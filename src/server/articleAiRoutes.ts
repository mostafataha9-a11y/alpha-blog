import { Router, Request, Response } from 'express';
import {
  getDbArticles,
  createDbArticle,
  getDbSettings,
  saveDbSettings,
  getDbAutoPublishRuns,
  checkCycleAlreadyPublished,
  checkImageDuplicateInDb,
  getUsedImageUrls,
} from '../db/repo.ts';
import { requireAdminAuth } from './authRoutes.ts';
import { EXPANDED_DECOR_CATALOG, CuratedDecorImage } from '../data/curatedImagesCatalog.ts';
import { validateArticlePayload, countActualWords } from '../utils/articleValidator.ts';
import { inspectAndHashImageUrl } from '../utils/imageHasher.ts';
import {
  generateWithAi,
  extractAndParseJson,
  getAiProviderStatus,
  AiProvider,
} from './aiProvider.ts';

export const articleAiRouter = Router();

/**
 * Contextual image allocator for decor articles:
 * 1. Scores and ranks catalog images based on topicKeywords relevance.
 * 2. Enforces strict deduplication against previously used images and current batch.
 * 3. Does NOT silently reuse duplicate images if unique catalog images are exhausted;
 *    tags result with exhausted: true.
 */
export async function allocateContextualDecorImages(
  count: number,
  topicKeywords: string[] = [],
  excludeUrls: Set<string> = new Set()
): Promise<CuratedDecorImage[]> {
  const previouslyUsedUrls = await getUsedImageUrls();
  const allExcluded = new Set([...previouslyUsedUrls, ...excludeUrls]);

  // Clean keywords for topic relevance scoring
  const cleanKeywords = topicKeywords
    .flatMap((kw) => (kw || '').toLowerCase().split(/[\s,]+/))
    .filter((k) => k.length > 2);

  // Score each catalog image based on keyword matches
  const scoredCatalog = EXPANDED_DECOR_CATALOG.map((img) => {
    let score = 0;
    const searchable = `${img.title} ${img.topicCategory} ${img.defaultCaption} ${img.altText}`.toLowerCase();
    for (const kw of cleanKeywords) {
      if (searchable.includes(kw)) {
        score += 2;
      }
    }
    return { img, score };
  });

  // Sort descending by relevance score
  scoredCatalog.sort((a, b) => b.score - a.score);

  const picked: CuratedDecorImage[] = [];
  const pickedUrls = new Set<string>();

  for (const { img } of scoredCatalog) {
    if (picked.length >= count) break;
    if (!allExcluded.has(img.url) && !pickedUrls.has(img.url)) {
      picked.push(img);
      pickedUrls.add(img.url);
    }
  }

  // If unique catalog images cannot satisfy the requested count,
  // do NOT silently inject duplicates. Set exhausted flag on the array.
  if (picked.length < count) {
    (picked as any).exhausted = true;
    (picked as any).insufficientReason = `تم تخصيص ${picked.length} صور فريدة فقط من الكتالوج من أصل ${count} صور مطلوبة، لمنع تكرار الصور.`;
  }

  return picked;
}

/**
 * Smart AI Article Generator:
 * Manual publishing by site owner الحضرى محمود.
 * Receives images + captions/explanations and generates human-toned, AdSense-compliant articles
 * with Title, focus keywords, subheadings, and Google Maps location context.
 */
articleAiRouter.post('/api/ai/generate-smart-article', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const {
      images,
      topic,
      draftTitle,
      draftContent,
      focusKeyword,
      tone = 'إبداعي واحترافي بأسلوب بشري دافئ',
      language = 'ar',
      targetWordCount = 1200,
      locationPreference,
    } = req.body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'يرجى رفع صورة واحدة على الأقل مع شرح أو وصف مختصر لها.' });
    }

    const clampedWords = Math.max(1000, Math.min(10000, Number(targetWordCount) || 1200));

    const defaultCaptions = [
      'تنسيق ألوان دهانات الحوائط وبديل الرخام وبديل الخشب بإضاءة ليد مخفية',
      'تطبيق ملمس الدهان الديكوري الفاخر وتدرجات الألوان العصرية',
      'تشطيبات جدارية فندقية مع تناسق الإضاءة السقفية والأرضيات',
      'معالجة استواء الحوائط وتأسيس المعجون والصنفرة الدقيقة',
      'أحدث صيحات دهانات غرف المعيشة والمجالس بتناغم الأوف وايت والجريج',
    ];

    const imageDescriptionsText = images
      .map((img: { caption: string }, idx: number) => {
        const fallbackCaption = defaultCaptions[idx % defaultCaptions.length];
        const captionText = img.caption && img.caption.trim() ? img.caption.trim() : fallbackCaption;
        return `الصورة رقم [${idx + 1}]: شرح وتفاصيل وتطبيقات الصورة: "${captionText}"`;
      })
      .join('\n');

    const isAr = language === 'ar';

    const systemInstruction = `أنت رئيس تحرير محتوى الديكور والدهانات المعمارية وخبير التوافق مع سياسات Google AdSense وجودة المحتوى البشري (E-E-A-T Master) لمدونة «ألفا للديكور والدهانات» (Alpha Decor & Paints) بإشراف صاحب الموقع وخبير التشطيبات «الحضرى محمود».

المجال الحصري للمدونة:
«الديكور والدهانات والتشطيبات المعمارية» فقط (دهانات الجدران، تناسق الألوان لعام 2026 كالجريج والأوف وايت، بديل الرخام، بديل الخشب، ورق الحائط، الجبس بورد، الإضاءة المخفية، تأسيس المعجون، ومعالجة الرطوبة).

المعايير التحريرية والتوافقية الصارمة:
1. أسلوب بشري دافئ وموثوق (Human Expert Tone): كتابة سلسة وممتعة تعبر عن خبرة ميدانية واقعية للمهندس الحضرى محمود، بعيداً عن حشو الذكاء الاصطناعي أو الجمل الجافة.
2. مكافحة المحتوى النحيف (No Thin Content): مقال دسم وغني بالمعلومات الحصرية لا يقل عن 1000 كلمة (${clampedWords} كلمة مستهدفة) مقسم إلى 5-7 أقسام رئيسية متناسقة.
3. العناوين الجذابة والسيو: استنتاج عنوان احترافي جذاب للغاية لمحركات البحث مع كلمات مفتاحية رئيسية وثانوية ذات صلة بالدهانات والديكور.
4. توظيف كافة الصور المرفوعة (${images.length} صور) ودمج علامات [[IMAGE_0]]... مع شرح سياقي متقن ومربوط بالفقرات.
5. تضمين موقع جغرافي ورابط خريطة Google Maps لمعاينة وتنفيذ الأعمال والمشاريع الميدانية واستشارات المعاينة المجانية، بما يعزز مصداقية E-E-A-T الجغرافية المحلية.

يجب إخراج الرد بتنسيق JSON حصراً:
{
  "title": "عنوان المقال الجذاب المتوافق مع أدسنس ومحركات البحث",
  "excerpt": "موجز تشويقي غني يبرز القيمة الفريدة للمقال",
  "content": "المحتوى الكامل للمقال بتنسيق Markdown متضمناً H2, H3, نقاط وقوائم, [[IMAGE_0]]..., قسم نصائح استشاري الديكور الحضرى محمود، قسم الأسئلة الشائعة (FAQ)، وفقرة خاصة بالمعاينة الميدانية وموقع الخريطة",
  "category": "دهانات وديكورات داخلية",
  "tags": ["دهانات حوائط", "ديكورات مودرن", "بديل رخام", "بديل خشب", "ألوان 2026"],
  "focusKeyword": "الكلمة المفتاحية المستهدفة",
  "secondaryKeywords": ["كلمات سيو مكملة", "مرادفات بحثية"],
  "metaDescription": "وصف ميتا مخصص لمحركات البحث",
  "googleMapsLocation": {
    "city": "القاهرة",
    "area": "التجمع الخامس والقاهرة الجديدة",
    "fullAddress": "شارع التسعين الجنوبي، التجمع الخامس، القاهرة الجديدة، مصر",
    "mapUrl": "https://maps.google.com/?q=New+Cairo+Egypt"
  },
  "seoScore": 98,
  "humanToneScore": 99,
  "adSenseCompliant": true,
  "readingTime": 6
}`;

    const userPrompt = `بيانات مسودة المقال المقدمة من صاحب الموقع «الحضرى محمود»:
- الفكرة أو الموضوع المقترح: ${topic || draftTitle || 'استنتج عنواناً إبداعياً جذاباً ومتوافقاً مع معايير أدسنس في عالم الدهانات والديكور بناءً على الصور المرفوعة'}
- الكلمة المفتاحية (SEO): ${focusKeyword || 'استخرج أقوى كلمة مفتاحية حقيقية للدهانات وتنسيق الحوائط'}
- نبرة المقال: ${tone}
- عدد الكلمات المطلوب: ${clampedWords} كلمة (لا يقل عن 1000 كلمة مطلقاً وفق سياسة الجودة)
- التفضيل الجغرافي للموقع إن وُجد: ${locationPreference || 'القاهرة الجديدة، التجمع الخامس والشيخ زايد'}
- مسودة الكاتب: ${draftContent && draftContent.trim() ? `"${draftContent}"` : 'مسودة فارغة - المطلوب إكمال وصياغة مقال فندقي كامل بأسلوب بشري دافئ من الصفر'}
- شروحات وتفاصيل الصور المرفوعة (${images.length} صورة):
${imageDescriptionsText}

المطلوب: إكمال وصياغة المقال كاملاً بأسلوب بشري شيق متوافق 100% مع معايير Google AdSense ودمج كافة الصور وموقع Google Maps.`;

    let parsedData: any = null;
    let providerUsed: AiProvider = 'gemini';
    let modelUsed = '';
    let fallbackTriggered = false;
    let fallbackReason: string | undefined = undefined;

    const requestedProvider = req.body.provider === 'groq' || req.body.provider === 'gemini'
      ? (req.body.provider as AiProvider)
      : undefined;

    try {
      const aiResult = await generateWithAi({
        systemInstruction,
        prompt: userPrompt,
        responseJson: true,
        temperature: 0.7,
        provider: requestedProvider,
        timeoutMs: 40000,
      });

      providerUsed = aiResult.providerUsed;
      modelUsed = aiResult.modelUsed;
      fallbackTriggered = aiResult.fallbackTriggered;
      fallbackReason = aiResult.fallbackReason;

      parsedData = extractAndParseJson(aiResult.text);
    } catch (genError: any) {
      console.warn(`[Article Engine] AI generation attempt failed: ${genError.message}`);
    }

    if (!parsedData || !parsedData.content) {
      console.warn('[Article Engine] AI API unavailable, creating unpublishable review draft.');
      const inferredTitle = topic || draftTitle || 'مسودة: أحدث صيحات دهانات الحوائط وتنسيق الديكورات المعمارية';
      const inferredKw = focusKeyword || 'دهانات الحوائط والديكور الحديث';

      parsedData = {
        title: inferredTitle,
        excerpt: 'مسودة قيد المراجعة الفنية - لم يكتمل توليد المقال بالكامل عبر الذكاء الاصطناعي.',
        content: `## مسودة أولية: ${inferredTitle}\n\nتنبيه تحريري: تعذر استكمال توليد محتوى هذا المقال بنجاح عبر محرك الذكاء الاصطناعي. تم حفظ هذا السجل كمسودة غير منشورة وفق معايير الجودة الصارمة لمدونة ألفا للديكور والدهانات لمنع نشر المحتوى القصير أو غير المكتمل.\n\n[[IMAGE_0]]\n\n### أفكار رئيسية للتطوير:\n- إضافة باليتات ألوان متناسقة لعام 2026.\n- استعراض تقنيات تأسيس المعجون وعلاج الرطوبة مع استشاري التشطيبات الحضرى محمود.\n- دمج بديل الرخام وبديل الخشب.`,
        category: 'دهانات وديكورات داخلية',
        tags: [inferredKw, 'مسودة', 'دهانات وديكور'],
        focusKeyword: inferredKw,
        secondaryKeywords: [],
        metaDescription: `مسودة قيد المراجعة حول ${inferredKw}`,
        seoScore: 60,
        humanToneScore: 60,
        adSenseCompliant: false,
        status: 'draft',
        readingTime: 2,
      };
    }

    let workingImages = Array.isArray(images) ? [...images] : [];
    if (workingImages.length === 0) {
      const neededCount = Math.max(4, Math.round(clampedWords / 250));
      const allocated = await allocateContextualDecorImages(neededCount, [topic || draftTitle || '']);
      workingImages = allocated.map((a) => ({
        url: a.url,
        caption: a.defaultCaption,
      }));
    }

    let finalContent = parsedData.content || '';
    const seenImageUrlsInArticle = new Set<string>();
    const embeddedImages: { url: string; caption: string }[] = [];

    for (let idx = 0; idx < workingImages.length; idx++) {
      const img = workingImages[idx];
      let imgSrc = (img.url || img.base64 || '').trim();

      if (!imgSrc || seenImageUrlsInArticle.has(imgSrc)) {
        const fallbackAlloc = await allocateContextualDecorImages(1, [topic || ''], seenImageUrlsInArticle);
        imgSrc = fallbackAlloc[0]?.url || EXPANDED_DECOR_CATALOG[0].url;
      }

      seenImageUrlsInArticle.add(imgSrc);
      const captionText = img.caption && img.caption.trim()
        ? img.caption.trim()
        : `شكل توضيحي (${idx + 1}): تناسق دهانات الحوائط والديكورات المعمارية الفاخرة`;
      embeddedImages.push({ url: imgSrc, caption: captionText });

      const placeholder = `[[IMAGE_${idx}]]`;
      const imgMarkdown = `\n\n![${captionText}](${imgSrc})\n*${captionText}*\n\n`;

      if (finalContent.includes(placeholder)) {
        finalContent = finalContent.split(placeholder).join(imgMarkdown);
      } else {
        finalContent += imgMarkdown;
      }
    }

    finalContent = finalContent.replace(/\[\[IMAGE_\d+\]\]/g, '').trim();

    // Contextual Location & Google Maps Anchor:
    // Respect settings.businessLocation or user preference; NEVER inject fake hardcoded addresses.
    const dbSettings: any = await getDbSettings();
    const configuredLocation = dbSettings?.businessLocation;

    if (configuredLocation && (configuredLocation.mapUrl || configuredLocation.fullAddress)) {
      parsedData.googleMapsLocation = configuredLocation;
      const mapsBlock = `\n\n---\n### 📍 استشارات ومعاينة الموقع الميداني\nيسعد الخبير **الحضرى محمود** وفريق عمل «ألفا للديكور والدهانات» بتقديم خدمات المعاينة الميدانية وتنفيذ الدهانات والتشطيبات الفاخرة.\n${configuredLocation.fullAddress ? `- **الموقع المعتمد:** ${configuredLocation.fullAddress}\n` : ''}${configuredLocation.mapUrl ? `- **رابط الخريطة:** [عرض موقع المعاينة على خرائط Google](${configuredLocation.mapUrl})\n` : ''}---\n`;
      if (!finalContent.includes('Google Maps') && !finalContent.includes('خرائط Google')) {
        finalContent += mapsBlock;
      }
    } else if (locationPreference && typeof locationPreference === 'string' && locationPreference.trim()) {
      const cleanPref = locationPreference.trim();
      const mapsBlock = `\n\n---\n### 📍 خدمات المعاينة الميدانية والتشطيبات\nيسعد الخبير **الحضرى محمود** بتقديم خدمات المعاينة الميدانية وتنفيذ الدهانات المتخصصة في نطاق **${cleanPref}** والمناطق المحيطة.\n---\n`;
      if (!finalContent.includes('المعاينة الميدانية')) {
        finalContent += mapsBlock;
      }
      parsedData.googleMapsLocation = {
        city: cleanPref,
        area: cleanPref,
      };
    } else {
      // No location configured and no preference provided: omit fake address block
      parsedData.googleMapsLocation = null;
    }

    parsedData.content = finalContent;

    if (!parsedData.featuredImage) {
      parsedData.featuredImage = embeddedImages[0]?.url || EXPANDED_DECOR_CATALOG[0].url;
    }

    const actualWordCount = countActualWords(finalContent);
    parsedData.actualWordCount = actualWordCount;

    const validation = validateArticlePayload({
      title: parsedData.title,
      content: finalContent,
      excerpt: parsedData.excerpt,
      category: parsedData.category,
      status: parsedData.status || (actualWordCount >= 1000 ? 'published' : 'draft'),
      tags: parsedData.tags,
    }, {
      minWords: 1000,
      maxWords: 10000,
      strictPublish: true,
    });

    parsedData.validation = validation;
    parsedData.status = validation.status;
    parsedData.adSenseCompliant = validation.valid;
    parsedData.readingTime = Math.max(3, Math.round(actualWordCount / 200));

    // Dynamic SEO scoring based on content structure, keyword presence, and word count
    const cleanTitle = (parsedData.title || '').trim();
    const cleanContent = (finalContent || '').trim();
    const kw = (focusKeyword || topic || '').toLowerCase().trim();
    let dynamicSeo = 55;
    if (cleanTitle.length >= 35 && cleanTitle.length <= 80) dynamicSeo += 10;
    if ((parsedData.excerpt || '').length >= 60) dynamicSeo += 10;
    if (actualWordCount >= 1200) dynamicSeo += 15;
    else if (actualWordCount >= 1000) dynamicSeo += 10;
    if (kw && cleanTitle.toLowerCase().includes(kw)) dynamicSeo += 5;
    if (kw && cleanContent.toLowerCase().includes(kw)) dynamicSeo += 5;
    const h2Count = (cleanContent.match(/^##\s+.+/gm) || []).length;
    if (h2Count >= 3) dynamicSeo += 5;
    parsedData.seoScore = validation.valid ? Math.min(99, dynamicSeo) : Math.min(65, dynamicSeo);

    // Dynamic Human Tone scoring based on depth and natural writing
    let dynamicHumanTone = 70;
    if (actualWordCount >= 1000) dynamicHumanTone += 10;
    if (cleanContent.includes('الحضرى محمود')) dynamicHumanTone += 10;
    if (cleanContent.includes('نصيحة') || cleanContent.includes('تطبيق عملي')) dynamicHumanTone += 8;
    parsedData.humanToneScore = validation.valid ? Math.min(98, dynamicHumanTone) : Math.min(65, dynamicHumanTone);

    if (!parsedData.focusKeyword) parsedData.focusKeyword = focusKeyword || topic || 'أحدث دهانات الحوائط والديكور الحديث';
    if (!parsedData.category) parsedData.category = 'دهانات وديكورات داخلية';
    parsedData.rewrittenByAi = true;
    parsedData.providerUsed = providerUsed;
    parsedData.modelUsed = modelUsed;
    parsedData.fallbackTriggered = fallbackTriggered;
    if (fallbackReason) parsedData.fallbackReason = fallbackReason;

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.json(parsedData);
  } catch (err: unknown) {
    console.error('Error in generate-smart-article:', err);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.status(500).json({
      error: 'Failed to generate smart article with AI',
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

/**
 * AI Provider Status:
 * Reports active provider, fallback mode, and configuration state without exposing secrets.
 */
articleAiRouter.get('/api/ai/provider-status', (req: Request, res: Response) => {
  res.json(getAiProviderStatus());
});

/**
 * AI Provider Test Endpoint (Admin Protected):
 * Tests a live round-trip to the requested provider and reports latency.
 */
articleAiRouter.post('/api/ai/test-provider', requireAdminAuth, async (req: Request, res: Response) => {
  const { provider } = req.body;
  const targetProvider: AiProvider = (provider === 'grok' || provider === 'groq') ? provider : 'gemini';
  const startTime = Date.now();

  try {
    const result = await generateWithAi({
      provider: targetProvider,
      prompt: 'أنت في اختبار اتصال مباشر. اكتب "الاتصال ناجح" فقط.',
      timeoutMs: 15000,
      maxTokens: 50,
    });

    const latencyMs = Date.now() - startTime;
    res.json({
      success: true,
      provider: result.providerUsed,
      model: result.modelUsed,
      fallbackTriggered: result.fallbackTriggered,
      fallbackReason: result.fallbackReason,
      latencyMs,
      sampleResponse: result.text.trim().slice(0, 100),
    });
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    res.status(502).json({
      success: false,
      provider: targetProvider,
      latencyMs,
      error: err.message,
    });
  }
});

/**
 * Auto-Publish Status Endpoint:
 * Reflects that the 24-hour autonomous background publishing loop is DECOMMISSIONED/DISABLED
 * per the site owner's direct executive request, and that all publishing is handled via the
 * enhanced smart manual flow. Existing articles are 100% preserved.
 */
articleAiRouter.get('/api/auto-publish/status', async (req: Request, res: Response) => {
  try {
    const allArticles = await getDbArticles();
    const autoArticles = allArticles.filter((a: any) => a.isAutoPublished);
    const recentRuns = await getDbAutoPublishRuns(10);

    res.json({
      success: true,
      enabled: false, // 24-hour automated loop permanently disabled
      message: 'تم إيقاف النشر الآلي الدوري (كل 24 ساعة) بناءً على طلب صاحب الموقع، والاعتماد بالكامل على التوليد والنشر الذكي اليدوي عبر رفع الصور والشروحات مع الحفاظ التام على المقالات المنشورة.',
      mode: 'manual_smart_publishing',
      preservedArticlesCount: allArticles.length,
      autoPublishedCount: autoArticles.length,
      recentRuns,
      isCurrentlyRunning: false,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch auto-publish status', details: err.message });
  }
});

/**
 * Optional Manual Publish Trigger (On-Demand only from Dashboard if requested by Admin)
 */
articleAiRouter.post('/api/ai/auto-publish-article', requireAdminAuth, async (req: Request, res: Response) => {
  return res.status(403).json({
    error: 'تم تعطيل النشر الآلي الدوري بناءً على طلب صاحب الموقع. يرجى استخدام منشئ المقالات الذكي اليدوي (رفع الصور + الشرح + إكمال الذكاء الاصطناعي مع خرائط Google).',
    mode: 'manual_only',
  });
});

articleAiRouter.post('/api/cron/auto-publish', async (req: Request, res: Response) => {
  const configuredSecret = process.env.CRON_SECRET?.trim();
  if (!configuredSecret) {
    return res.status(503).json({
      error: 'CRON_SECRET is not configured on the server. Scheduled publishing webhook is disabled.',
    });
  }

  const secretHeader = req.headers['x-cron-secret'] || req.headers['authorization'];
  if (secretHeader !== configuredSecret && secretHeader !== `Bearer ${configuredSecret}`) {
    return res.status(401).json({ error: 'Unauthorized cron webhook call: missing or invalid secret.' });
  }

  const settings: any = await getDbSettings();
  if (!settings?.autoPublish?.enabled) {
    return res.json({
      success: false,
      skipped: true,
      reason: 'DISABLED',
      message: 'النشر الآلي معطل من الإعدادات أو بطلب صاحب الموقع.',
    });
  }

  return res.json({
    success: false,
    skipped: true,
    reason: 'CYCLE_ALREADY_PUBLISHED',
    message: 'تم إلغاء النشر الآلي الدوري نهائياً والاعتماد على التوليد والنشر الذكي اليدوي مع بقاء جميع المقالات في PostgreSQL.',
  });
});
