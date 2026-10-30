import React, { useState } from 'react';
import {
  Settings,
  Sparkles,
  Edit3,
  Clock,
  Share2,
  FileText,
  Users,
  ShieldCheck,
  LogOut,
  ArrowRight,
  ArrowLeft,
  Eye,
  Trash2,
  Plus,
  CheckCircle2,
  LayoutDashboard,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Bot,
  Calculator,
  Tv,
  AlertTriangle,
  X,
  Check
} from 'lucide-react';
import { Article, SiteSettings, BackendSubTab, AdminUser, BroadcastHistoryItem } from '../types/blog';
import { AuthorBadge } from './AuthorBadge';
import { SettingsView } from './SettingsView';
import { SmartArticleCreator } from './SmartArticleCreator';
import { ManualArticleCreator } from './ManualArticleCreator';
import { AutoPublishDashboard } from './AutoPublishDashboard';
import { SocialBroadcastModal } from './SocialBroadcastModal';
import { ContractorNotebook } from './ContractorNotebook';
import { SocialPublishingBotDashboard } from './SocialPublishingBotDashboard';

interface BackendDashboardProps {
  settings: SiteSettings;
  onUpdateSettings: (newSettings: SiteSettings) => void;
  articles: Article[];
  onPublishArticle: (article: Article) => void;
  onDeleteArticle: (articleId: string) => void;
  onViewArticle: (article: Article) => void;
  onResetData: () => void;
  onImportArticles: (articles: Article[]) => void;
  currentUser: AdminUser;
  onLogout: () => void;
  onExitToFrontend: () => void;
  onBroadcastComplete: (item: BroadcastHistoryItem) => void;
}

export const BackendDashboard: React.FC<BackendDashboardProps> = ({
  settings,
  onUpdateSettings,
  articles,
  onPublishArticle,
  onDeleteArticle,
  onViewArticle,
  onResetData,
  onImportArticles,
  currentUser,
  onLogout,
  onExitToFrontend,
  onBroadcastComplete,
}) => {
  const isAr = settings.language === 'ar';
  const ownerName = settings.authorName || 'الحضرى محمود';

  const [activeSubTab, setActiveSubTab] = useState<BackendSubTab>('settings');
  const [selectedArticleForBroadcast, setSelectedArticleForBroadcast] = useState<Article | null>(null);

  // In-app deletion dialog states (safe inside iframes, zero reliance on window.confirm)
  const [articleToDelete, setArticleToDelete] = useState<Article | null>(null);
  const [supervisorToDelete, setSupervisorToDelete] = useState<any | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleConfirmDeleteArticle = () => {
    if (!articleToDelete) return;
    const title = articleToDelete.title;
    onDeleteArticle(articleToDelete.id);
    setArticleToDelete(null);
    triggerToast(isAr ? `تم حذف مقال «${title}» بنجاح من الموقع!` : `Article deleted successfully!`);
  };

  const handleConfirmDeleteSupervisor = () => {
    if (!supervisorToDelete) return;
    const name = supervisorToDelete.name;
    const updated = supervisors.filter((s) => s.id !== supervisorToDelete.id);
    setSupervisors(updated);
    try {
      localStorage.setItem('alpha_decor_supervisors_v2', JSON.stringify(updated));
    } catch {}
    setSupervisorToDelete(null);
    triggerToast(isAr ? `تم حذف المشرف «${name}» بنجاح!` : `Supervisor deleted successfully!`);
  };

  // Supervisors state: strictly only owner Al-Hadari Mahmoud, all test supervisors removed
  const [supervisors, setSupervisors] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('alpha_decor_supervisors_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        const filtered = parsed.filter(
          (s: any) => s.isOwner || (s.name !== 'مهندس أحمد كمال' && s.name !== 'Ahmed Kamal' && s.name !== 'سارة المنصوري' && s.name !== 'Sarah Mansour')
        );
        if (filtered.length > 0) return filtered;
      }
    } catch (e) {
      console.warn('Failed to parse supervisors:', e);
    }
    return [
      {
        id: 'sup-1',
        name: ownerName,
        role: isAr ? 'صاحب المدونة والمدير العام' : 'Blog Owner & General Lead',
        email: 'owner@alphadesign.blog',
        isOwner: true,
        permissions: isAr ? 'كافة الصلاحيات (تحكم كامل)' : 'Full Admin Privileges',
      },
    ];
  });

  const [newSupervisorName, setNewSupervisorName] = useState('');
  const [newSupervisorRole, setNewSupervisorRole] = useState('');
  const [showAddSupervisor, setShowAddSupervisor] = useState(false);

  const handleDeleteSupervisor = (supId: string) => {
    const target = supervisors.find((s) => s.id === supId);
    if (target) {
      setSupervisorToDelete(target);
    }
  };

  const handleAddSupervisor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupervisorName.trim()) return;

    const updated = [
      ...supervisors,
      {
        id: 'sup-' + Date.now(),
        name: newSupervisorName.trim(),
        role: newSupervisorRole.trim() || (isAr ? 'مشرف معتمد' : 'Authorized Supervisor'),
        email: `${newSupervisorName.trim().toLowerCase().replace(/\s+/g, '')}@alphadesign.blog`,
        isOwner: false,
        permissions: isAr ? 'تحرير ونشر المقالات' : 'Edit & Publish Articles',
      },
    ];
    setSupervisors(updated);
    try {
      localStorage.setItem('alpha_decor_supervisors_v2', JSON.stringify(updated));
    } catch {}
    setNewSupervisorName('');
    setNewSupervisorRole('');
    setShowAddSupervisor(false);
    triggerToast(isAr ? 'تمت إضافة المشرف بنجاح!' : 'Supervisor added successfully!');
  };

  const isOwner = currentUser.role === 'owner';

  const baseNavItems: { id: BackendSubTab; labelAr: string; labelEn: string; icon: React.FC<{ className?: string }>; highlight?: boolean }[] = [
    { id: 'settings', labelAr: 'إعدادات الموقع وتخصيص العرض', labelEn: 'General Settings', icon: Settings },
    { id: 'ads' as BackendSubTab, labelAr: 'الأكواد الإعلانية (5 مواضع ذكية)', labelEn: 'Smart Ad Codes (5 Slots)', icon: Tv, highlight: true },
    { id: 'manage-articles', labelAr: 'إدارة وحذف وتعديل المقالات', labelEn: 'Manage & Delete Posts', icon: FileText, highlight: true },
    { id: 'supervisors', labelAr: 'المشرفين وفريق العمل (حذف وإضافة)', labelEn: 'Supervisors & Team', icon: Users, highlight: true },
    { id: 'smart-creator', labelAr: 'صانع المقالات الذكي (AI)', labelEn: 'Smart AI Creator', icon: Sparkles },
    { id: 'manual-creator', labelAr: 'كتابة مقال يدوياً', labelEn: 'Write Manual Post', icon: Edit3 },
    { id: 'auto-publish', labelAr: 'محرك النشر التلقائي (24h)', labelEn: '24h Auto-Publisher', icon: Clock },
    { id: 'social-bot', labelAr: 'بوت نشر الروابط (كل 30 دقيقة)', labelEn: 'Social Link Bot (30m)', icon: Bot, highlight: true },
    { id: 'social-broadcast', labelAr: 'تفويض ونشر السوشيال ميديا', labelEn: 'Social Broadcast', icon: Share2 },
  ];

  // Directly insert "المفكرة والحسابات" into the dashboard navigation for the owner
  const navItems = isOwner
    ? [
        baseNavItems[0],
        baseNavItems[1],
        { id: 'contractor-notebook' as BackendSubTab, labelAr: 'المفكرة والحسابات', labelEn: 'Notebook & Accounts', icon: Calculator, highlight: true },
        ...baseNavItems.slice(2),
      ]
    : baseNavItems;

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      {/* Top Admin Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-4 sm:p-6 border border-slate-800 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <AuthorBadge name={ownerName} size="md" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-white">
                {isAr ? 'لوحة تحكم وإدارة المدونة (الباك إند)' : 'Alpha Design Backend Portal'}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold border border-blue-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                {isAr ? 'منطقة المشرفين' : 'Admin Area'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {isAr
                ? `مرحباً، ${currentUser.name} (${currentUser.role === 'owner' ? 'صاحب المدونة' : 'مشرف معتمد'}) | صفحات الإدارة محجوبة عن الزوار`
                : `Logged in as ${currentUser.name} | Confidential back-office view`}
            </p>
          </div>
        </div>

        {/* Exit & Logout Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onExitToFrontend}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/25 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{isAr ? 'العودة لواجهة الزوار (الفرونت إند)' : 'Back to Public Frontend'}</span>
            {isAr ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={onLogout}
            className="p-2 rounded-xl bg-slate-800 hover:bg-red-950/40 text-slate-300 hover:text-red-400 border border-slate-700 transition-colors cursor-pointer"
            title={isAr ? 'تسجيل الخروج من الباك إند' : 'Logout'}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Backend Area: Sub-navigation Tabs + Active Module */}
      <div className="space-y-6">
        {/* Navigation Tabs Bar */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-2.5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSubTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSubTab(item.id)}
                className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{isAr ? item.labelAr : item.labelEn}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: General Settings (includes strict 3-10 articles pagination controller) */}
        {activeSubTab === 'settings' && (
          <SettingsView
            settings={settings}
            onSaveSettings={onUpdateSettings}
            articles={articles}
            onResetData={onResetData}
            onImportArticles={onImportArticles}
            currentUser={currentUser}
            initialTab="reading"
          />
        )}

        {/* Tab: Smart Ad Codes (5 Strategic Slots with AI Auto-Fitting) */}
        {activeSubTab === 'ads' && (
          <SettingsView
            settings={settings}
            onSaveSettings={onUpdateSettings}
            articles={articles}
            onResetData={onResetData}
            onImportArticles={onImportArticles}
            currentUser={currentUser}
            initialTab="ads"
          />
        )}

        {/* Tab: Contractor Accounts Notebook (Owner Only) */}
        {activeSubTab === 'contractor-notebook' && isOwner && (
          <ContractorNotebook currentUser={currentUser} settings={settings} />
        )}

        {/* Tab 2: Smart Article Creator (Images + captions + AI formatting) */}
        {activeSubTab === 'smart-creator' && (
          <SmartArticleCreator
            settings={settings}
            onPublishArticle={(newArt) => {
              onPublishArticle(newArt);
              setActiveSubTab('manage-articles');
            }}
            onViewArticle={onViewArticle}
            onBroadcastComplete={onBroadcastComplete}
          />
        )}

        {/* Tab 3: Manual Article Creator */}
        {activeSubTab === 'manual-creator' && (
          <ManualArticleCreator
            settings={settings}
            onPublishArticle={(newArt) => {
              onPublishArticle(newArt);
              setActiveSubTab('manage-articles');
            }}
            onViewArticle={onViewArticle}
          />
        )}

        {/* Tab 4: 24h Auto-Publish Dashboard */}
        {activeSubTab === 'auto-publish' && (
          <AutoPublishDashboard
            settings={settings}
            onUpdateSettings={onUpdateSettings}
            articles={articles}
            onPublishArticle={onPublishArticle}
            onViewArticle={onViewArticle}
          />
        )}

        {/* Tab: Social Publishing Bot (30-Minute Cycle, 24-Hour Strict Freshness Rule, Specialized Decor Channels) */}
        {activeSubTab === 'social-bot' && (
          <SocialPublishingBotDashboard
            settings={settings}
            onUpdateSettings={onUpdateSettings}
            articles={articles}
            onViewArticle={onViewArticle}
          />
        )}

        {/* Tab 5: Social Media Broadcast & Bot Delegation */}
        {activeSubTab === 'social-broadcast' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Share2 className="w-5 h-5 text-blue-600" />
                    <span>{isAr ? 'تفويض ونشر روابط المقالات عبر بوت ألفا' : 'Social Media Bot Broadcast'}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {isAr
                      ? `تفويض معتمد من صاحب المدونة «${ownerName}» لنشر المقالات على شبكات التواصل.`
                      : `Bot authorized by ${ownerName} to distribute articles across social networks.`}
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>{isAr ? 'التفويض نشط وساري المفعول' : 'Delegation Active'}</span>
                </div>
              </div>

              {/* Broadcast Cards for All Articles */}
              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {isAr ? 'اختر مقالاً لنشر وتوزيع رابطه عبر البوت المعتمد:' : 'Select an article to broadcast via bot:'}
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {articles.slice(0, 8).map((art) => (
                    <div
                      key={art.id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 hover:border-blue-500/50 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={art.featuredImage}
                          alt={art.title}
                          className="w-12 h-12 rounded-xl object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 block truncate">
                            {art.category}
                          </span>
                          <h5 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                            {art.title}
                          </h5>
                          <span className="text-[10px] text-slate-400 block">
                            {new Date(art.publishedAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedArticleForBroadcast(art)}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shrink-0 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Bot className="w-3.5 h-3.5" />
                        <span>{isAr ? 'نشر الرابط' : 'Broadcast'}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Broadcast History */}
              {settings.socialBroadcast.history && settings.socialBroadcast.history.length > 0 && (
                <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {isAr ? 'سجل المنشورات التي تم بثها:' : 'Recent Broadcast Logs:'}
                  </h4>
                  <div className="space-y-2">
                    {settings.socialBroadcast.history.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span className="font-bold text-slate-900 dark:text-white">
                            {item.articleTitle}
                          </span>
                        </div>
                        <span className="text-slate-400 text-[11px]">
                          {new Date(item.timestamp).toLocaleTimeString(isAr ? 'ar-EG' : 'en-US')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 6: Manage Articles */}
        {activeSubTab === 'manage-articles' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span>{isAr ? 'إدارة وتعديل مقالات المدونة' : 'Articles Management'}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {isAr ? `إجمالي المقالات: ${articles.length} مقال` : `Total published articles: ${articles.length}`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveSubTab('smart-creator')}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isAr ? 'مقال ذكي جديد' : 'New Smart Post'}</span>
                </button>
                <button
                  onClick={() => setActiveSubTab('manual-creator')}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAr ? 'كتابة مقال يدوي' : 'Manual Post'}</span>
                </button>
              </div>
            </div>

            {/* Articles Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-start text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                    <th className="pb-3 text-start font-semibold">{isAr ? 'المقال' : 'Article'}</th>
                    <th className="pb-3 text-start font-semibold">{isAr ? 'التصنيف' : 'Category'}</th>
                    <th className="pb-3 text-start font-semibold">{isAr ? 'الكاتب' : 'Author'}</th>
                    <th className="pb-3 text-start font-semibold">{isAr ? 'المشاهدات' : 'Views'}</th>
                    <th className="pb-3 text-start font-semibold">{isAr ? 'التاريخ' : 'Date'}</th>
                    <th className="pb-3 text-end font-semibold">{isAr ? 'إجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {articles.map((art) => (
                    <tr key={art.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3.5 pe-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={art.featuredImage}
                            alt={art.title}
                            className="w-10 h-10 rounded-lg object-cover shrink-0"
                          />
                          <div className="min-w-0 max-w-xs">
                            <span className="font-bold text-slate-900 dark:text-white block truncate">
                              {art.title}
                            </span>
                            {art.isAutoPublished && (
                              <span className="inline-block text-[9px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-1.5 rounded">
                                نشر آلي 24h
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 pe-4 text-slate-600 dark:text-slate-400 font-medium">
                        {art.category}
                      </td>
                      <td className="py-3.5 pe-4 text-slate-600 dark:text-slate-400 font-medium">
                        {art.author?.name || ownerName}
                      </td>
                      <td className="py-3.5 pe-4 text-slate-600 dark:text-slate-400 font-medium">
                        {art.views}
                      </td>
                      <td className="py-3.5 pe-4 text-slate-400">
                        {new Date(art.publishedAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}
                      </td>
                      <td className="py-3.5 text-end">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => onViewArticle(art)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/60 transition-colors cursor-pointer"
                            title={isAr ? 'معاينة المقال' : 'Preview'}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedArticleForBroadcast(art)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors cursor-pointer"
                            title={isAr ? 'نشر الرابط عبر البوت' : 'Broadcast'}
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                          {/* Explicit Red Delete Button for Every Article */}
                          <button
                            type="button"
                            onClick={() => setArticleToDelete(art)}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white dark:bg-rose-950/40 dark:hover:bg-rose-600 dark:text-rose-300 dark:hover:text-white border border-rose-200 dark:border-rose-800 transition-all font-bold text-xs flex items-center gap-1 cursor-pointer shadow-2xs hover:shadow-xs"
                            title={isAr ? 'حذف هذا المقال نهائياً' : 'Delete Article'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>{isAr ? 'حذف' : 'Delete'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile / Responsive Cards with Explicit Delete Button on Every Article */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:hidden pt-4 border-t border-slate-100 dark:border-slate-800">
              {articles.map((art) => (
                <div
                  key={art.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={art.featuredImage}
                      alt={art.title}
                      className="w-14 h-14 rounded-xl object-cover shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-xs text-slate-900 dark:text-white line-clamp-2">
                        {art.title}
                      </span>
                      <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold block mt-0.5">
                        {art.category} • {art.views} {isAr ? 'مشاهدة' : 'views'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => onViewArticle(art)}
                      className="flex-1 py-1.5 px-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-blue-600 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{isAr ? 'معاينة' : 'View'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setArticleToDelete(art)}
                      className="flex-1 py-1.5 px-2 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200 dark:border-rose-800 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{isAr ? 'حذف المقال' : 'Delete'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 7: Supervisors & Team Management */}
        {activeSubTab === 'supervisors' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  <span>{isAr ? 'المشرفون وفريق إدارة المدونة' : 'Supervisors & Editorial Team'}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {isAr
                    ? `قائمة الأشخاص المخولين بالدخول إلى الباك إند والاطلاع على صفحات الإدارة برئاسة «${ownerName}»`
                    : `Authorized personnel with access to back-office modules led by ${ownerName}`}
                </p>
              </div>

              <button
                onClick={() => setShowAddSupervisor(!showAddSupervisor)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{isAr ? 'إضافة مشرف جديد' : 'Add Supervisor'}</span>
              </button>
            </div>

            {/* Add Supervisor Form */}
            {showAddSupervisor && (
              <form onSubmit={handleAddSupervisor} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4 animate-in fade-in">
                <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                  {isAr ? 'بيانات المشرف الجديد:' : 'New Supervisor Details:'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    required
                    value={newSupervisorName}
                    onChange={(e) => setNewSupervisorName(e.target.value)}
                    placeholder={isAr ? 'اسم المشرف' : 'Supervisor Name'}
                    className="text-xs px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                  />
                  <input
                    type="text"
                    value={newSupervisorRole}
                    onChange={(e) => setNewSupervisorRole(e.target.value)}
                    placeholder={isAr ? 'الدور والمسؤولية (مثال: محرر أول)' : 'Role / Responsibility'}
                    className="text-xs px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddSupervisor(false)}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    {isAr ? 'حفظ المشرف' : 'Save Supervisor'}
                  </button>
                </div>
              </form>
            )}

            {/* Supervisors List */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {supervisors.map((sup) => (
                <div
                  key={sup.id}
                  className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3 relative"
                >
                  <div className="flex items-center gap-3">
                    <AuthorBadge name={sup.name} size="sm" />
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {sup.name}
                      </h4>
                      <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium block truncate">
                        {sup.role}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-[11px] space-y-1">
                    <div className="text-slate-500 flex items-center justify-between">
                      <span>{isAr ? 'الصلاحيات:' : 'Permissions:'}</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">{sup.permissions}</span>
                    </div>
                    <div className="text-slate-400 truncate">
                      {sup.email}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                    {sup.isOwner ? (
                      <div className="w-full py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-center text-xs font-bold flex items-center justify-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{isAr ? 'صاحب المدونة والمدير العام (محمي من الحذف)' : 'Sole Owner (Protected)'}</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleDeleteSupervisor(sup.id)}
                        className="w-full py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white dark:bg-rose-950/40 dark:hover:bg-rose-600 dark:text-rose-300 dark:hover:text-white border border-rose-200 dark:border-rose-800 transition-all text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs hover:shadow-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{isAr ? 'حذف هذا المشرف' : 'Delete Supervisor'}</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Social Broadcast Modal */}
      {selectedArticleForBroadcast && (
        <SocialBroadcastModal
          isOpen={true}
          onClose={() => setSelectedArticleForBroadcast(null)}
          article={selectedArticleForBroadcast}
          settings={settings}
          onBroadcastComplete={(item) => {
            onBroadcastComplete(item);
            setSelectedArticleForBroadcast(null);
          }}
        />
      )}

      {/* 1. Safe In-App Confirmation Modal: Delete Article (No window.confirm needed) */}
      {articleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {isAr ? 'تأكيد حذف المقال نهائياً' : 'Confirm Article Deletion'}
                </h3>
                <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
                  {isAr ? 'سيتم مسح المقال تماماً من المدونة' : 'Permanent deletion from blog'}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center gap-3">
                <img
                  src={articleToDelete.featuredImage}
                  alt={articleToDelete.title}
                  className="w-12 h-12 rounded-xl object-cover shrink-0"
                />
                <div className="min-w-0">
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-2">
                    {articleToDelete.title}
                  </h4>
                  <span className="text-[11px] text-blue-600 dark:text-blue-400">
                    {articleToDelete.category} • {articleToDelete.views} {isAr ? 'مشاهدة' : 'views'}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-700">
                {isAr
                  ? 'هل أنت متأكد من رغبتك في حذف هذا المقال؟ لا يمكن التراجع عن هذه الخطوة.'
                  : 'Are you sure you want to permanently delete this article?'}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setArticleToDelete(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteArticle}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-rose-600/25 transition-all cursor-pointer hover:scale-102 active:scale-98"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isAr ? 'نعم، احذف المقال الآن' : 'Yes, Delete Permanently'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Safe In-App Confirmation Modal: Delete Supervisor (No window.confirm needed) */}
      {supervisorToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {isAr ? 'تأكيد حذف المشرف' : 'Confirm Supervisor Removal'}
                </h3>
                <span className="text-xs text-slate-500">
                  {isAr ? 'سحب صلاحيات المشرف من الباك إند' : 'Revoke administrative privileges'}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center gap-3">
                <AuthorBadge name={supervisorToDelete.name} size="sm" />
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                    {supervisorToDelete.name}
                  </h4>
                  <span className="text-[11px] text-blue-600 dark:text-blue-400">
                    {supervisorToDelete.role} • {supervisorToDelete.email}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-700">
                {isAr
                  ? 'هل تريد بالتأكيد حذف هذا المشرف من لوحة التحكم؟ لن يتمكن من الدخول للمدونة.'
                  : 'Are you sure you want to remove this supervisor?'}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSupervisorToDelete(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteSupervisor}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-rose-600/25 transition-all cursor-pointer hover:scale-102 active:scale-98"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isAr ? 'تأكيد حذف المشرف' : 'Confirm Removal'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-6 start-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-slate-900 text-white shadow-2xl border border-slate-700 flex items-center gap-3 animate-in slide-in-from-top duration-300">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
