import { Router, Request, Response } from 'express';
import sharp, { Metadata } from 'sharp';
import {
  getDbArticles,
  createDbArticle,
  deleteDbArticle,
  likeDbArticle,
  getDbSettings,
  saveDbSettings,
  getDbContractorProjects,
  saveDbContractorProject,
  deleteDbContractorProject,
  saveDbContactMessage,
  getDbContactMessages,
  saveDbUploadedMedia,
  getDbUploadedMedia,
  addDbNewsletterSubscriber,
  unsubscribeDbNewsletter,
  deleteDbNewsletterSubscriber,
  getDbNewsletterSubscribers,
  checkDbApiRateLimit,
  validateDbSession,
} from '../db/repo.ts';
import { requireAdminAuth } from './authRoutes.ts';
import { validateArticlePayload } from '../utils/articleValidator.ts';

export const dbRouter = Router();

// Helper to reliably extract client IP
function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}

// ----------------------------------------------------
// ARTICLES DATABASE ROUTES
// ----------------------------------------------------
dbRouter.get('/api/db/articles', async (req: Request, res: Response) => {
  try {
    const statusParam = req.query.status as string;
    const filter = (statusParam === 'draft' || statusParam === 'all') ? statusParam : 'published';
    const articles = await getDbArticles({ statusFilter: filter });
    res.json(articles);
  } catch (err: any) {
    console.error('API GET /api/db/articles error:', err);
    res.status(500).json({ error: 'فشل استرجاع المقالات من قاعدة البيانات.' });
  }
});

dbRouter.post('/api/db/articles', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const validation = validateArticlePayload(payload);

    if (!validation.valid) {
      return res.status(400).json({
        error: 'بيانات المقال غير مطابقة لمعايير الجودة والنشر.',
        validationErrors: validation.errors,
      });
    }

    const created = await createDbArticle(payload);
    res.status(201).json({
      success: true,
      article: created,
      validation,
      message: 'تم حفظ ونشر المقال في قاعدة البيانات بنجاح.',
    });
  } catch (err: any) {
    console.error('API POST /api/db/articles error:', err);
    res.status(500).json({ error: 'فشل حفظ المقال في قاعدة البيانات.' });
  }
});

dbRouter.delete('/api/db/articles/:id', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    await deleteDbArticle(req.params.id);
    res.json({ success: true, message: 'تم حذف المقال من قاعدة البيانات.' });
  } catch (err: any) {
    console.error('API DELETE /api/db/articles error:', err);
    res.status(500).json({ error: 'فشل حذف المقال من قاعدة البيانات.' });
  }
});

dbRouter.post('/api/db/articles/:id/like', async (req: Request, res: Response) => {
  const ip = getClientIp(req);
  const rate = await checkDbApiRateLimit('like', ip, 30, 60, 120);
  if (!rate.allowed) {
    return res.status(429).json({ error: 'تم تجاوز الحد المسموح به للإعجابات. يرجى الانتظار قليلاً.' });
  }

  try {
    const likes = await likeDbArticle(req.params.id);
    res.json({ success: true, likes });
  } catch (err: any) {
    res.status(500).json({ error: 'فشل تسجيل الإعجاب.' });
  }
});

// ----------------------------------------------------
// SETTINGS DATABASE ROUTES
// ----------------------------------------------------
dbRouter.get('/api/db/settings', async (req: Request, res: Response) => {
  try {
    const s = await getDbSettings();
    res.json(s);
  } catch (err: any) {
    console.error('API GET /api/db/settings error:', err);
    res.status(500).json({ error: 'فشل استرجاع إعدادات الموقع من قاعدة البيانات.' });
  }
});

dbRouter.post('/api/db/settings', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const newSettings = req.body;
    if (!newSettings || typeof newSettings !== 'object') {
      return res.status(400).json({ error: 'بيانات الإعدادات غير صالحة.' });
    }

    // Preserve owner's decree: Always ensure autoPublish stays disabled unless explicitly configured
    if (newSettings.autoPublish) {
      newSettings.autoPublish.enabled = false;
    }

    const saved = await saveDbSettings(newSettings);
    res.json({
      success: true,
      settings: saved,
      message: 'تم حفظ وتحديث إعدادات الموقع في قاعدة البيانات بنجاح.',
    });
  } catch (err: any) {
    console.error('API POST /api/db/settings error:', err);
    res.status(500).json({ error: 'فشل حفظ إعدادات الموقع في قاعدة البيانات.' });
  }
});

// ----------------------------------------------------
// CONTRACTOR PROJECTS DATABASE ROUTES
// ----------------------------------------------------
dbRouter.get('/api/db/contractor-projects', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const projects = await getDbContractorProjects();
    res.json(projects);
  } catch (err: any) {
    console.error('API GET /api/db/contractor-projects error:', err);
    res.status(500).json({ error: 'فشل استرجاع المشاريع من قاعدة البيانات.' });
  }
});

dbRouter.post('/api/db/contractor-projects', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const project = req.body;
    if (!project || !project.name || !project.client) {
      return res.status(400).json({ error: 'اسم المشروع واسم العميل مطلوبان.' });
    }

    const saved = await saveDbContractorProject(project);
    res.json({
      success: true,
      project: saved,
      message: 'تم حفظ المشروع في قاعدة البيانات بنجاح.',
    });
  } catch (err: any) {
    console.error('API POST /api/db/contractor-projects error:', err);
    res.status(500).json({ error: 'فشل حفظ المشروع في قاعدة البيانات.' });
  }
});

dbRouter.delete('/api/db/contractor-projects/:id', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    await deleteDbContractorProject(req.params.id);
    res.json({ success: true, message: 'تم حذف المشروع من قاعدة البيانات.' });
  } catch (err: any) {
    console.error('API DELETE /api/db/contractor-projects error:', err);
    res.status(500).json({ error: 'فشل حذف المشروع من قاعدة البيانات.' });
  }
});

// ----------------------------------------------------
// CONTACT MESSAGES API (Verified Persistent Storage & Anti-Spam)
// ----------------------------------------------------
dbRouter.post('/api/contact', async (req: Request, res: Response) => {
  try {
    const ip = getClientIp(req);

    // Anti-spam honeypot detection
    if (req.body.website || req.body.hp_code || req.body.address_line_2) {
      // Silently drop bot submission
      return res.json({
        success: true,
        message: 'تم استلام رسالتكم بنجاح.',
      });
    }

    // Distributed rate limit: max 8 inquiries per 5 minutes per IP
    const rate = await checkDbApiRateLimit('contact', ip, 8, 300, 600);
    if (!rate.allowed) {
      return res.status(429).json({
        error: 'تم تجاوز الحد المسموح به لإرسال الرسائل. يرجى الانتظار بضع دقائق.',
      });
    }

    const { name, email, phone, subject, message } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'الاسم بالكامل مطلوب ولا يمكن تركه فارغاً.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
      return res.status(400).json({ error: 'البريد الإلكتروني مطلوب ويجب أن يكون بصيغة صحيحة.' });
    }

    if (!message || typeof message !== 'string' || message.trim().length < 5) {
      return res.status(400).json({ error: 'نص الرسالة مطلوب ويجب ألا يقل عن 5 أحرف.' });
    }

    const result = await saveDbContactMessage({
      name: name.trim().slice(0, 100),
      email: email.trim().slice(0, 150),
      phone: phone ? String(phone).trim().slice(0, 30) : undefined,
      subject: subject ? String(subject).trim().slice(0, 200) : undefined,
      message: message.trim().slice(0, 3000),
      ipAddress: ip,
    });

    res.json({
      success: true,
      message: 'تم استلام رسالتكم بنجاح وحفظها في قاعدة البيانات. سيقوم فريق العمل بمراجعتها والرد عليكم في أقرب وقت.',
      id: result.id,
    });
  } catch (err: any) {
    console.error('API POST /api/contact error:', err);
    res.status(500).json({ error: 'تعذر حفظ رسالة التواصل في خادم البيانات. يرجى المحاولة لاحقاً أو التواصل عبر واتساب.' });
  }
});

dbRouter.get('/api/db/contact-messages', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const messages = await getDbContactMessages();
    res.json(messages);
  } catch (err: any) {
    console.error('API GET /api/db/contact-messages error:', err);
    res.status(500).json({ error: 'فشل استرجاع رسائل التواصل.' });
  }
});

// ----------------------------------------------------
// MEDIA UPLOAD API (Strict Sharp Verification, No SVG)
// ----------------------------------------------------
dbRouter.post('/api/upload/image', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { filename, dataUrl, imageBase64, mimeType } = req.body;
    const rawData = (dataUrl || imageBase64 || '').trim();

    if (!rawData || typeof rawData !== 'string') {
      return res.status(400).json({ error: 'بيانات الصورة مفقودة.' });
    }

    if (filename && String(filename).toLowerCase().endsWith('.svg')) {
      return res.status(400).json({
        error: 'صيغة SVG غير مسموح برفعها لأسباب أمنية. يُسمح فقط بصيغ الصور النقطية: JPEG, PNG, WebP, AVIF.',
      });
    }

    // Extract base64 payload
    const matches = rawData.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ error: 'تنسيق ترميز الصورة (base64) غير صالح.' });
    }

    const declaredMime = matches[1].toLowerCase();
    const base64Data = matches[2];
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Strict size ceiling (5 MB max)
    const maxSizeBytes = 5 * 1024 * 1024;
    if (imageBuffer.length > maxSizeBytes) {
      return res.status(400).json({
        error: `حجم الصورة يتجاوز الحد الأقصى المسموح به (5 ميجابايت). الحجم الحالي: ${(imageBuffer.length / (1024 * 1024)).toFixed(1)} ميجابايت.`,
      });
    }

    // Disallow SVG explicitly to prevent stored XSS and XML attacks
    if (declaredMime.includes('svg') || declaredMime.includes('xml')) {
      return res.status(400).json({
        error: 'صيغة SVG غير مسموح برفعها لأسباب أمنية. يُسمح فقط بصيغ الصور النقطية: JPEG, PNG, WebP, AVIF.',
      });
    }

    // Deep content verification with Sharp (verifies magic bytes and raster metadata)
    let metadata: Metadata;
    try {
      metadata = await sharp(imageBuffer).metadata();
    } catch {
      return res.status(400).json({ error: 'الملف ليس صورة نقطية صالحة أو تالف (Corrupt image).' });
    }

    if (!metadata.format || !metadata.width || !metadata.height) {
      return res.status(400).json({ error: 'تعذر التحقق من أبعاد وصيغة الصورة.' });
    }

    const allowedFormats = ['jpeg', 'png', 'webp', 'avif'];
    if (!allowedFormats.includes(metadata.format.toLowerCase())) {
      return res.status(400).json({
        error: `صيغة الملف الفعلية (${metadata.format}) غير مدعومة. يُسمح فقط بـ JPEG, PNG, WebP, AVIF.`,
      });
    }

    // Dimension bounds check: max 4096px and 16MP total pixels
    if (metadata.width > 4096 || metadata.height > 4096 || (metadata.width * metadata.height) > 16000000) {
      return res.status(400).json({
        error: `أبعاد الصورة تتجاوز الحد الأقصى المسموح به (${metadata.width}x${metadata.height}). الحد الأقصى 4096 بكسل.`,
      });
    }

    const safeFilename = (filename || 'image-' + Date.now()).replace(/[^a-zA-Z0-9._-]/g, '_');

    const savedRecord = await saveDbUploadedMedia({
      filename: safeFilename,
      url: dataUrl,
      mimeType: `image/${metadata.format}`,
      sizeBytes: imageBuffer.length,
    });

    res.json({
      success: true,
      media: savedRecord,
      message: 'تم التحقق من الصورة وحفظها بنجاح في قاعدة البيانات الدائمة.',
    });
  } catch (err: any) {
    console.error('API POST /api/upload/image error:', err);
    res.status(500).json({ error: 'فشل رفع وحفظ الصورة في قاعدة البيانات.' });
  }
});

// ----------------------------------------------------
// NEWSLETTER API ROUTES (Distributed Rate Limiting & Token-Secured Unsubscribe)
// ----------------------------------------------------
dbRouter.post('/api/newsletter/subscribe', async (req: Request, res: Response) => {
  try {
    const ip = getClientIp(req);

    // Distributed rate limit in PostgreSQL: max 12 attempts per minute per IP
    const rate = await checkDbApiRateLimit('newsletter', ip, 12, 60, 180);
    if (!rate.allowed) {
      return res.status(429).json({
        error: 'تم تجاوز الحد المسموح به لمحاولات الاشتراك. يرجى المحاولة بعد قليل.',
      });
    }

    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'يرجى إدخال عنوان بريد إلكتروني صحيح.' });
    }

    const result = await addDbNewsletterSubscriber(email, ip);

    res.json({
      success: true,
      status: result.status,
      message: result.message,
      isNew: result.isNew,
      unsubscribeToken: result.unsubscribeToken,
      emailDelivery: 'not_configured_database_only',
      note: 'تم تسجيل البريد في قاعدة البيانات الدائمة بنجاح. خدمة إرسال النشرات الخارجية غير مفعلة حالياً.',
    });
  } catch (err: any) {
    console.error('API POST /api/newsletter/subscribe error:', err);
    res.status(400).json({ error: err.message || 'فشل تسجيل الاشتراك.' });
  }
});

dbRouter.post('/api/newsletter/unsubscribe', async (req: Request, res: Response) => {
  try {
    const { email, token } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'البريد الإلكتروني مطلوب لإلغاء الاشتراك.' });
    }

    // Check if caller has active admin session
    const cookieToken = req.cookies?.alpha_session;
    const headerToken = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split('Bearer ')[1].trim()
      : null;
    const adminSessionToken = cookieToken || headerToken;
    let isAdmin = false;
    if (adminSessionToken) {
      const adminUser = await validateDbSession(adminSessionToken);
      if (adminUser) isAdmin = true;
    }

    const result = await unsubscribeDbNewsletter(email, token, isAdmin);
    if (!result.success && (result as any).error === 'TOKEN_REQUIRED') {
      return res.status(403).json(result);
    }
    if (!result.success && (result as any).error === 'INVALID_TOKEN') {
      return res.status(401).json(result);
    }

    res.json(result);
  } catch (err: any) {
    console.error('API POST /api/newsletter/unsubscribe error:', err);
    res.status(500).json({ error: err.message || 'فشل إلغاء الاشتراك.' });
  }
});

dbRouter.get('/api/newsletter/subscribers', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const subscribers = await getDbNewsletterSubscribers();
    res.json({
      success: true,
      count: subscribers.length,
      subscribers,
    });
  } catch (err: any) {
    console.error('API GET /api/newsletter/subscribers error:', err);
    res.status(500).json({ error: 'فشل استرجاع قائمة المشتركين.' });
  }
});

// Admin endpoint to permanently delete subscriber upon data deletion request (GDPR)
dbRouter.delete('/api/newsletter/subscribers/:email', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const email = req.params.email;
    const result = await deleteDbNewsletterSubscriber(email);
    res.json(result);
  } catch (err: any) {
    console.error('API DELETE /api/newsletter/subscribers error:', err);
    res.status(500).json({ error: 'فشل حذف المشترك من قاعدة البيانات.' });
  }
});
