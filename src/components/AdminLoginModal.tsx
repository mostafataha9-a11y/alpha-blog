import React, { useState } from 'react';
import {
  Lock,
  ShieldCheck,
  X,
  KeyRound,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { AdminUser, SiteSettings } from '../types/blog';
import { AuthorBadge } from './AuthorBadge';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: AdminUser) => void;
  settings: SiteSettings;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  settings,
}) => {
  const isAr = settings.language === 'ar';
  const ownerName = settings.authorName || 'الحضرى محمود';

  const [mode, setMode] = useState<'login' | 'changePassword'>('login');
  const [loginName, setLoginName] = useState('الحضرى محمود');
  const [password, setPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [pendingUser, setPendingUser] = useState<AdminUser | null>(null);

  if (!isOpen) return null;

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const trimmedPassword = password.trim();
    if (!trimmedPassword) {
      setErrorMsg(isAr ? 'يرجى إدخال كلمة المرور، لا يمكن ترك الحقل فارغاً.' : 'Password cannot be empty.');
      return;
    }

    setIsVerifying(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          username: loginName.trim(),
          email: loginName.trim(),
          loginName: loginName.trim(),
          password: trimmedPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(data.error || (isAr ? 'فشل تسجيل الدخول. يرجى التحقق من كلمة المرور.' : 'Login failed. Please check your credentials.'));
        setIsVerifying(false);
        return;
      }

      const user: AdminUser = {
        name: data.user?.name || ownerName,
        role: data.user?.role || 'owner',
        email: data.user?.email || 'hadary@alphadecor.blog',
        isLoggedIn: true,
        mustChangePassword: data.mustChangePassword,
      };

      // If server demands password change (e.g. bootstrap password or legacy default rotation)
      if (data.mustChangePassword) {
        setPendingUser(user);
        setCurrentPassword(trimmedPassword);
        setMode('changePassword');
        setErrorMsg(isAr ? 'تنبيه أمان إلزامي: يجب تعيين كلمة مرور جديدة قوية وخاصة بحساب المالك قبل المتابعة.' : 'Mandatory security check: Please set a new strong password.');
        setIsVerifying(false);
        return;
      }

      onLoginSuccess(user);
      onClose();
    } catch (err: any) {
      console.error('Login request failed:', err);
      setErrorMsg(isAr ? 'تعذر الاتصال بخادم المصادقة. يرجى المحاولة لاحقاً.' : 'Unable to connect to authentication server.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleChangePassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const trimmedCurrent = currentPassword.trim();
    const trimmedNew = newPassword.trim();
    const trimmedConfirm = confirmPassword.trim();

    if (!trimmedCurrent) {
      setErrorMsg(isAr ? 'يرجى إدخال كلمة المرور الحالية.' : 'Current password is required.');
      return;
    }

    if (trimmedNew.length < 8) {
      setErrorMsg(isAr ? 'يجب أن لا تقل كلمة المرور الجديدة عن 8 أحرف.' : 'New password must be at least 8 characters.');
      return;
    }

    if (trimmedNew !== trimmedConfirm) {
      setErrorMsg(isAr ? 'كلمتا المرور غير متطابقتين.' : 'Passwords do not match.');
      return;
    }

    setIsVerifying(true);

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: trimmedCurrent,
          newPassword: trimmedNew,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(data.error || (isAr ? 'فشل تغيير كلمة المرور.' : 'Failed to change password.'));
        setIsVerifying(false);
        return;
      }

      setSuccessMsg(isAr ? 'تم تغيير كلمة المرور بنجاح وحفظها مشفرة في قاعدة البيانات.' : 'Password updated successfully.');

      setTimeout(() => {
        if (pendingUser) {
          onLoginSuccess({ ...pendingUser, mustChangePassword: false });
        }
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Change password failed:', err);
      setErrorMsg(isAr ? 'تعذر الاتصال بالخادم.' : 'Server connection failed.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 end-4 p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/30 border border-blue-400/30 text-blue-300 flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base">
                  {mode === 'login'
                    ? (isAr ? 'بوابة الإدارة المشفرة (Cloud SQL Auth)' : 'Secure Admin Portal')
                    : (isAr ? 'تغيير كلمة المرور وتحديث الأمان' : 'Update Admin Password')}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                  {isAr ? 'محمي وموثق' : 'Protected'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {isAr
                  ? 'مخصص فقط لصاحب الموقع والمشرفين المعتمدين'
                  : 'Restricted to site owner & authorized staff'}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Owner Identity Highlight */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AuthorBadge name={ownerName} size="md" />
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  {ownerName}
                </span>
                <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                  {isAr ? 'صاحب المدونة والمدير العام' : 'Blog Owner'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-[11px] font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
              <span>{isAr ? 'مصادقة الخادم' : 'Server Auth'}</span>
            </div>
          </div>

          {mode === 'login' ? (
            /* Login Form */
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  {isAr ? 'اسم الدخول لحساب الإدارة (صاحب الموقع):' : 'Admin Login Name / Username:'}
                </label>
                <input
                  type="text"
                  value={loginName}
                  onChange={(e) => setLoginName(e.target.value)}
                  placeholder={isAr ? 'أدخل اسم الدخول (الحضرى محمود)...' : 'Enter login name (Al-Hadari Mahmoud)...'}
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  {isAr ? 'كلمة المرور المشفرة (Admin Password):' : 'Encrypted Password:'}
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isAr ? 'أدخل كلمة مرور الإدارة...' : 'Enter your password...'}
                    autoFocus
                    required
                    className="w-full ps-10 pe-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                  />
                </div>
                <span className="text-[10px] text-slate-400 block">
                  {isAr ? 'تتم المصادقة عبر تجزئة Bcrypt الآمنة وجلسات PostgreSQL الدائمة.' : 'Authenticated via secure Bcrypt hash and PostgreSQL sessions.'}
                </span>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isVerifying}
                className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isVerifying ? (
                  <span>{isAr ? 'جارِ التحقق من الخادم...' : 'Verifying with server...'}</span>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>{isAr ? 'تسجيل الدخول الآمن إلى الباك إند' : 'Secure Login'}</span>
                    {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Change Password Form */
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  {isAr ? 'كلمة المرور الحالية:' : 'Current Password:'}
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder={isAr ? 'كلمة المرور الحالية...' : 'Current password...'}
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  {isAr ? 'كلمة المرور الجديدة (8 أحرف على الأقل):' : 'New Password (min 8 chars):'}
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={isAr ? 'أدخل كلمة مرور جديدة قوية...' : 'Enter new strong password...'}
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  {isAr ? 'تأكيد كلمة المرور الجديدة:' : 'Confirm New Password:'}
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={isAr ? 'أعد إدخال كلمة المرور الجديدة...' : 'Re-enter new password...'}
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                />
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={isVerifying}
                  className="flex-1 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isVerifying ? (
                    <span>{isAr ? 'جارِ الحفظ والتشفير...' : 'Saving...'}</span>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      <span>{isAr ? 'حفظ كلمة المرور الجديدة' : 'Save New Password'}</span>
                    </>
                  )}
                </button>

                {!pendingUser?.mustChangePassword && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setErrorMsg('');
                    }}
                    className="px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

