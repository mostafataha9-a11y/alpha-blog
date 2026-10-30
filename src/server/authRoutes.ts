import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import {
  verifyOwnerCredentials,
  changeOwnerPassword,
  createDbSession,
  validateDbSession,
  revokeDbSession,
  checkDbRateLimit,
  recordDbFailedLogin,
  resetDbRateLimit,
  DbAuthUser,
} from '../db/repo.ts';

export const authRouter = Router();

export interface AuthRequest extends Request {
  adminUser?: DbAuthUser;
}

/**
 * CSRF / Origin & Referer Verification Middleware
 * Validates state-changing requests against known allowed origins
 */
export function verifyCsrfOrigin(req: Request, res: Response, next: NextFunction) {
  const method = req.method.toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return next();
  }

  // Exempt webhooks carrying valid secret key
  const cronSecret = process.env.CRON_SECRET?.trim();
  const authHeader = req.headers.authorization;
  if (
    cronSecret &&
    (authHeader === `Bearer ${cronSecret}` || req.headers['x-cron-secret'] === cronSecret)
  ) {
    return next();
  }

  const origin = req.headers.origin;
  const referer = req.headers.referer;
  const host = req.get('host');

  // If both origin and referer are missing on browser mutation request
  if (!origin && !referer) {
    // Direct server-to-server or test runner requests without Origin/Referer
    return next();
  }

  const candidate = origin || referer || '';
  try {
    const candidateUrl = new URL(candidate);
    const candidateHost = candidateUrl.host.toLowerCase();

    const isMatch =
      candidateHost === host?.toLowerCase() ||
      candidateHost.endsWith('.run.app') ||
      candidateHost === 'aistudio.google.com' ||
      candidateHost.startsWith('localhost') ||
      candidateHost.startsWith('127.0.0.1');

    if (!isMatch) {
      return res.status(403).json({
        error: 'CSRF_BLOCKED',
        message: 'طلب مرفوض: مصدر الطلب غير موثوق به (Origin mismatch).',
      });
    }
  } catch {
    return res.status(403).json({
      error: 'CSRF_BLOCKED',
      message: 'طلب مرفوض: ترويسة المصدر غير صالحة.',
    });
  }

  next();
}

// Server-Side Admin Auth Verification Middleware (PostgreSQL-Backed)
export async function requireAdminAuth(req: AuthRequest, res: Response, next: () => void) {
  try {
    const cookieToken = req.cookies?.alpha_session;
    const headerToken = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split('Bearer ')[1].trim()
      : null;

    const token = cookieToken || headerToken;

    if (!token) {
      return res.status(401).json({ error: 'غير مصرح: يجب تسجيل الدخول للوصول إلى هذه الوظيفة.' });
    }

    const sessionUser = await validateDbSession(token);
    if (!sessionUser) {
      const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https' || process.env.NODE_ENV === 'production';
      res.clearCookie('alpha_session', { path: '/', sameSite: isHttps ? 'none' : 'lax', secure: isHttps });
      return res.status(401).json({ error: 'انتهت صلاحية الجلسة أو تم إبطالها، يرجى تسجيل الدخول مجدداً.' });
    }

    // Mandatory password change check: Block all admin APIs except password change and session check
    const normalizedPath = req.baseUrl ? `${req.baseUrl}${req.path}` : req.path;
    if (
      sessionUser.mustChangePassword &&
      !normalizedPath.includes('/api/auth/change-password') &&
      !normalizedPath.includes('/api/auth/me') &&
      !normalizedPath.includes('/api/auth/logout')
    ) {
      return res.status(403).json({
        error: 'MUST_CHANGE_PASSWORD',
        message: 'يجب تغيير كلمة المرور لحساب المدير قبل متابعة استخدام لوحة الإدارة.',
      });
    }

    req.adminUser = sessionUser;
    next();
  } catch (authErr) {
    console.error('requireAdminAuth error:', authErr);
    res.status(500).json({ error: 'فشل التحقق من الجلسة في خادم المصادقة.' });
  }
}

// Apply CSRF protection on authRouter
authRouter.use(verifyCsrfOrigin);

// ----------------------------------------------------
// AUTH ENDPOINTS
// ----------------------------------------------------
authRouter.post('/api/auth/login', async (req: Request, res: Response) => {
  const ip = req.ip || (req.socket.remoteAddress as string) || 'unknown';

  // Persistent IP rate limit check
  const rateCheck = await checkDbRateLimit(ip);
  if (!rateCheck.allowed) {
    if (rateCheck.retryAfterSeconds) {
      res.setHeader('Retry-After', String(rateCheck.retryAfterSeconds));
    }
    return res.status(429).json({
      error: `تم تجاوز عدد محاولات الدخول المسموح بها. الحساب مؤمّن ومقفل مؤقتاً. يرجى الانتظار ${Math.ceil((rateCheck.retryAfterSeconds || 900) / 60)} دقيقة.`,
      retryAfterSeconds: rateCheck.retryAfterSeconds,
    });
  }

  const { password, email, username, loginName } = req.body;
  const identifier = username || loginName || email;
  if (!password || typeof password !== 'string' || password.trim().length === 0) {
    await recordDbFailedLogin(ip);
    return res.status(400).json({ error: 'كلمة المرور مطلوبة ولا يمكن تركها فارغة.' });
  }

  const authResult = await verifyOwnerCredentials(password.trim(), identifier);
  if (!authResult.valid || !authResult.user) {
    const failRecord = await recordDbFailedLogin(ip);
    if (failRecord.locked) {
      res.setHeader('Retry-After', String(failRecord.retryAfterSeconds || 900));
      return res.status(429).json({
        error: 'تم قفل محاولات تسجيل الدخول لمدة 15 دقيقة بعد 5 محاولات خاطئة متتالية.',
        retryAfterSeconds: failRecord.retryAfterSeconds,
      });
    }
    return res.status(401).json({ error: authResult.error || 'بيانات الدخول غير صحيحة. يرجى التأكد من اسم الدخول ورمز المرور.' });
  }

  // Reset rate limits on successful authentication
  await resetDbRateLimit(ip);

  // Generate cryptographically secure 256-bit session token
  const token = crypto.randomBytes(32).toString('hex');
  const user = authResult.user;
  const userAgent = (req.headers['user-agent'] as string) || 'unknown';

  // Save session to PostgreSQL table admin_sessions
  await createDbSession(token, user, ip, userAgent);

  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https' || process.env.NODE_ENV === 'production';
  const cookieOptions = {
    httpOnly: true,
    secure: isHttps,
    sameSite: isHttps ? ('none' as const) : ('lax' as const),
    path: '/',
    maxAge: 7 * 24 * 3600 * 1000,
  };

  res.cookie('alpha_session', token, cookieOptions);

  // Respond WITHOUT leaking session token into response body (Strict HttpOnly security)
  res.json({
    success: true,
    user: {
      uid: user.uid,
      name: user.name,
      email: user.email,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    },
  });
});

authRouter.post('/api/auth/logout', async (req: Request, res: Response) => {
  try {
    const cookieToken = req.cookies?.alpha_session;
    const headerToken = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split('Bearer ')[1].trim()
      : null;

    const token = cookieToken || headerToken;
    if (token) {
      await revokeDbSession(token);
    }

    const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https' || process.env.NODE_ENV === 'production';
    res.clearCookie('alpha_session', { path: '/', sameSite: isHttps ? 'none' : 'lax', secure: isHttps });
    res.json({ success: true, message: 'تم تسجيل الخروج وإبطال الجلسة في قاعدة البيانات.' });
  } catch (err: any) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'حدث خطأ أثناء تسجيل الخروج.' });
  }
});

authRouter.get('/api/auth/me', async (req: Request, res: Response) => {
  const cookieToken = req.cookies?.alpha_session;
  const headerToken = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.split('Bearer ')[1].trim()
    : null;

  const token = cookieToken || headerToken;
  if (!token) {
    return res.json({ isLoggedIn: false });
  }

  const user = await validateDbSession(token);
  if (!user) {
    return res.json({ isLoggedIn: false });
  }

  res.json({
    isLoggedIn: true,
    user: {
      uid: user.uid,
      name: user.name,
      email: user.email,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    },
  });
});

authRouter.post('/api/auth/change-password', requireAdminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'كلمة المرور الحالية والجديدة مطلوبتان.' });
    }

    const userId = req.adminUser?.uid || 'owner-hadary-1';
    const result = await changeOwnerPassword(userId, currentPassword, newPassword);

    if (!result.success) {
      return res.status(400).json({ error: result.error || 'فشل تغيير كلمة المرور.' });
    }

    // Issue a fresh session cookie for the updated credentials
    const ip = req.ip || (req.socket.remoteAddress as string) || 'unknown';
    const userAgent = (req.headers['user-agent'] as string) || 'unknown';
    const freshToken = crypto.randomBytes(32).toString('hex');

    const freshUser: DbAuthUser = {
      uid: req.adminUser!.uid,
      name: req.adminUser!.name,
      email: req.adminUser!.email,
      role: req.adminUser!.role,
      mustChangePassword: false,
    };

    await createDbSession(freshToken, freshUser, ip, userAgent);

    const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https' || process.env.NODE_ENV === 'production';
    res.cookie('alpha_session', freshToken, {
      httpOnly: true,
      secure: isHttps,
      sameSite: isHttps ? 'none' : 'lax',
      path: '/',
      maxAge: 7 * 24 * 3600 * 1000,
    });

    res.json({
      success: true,
      message: 'تم تحديث كلمة المرور بنجاح في قاعدة البيانات وإبطال الجلسات القديمة.',
      user: freshUser,
    });
  } catch (err: any) {
    console.error('change-password error:', err);
    res.status(500).json({ error: 'فشل تغيير كلمة المرور في قاعدة البيانات.' });
  }
});
