import React from 'react';
import { ShieldCheck, Lock, Eye, FileText, Database, CheckCircle, Sparkles } from 'lucide-react';
import { SiteSettings } from '../types/blog';

interface PrivacyViewProps {
  settings: SiteSettings;
}

export const PrivacyView: React.FC<PrivacyViewProps> = ({ settings }) => {
  const isAr = settings.language === 'ar';
  const authorName = settings.authorName || 'الحضرى محمود';

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-16 animate-in fade-in duration-300">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4" />
          <span>{isAr ? 'سياسة الخصوصية وحماية البيانات' : 'Privacy & Data Protection Policy'}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
          {isAr ? 'سياسة الخصوصية لمدونة ألفا ديزاين' : 'Alpha Design Privacy Policy'}
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm">
          {isAr
            ? `آخر تحديث: 2026 | بإشراف إدارة المدونة وصاحبها «${authorName}»`
            : `Last updated: 2026 | Under supervision of ${authorName}`}
        </p>
      </div>

      {/* Main Content Body */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-sm space-y-8 text-slate-700 dark:text-slate-300 leading-relaxed text-xs sm:text-sm">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-blue-600" />
            <span>{isAr ? '1. التزامنا بحماية خصوصيتك' : '1. Commitment to Privacy'}</span>
          </h2>
          <p>
            {isAr
              ? `نحن في مدونة «ألفا ديزاين» (Alpha Design)، تحت إدارة صاحب المدونة «${authorName}»، نضع حماية بيانات زوارنا وقرائنا على رأس أولوياتنا. توضح هذه الوثيقة طبيعة المعلومات التي يتم جمعها وكيفية استخدامها وحمايتها عند تصفحك لمدونتنا ومقالاتها.`
              : `At Alpha Design, under the direction of ${authorName}, safeguarding reader privacy is our top priority. This document outlines how data is gathered and protected.`}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-600" />
            <span>{isAr ? '2. البيانات التي نقوم بجمعها' : '2. Information We Collect'}</span>
          </h2>
          <ul className="list-disc list-inside space-y-1.5 ps-2">
            <li>
              <strong>{isAr ? 'البيانات التفضيلية المحلية:' : 'Local Preferences:'}</strong>{' '}
              {isAr
                ? 'مثل حفظ مقالاتك المفضلة، تفضيل الوضع الليلي/النهاري، وتفضيل اللغة، والتي تُخزن محلياً في متصفحك (LocalStorage).'
                : 'Dark mode preferences and language saved strictly in your local browser storage.'}
            </li>
            <li>
              <strong>{isAr ? 'بيانات التواصل والتعليقات:' : 'Contact & Comments:'}</strong>{' '}
              {isAr
                ? 'عند إرسال رسالة عبر نموذج "اتصل بنا" أو كتابة تعليق على مقال، نقوم بحفظ الاسم والبريد الإلكتروني للرد عليك.'
                : 'Names and email addresses provided voluntarily when submitting comments or contacting us.'}
            </li>
            <li>
              <strong>{isAr ? 'إحصائيات القراءة المجهولة:' : 'Anonymous Readership Metrics:'}</strong>{' '}
              {isAr
                ? 'عدد مشاهدات المقالات والإعجابات دون ربطها بهوية شخصية محددة.'
                : 'Aggregated view counts and like totals devoid of personally identifiable information.'}
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <span>{isAr ? '3. سياسة الذكاء الاصطناعي وبوت ألفا' : '3. AI Features & Alpha Bot'}</span>
          </h2>
          <p>
            {isAr
              ? `تستخدم المدونة تقنيات الذكاء الاصطناعي (Gemini) لمساعدة الإدارة في صياغة وتنسيق المقالات وتقديم بوت دردشة تفاعلي وتفويض نشر الروابط في وسائل التواصل الاجتماعي. الأسئلة المطروحة على بوت ألفا تُعالج لتقديم الإجابة الفورية ولا يتم بيعها أو مشاركتها مع أطراف خارجية تجارية.`
              : `Alpha Design utilizes AI models for article structuring and chatbot assistance. Conversations with Alpha Bot are processed in real-time to generate design answers and are never sold to external third parties.`}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Eye className="w-5 h-5 text-emerald-600" />
            <span>{isAr ? '4. مشاركة الروابط وشبكات التواصل' : '4. Social Sharing & Links'}</span>
          </h2>
          <p>
            {isAr
              ? `تحتوي المدونة على أزرار لمشاركة المقالات مباشرة عبر (X/Twitter, LinkedIn, Facebook, Telegram, WhatsApp). عند الضغط على هذه الروابط، تخضع عملية المشاركة لسياسات الخصوصية الخاصة بتلك المنصات المستقلة.`
              : `The platform includes social sharing triggers. Clicking external social links subjects the user to the respective platforms' privacy policies.`}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-blue-600" />
            <span>{isAr ? '5. حقوق الزائر والتحكم' : '5. Visitor Rights'}</span>
          </h2>
          <p>
            {isAr
              ? 'يحق لكل زائر طلب حذف تعليقاته أو محو بيانات التخزين المؤقت في أي وقت بمجرد مسح بيانات المتصفح أو مراسلتنا مباشرة عبر صفحة اتصل بنا.'
              : 'Users retain full rights to clear local browser storage or request removal of comments via our contact page.'}
          </p>
        </section>
      </div>
    </div>
  );
};
