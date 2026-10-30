import React, { useState, useMemo } from 'react';
import {
  Edit3,
  Image as ImageIcon,
  Tag,
  Folder,
  Send,
  Eye,
  Bold,
  Italic,
  Heading2,
  Heading3,
  Quote,
  List,
  ListOrdered,
  Code,
  CheckCircle,
  FileText,
  Clock,
  Sparkles,
  Loader2,
  AlertCircle,
  Upload
} from 'lucide-react';
import { Article, SiteSettings } from '../types/blog';
import { CATEGORIES } from '../data/initialData';
import { fetchWithAuth } from '../utils/apiAuth';
import { compressImageClient } from '../utils/imageCompression';

interface ManualArticleCreatorProps {
  settings: SiteSettings;
  onPublishArticle: (article: Article) => void;
  onViewArticle: (article: Article) => void;
}

export const ManualArticleCreator: React.FC<ManualArticleCreatorProps> = ({
  settings,
  onPublishArticle,
  onViewArticle,
}) => {
  const isAr = settings.language === 'ar';

  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState(CATEGORIES[1] || 'دهانات الحوائط والألوان');
  const [newCatInput, setNewCatInput] = useState('');
  const [featuredImage, setFeaturedImage] = useState(
    'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80'
  );
  const [tagsInput, setTagsInput] = useState('');
  const [tagsList, setTagsList] = useState<string[]>(['دهانات حوائط', 'ديكورات داخلية', 'بديل خشب ورخام', 'ألفا ديكور']);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [publishedPost, setPublishedPost] = useState<Article | null>(null);

  // Word count & reading time
  const wordCount = useMemo(() => {
    return content.trim().split(/\s+/).filter(Boolean).length;
  }, [content]);

  const readingTime = useMemo(() => {
    return Math.max(1, Math.ceil(wordCount / 200));
  }, [wordCount]);

  // Insert markdown helper
  const insertFormatting = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('manual-content-editor') as HTMLTextAreaElement | null;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end) || (isAr ? 'نص توضيحي' : 'sample text');
    const newText = content.substring(0, start) + prefix + selectedText + suffix + content.substring(end);

    setContent(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 50);
  };

  const handleAddTag = () => {
    if (!tagsInput.trim()) return;
    const clean = tagsInput.replace(/#/g, '').trim();
    if (clean && !tagsList.includes(clean)) {
      setTagsList([...tagsList, clean]);
    }
    setTagsInput('');
  };

  const handleRemoveTag = (tag: string) => {
    setTagsList(tagsList.filter((t) => t !== tag));
  };

  const [formError, setFormError] = useState('');
  const [isAiRewriting, setIsAiRewriting] = useState(false);
  const [aiSuccessMsg, setAiSuccessMsg] = useState('');

  const handleAiRewrite = async () => {
    if (!title.trim() && !content.trim()) {
      setFormError(isAr ? 'يرجى كتابة عنوان المقال أو جزء من مسودته لتتم إعادة صياغتها بالسيو.' : 'Please enter a title or draft text to rewrite.');
      return;
    }

    setFormError('');
    setIsAiRewriting(true);
    setAiSuccessMsg('');

    try {
      const response = await fetchWithAuth('/api/ai/generate-smart-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: [
            {
              url: featuredImage,
              caption: title || (isAr ? 'تصميم رقمي معاصر' : 'Modern design figure'),
            },
          ],
          topic: title,
          draftTitle: title,
          draftContent: content,
          tone: 'إبداعي واحترافي بأسلوب بشري',
          language: settings.language,
          length: 'medium',
        }),
      });

      if (!response.ok) throw new Error('Failed to rewrite');
      const data = await response.json();

      if (data.title) setTitle(data.title);
      if (data.content) setContent(data.content);
      if (data.excerpt) setExcerpt(data.excerpt);
      if (data.tags && Array.isArray(data.tags)) setTagsList(data.tags);
      if (data.category) setCategory(data.category);

      setAiSuccessMsg(
        isAr
          ? 'تمت إعادة صياغة المقال بنجاح وتطبيقه على معايير السيو والأسلوب البشري! يمكنك مراجعته أو نشره فوراً.'
          : 'Article rewritten and optimized for Google SEO in a human tone!'
      );
    } catch (e) {
      console.error(e);
      setFormError(isAr ? 'تعذر الاتصال بخادم الذكاء الاصطناعي.' : 'Failed to contact AI service.');
    } finally {
      setIsAiRewriting(false);
    }
  };

  const handlePublish = (status: 'published' | 'draft' = 'published') => {
    if (!title.trim() || !content.trim()) {
      setFormError(isAr ? 'يرجى كتابة عنوان المقال ومحتواه على الأقل.' : 'Please provide at least a title and content.');
      return;
    }
    setFormError('');

    const finalCategory = newCatInput.trim() ? newCatInput.trim() : category;

    const newArticle: Article = {
      id: 'manual-post-' + Date.now(),
      title: title.trim(),
      slug: title.trim().toLowerCase().replace(/\s+/g, '-').slice(0, 50),
      excerpt: excerpt.trim() || content.slice(0, 160) + '...',
      content: content.trim(),
      featuredImage: featuredImage.trim(),
      author: {
        name: settings.authorName,
        avatar: settings.authorAvatar,
        role: isAr ? 'كاتب ومصمم الموقع' : 'Site Author',
      },
      category: finalCategory,
      tags: tagsList,
      publishedAt: new Date().toISOString(),
      readingTime,
      views: 1,
      likes: 0,
      comments: [],
      status,
      seoScore: 95,
      rewrittenByAi: false,
    };

    onPublishArticle(newArticle);
    setPublishedPost(newArticle);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-semibold mb-2">
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isAr ? 'محرر المقالات اليدوي الكلاسيكي' : 'Classic Manual Article Editor'}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            {isAr ? 'إنشاء ونشر مقال يدوي بنفسك' : 'Write & Publish Manual Article'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isAr
              ? 'محرر كامل للتدوين اليدوي بصيغة ووردبريس مع أدوات التنسيق، وتخصيص الصورة البارزة والتصنيفات.'
              : 'Full WordPress style publication editor with typography toolbar, categories, and tags.'}
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'editor'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {isAr ? 'المحرر والكتابة' : 'Editor'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              activeTab === 'preview'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{isAr ? 'معاينة حية للمقال' : 'Live Preview'}</span>
          </button>
        </div>
      </div>

      {publishedPost && (
        <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-emerald-500" />
            <div>
              <h3 className="font-bold text-sm text-emerald-900 dark:text-emerald-200">
                {isAr ? 'تم نشر مقالك اليدوي بنجاح على المدونة!' : 'Article Published Successfully!'}
              </h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                "{publishedPost.title}"
              </p>
            </div>
          </div>
          <button
            onClick={() => onViewArticle(publishedPost)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors"
          >
            {isAr ? 'عرض المقال الآن' : 'View Article'}
          </button>
        </div>
      )}

      {formError && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs sm:text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{formError}</span>
        </div>
      )}

      {aiSuccessMsg && (
        <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs sm:text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4 shrink-0 text-indigo-500" />
          <span>{aiSuccessMsg}</span>
        </div>
      )}

      {/* Editor Body */}
      {activeTab === 'editor' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
              {/* Title Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {isAr ? 'عنوان المقال (Title):' : 'Article Title:'}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={isAr ? 'اكتب عنواناً جذاباً ومؤثراً للمقال...' : 'Enter an eye-catching article title...'}
                  className="w-full text-base sm:text-lg font-bold px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Excerpt */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {isAr ? 'مقتطف موجز للمقال (Excerpt):' : 'Short Excerpt:'}
                </label>
                <textarea
                  rows={2}
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder={isAr ? 'ملخص سريع يظهر في بطاقة المقال بالصفحة الرئيسية...' : 'Brief summary shown in the card feed...'}
                  className="w-full text-xs sm:text-sm p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Toolbar */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs">
                  <button
                    type="button"
                    onClick={() => insertFormatting('**', '**')}
                    className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                    title={isAr ? 'عريض (Bold)' : 'Bold'}
                  >
                    <Bold className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('*', '*')}
                    className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                    title={isAr ? 'مائل (Italic)' : 'Italic'}
                  >
                    <Italic className="w-4 h-4" />
                  </button>
                  <span className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-1"></span>
                  <button
                    type="button"
                    onClick={() => insertFormatting('\n## ', '\n')}
                    className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1 font-bold"
                    title={isAr ? 'عنوان فرعي H2' : 'Heading 2'}
                  >
                    <Heading2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('\n### ', '\n')}
                    className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1 font-bold"
                    title={isAr ? 'عنوان فرعي H3' : 'Heading 3'}
                  >
                    <Heading3 className="w-4 h-4" />
                  </button>
                  <span className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-1"></span>
                  <button
                    type="button"
                    onClick={() => insertFormatting('\n> ', '\n')}
                    className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                    title={isAr ? 'اقتباس (Quote)' : 'Blockquote'}
                  >
                    <Quote className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('\n- ', '')}
                    className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                    title={isAr ? 'قائمة نقطية' : 'Bullet List'}
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('\n1. ', '')}
                    className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                    title={isAr ? 'قائمة مرقمة' : 'Numbered List'}
                  >
                    <ListOrdered className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('```\n', '\n```')}
                    className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                    title={isAr ? 'كتلة كود برمجية' : 'Code'}
                  >
                    <Code className="w-4 h-4" />
                  </button>
                  <span className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-1"></span>
                  <button
                    type="button"
                    onClick={() =>
                      insertFormatting(
                        '\n![شرح توضيحي للصورة](https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1000&q=80)\n*شرح توضيحي للصورة*\n'
                      )
                    }
                    className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1 text-xs"
                    title={isAr ? 'إدراج صورة مع شرح' : 'Insert image with caption'}
                  >
                    <ImageIcon className="w-4 h-4 text-blue-500" />
                    <span>{isAr ? 'إدراج صورة' : 'Image'}</span>
                  </button>
                </div>

                {/* Textarea */}
                <textarea
                  id="manual-content-editor"
                  rows={16}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={
                    isAr
                      ? 'اكتب محتوى المقال هنا بتنسيق Markdown...\n\nيمكنك استخدام العناوين الفرعية: ## عنوان المقال\nأو إدراج صور مع شرح: ![شرح](رابط_الصورة)\nأو نقاط وتفاصيل إبداعية.'
                      : 'Write your post in Markdown...'
                  }
                  className="w-full text-sm p-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none leading-relaxed font-sans"
                />

                <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500">
                  <div className="flex items-center gap-4">
                    <span>
                      {wordCount} {isAr ? 'كلمة' : 'words'}
                    </span>
                    <span>
                      {content.length} {isAr ? 'حرف' : 'chars'}
                    </span>
                    <span className="flex items-center gap-1 text-blue-600">
                      <Clock className="w-3 h-3" />
                      {readingTime} {isAr ? 'دقائق قراءة' : 'min read'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar: Post Settings */}
          <div className="lg:col-span-4 space-y-6">
            {/* Publish Actions Box */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
                <Send className="w-4 h-4 text-blue-600" />
                {isAr ? 'إجراءات النشر' : 'Publish Actions'}
              </h3>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleAiRewrite}
                  disabled={isAiRewriting}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isAiRewriting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{isAr ? 'جارِ التحويل وإعادة الصياغة بالسيو...' : 'Rewriting for SEO...'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>{isAr ? 'إعادة صياغة المقال بالسيو (AI)' : 'SEO Rewrite with AI'}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handlePublish('published')}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{isAr ? 'نشر المقال فوراً على المدونة' : 'Publish Article Now'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePublish('draft')}
                  className="w-full py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
                >
                  {isAr ? 'حفظ كمسودة' : 'Save as Draft'}
                </button>
              </div>
            </div>

            {/* Featured Image */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-indigo-500" />
                {isAr ? 'الصورة البارزة (غلاف المقال)' : 'Featured Image'}
              </h3>

              <div className="aspect-16/10 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <img
                  src={featuredImage}
                  alt="Featured preview"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex gap-2">
                <input
                  type="url"
                  value={featuredImage}
                  onChange={(e) => setFeaturedImage(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 text-xs p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                />
                <label className="p-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white cursor-pointer transition-colors flex items-center justify-center shrink-0" title={isAr ? 'رفع وضغط صورة محلية (WebP)' : 'Upload & compress image'}>
                  <Upload className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const compressed = await compressImageClient(file, { maxWidth: 1600, maxHeight: 1600, quality: 0.82 });
                        setFeaturedImage(compressed.dataUrl);
                      } catch (err) {
                        console.warn('Compression error:', err);
                      }
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>
            </div>

            {/* Category */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
                <Folder className="w-4 h-4 text-amber-500" />
                {isAr ? 'تصنيف المقال' : 'Category'}
              </h3>

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
              >
                {CATEGORIES.slice(1).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <div className="space-y-1 pt-1">
                <span className="text-[11px] text-slate-400">
                  {isAr ? 'أو اكتب تصنيفاً جديداً مخصصاً:' : 'Or custom category:'}
                </span>
                <input
                  type="text"
                  value={newCatInput}
                  onChange={(e) => setNewCatInput(e.target.value)}
                  placeholder={isAr ? 'اسم تصنيف جديد...' : 'New category name...'}
                  className="w-full text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>

            {/* Tags / Keywords */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-500" />
                {isAr ? 'الكلمات المفتاحية والوسوم (SEO)' : 'Tags / Keywords'}
              </h3>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder={isAr ? 'أضف وسماً واضغط Enter...' : 'Add tag & Enter...'}
                  className="flex-1 text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-3 py-2 bg-slate-200 dark:bg-slate-700 text-xs font-semibold rounded-lg"
                >
                  {isAr ? 'إضافة' : 'Add'}
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {tagsList.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-medium"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-blue-400 hover:text-blue-600 text-[10px]"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Live Preview Mode */
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-sm max-w-4xl mx-auto space-y-6">
          <div className="relative aspect-16/9 rounded-2xl overflow-hidden">
            <img
              src={featuredImage}
              alt={title || 'Featured'}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="space-y-3">
            <span className="px-3 py-1 rounded-lg bg-blue-600 text-white text-xs font-bold">
              {newCatInput || category}
            </span>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white leading-tight">
              {title || (isAr ? 'عنوان المقال التجريبي' : 'Sample Article Title')}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic border-s-4 border-blue-500 ps-4">
              {excerpt || (isAr ? 'مقتطف المقال التوضيحي...' : 'Article excerpt summary...')}
            </p>
          </div>

          <div className="prose dark:prose-invert max-w-none text-sm sm:text-base leading-relaxed space-y-4 whitespace-pre-wrap">
            {content || (isAr ? 'محتوى المقال سيظهر هنا بالتفصيل...' : 'Article body will appear here...')}
          </div>
        </div>
      )}
    </div>
  );
};
