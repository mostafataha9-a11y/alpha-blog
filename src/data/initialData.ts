import { Article, SiteSettings } from '../types/blog';

export const INITIAL_SETTINGS: SiteSettings = {
  blogName: 'ألفا للديكور والدهانات',
  blogNameEn: 'Alpha Decor & Paints',
  tagline: 'المنصة الرائدة في عالم الديكورات المعمارية الحديثة، أحدث صيحات دهانات الجدران، والتشطيبات الفاخرة',
  taglineEn: 'The Premier Guide to Modern Interior Decor, Architectural Wall Paints, and Luxury Home Finishes',
  authorName: 'الحضرى محمود',
  authorBio: 'صاحب المدونة واستشاري الديكورات والتشطيبات المعمارية - متخصص في دهانات الحوائط الحديثة، بديل الخشب والرخام، والأسقف المعلقة وتنسيق ألوان المنازل العصرية.',
  authorAvatar: '', // تم حذف الصورة بناءً على طلب صاحب المدونة
  articlesPerPage: 6, // Between 3 and 10 strictly
  language: 'ar',
  direction: 'rtl',
  socialLinks: {
    facebook: 'https://facebook.com/alphadecor.paints',
    twitter: 'https://x.com/alphadecor_hub',
    instagram: 'https://instagram.com/alphadecor.paints',
    linkedin: 'https://linkedin.com/company/alpha-decor-finishes',
    youtube: 'https://youtube.com/@alphadecor_finishes',
    github: 'https://github.com/alphadecor',
    tiktok: 'https://tiktok.com/@alphadecor_paints',
    whatsapp: 'https://wa.me/201098765432',
    telegram: 'https://t.me/alphadecor_channel',
  },
  autoPublish: {
    enabled: false,
    frequencyHours: 24,
    lastPublishedAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(), // 18 hours ago
    targetWordCount: 1500, // Strictly between 1000 and 10000 words
    wordsPerImageRatio: 250, // 1500 words / 250 = 6 images
    selectedTopics: [
      'أحدث صيحات دهانات الحوائط وتنسيق ألوان الديكور الداخلي لعام 2026: دمج درجات الجريج والأوف وايت',
      'ديكورات بديل الرخام وبديل الخشب: دليلك العملي لتشطيب جدار التلفزيون والمداخل الفندقية الفاخرة',
      'أنواع الدهانات الديكورية الراقية (ستوكو أنتيكو، قطيفة، شمواه، مارمورينو): طرق التطبيق والمميزات',
      'الدليل الشامل لمعالجة رطوبة الجدران وتأسيس المعجون والصنفرة باحترافية قبل الدهان النهائي',
      'أفضل ألوان دهانات غرف النوم والمجالس والصالونات لتوسيع المساحات الضيقة وإشاعة الهدوء النفسي',
      'ديكورات الأسقف المعلقة بالجبس بورد: تصميم بيوت النور وتوزيع الاسبوتات الليد الحديثة',
      'دهانات الحوائط القابلة للغسيل المقاومة للبقع والخدوش: أسرار اختيار البلاستيك المط والنصف لامع',
      'تنسيق ألوان دهانات الحوائط مع ألوان الأثاث والسجاد: القواعد الذهبية لمهندسي الديكور'
    ],
    language: 'ar',
  },
  socialBroadcast: {
    isDelegated: false, // تفويض صاحب المدونة معطل افتراضياً
    delegationDate: undefined,
    autoBroadcastOnPublish: false, // معطل افتراضياً لمنع النشر التلقائي
    activeNetworks: ['twitter', 'facebook', 'linkedin', 'telegram', 'whatsapp'],
    customHashtags: '#ألفا_ديكور #دهانات_حوائط #ديكورات_داخلية #تشطيبات_فلل #ألوان_2026',
    history: [
      {
        id: 'b-1',
        articleId: 'post-1',
        articleTitle: 'أحدث صيحات دهانات الحوائط لعام 2026: تناسق درجات الجريج والأوف وايت مع بديل الخشب',
        articleUrl: 'https://alphadecor.blog/interior-wall-paint-color-trends-2026',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
        networks: ['twitter', 'facebook', 'linkedin', 'telegram'],
        status: 'published',
        summary: 'تمت مشاركة رابط المقال والملخص الإبداعي بتفويض من الحضرى محمود على شبكات التواصل المعتمدة.',
      },
      {
        id: 'b-2',
        articleId: 'post-2',
        articleTitle: 'ديكورات بديل الرخام وبديل الخشب: دليلك الشامل لتصميم جدران تلفزيون ومداخل فندقية فاخرة',
        articleUrl: 'https://alphadecor.blog/faux-marble-wood-slats-decor-guide',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
        networks: ['twitter', 'linkedin', 'telegram'],
        status: 'published',
        summary: 'نشر آلي معتمد على شبكات التواصل المهنية مع الوسوم المخصصة.',
      }
    ],
  },
  assistantNegotiation: {
    enabled: true,
    assistantName: 'مساعد ألفا الذكي لأعمال الديكور والدهانات',
    ownerPhone: '+201098765432', // رقم هاتف صاحب المدونة الحضرى محمود
    ownerWhatsApp: '201098765432', // رقم الواتساب المعتمد
    currency: '$',
    welcomePitch: 'مرحباً بك! أنا المساعد الذكي المفوض من خبير الديكور والتشطيبات «الحضرى محمود». يمكنني إطلاعك على قائمة خدمات الديكور والدهانات، حساب تكلفة تشطيب منزلك بدقة، والتفاوض معك للوصول لأفضل سعر معتمد، ثم تحويلك مباشرة للواتساب أو الاتصال الهاتفي بالمهندس للبدء فوراً!',
    maxDiscountPercent: 20, // أقصى خصم تفاوضي 20%
    services: [
      {
        id: 'service-paint-interior',
        name: 'تنفيذ أعمال دهانات الشقق والفلل (بلاستيك قابل للغسيل وجهين + تأسيس)',
        nameEn: 'Interior Wall Painting & Surface Preparation',
        category: 'دهانات الحوائط',
        description: 'تنفيذ دهانات داخلية كاملة بمواد عالية الجودة قابلة للغسيل (جوتن أو سيبس) تشمل سيلر مائي وثلاث سكاكين معجون ناعم وصنفرة دقيقة بالضوء الكاشف.',
        basePrice: 4,
        minNegotiatedPrice: 3.2,
        currency: '$',
        deliveryDays: 7,
        unit: 'لكل متر مربع (م²)',
        popular: true,
        features: ['سيلر مائي عازل للمسام', '3 سكاكين معجون ناعم متقاطع', 'وجهين بلاستيك عالي الجودة قابل للغسيل ومقاوم للبقع', 'ضمان 5 سنوات على ثبات اللون وعدم التقشير']
      },
      {
        id: 'service-marble-wood',
        name: 'توريد وتركيب جدار التلفزيون بديل الرخام وبديل الخشب مع شريط ليد',
        nameEn: 'Faux Marble & Wood Slat Accent Wall Cladding',
        category: 'ديكورات الحوائط',
        description: 'تشطيب جدار الصالة أو التلفزيون بأفخم ألواح بديل الرخام UV اللامعة مع شرائح بديل الخشب الكوري وحزام إضاءة مخفية LED Profile.',
        basePrice: 280,
        minNegotiatedPrice: 230,
        currency: '$',
        deliveryDays: 2,
        unit: 'لكل جدار تلفزيون متكامل',
        popular: true,
        features: ['لوح بديل رخام PVC معالج ضد الخدش مقاس 122×244', 'شرائح بديل خشب معالج ضد الرطوبة والحشرات', 'شريط ليد بروفايل مخفي مع ترانس ألماني', 'تركيب هندسي دقيق بدون فواصل ظاهرة']
      },
      {
        id: 'service-decorative-paint',
        name: 'تطبيق الدهانات الديكورية الفاخرة (ستوكو أنتيكو، شمواه، قطيفة)',
        nameEn: 'Luxury Decorative Wall Finishes (Stucco & Velvet)',
        category: 'الدهانات الديكورية',
        description: 'تطبيق دهانات ديكورية فاخرة للمجالس والصالونات كحائط مميز بتأثيرات الرخام الطبيعي اللامع أو ملمس القماش المخملي الفاخر.',
        basePrice: 12,
        minNegotiatedPrice: 9.5,
        currency: '$',
        deliveryDays: 3,
        unit: 'لكل متر مربع (م²)',
        popular: true,
        features: ['فنيين محترفين متخصصين في دهانات المالج الإيطالية', 'تطبيق عازل ورنيش شمعي لحماية الدهان وسهولة تنظيفه', 'مقاوم للرطوبة وتغير درجات الحرارة', 'خيارات متعددة من كتالوجات 2026']
      },
      {
        id: 'service-gypsum-ceiling',
        name: 'تشكيل وتركيب أسقف معلقة جبس بورد مع بيت النور والاسبوتات',
        nameEn: 'Suspended Gypsum Ceilings & Recessed Lighting',
        category: 'الأسقف المعلقة',
        description: 'تصميم وتنفيذ أحدث ديكورات الأسقف الجبس بورد المقاوم للرطوبة والحريق مع فتحات الاسبوتات وتأسيس بيوت النور المخفية المتناسقة.',
        basePrice: 18,
        minNegotiatedPrice: 14.5,
        currency: '$',
        deliveryDays: 4,
        unit: 'لكل متر طولي / مربع',
        features: ['ألواح كناوف ألمانية معالجة ضد الرطوبة', 'شاسيهات صاج مجلفن محملة بأعلى متانة', 'معجون وفايبر تيب لضمان عدم حدوث شروخ باللحامات', 'تنسيق فتحات الإضاءة وفتحات التكييف بدقة']
      },
      {
        id: 'service-moisture-treatment',
        name: 'معالجة رطوبة وتقشير الجدران وعزل الحوائط التام',
        nameEn: 'Wall Dampness & Moisture Remediation',
        category: 'التأسيس والعزل',
        description: 'علاج جذري لمشكلات رطوبة وأملاح الجدران وسقوط الدهان عبر كشط الحائط ومعالجته بمواد عزل كيميائية مائية وسيلر بوليمري فائق القوة.',
        basePrice: 150,
        minNegotiatedPrice: 120,
        currency: '$',
        deliveryDays: 2,
        unit: 'لكل غرفة كاملة',
        features: ['كشط كامل للأجزاء التالفة والمتحللة من المحارة', 'معالجة بالمواد الكيميائية المانعة للرشح والأملاح', 'تطبيق معجون إيبوكسي أو بوليمري عازل للرطوبة', 'ضمان عدم ارتداد الرطوبة أو تقشير الدهان مجدداً']
      },
      {
        id: 'service-color-consult',
        name: 'استشارة هندسية واختيار باليتة ألوان الديكور وتنسيق الأثاث',
        nameEn: 'Interior Color Palette Consultation',
        category: 'الاستشارات الهندسية',
        description: 'جلسة استشارية متخصصة مع خبير الديكور «الحضرى محمود» لمساعدتك في تنسيق درجات الألوان مع الأثاث والإضاءة واختيار أكواد جوتن وسيبس المعتمدة.',
        basePrice: 60,
        minNegotiatedPrice: 45,
        currency: '$',
        deliveryDays: 1,
        unit: 'جلسة استشارية + كود الألوان',
        features: ['جلسة مباشرة (مكالمة فيديو أو هاتفية) 60 دقيقة', 'تحديد الأكواد الدقيقة للدهانات (RAL / NCS / Jotun Codes)', 'توزيع الإضاءة المناسبة لإبراز درجات الألوان', 'تقرير بصري شامل مع نصائح الشراء']
      }
    ]
  },
  themeColor: 'blue',
  fontFamily: 'cairo',
  ads: {
    enabled: true,
    header: {
      id: 'header',
      nameAr: 'إعلان الهيدر (أعلى الموقع)',
      nameEn: 'Header Top Banner',
      descriptionAr: 'يظهر في أعلى صفحات الموقع بالكامل، متجاوب ذكياً ويحقق أعلى نسب مشاهدة.',
      descriptionEn: 'Appears at the top of all pages, responsive and high-visibility.',
      enabled: true,
      type: 'image',
      code: '',
      imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=1200&q=80',
      targetUrl: 'https://wa.me/201098765432?text=أرغب+في+الاستفسار+عن+كتالوج+دهانات+جوتن+وأكواد+الألوان',
      altText: 'كتالوج دهانات جوتن الفاخرة لعام 2026',
      sponsorName: 'دهانات جوتن والتشطيبات الملكية',
      badgeText: 'إعلان ممول',
      aiAutoFit: true,
      maxHeight: 90,
      aspectRatio: 'auto',
    },
    sidebar: {
      id: 'sidebar',
      nameAr: 'إعلان جانب الموقع (الشريط الجانبي)',
      nameEn: 'Sidebar Sticky Banner',
      descriptionAr: 'يظهر في القائمة الجانبية بالصفحة الرئيسية بجوار المقالات، متكيف تلقائياً مع أحجام الشاشات.',
      descriptionEn: 'Appears in the sticky sidebar alongside articles with smart layout.',
      enabled: true,
      type: 'image',
      code: '',
      imageUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80',
      targetUrl: 'https://wa.me/201098765432?text=طلب+معاينة+بديل+الرخام+وبديل+الخشب',
      altText: 'روائع بديل الرخام وبديل الخشب الإيطالي',
      sponsorName: 'روائع بديل الرخام والخشب الإيطالي',
      badgeText: 'شريك معتمد',
      aiAutoFit: true,
      maxHeight: 320,
      aspectRatio: 'auto',
    },
    articleTop: {
      id: 'articleTop',
      nameAr: 'إعلان أول المقال (قبل النص الرئيسي)',
      nameEn: 'Article Top Banner',
      descriptionAr: 'يظهر مباشرة تحت عنوان المقال وبيانات الكاتب وقبل بدء النص، مهيأ ذكياً ليناسب تجربة القراءة.',
      descriptionEn: 'Appears directly below the article title and author byline, optimized for reading.',
      enabled: true,
      type: 'image',
      code: '',
      imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      targetUrl: 'https://wa.me/201098765432?text=استفسار+عن+تركيب+أسقف+جبس+بورد+وليد+بروفايل',
      altText: 'المركز المتخصص للأسقف المعلقة والجبس بورد',
      sponsorName: 'المركز المتخصص للأسقف المعلقة والجبس بورد',
      badgeText: 'إعلان ممول',
      aiAutoFit: true,
      maxHeight: 110,
      aspectRatio: 'auto',
    },
    articleMiddle: {
      id: 'articleMiddle',
      nameAr: 'إعلان منتصف المقال (بين الفقرات)',
      nameEn: 'In-Article Mid Content Banner',
      descriptionAr: 'يظهر في منتصف المقال بين الفقرات بشكل انسيابي وجذاب مع فواصل مريحة للعين.',
      descriptionEn: 'Appears in the middle of article paragraphs with fluid spacing.',
      enabled: true,
      type: 'image',
      code: '',
      imageUrl: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=80',
      targetUrl: 'https://wa.me/201098765432?text=طلب+عرض+سعر+دهانات+قابلة+للغسيل',
      altText: 'سيبس للدهانات البلاستيكية القابلة للغسيل ومقاومة البقع',
      sponsorName: 'سيبس وماكسي كوت للدهانات الفاخرة',
      badgeText: 'برعاية',
      aiAutoFit: true,
      maxHeight: 140,
      aspectRatio: 'auto',
    },
    articleBottom: {
      id: 'articleBottom',
      nameAr: 'إعلان أسفل المقال والصفحات',
      nameEn: 'Article Bottom & Page Banner',
      descriptionAr: 'يظهر في نهاية المقالات وأسفل صفحات الموقع قبل الفوتر، مهيأ لجلب التفاعل والتحويلات.',
      descriptionEn: 'Appears at the end of articles and pages before footer for maximum conversion.',
      enabled: true,
      type: 'image',
      code: '',
      imageUrl: 'https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?auto=format&fit=crop&w=1200&q=80',
      targetUrl: 'https://wa.me/201098765432?text=مرحباً+باشمهندس+الحضرى+أرغب+في+حجز+استشارة+ديكور',
      altText: 'حجز استشارة هندسية وتشطيبات متكاملة مع الحضرى محمود',
      sponsorName: 'مكتب الحضرى محمود للاستشارات الديكورية',
      badgeText: 'إعلان معتمد',
      aiAutoFit: true,
      maxHeight: 130,
      aspectRatio: 'auto',
    },
  },
  socialPublishingBot: {
    enabled: false, // معطل افتراضياً بقرار الإدارة
    intervalMinutes: 30, // دورة النشر كل 30 دقيقة
    maxArticleAgeHours: 24, // شرط صارم: لا ينشر مقال مر على نشره أكثر من 24 ساعة
    lastDispatchAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    nextDispatchAt: new Date(Date.now() + 1000 * 60 * 12).toISOString(),
    privacyComplianceRules: {
      antiSpamEnforced: true, // فاصل 30 دقيقة لمنع حظر الحسابات
      checkTermsBeforePost: true, // تدقيق شروط خصوصية كل منصة قبل البث
      customDecorIntro: true, // توليد مقدمة تفاعلية مهنية متخصصة في الديكور
      includeDecorHashtags: true, // إدراج هاشتاجات الديكور والدهانات المعتمدة
    },
    targetChannels: [
      {
        id: 'chan-1',
        name: 'جروب مهندسي ومصممي الديكور والدهانات الحديثة',
        url: 'https://facebook.com/groups/modern.decor.paints.arab',
        platform: 'facebook',
        channelType: 'group',
        hasPostingPermission: true,
        privacyVerified: true,
        status: 'active',
        specialization: 'دهانات الحوائط والديكورات العصرية',
        postsCount: 14,
        lastPostedAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
        addedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      },
      {
        id: 'chan-2',
        name: 'صفحة أحدث تشطيبات وبديل الرخام وبديل الخشب',
        url: 'https://facebook.com/decor.wood.marble.alternatives',
        platform: 'facebook',
        channelType: 'page',
        hasPostingPermission: true,
        privacyVerified: true,
        status: 'active',
        specialization: 'بديل الرخام وبديل الخشب والجبس بورد',
        postsCount: 19,
        lastPostedAt: new Date(Date.now() - 1000 * 60 * 48).toISOString(),
        addedAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
      },
      {
        id: 'chan-3',
        name: 'قناة أحدث كتالوجات وألوان دهانات 2026',
        url: 'https://t.me/paints_decor_trends_2026',
        platform: 'telegram',
        channelType: 'channel',
        hasPostingPermission: true,
        privacyVerified: true,
        status: 'active',
        specialization: 'كتالوجات الألوان وتناسق الجريج والأوف وايت',
        postsCount: 26,
        lastPostedAt: new Date(Date.now() - 1000 * 60 * 78).toISOString(),
        addedAt: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
      },
      {
        id: 'chan-4',
        name: 'مجتمع معلمي الديكور وتشطيبات المنازل الفاخرة',
        url: 'https://chat.whatsapp.com/invite/decorPaintsExpertsMaster',
        platform: 'whatsapp',
        channelType: 'community',
        hasPostingPermission: true,
        privacyVerified: true,
        status: 'active',
        specialization: 'ورش التشطيب ومعالجة الرطوبة والدهانات الفندقية',
        postsCount: 11,
        lastPostedAt: new Date(Date.now() - 1000 * 60 * 108).toISOString(),
        addedAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
      },
      {
        id: 'chan-5',
        name: 'لوحة أفكار ديكورات ودهانات ألفا ديزاين الرسمية',
        url: 'https://pinterest.com/alphadecor/interior-paints-ideas',
        platform: 'pinterest',
        channelType: 'account',
        hasPostingPermission: true,
        privacyVerified: true,
        status: 'active',
        specialization: 'أفكار بصرية لتنسيق غرف المعيشة والمجالس',
        postsCount: 32,
        lastPostedAt: new Date(Date.now() - 1000 * 60 * 138).toISOString(),
        addedAt: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(),
      },
      {
        id: 'chan-6',
        name: 'ملتقى خبراء التشطيبات المعمارية والدهانات',
        url: 'https://linkedin.com/groups/architectural-finishes-decor',
        platform: 'linkedin',
        channelType: 'group',
        hasPostingPermission: true,
        privacyVerified: true,
        status: 'active',
        specialization: 'مقاولات التشطيبات وتنسيق ألوان المشاريع',
        postsCount: 8,
        lastPostedAt: new Date(Date.now() - 1000 * 60 * 168).toISOString(),
        addedAt: new Date(Date.now() - 1000 * 60 * 60 * 60).toISOString(),
      },
    ],
    dispatchHistory: [
      {
        id: 'log-1',
        timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
        articleId: 'post-1',
        articleTitle: 'أحدث صيحات دهانات الحوائط لعام 2026: تناسق درجات الجريج والأوف وايت مع بديل الخشب',
        articleSlug: 'interior-wall-paint-color-trends-2026',
        articleUrl: '/#interior-wall-paint-color-trends-2026',
        targetChannelId: 'chan-1',
        targetChannelName: 'جروب مهندسي ومصممي الديكور والدهانات الحديثة',
        targetPlatform: 'facebook',
        postSnippet: '🎨 لعشاق التشطيبات الفاخرة وأحدث صيحات الديكور لعام 2026! استكشف كيف تدمج ألوان الجريج والأوف وايت مع شرائح بديل الخشب بإشراف خبير التشطيبات الحضرى محمود.\n\n🔗 تصفح المقال بالكامل:\nhttps://alphadecor.com/#interior-wall-paint-color-trends-2026\n\n#دهانات_2026 #ديكورات_مودرن #بديل_الخشب',
        privacyCheckPassed: true,
        ageHoursAtPublish: 12.0,
        status: 'published',
        notes: 'تم التحقق من شروط خصوصية فيسبوك، حساب المالك مسجل، تم النشر بسلاسة ضمن نافذة الـ 24 ساعة.',
      },
      {
        id: 'log-2',
        timestamp: new Date(Date.now() - 1000 * 60 * 48).toISOString(),
        articleId: 'post-1',
        articleTitle: 'أحدث صيحات دهانات الحوائط لعام 2026: تناسق درجات الجريج والأوف وايت مع بديل الخشب',
        articleSlug: 'interior-wall-paint-color-trends-2026',
        articleUrl: '/#interior-wall-paint-color-trends-2026',
        targetChannelId: 'chan-3',
        targetChannelName: 'قناة أحدث كتالوجات وألوان دهانات 2026',
        targetPlatform: 'telegram',
        postSnippet: '📢 تحديث فندقي جديد لغرف المعيشة والمجالس: درجات الجريج والليد بروفايل.\n\nاقرأ الدليل الشامل من هنا 👈 https://alphadecor.com/#interior-wall-paint-color-trends-2026',
        privacyCheckPassed: true,
        ageHoursAtPublish: 11.5,
        status: 'published',
        notes: 'بث آمن عبر القناة الرسمية للمدونة بتليجرام.',
      },
    ],
  },
  developerCredit: {
    enabled: true,
    name: 'Mostafa Taha',
    email: 'mostafa.taha9@gmail.com',
  },
};

export const INITIAL_ARTICLES: Article[] = [
  {
    id: 'post-1',
    title: 'أحدث صيحات دهانات الحوائط لعام 2026: تناسق درجات الجريج والأوف وايت مع بديل الخشب',
    slug: 'interior-wall-paint-color-trends-2026',
    excerpt: 'استكشف أحدث باليتات الألوان العالمية التي تتربع على عرش الديكور الداخلي لعام 2026، وكيفية دمج درجات الجريج الهادئة مع الإضاءة المعمارية لإبراز فخامة منزلك.',
    featuredImage: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80',
    author: {
      name: 'الحضرى محمود',
      avatar: '',
      role: 'صاحب المدونة واستشاري الديكور والتشطيبات',
    },
    category: 'دهانات الحوائط والألوان',
    tags: ['دهانات 2026', 'أوف وايت', 'جريج', 'بديل الخشب', 'ديكورات مودرن', 'تنسيق ألوان'],
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    readingTime: 6,
    views: 2450,
    likes: 184,
    status: 'published',
    content: `# أحدث صيحات دهانات الحوائط وتنسيق الديكور المعماري لعام 2026

في عالم الديكور الداخلي الحديث، لم تعد دهانات الجدران مجرد طبقة لونية لتغطية المحارة، بل أصبحت **حجر الزاوية الهندسي** الذي يتحكم في كمية الضوء المنعكس، ويحدد مدى رحابة الغرفة وطابعها الشعوري.

![تناغم دهانات الحوائط بدرجات الجريج الدافئ مع الإضاءة المعمارية](https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80)
*تناسق درجات الجريج (Greige) مع الأثاث العصري يمنح صالة الاستقبال فخامة فندقية لا تبلى مع مرور الزمن*

## 1. ثورة لون "الجريج" (Greige): المزيج الملكي بين البيج والرمادي
لطالما احتار أصحاب المنازل بين دفء البيج وأناقة الرمادي المحايد. يحل لون الجريج هذه المعادلة بأناقة متناهية؛ فهو يمتص برودة الرمادي ويمنحك دفء البيج دون أن يتحول إلى الدرجات الصفراء القديمة.
* يتناسب بامتياز مع الإضاءة الصفراء الدافئة (Warm 3000K).
* يمنح مرونة مطلقة لتغيير ألوان الستائر والسجاد في المستقبل دون الحاجة لتغيير دهان الجدران.

## 2. دمج دهانات الجدران مع شرائح بديل الخشب
من أبرز نصائح المهندس «الحضرى محمود» لموسم 2026 هو تجنب ترك الجدران الرئيسية مصمتة بلون واحد. إن إضافة عمود رأسي من شرائح بديل الخشب (Wood Slats) المعالج ضد الرطوبة بجوار جدار مطلي بلون أوف وايت ناعم يمنح الغرفة بعداً بصرياً مضاعفاً ويخفي أي عيوب إنشائية.

![تطبيق درجات الألوان المحايدة في غرف المعيشة العصرية](https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=80)
*التناغم بين جدران الدهان المطفية واللمسات الخشبية الطبيعية يعزز الهدوء النفسي والاتساع البصري*

## 3. قاعدة اختيار درجة لمعان الدهان (Gloss Level)
* **الدهان المط (Matte / Flat):** الأفضل لأسقف الجبس بورد وحوائط غرف النوم لإخفاء تموجات المعجون وعدم إزعاج العين بالانعكاسات.
* **الدهان ربع لامع / قشر البيضة (Eggshell):** الاختيار المثالي لغرف الصالونات والممرات لأنه يجمع بين سهولة المسح والجمال المخملي.
* **الدهان نصف اللامع (Semi-Gloss):** أساسي لغرف الأطفال والمطابخ والمناطق الأكثر عرضة للبقع لقابليته العالية للغسيل المتكرر.

> "دهان الحائط هو أسرع وأوفر وسيلة تحويلية لأي فراغ منزلي؛ جودة التأسيس هي الفرق الجوهري بين حائط يدوم 10 سنوات وحائط يتقشر بعد أول شتاء." - الحضرى محمود`,
    comments: [
      {
        id: 'c-1',
        author: 'م. أحمد الشافعي',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
        content: 'مقال دقيق جداً! درجة الجريج مع الإضاءة 3000K صنعت فارقاً هائلاً في شقتي الجديدة.',
        createdAt: 'منذ ساعتين',
        likes: 14,
      },
      {
        id: 'c-2',
        author: 'أميرة عبد العزيز',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
        content: 'شكراً للمهندس الحضرى على شرح درجات اللمعان، كنت محتارة بين المط وقشر البيضة للصالة.',
        createdAt: 'منذ 4 ساعات',
        likes: 9,
      }
    ],
  },
  {
    id: 'post-2',
    title: 'ديكورات بديل الرخام وبديل الخشب: دليلك الشامل لتصميم جدران تلفزيون ومداخل فندقية فاخرة',
    slug: 'faux-marble-wood-slats-decor-guide',
    excerpt: 'تعرف على أسرار تركيب ألواح بديل الرخام PVC وشرائح بديل الخشب، وكيفية توظيف إضاءة الليد بروفايل المخفية لصنع جدار ديكوري ساحر بتكلفة اقتصادية.',
    featuredImage: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80',
    author: {
      name: 'الحضرى محمود',
      avatar: '',
      role: 'صاحب المدونة واستشاري الديكور والتشطيبات',
    },
    category: 'ديكورات بديل الرخام والخشب',
    tags: ['بديل رخام', 'بديل خشب', 'جدار تلفزيون', 'ليد بروفايل', 'ديكورات صالات', 'تشطيب فنادق'],
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    readingTime: 7,
    views: 3120,
    likes: 240,
    status: 'published',
    content: `# الدليل العملي لتركيب وتنسيق بديل الرخام وبديل الخشب

أحدثت ألواح بديل الرخام (PVC Marble Sheets) وبديل الخشب (Wood Plastic Composite - WPC) ثورة في عالم الديكور الحديث، حيث تمنحك فخامة الرخام الإسباني ودفء الخشب الطبيعي بجزء بسيط من التكلفة والوزن.

![جدار صالة عصري يجمع بين بديل الرخام وبديل الخشب والإضاءة الهندسية](https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80)
*الدمج بين بديل الرخام والشرائح الخشبية يعكس هوية فندقية معاصرة في صالات المنازل*

## 1. لماذا يفضل المهندسون بديل الرخام؟
* **خفة الوزن وسهولة التركيب:** يثبت بالسليكون العظم مباشرة على الحائط المدهون أو المحارة دون الحاجة لمون إسمنتية أو تكسير.
* **مقاومة تامة للمياه والبكتيريا:** طبقة UV المعالجة تجعله مقاوماً للرطوبة، والزيوت، ولا يتشرب البقع مثل الرخام الطبيعي.
* **تنوع النقشات الفاخرة:** يتوفر بنقشات كلكتا الأبيض، والماركينا الأسود الملكي، والستاتوريو الإيطالي.

## 2. قواعد تصميم جدار التلفزيون (TV Feature Wall)
1. اجعل لوح بديل الرخام في المنتصف بعرض 120 إلى 240 سم خلف شاشة التلفاز.
2. ثبت شرائح بديل الخشب على الجانبين الأيمن والأيسر لكسر حدة اللمعان وإعطاء اتساع عرضي للجدار.
3. قم بتأسيس شريط إضاءة ليد مخفي (LED Profile) خلف حواف لوح الرخام، ليعطي هالة إضاءة دافئة تجعل الجدار يبدو وكأنه يطفو في الفراغ.

![تفاصيل الخامات والتشطيبات المعمارية الراقية](https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1200&q=80)
*الإضاءة المخفية تبرز الخطوط الطولية لشرائح بديل الخشب وتمنح عمقاً بصرياً مبهراً*

## نصيحة المهندس لتجنب الأخطاء الشائعة:
تأكد دائماً من استواء الحائط وصنفرته قبل لصق الألواح، واستخدم سليكون عظم أصلي (Polyurethane Adhesive) لضمان ثبات اللوح لعشرات السنين دون انفصال.`,
    comments: [
      {
        id: 'c-3',
        author: 'خالد ممدوح',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
        content: 'قمت بتنفيذ هذا التصميم في مدخل الشقة وكانت النتيجة أكثر من رائعة بشهادة كل الضيوف!',
        createdAt: 'أمس',
        likes: 21,
      }
    ],
  },
  {
    id: 'post-3',
    title: 'دليل أنواع الدهانات الديكورية الفاخرة: الستوكو، القطيفة، والشمواه وطرق تطبيقها',
    slug: 'luxury-decorative-wall-finishes-stucco-velvet',
    excerpt: 'استعرض معنا أرقى خامات الدهانات الديكورية التي تحول الجدران إلى لوحات فنية تحاكي الرخام الطبيعي والأقمشة المخملية الفاخرة بأيدي أمهر الفنيين.',
    featuredImage: 'https://images.unsplash.com/photo-1615529182904-14819c35db37?auto=format&fit=crop&w=1200&q=80',
    author: {
      name: 'الحضرى محمود',
      avatar: '',
      role: 'صاحب المدونة واستشاري الديكور والتشطيبات',
    },
    category: 'الدهانات الديكورية الفاخرة',
    tags: ['ستوكو', 'دهان قطيفة', 'شمواه', 'مارمورينو', 'دهانات ديكورية', 'ديكور مجالس'],
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 60).toISOString(),
    readingTime: 5,
    views: 1890,
    likes: 142,
    status: 'published',
    content: `# سحر الدهانات الديكورية: حين يتحول الحائط إلى تحفة فنية

تعتبر الدهانات الديكورية الخيار الأمثل لمن يبحث عن لمسة تفرد لا تتيحها الدهانات البلاستيكية العادية. إنها توفر ملمساً وتأثيراً بصرياً ثلاثي الأبعاد يعكس الإضاءة بزوايا ساحرة.

![ملمس الدهانات الديكورية المستوحاة من خامات الطبيعة والستوكو الإيطالي](https://images.unsplash.com/photo-1615529182904-14819c35db37?auto=format&fit=crop&w=1200&q=80)
*التأثيرات الملمسية تمنح الحائط حضوراً قوياً وتغنيك عن اللوحات الجدارية المعقدة*

## 1. دهان ستوكو أنتيكو (Stucco Antico)
* **المظهر:** يحاكي تماماً الرخام الإيطالي المصقول مع عروق ناعمة ولمعان زجاجي طبيعي.
* **طريقة التطبيق:** يطبق بالمالج الإيطالي المصنوع من الستانلس ستيل على طبقات رقيقة جداً، ثم يُصقل بالاحتكاك السريع لإنتاج البريق الرخامي دون الحاجة لورنيش كيميائي.
* **الاستخدام الأمثل:** الأعمدة الدائرية، جدران المداخل، وجدران غرف الطعام الفاخرة.

## 2. دهان القطيفة والشمواه (Velvet Effect)
* **المظهر:** يعطي ملمس القماش المخملي مع ظلال لونية فاتحة وداكنة تتغير حسب زاوية سقوط الضوء وحركة اليد.
* **المميزات:** سهل الصيانة، يمنح دفئاً عائلياً كبيراً، ومثالي لغرف النوم والمجالس العائلية.

![أدوات تطبيق الدهانات الديكورية واختبار تناغم الألوان](https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=1200&q=80)
*المهارة اليدوية واستخدام الأدوات الاحترافية هي سر نجاح ملمس الدهان الديكوري*

تذكر دائماً أن الدهانات الديكورية لا تطبق على كافة جدران الغرفة، بل تخصص **لجدار واحد فقط (Accent Wall)** لتكون نقطة الجذب الأساسية في الفراغ.`,
    comments: [],
  },
  {
    id: 'post-4',
    title: 'طرق معالجة رطوبة الجدران وتأسيس دهان الحوائط خطوة بخطوة لضمان عمر يدوم سنوات',
    slug: 'treating-wall-moisture-and-paint-priming-guide',
    excerpt: 'الدليل الهندسي الشامل للتخلص النهائي من رطوبة وتقشير الدهان وأملاح الحوائط، مع خطوات تأسيس المعجون والصنفرة التي يوصي بها كبار مقاولي التشطيبات.',
    featuredImage: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=1200&q=80',
    author: {
      name: 'الحضرى محمود',
      avatar: '',
      role: 'صاحب المدونة واستشاري الديكور والتشطيبات',
    },
    category: 'تأسيس وعلاج رطوبة الجدران',
    tags: ['علاج الرطوبة', 'تأسيس معجون', 'تقشير الدهان', 'سيلر مائي', 'تشطيبات هندسية', 'نصائح مقاولات'],
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
    readingTime: 6,
    views: 2890,
    likes: 215,
    status: 'published',
    content: `# علاج رطوبة الحوائط: الحلول الجذرية قبل تطبيق الدهان النهائي

أكبر خطأ يقع فيه الكثيرون هو إعادة دهان الجدار المرطب مباشرة بالمعجون والبلاستيك؛ النتيجة الحتمية هي عودة التقشير والأملاح خلال أشهر قليلة. المعالجة يجب أن تبدأ من الجذور.

![تأسيس الحوائط ومعالجة الرطوبة لضمان استواء السطح ونظافته](https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=1200&q=80)
*التأسيس المتقن للحائط هو الضمان الوحيد لثبات الدهان لعشرات السنين دون تشقق*

## الخطوات الهندسية السليمة لعلاج الرطوبة:
1. **تحديد وإصلاح مصدر المياه:** سواء كان تسريباً في سباكة الحمام أو رطوبة ناتجة عن مياه جوفية أو تكثيف خارجي.
2. **كشط الحائط بالكامل:** إزالة كافة طبقات الدهان والمعجون المتهالكة وصولاً إلى الطوب أو المحارة الصلبة.
3. **التطهير والعزل:** غسل الحائط بمحلول مخفف مضاد للأملاح، ثم دهان وجهين من السيلر العازل المائي القوي (Waterproofing Polymer Primer).
4. **سحب المعجون الإيبوكسي أو الأسمنتي المقاوم:** استخدام معجون أسمنتي أو إيبوكسي للمناطق السفلية الملاصقة للأرضية لمنع صعود الرطوبة الشعرية.
5. **الصنفرة بالضوء الكاشف:** صنفرة ناعمة باستخدام كشاف ليد موازٍ للحائط لاكتشاف أصغر التموجات وتصحيحها قبل الوجه الأخير من الدهان البلاستيكي المقاوم للبكتيريا.`,
    comments: [],
  }
];

export const CATEGORIES = [
  'الكل',
  'دهانات الحوائط والألوان',
  'ديكورات بديل الرخام والخشب',
  'الدهانات الديكورية الفاخرة',
  'الأسقف المعلقة والجبس بورد',
  'تأسيس وعلاج رطوبة الجدران',
  'ديكورات غرف النوم والصالونات',
  'النشر الآلي 24h'
];
