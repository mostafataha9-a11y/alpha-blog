import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomeView } from './components/HomeView';
import { ArticlesView } from './components/ArticlesView';
import { AboutView } from './components/AboutView';
import { ContactView } from './components/ContactView';
import { PrivacyView } from './components/PrivacyView';
import { TermsView } from './components/TermsView';
import { ArticleDetailView } from './components/ArticleDetailView';
import { BackendDashboard } from './components/BackendDashboard';
import { AdminLoginModal } from './components/AdminLoginModal';
import { ChatBot } from './components/ChatBot';
import { BlindScreenReader } from './components/BlindScreenReader';
import { SocialBroadcastModal } from './components/SocialBroadcastModal';
import { SmartAdBanner } from './components/SmartAdBanner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SeoStructuredData } from './components/SeoStructuredData';
import { Article, SiteSettings, ActiveTab, Comment, BroadcastHistoryItem, AdminUser, PublicTab } from './types/blog';
import { INITIAL_SETTINGS, INITIAL_ARTICLES, CATEGORIES } from './data/initialData';
import { Bot } from 'lucide-react';
import { getAuthToken, clearAuthToken, fetchWithAuth } from './utils/apiAuth';

const STORAGE_KEY_SETTINGS = 'alpha_decor_settings_v3';
const STORAGE_KEY_ARTICLES = 'alpha_decor_articles_v3';
const STORAGE_KEY_ADMIN = 'alpha_decor_admin_v3';

export default function App() {
  // Load settings with fallback to initial data
  const [settings, setSettings] = useState<SiteSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...INITIAL_SETTINGS,
          ...parsed,
          blogName: parsed.blogName?.includes('ديكور') ? parsed.blogName : INITIAL_SETTINGS.blogName,
          tagline: parsed.tagline?.includes('ديكور') ? parsed.tagline : INITIAL_SETTINGS.tagline,
          authorName: 'الحضرى محمود',
          authorAvatar: '',
          autoPublish: {
            ...INITIAL_SETTINGS.autoPublish,
            ...(parsed.autoPublish || {}),
            targetWordCount: Math.max(1000, Math.min(10000, Number(parsed.autoPublish?.targetWordCount) || 1500)),
          },
          socialBroadcast: parsed.socialBroadcast || INITIAL_SETTINGS.socialBroadcast,
          assistantNegotiation: parsed.assistantNegotiation || INITIAL_SETTINGS.assistantNegotiation,
          ads: parsed.ads || INITIAL_SETTINGS.ads,
        };
      }
    } catch (e) {
      console.warn('Failed to parse stored settings:', e);
    }
    return INITIAL_SETTINGS;
  });

  // Articles state: initialized with initial data for zero-flash UI, then hydrated from Cloud SQL
  const [articles, setArticles] = useState<Article[]>(INITIAL_ARTICLES);
  const [isArticlesLoading, setIsArticlesLoading] = useState<boolean>(true);
  const [articlesError, setArticlesError] = useState<string | null>(null);

  // Admin user authentication state
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ADMIN);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to parse admin state:', e);
    }
    return null;
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const [isChatBotOpen, setIsChatBotOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [articleForShareModal, setArticleForShareModal] = useState<Article | null>(null);

  // Centralized tab & route navigation function
  const navigateToTab = (tab: ActiveTab, article?: Article | null) => {
    if (tab === 'home') {
      setActiveTab('home');
      setSelectedArticle(null);
      // Clean URL back to root '/'
      if (window.location.hash || (window.location.pathname !== '/' && !window.location.pathname.endsWith('/index.html'))) {
        try {
          window.history.pushState(null, '', '/');
        } catch (_) {}
      }
      try {
        delete (window as any).__INITIAL_ARTICLE_ID__;
      } catch (_) {}
    } else if (tab === 'article-detail' && article) {
      setSelectedArticle(article);
      setActiveTab('article-detail');
      try {
        window.history.pushState(null, '', `/#article-${encodeURIComponent(article.slug || article.id)}`);
      } catch (_) {}
    } else if (tab === 'backend') {
      if (adminUser?.isLoggedIn) {
        setActiveTab('backend');
        try {
          window.history.pushState(null, '', '/#backend');
        } catch (_) {}
      } else {
        setIsAdminLoginOpen(true);
        return;
      }
    } else {
      setActiveTab(tab);
      setSelectedArticle(null);
      try {
        window.history.pushState(null, '', `/#${tab}`);
      } catch (_) {}
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Synchronize ActiveTab with Pathname and URL Hash for seamless SEO and direct links
  useEffect(() => {
    const handleRouteSync = () => {
      const pathname = window.location.pathname || '';

      // 1. Explicit direct deep-link to /article/:slug
      if (pathname.startsWith('/article/') && pathname.length > 9) {
        const slug = decodeURIComponent(pathname.replace('/article/', '').trim());
        if (slug) {
          const matched = articles.find(
            (a) => a.slug === slug || a.id === slug || encodeURIComponent(a.slug) === slug
          );
          if (matched) {
            setSelectedArticle(matched);
            setActiveTab('article-detail');
            return;
          }
        }
      }

      // 2. Server-rendered initial article ID (only if on /article/... route)
      const initialArticleId = (window as any).__INITIAL_ARTICLE_ID__;
      if (initialArticleId && pathname.startsWith('/article/')) {
        const matched = articles.find((a) => a.id === initialArticleId);
        if (matched) {
          setSelectedArticle(matched);
          setActiveTab('article-detail');
          try {
            delete (window as any).__INITIAL_ARTICLE_ID__;
          } catch (_) {}
          return;
        }
      }

      // 3. Hash navigation
      const rawHash = window.location.hash.replace(/^#/, '').trim();
      const decodedHash = decodeURIComponent(rawHash);

      // If no hash, or #home, or visiting root `/`, always show the main blog homepage
      if (!decodedHash || decodedHash === 'home' || decodedHash === '') {
        setActiveTab('home');
        setSelectedArticle(null);
        if (window.location.hash) {
          try {
            window.history.replaceState(null, '', window.location.pathname || '/');
          } catch (_) {}
        }
        return;
      }

      // Standard public sections
      if (['articles', 'about', 'contact', 'privacy', 'terms'].includes(decodedHash)) {
        setActiveTab(decodedHash as ActiveTab);
        setSelectedArticle(null);
        return;
      }

      // Admin portal
      if (decodedHash === 'backend') {
        if (adminUser?.isLoggedIn) {
          setActiveTab('backend');
        } else {
          setIsAdminLoginOpen(true);
        }
        return;
      }

      // Explicit article hash (e.g. #article-slug)
      if (decodedHash.startsWith('article-')) {
        const articleSlugOrId = decodedHash.replace(/^article-/, '');
        const matched = articles.find(
          (a) =>
            a.slug === articleSlugOrId ||
            a.id === articleSlugOrId ||
            encodeURIComponent(a.slug) === articleSlugOrId
        );
        if (matched) {
          setSelectedArticle(matched);
          setActiveTab('article-detail');
          return;
        }
      }

      // For any unrecognized hash or normal visit, safely default to the main blog homepage
      setActiveTab('home');
      setSelectedArticle(null);
    };

    handleRouteSync();
    window.addEventListener('hashchange', handleRouteSync);
    window.addEventListener('popstate', handleRouteSync);
    return () => {
      window.removeEventListener('hashchange', handleRouteSync);
      window.removeEventListener('popstate', handleRouteSync);
    };
  }, [articles, adminUser?.isLoggedIn]);

  // Initial load from Cloud SQL Database & verify session
  useEffect(() => {
    // 1. Verify session with backend
    fetchWithAuth('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.isLoggedIn && data.user) {
          setAdminUser({ ...data.user, isLoggedIn: true });
        } else {
          setAdminUser(null);
          clearAuthToken();
        }
      })
      .catch((err) => console.warn('Could not verify server session:', err));

    // 2. Fetch published articles strictly from PostgreSQL Cloud SQL
    fetch('/api/db/articles')
      .then((res) => {
        if (!res.ok) throw new Error('فشل جلب المقالات من قاعدة البيانات PostgreSQL');
        return res.json();
      })
      .then((dbArticles) => {
        if (Array.isArray(dbArticles)) {
          setArticles(dbArticles);
        } else {
          setArticles([]);
        }
        setIsArticlesLoading(false);
      })
      .catch((err) => {
        console.error('Could not fetch articles from database:', err);
        setArticlesError('تعذر جلب المقالات من قاعدة البيانات.');
        setIsArticlesLoading(false);
      });

    // 3. Fetch permanent settings from Cloud SQL
    fetch('/api/db/settings')
      .then((res) => res.json())
      .then((dbSettings) => {
        if (dbSettings && dbSettings.blogName) {
          setSettings((prev) => ({
            ...prev,
            ...dbSettings,
            authorName: 'الحضرى محمود',
          }));
        }
      })
      .catch((err) => console.warn('Could not fetch settings from database:', err));
  }, []);

  // Sync settings to localStorage and HTML direction
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.warn('Could not save settings to localStorage:', e);
    }

    const html = document.documentElement;
    html.dir = settings.direction || 'rtl';
    html.lang = settings.language || 'ar';
  }, [settings]);

  // Sync admin user to localStorage
  useEffect(() => {
    try {
      if (adminUser) {
        localStorage.setItem(STORAGE_KEY_ADMIN, JSON.stringify(adminUser));
      } else {
        localStorage.removeItem(STORAGE_KEY_ADMIN);
      }
    } catch (e) {
      console.warn('Could not save admin session:', e);
    }
  }, [adminUser]);

  // Periodically sync articles from Cloud SQL to capture autonomous background publications
  useEffect(() => {
    const syncArticlesFromDb = async () => {
      try {
        const res = await fetch('/api/db/articles');
        if (res.ok) {
          const dbArticles = await res.json();
          if (Array.isArray(dbArticles)) {
            setArticles(dbArticles);
          }
        }
      } catch (err) {
        console.warn('Silent sync error:', err);
      }
    };

    // Poll every 60 seconds to catch newly published articles
    const syncTimer = setInterval(syncArticlesFromDb, 60000);
    return () => clearInterval(syncTimer);
  }, []);

  // Navigate to article details
  const handleSelectArticle = (article: Article) => {
    navigateToTab('article-detail', article);
  };

  // Publish a new article (from smart creator or manual creator in backend)
  // Strict Directive Rule: Do NOT display article as published before confirmed insertion into PostgreSQL
  const handlePublishArticle = async (newArticle: Article) => {
    try {
      const res = await fetchWithAuth('/api/db/articles', {
        method: 'POST',
        body: JSON.stringify({
          ...newArticle,
          rejectIfInvalid: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'فشل حفظ ونشر المقال في قاعدة البيانات PostgreSQL.');
      }
      const savedArticle = data.article || newArticle;
      // Prepend to UI list ONLY after confirmed persistence in PostgreSQL
      setArticles((prev) => [savedArticle, ...prev.filter((a) => a.id !== savedArticle.id)]);
      return { success: true, article: savedArticle };
    } catch (err: any) {
      console.error('Failed to persist article to Cloud SQL:', err);
      throw err;
    }
  };

  // Delete an article (from backend manage articles)
  const handleDeleteArticle = async (articleId: string) => {
    setArticles((prev) => prev.filter((a) => a.id !== articleId));
    if (selectedArticle && selectedArticle.id === articleId) {
      setSelectedArticle(null);
      setActiveTab('home');
    }
    try {
      await fetchWithAuth(`/api/db/articles/${articleId}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Failed to delete article from Cloud SQL:', err);
    }
  };

  // Add comment to an article
  const handleAddComment = (articleId: string, comment: Comment) => {
    setArticles((prev) =>
      prev.map((art) => {
        if (art.id === articleId) {
          return {
            ...art,
            comments: [...art.comments, comment],
          };
        }
        return art;
      })
    );

    if (selectedArticle && selectedArticle.id === articleId) {
      setSelectedArticle({
        ...selectedArticle,
        comments: [...selectedArticle.comments, comment],
      });
    }
  };

  // Like an article
  const handleLikeArticle = async (articleId: string) => {
    setArticles((prev) =>
      prev.map((art) => {
        if (art.id === articleId) {
          return { ...art, likes: art.likes + 1 };
        }
        return art;
      })
    );

    if (selectedArticle && selectedArticle.id === articleId) {
      setSelectedArticle({
        ...selectedArticle,
        likes: selectedArticle.likes + 1,
      });
    }

    try {
      await fetch(`/api/db/articles/${articleId}/like`, { method: 'POST' });
    } catch (err) {
      console.warn('Failed to like article on server:', err);
    }
  };

  // Update settings and persist to Cloud SQL
  const handleUpdateSettings = async (newSettings: SiteSettings) => {
    setSettings(newSettings);
    try {
      await fetchWithAuth('/api/db/settings', {
        method: 'POST',
        body: JSON.stringify(newSettings),
      });
    } catch (err) {
      console.error('Failed to persist settings to Cloud SQL:', err);
    }
  };

  // Reset data to defaults
  const handleResetData = () => {
    setSettings(INITIAL_SETTINGS);
    setArticles(INITIAL_ARTICLES);
    localStorage.removeItem(STORAGE_KEY_SETTINGS);
    localStorage.removeItem(STORAGE_KEY_ARTICLES);
  };

  // Import articles
  const handleImportArticles = (importedArticles: Article[]) => {
    setArticles(importedArticles);
  };

  // Record social broadcast in settings history
  const handleBroadcastComplete = (item: BroadcastHistoryItem) => {
    setSettings((prev) => ({
      ...prev,
      socialBroadcast: {
        ...prev.socialBroadcast,
        history: [item, ...(prev.socialBroadcast?.history || [])],
      },
    }));
  };

  // Admin login handler
  const handleAdminLogin = (user: AdminUser) => {
    setAdminUser(user);
    setActiveTab('backend');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Admin logout handler
  const handleAdminLogout = async () => {
    try {
      await fetchWithAuth('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.warn('Logout request failed:', err);
    }
    clearAuthToken();
    setAdminUser(null);
    setActiveTab('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Guard for backend view: if not logged in, show login modal
  const handleOpenBackend = () => {
    if (adminUser?.isLoggedIn) {
      setActiveTab('backend');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setIsAdminLoginOpen(true);
    }
  };

  return (
    <div
      dir={settings.direction}
      className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors selection:bg-blue-600 selection:text-white"
      style={{
        fontFamily:
          settings.language === 'ar'
            ? "'Cairo', 'Tajawal', 'Almarai', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Tahoma, Arial, sans-serif"
            : "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* WordPress-style Header with Visitor Navigation & Admin Portal Button */}
      <Header
        settings={settings}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'backend') {
            handleOpenBackend();
          } else {
            navigateToTab(tab);
          }
        }}
        onOpenBot={() => setIsChatBotOpen(true)}
        onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
        adminUser={adminUser}
      />

      {/* Dynamic Schema.org JSON-LD Structured Data (Organization + BlogPosting) */}
      <SeoStructuredData settings={settings} article={selectedArticle} />

      {/* Ad Slot 1: Header Top Smart Ad Banner (الأول في الهيدر) */}
      {activeTab !== 'backend' && settings.ads?.enabled && (
        <div className="w-full">
          <SmartAdBanner
            config={settings.ads.header}
            placement="header"
            isAr={settings.language === 'ar'}
          />
        </div>
      )}

      {/* Main Page Body Protected by ErrorBoundary */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 pt-8">
        <ErrorBoundary isRtl={settings.language === 'ar'}>
          {/* Public View 1: Home (Main feed with strict 3-10 articles pagination) */}
        {activeTab === 'home' && (
          <HomeView
            articles={articles}
            settings={settings}
            setActiveTab={(tab) => {
              if (tab === 'settings' || tab === 'smart-creator' || tab === 'manual-creator' || tab === 'auto-publish') {
                handleOpenBackend();
              } else {
                navigateToTab(tab);
              }
            }}
            onSelectArticle={handleSelectArticle}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            onBroadcastComplete={handleBroadcastComplete}
            onOpenChatBot={() => setIsChatBotOpen(true)}
          />
        )}

        {/* Public View 2: Articles Archive / Directory */}
        {activeTab === 'articles' && (
          <ArticlesView
            articles={articles}
            settings={settings}
            categories={CATEGORIES}
            onSelectArticle={handleSelectArticle}
            onOpenShareModal={(art) => setArticleForShareModal(art)}
          />
        )}

        {/* Public View 3: About Us (معلومات عنا / من نحن) */}
        {activeTab === 'about' && (
          <AboutView
            settings={settings}
            onNavigate={(tab) => navigateToTab(tab)}
            articlesCount={articles.length}
          />
        )}

        {/* Public View 4: Contact Us (اتصل بنا) */}
        {activeTab === 'contact' && (
          <ContactView
            settings={settings}
            onOpenChatBot={() => setIsChatBotOpen(true)}
          />
        )}

        {/* Public View 5: Privacy Policy (سياسة الخصوصية) */}
        {activeTab === 'privacy' && (
          <PrivacyView settings={settings} />
        )}

        {/* Public View 6: Terms of Use (شروط الاستخدام) */}
        {activeTab === 'terms' && (
          <TermsView settings={settings} />
        )}

        {/* Public View 7: Article Detail View (تفاصيل المقال الفردي) */}
        {activeTab === 'article-detail' && (
          <ErrorBoundary
            isRtl={settings.language === 'ar'}
            fallbackTitle={settings.language === 'ar' ? 'تعذر تحميل تفاصيل المقال' : 'Could not load article details'}
            fallbackMessage={settings.language === 'ar' ? 'حدث خطأ غير متوقع أثناء عرض هذا المقال. يمكنك الرجوع للصفحة الرئيسية وتصفح المقالات الأخرى.' : 'An error occurred displaying this article.'}
            onReset={() => navigateToTab('home')}
          >
            <ArticleDetailView
              article={selectedArticle || articles[0]}
              settings={settings}
              onBack={() => navigateToTab('home')}
              onSelectArticle={handleSelectArticle}
              allArticles={articles}
              onAddComment={handleAddComment}
              onLikeArticle={handleLikeArticle}
              onBroadcastComplete={handleBroadcastComplete}
            />
          </ErrorBoundary>
        )}

        {/* Backend / Admin Portal (Strictly for Owner الحضرى محمود & Supervisors) */}
        {activeTab === 'backend' && adminUser?.isLoggedIn && (
          <BackendDashboard
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            articles={articles}
            onPublishArticle={handlePublishArticle}
            onDeleteArticle={handleDeleteArticle}
            onViewArticle={handleSelectArticle}
            onResetData={handleResetData}
            onImportArticles={handleImportArticles}
            currentUser={adminUser}
            onLogout={handleAdminLogout}
            onExitToFrontend={() => navigateToTab('home')}
            onBroadcastComplete={handleBroadcastComplete}
          />
        )}
        </ErrorBoundary>
      </main>

      {/* Footer with Links to All 6 Public Visitor Pages + Discrete Admin Link */}
      <Footer
        settings={settings}
        setActiveTab={(tab) => {
          if (tab === 'backend') {
            handleOpenBackend();
          } else {
            navigateToTab(tab);
          }
        }}
        categories={CATEGORIES}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          navigateToTab('articles');
        }}
        onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
      />

      {/* Floating Chatbot Launcher Button */}
      {!isChatBotOpen && (
        <button
          onClick={() => setIsChatBotOpen(true)}
          className="fixed bottom-6 end-6 z-40 p-4 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 group ring-4 ring-blue-500/20 cursor-pointer"
          aria-label="Open Alpha Chatbot"
        >
          <Bot className="w-6 h-6 animate-bounce" />
          <span className="hidden sm:inline font-bold text-xs pe-1">
            {settings.language === 'ar' ? 'بوت ألفا الذكي' : 'Alpha Bot'}
          </span>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute top-1 end-1 ring-2 ring-white"></span>
        </button>
      )}

      {/* Interactive AI ChatBot Widget */}
      <ChatBot
        settings={settings}
        isOpen={isChatBotOpen}
        onClose={() => setIsChatBotOpen(false)}
        articles={articles}
        currentArticle={selectedArticle}
        onSelectArticle={handleSelectArticle}
      />

      {/* Screen Reader & Voice Host for the Visually Impaired (on the Right Side of the Screen) */}
      <BlindScreenReader
        settings={settings}
        articles={articles}
        currentArticle={selectedArticle}
        activeTab={activeTab}
        onSelectArticle={handleSelectArticle}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
          setSelectedArticle(null);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Admin Login Modal for Restricted Backend Access */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onLoginSuccess={handleAdminLogin}
        settings={settings}
      />

      {/* Social Broadcast Modal from Quick Action */}
      {articleForShareModal && (
        <SocialBroadcastModal
          isOpen={true}
          onClose={() => setArticleForShareModal(null)}
          article={articleForShareModal}
          settings={settings}
          onBroadcastComplete={(item) => {
            handleBroadcastComplete(item);
            setArticleForShareModal(null);
          }}
        />
      )}
    </div>
  );
}
