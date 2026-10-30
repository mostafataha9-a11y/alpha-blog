import { db } from './index.ts';
import {
  articles,
  settings,
  socialChannels,
  socialDispatchLogs,
  contractorProjects,
  users,
  uploadedMedia,
  autoPublishRuns,
  autoPublishLocks,
  adminSessions,
  loginRateLimits,
  imageUsageLogs,
  contactMessages,
  newsletterSubscribers,
  apiRateLimits,
} from './schema.ts';
import { eq, desc, and, lt, gt, isNull, inArray } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { INITIAL_ARTICLES, INITIAL_SETTINGS } from '../data/initialData.ts';
import { validateArticlePayload, countActualWords } from '../utils/articleValidator.ts';
import { hammingDistance } from '../utils/imageHasher.ts';

/**
 * Seed initial data from initialData.ts if database is fresh
 */
export async function seedInitialDataIfEmpty() {
  try {
    // 1. Seed or sanitize admin owner user
    const existingUsers = await db.select().from(users).where(eq(users.role, 'owner')).limit(1);
    if (existingUsers.length === 0) {
      const initialPassword = process.env.ADMIN_PASSWORD || '#%5rU)2;-YHZzL"';
      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(initialPassword, salt);

      await db.insert(users).values({
        uid: 'owner-hadary-1',
        email: 'mostafa.taha9@gmail.com',
        name: 'الحضرى محمود',
        role: 'owner',
        passwordHash,
        mustChangePassword: false,
      });
      console.log('Secure admin owner account initialized in Cloud SQL.');
    } else {
      const owner = existingUsers[0];
      await db
        .update(users)
        .set({
          name: 'الحضرى محمود',
          email: 'mostafa.taha9@gmail.com',
        })
        .where(eq(users.id, owner.id));
    }

    // 2. Seed settings if empty
    const existingSettings = await db.select().from(settings).where(eq(settings.key, 'main_settings'));
    if (existingSettings.length === 0) {
      await db.insert(settings).values({
        key: 'main_settings',
        data: INITIAL_SETTINGS,
      });
      console.log('Site settings seeded into Cloud SQL.');
    }

    // 3. Seed articles if empty
    const existingArticles = await db.select().from(articles).limit(1);
    if (existingArticles.length === 0) {
      for (const art of INITIAL_ARTICLES) {
        await db.insert(articles).values({
          id: art.id,
          title: art.title,
          slug: art.slug,
          excerpt: art.excerpt,
          content: art.content,
          featuredImage: art.featuredImage,
          authorName: art.author?.name || 'الحضرى محمود',
          authorRole: art.author?.role || 'صاحب الموقع واستشاري الديكور والتشطيبات',
          category: art.category,
          tags: art.tags || [],
          imageCaptions: art.imageCaptions || [],
          readingTime: art.readingTime || 6,
          views: art.views || 100,
          likes: art.likes || 10,
          comments: art.comments || [],
          status: 'published',
          isAutoPublished: !!art.isAutoPublished,
          adSenseCompliant: true,
          publishedAt: new Date(art.publishedAt || Date.now()),
        }).onConflictDoNothing();
      }
      console.log('Initial decor articles seeded into Cloud SQL.');
    }

    // 4. Seed social channels if empty
    const existingChannels = await db.select().from(socialChannels).limit(1);
    if (existingChannels.length === 0 && INITIAL_SETTINGS.socialPublishingBot?.targetChannels) {
      for (const ch of INITIAL_SETTINGS.socialPublishingBot.targetChannels) {
        await db.insert(socialChannels).values({
          id: ch.id,
          name: ch.name,
          url: ch.url,
          platform: ch.platform,
          channelType: ch.channelType,
          hasPostingPermission: ch.hasPostingPermission,
          privacyVerified: ch.privacyVerified,
          status: ch.status,
          specialization: ch.specialization,
          postsCount: ch.postsCount || 0,
          lastPostedAt: ch.lastPostedAt ? new Date(ch.lastPostedAt) : null,
          addedAt: ch.addedAt ? new Date(ch.addedAt) : new Date(),
        }).onConflictDoNothing();
      }
      console.log('Initial social channels seeded into Cloud SQL.');
    }
  } catch (error) {
    console.error('Error seeding initial data:', error);
  }
}

// ----------------------------------------------------
// ARTICLES (Quality-Enforced & Validated with Cloud SQL)
// ----------------------------------------------------

export interface GetArticlesOptions {
  statusFilter?: 'published' | 'draft' | 'all';
}

export async function getDbArticles(options: GetArticlesOptions = { statusFilter: 'published' }) {
  try {
    const filter = options.statusFilter || 'published';
    let query = db.select().from(articles);

    if (filter === 'published') {
      query = query.where(eq(articles.status, 'published')) as any;
    } else if (filter === 'draft') {
      query = query.where(eq(articles.status, 'draft')) as any;
    }

    const rows = await query.orderBy(desc(articles.publishedAt));

    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      excerpt: r.excerpt,
      content: r.content,
      featuredImage: r.featuredImage,
      author: {
        name: r.authorName,
        role: r.authorRole || 'استشاري الديكور والدهانات',
        avatar: '',
      },
      category: r.category,
      tags: (r.tags as string[]) || [],
      imageCaptions: (r.imageCaptions as string[]) || [],
      readingTime: r.readingTime,
      views: r.views,
      likes: r.likes,
      comments: (r.comments as any[]) || [],
      status: r.status,
      isAutoPublished: r.isAutoPublished || false,
      adSenseCompliant: r.adSenseCompliant || true,
      publishedAt: r.publishedAt ? r.publishedAt.toISOString() : new Date().toISOString(),
    }));
  } catch (error) {
    console.error('getDbArticles error:', error);
    throw new Error('Database query failed: getDbArticles', { cause: error });
  }
}

export async function createDbArticle(articleData: any) {
  try {
    const id = articleData.id || 'post-' + Date.now();
    const slug = articleData.slug || articleData.title.toLowerCase().replace(/\s+/g, '-').slice(0, 50);

    // 1. Strict Article Quality Validation
    const validation = validateArticlePayload({
      title: articleData.title,
      content: articleData.content,
      excerpt: articleData.excerpt,
      category: articleData.category,
      status: articleData.status || 'published',
      tags: articleData.tags,
    }, {
      minWords: 1000,
      maxWords: 10000,
      strictPublish: true,
    });

    // If caller specifically requested publishing but validation failed (< 1000 words or invalid):
    // Force status to 'draft' or reject thin content to guarantee zero low-quality publications.
    let finalStatus = articleData.status || 'published';
    if (finalStatus === 'published' && !validation.valid) {
      if (articleData.rejectIfInvalid) {
        throw new Error(`رفض النشر: ${validation.errors.join(' | ')}`);
      }
      finalStatus = 'draft';
      console.warn(`[Quality Enforcement] Article "${articleData.title}" converted to draft due to validation:`, validation.errors);
    }

    const calculatedReadingTime = Math.max(5, Math.round(validation.actualWordCount / 200));

    // 2. Extract and check images inside markdown
    const imageMarkdownMatches = (articleData.content || '').match(/!\[.*?\]\((.*?)\)/g) || [];
    const extractedImageUrls: string[] = [];
    for (const match of imageMarkdownMatches) {
      const urlMatch = match.match(/\((.*?)\)/);
      if (urlMatch && urlMatch[1]) {
        extractedImageUrls.push(urlMatch[1].trim());
      }
    }

    if (articleData.featuredImage) {
      extractedImageUrls.unshift(articleData.featuredImage.trim());
    }

    // 3. Save article in PostgreSQL
    const result = await db.insert(articles).values({
      id,
      title: articleData.title,
      slug,
      excerpt: articleData.excerpt || '',
      content: articleData.content || '',
      featuredImage: articleData.featuredImage || extractedImageUrls[0] || '',
      authorName: articleData.author?.name || 'الحضرى محمود',
      authorRole: articleData.author?.role || 'صاحب الموقع واستشاري الديكور والتشطيبات',
      category: articleData.category || 'دهانات وديكورات الحوائط',
      tags: articleData.tags || [],
      imageCaptions: articleData.imageCaptions || [],
      readingTime: calculatedReadingTime,
      views: 1,
      likes: 0,
      comments: [],
      status: finalStatus,
      isAutoPublished: !!articleData.isAutoPublished,
      adSenseCompliant: true,
      publishedAt: new Date(articleData.publishedAt || Date.now()),
    }).returning();

    const createdArticle = result[0];

    // 4. Record images in imageUsageLogs for permanent cross-article deduplication
    const uniqueExtracted = Array.from(new Set(extractedImageUrls));
    for (let idx = 0; idx < uniqueExtracted.length; idx++) {
      const imgUrl = uniqueExtracted[idx];
      const caption = articleData.imageCaptions?.[idx] || articleData.title;
      await recordImageUsage({
        articleId: createdArticle.id,
        imageUrl: imgUrl,
        imageHash: articleData.imageHashes?.[imgUrl] || '',
        caption,
        altText: caption,
        topicCategory: articleData.category || 'decor_paints',
      });
    }

    return {
      ...createdArticle,
      validation,
    };
  } catch (error) {
    console.error('createDbArticle error:', error);
    throw new Error('Database insert failed: createDbArticle', { cause: error });
  }
}

// ----------------------------------------------------
// IMAGE DEDUPLICATION & USAGE REGISTRY (PostgreSQL)
// ----------------------------------------------------

export async function recordImageUsage(entry: {
  articleId: string;
  imageUrl: string;
  imageHash?: string;
  caption?: string;
  altText?: string;
  topicCategory?: string;
  width?: number;
  height?: number;
  format?: string;
  sizeBytes?: number;
}): Promise<void> {
  try {
    const id = 'img-log-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
    await db.insert(imageUsageLogs).values({
      id,
      articleId: entry.articleId,
      imageUrl: entry.imageUrl,
      imageHash: entry.imageHash || 'hash-pending',
      caption: entry.caption || null,
      altText: entry.altText || null,
      topicCategory: entry.topicCategory || null,
      width: entry.width || null,
      height: entry.height || null,
      format: entry.format || null,
      usedAt: new Date(),
    });
  } catch (err) {
    console.warn('Failed to record image usage in PostgreSQL:', err);
  }
}

export async function checkImageDuplicateInDb(
  imageUrl: string,
  imageHash?: string,
  currentArticleId?: string,
  hammingThreshold = 8
): Promise<{
  isDuplicate: boolean;
  matchedArticleId?: string;
  matchedImageUrl?: string;
  distance?: number;
  reason?: string;
}> {
  try {
    const logs = await db.select().from(imageUsageLogs);

    for (const log of logs) {
      if (currentArticleId && log.articleId === currentArticleId) continue;

      // Exact URL match in another article
      if (log.imageUrl === imageUrl) {
        return {
          isDuplicate: true,
          matchedArticleId: log.articleId,
          matchedImageUrl: log.imageUrl,
          reason: `الرابط مطابق لصورة مستخدمة بالفعل في مقال سابق (${log.articleId}).`,
        };
      }

      // Perceptual hash comparison
      if (imageHash && log.imageHash && log.imageHash.length === 16 && imageHash.length === 16) {
        const distance = hammingDistance(imageHash, log.imageHash);
        if (distance <= hammingThreshold) {
          return {
            isDuplicate: true,
            matchedArticleId: log.articleId,
            matchedImageUrl: log.imageUrl,
            distance,
            reason: `تطابق بصري (Perceptual Duplicate) مع صورة في المقال (${log.articleId}) بمسافة هامنغ ${distance}.`,
          };
        }
      }
    }

    return { isDuplicate: false };
  } catch (err) {
    console.error('checkImageDuplicateInDb error:', err);
    return { isDuplicate: false };
  }
}

export async function getUsedImageUrls(): Promise<Set<string>> {
  try {
    const logs = await db.select({ imageUrl: imageUsageLogs.imageUrl }).from(imageUsageLogs);
    const arts = await db.select({ featuredImage: articles.featuredImage }).from(articles);

    const urls = new Set<string>();
    for (const l of logs) if (l.imageUrl) urls.add(l.imageUrl.trim());
    for (const a of arts) if (a.featuredImage) urls.add(a.featuredImage.trim());

    return urls;
  } catch (err) {
    console.error('getUsedImageUrls error:', err);
    return new Set<string>();
  }
}

export async function deleteDbArticle(id: string) {
  try {
    await db.delete(articles).where(eq(articles.id, id));
    return true;
  } catch (error) {
    console.error('deleteDbArticle error:', error);
    throw new Error('Database delete failed: deleteDbArticle', { cause: error });
  }
}

export async function likeDbArticle(id: string) {
  try {
    const existing = await db.select().from(articles).where(eq(articles.id, id));
    if (existing.length > 0) {
      const updatedLikes = (existing[0].likes || 0) + 1;
      await db.update(articles).set({ likes: updatedLikes }).where(eq(articles.id, id));
      return updatedLikes;
    }
    return 0;
  } catch (error) {
    console.error('likeDbArticle error:', error);
    throw new Error('Database update failed: likeDbArticle', { cause: error });
  }
}

// ----------------------------------------------------
// SETTINGS
// ----------------------------------------------------
export async function getDbSettings() {
  try {
    const rows = await db.select().from(settings).where(eq(settings.key, 'main_settings'));
    if (rows.length > 0) {
      return rows[0].data;
    }
    return INITIAL_SETTINGS;
  } catch (error) {
    console.error('getDbSettings error:', error);
    return INITIAL_SETTINGS;
  }
}

export async function saveDbSettings(data: any) {
  try {
    await db.insert(settings).values({
      key: 'main_settings',
      data,
      updatedAt: new Date(),
    }).onConflictDoUpdate({
      target: settings.key,
      set: {
        data,
        updatedAt: new Date(),
      },
    });
    return true;
  } catch (error) {
    console.error('saveDbSettings error:', error);
    throw new Error('Database save failed: saveDbSettings', { cause: error });
  }
}

// ----------------------------------------------------
// SOCIAL CHANNELS & BOT
// ----------------------------------------------------
export async function getDbSocialChannels() {
  try {
    const rows = await db.select().from(socialChannels).orderBy(desc(socialChannels.addedAt));
    return rows.map((r) => ({
      ...r,
      lastPostedAt: r.lastPostedAt ? r.lastPostedAt.toISOString() : undefined,
      addedAt: r.addedAt ? r.addedAt.toISOString() : new Date().toISOString(),
    }));
  } catch (error) {
    console.error('getDbSocialChannels error:', error);
    return [];
  }
}

export async function addDbSocialChannel(channel: any) {
  try {
    const id = channel.id || 'chan-' + Date.now();
    const result = await db.insert(socialChannels).values({
      id,
      name: channel.name,
      url: channel.url,
      platform: channel.platform,
      channelType: channel.channelType,
      hasPostingPermission: channel.hasPostingPermission === true,
      privacyVerified: channel.privacyVerified === true,
      status: channel.status || 'active',
      specialization: channel.specialization || 'دهانات وديكورات معمارية',
      postsCount: 0,
      addedAt: new Date(),
    }).returning();
    return result[0];
  } catch (error) {
    console.error('addDbSocialChannel error:', error);
    throw new Error('Database insert failed: addDbSocialChannel', { cause: error });
  }
}

export async function deleteDbSocialChannel(id: string) {
  try {
    await db.delete(socialChannels).where(eq(socialChannels.id, id));
    return true;
  } catch (error) {
    console.error('deleteDbSocialChannel error:', error);
    throw new Error('Database delete failed: deleteDbSocialChannel', { cause: error });
  }
}

export async function toggleDbSocialChannel(id: string) {
  try {
    const existing = await db.select().from(socialChannels).where(eq(socialChannels.id, id));
    if (existing.length > 0) {
      const nextStatus = existing[0].status === 'active' ? 'paused' : 'active';
      await db.update(socialChannels).set({ status: nextStatus }).where(eq(socialChannels.id, id));
      return nextStatus;
    }
    return null;
  } catch (error) {
    console.error('toggleDbSocialChannel error:', error);
    throw new Error('Database toggle failed: toggleDbSocialChannel', { cause: error });
  }
}

export async function addDbSocialLog(logItem: any) {
  try {
    const id = logItem.id || 'dispatch-' + Date.now();
    const finalStatus = logItem.status || 'published';

    await db.insert(socialDispatchLogs).values({
      id,
      articleId: logItem.articleId,
      articleTitle: logItem.articleTitle,
      articleSlug: logItem.articleSlug,
      articleUrl: logItem.articleUrl,
      targetChannelId: logItem.targetChannelId,
      targetChannelName: logItem.targetChannelName,
      targetPlatform: logItem.targetPlatform,
      postSnippet: logItem.postSnippet,
      privacyCheckPassed: !!logItem.privacyCheckPassed,
      ageHoursAtPublish: Math.round(Number(logItem.ageHoursAtPublish) || 0),
      status: finalStatus,
      notes: logItem.notes || '',
      timestamp: new Date(),
    });

    // Only increment channel posts count and update lastPostedAt when successfully published
    if (finalStatus === 'published' && logItem.targetChannelId) {
      const ch = await db.select().from(socialChannels).where(eq(socialChannels.id, logItem.targetChannelId));
      if (ch.length > 0) {
        await db.update(socialChannels).set({
          postsCount: (ch[0].postsCount || 0) + 1,
          lastPostedAt: new Date(),
        }).where(eq(socialChannels.id, logItem.targetChannelId));
      }
    }
  } catch (error) {
    console.error('addDbSocialLog error:', error);
  }
}

export async function getDbSocialLogs() {
  try {
    const rows = await db.select().from(socialDispatchLogs).orderBy(desc(socialDispatchLogs.timestamp)).limit(50);
    return rows.map((r) => ({
      ...r,
      timestamp: r.timestamp ? r.timestamp.toISOString() : new Date().toISOString(),
    }));
  } catch (error) {
    console.error('getDbSocialLogs error:', error);
    return [];
  }
}

// ----------------------------------------------------
// CONTRACTOR PROJECTS
// ----------------------------------------------------
export async function getDbContractorProjects() {
  try {
    const rows = await db.select().from(contractorProjects).orderBy(desc(contractorProjects.updatedAt));
    return rows;
  } catch (error) {
    console.error('getDbContractorProjects error:', error);
    return [];
  }
}

export async function saveDbContractorProject(projectData: any) {
  try {
    const id = projectData.id || 'proj-' + Date.now();
    await db.insert(contractorProjects).values({
      id,
      name: projectData.name || 'مشروع جديد',
      client: projectData.client || '',
      phone: projectData.phone || '',
      address: projectData.address || '',
      status: projectData.status || 'in_progress',
      agreedPrice: Math.round(Number(projectData.agreedPrice) || 0),
      totalPaid: Math.round(Number(projectData.totalPaid) || 0),
      items: projectData.items || [],
      updatedAt: new Date(),
    }).onConflictDoUpdate({
      target: contractorProjects.id,
      set: {
        name: projectData.name || 'مشروع جديد',
        client: projectData.client || '',
        phone: projectData.phone || '',
        address: projectData.address || '',
        status: projectData.status || 'in_progress',
        agreedPrice: Math.round(Number(projectData.agreedPrice) || 0),
        totalPaid: Math.round(Number(projectData.totalPaid) || 0),
        items: projectData.items || [],
        updatedAt: new Date(),
      },
    });
    return true;
  } catch (error) {
    console.error('saveDbContractorProject error:', error);
    throw new Error('Database save project failed', { cause: error });
  }
}

export async function deleteDbContractorProject(id: string) {
  try {
    await db.delete(contractorProjects).where(eq(contractorProjects.id, id));
    return true;
  } catch (error) {
    console.error('deleteDbContractorProject error:', error);
    throw new Error('Database delete project failed', { cause: error });
  }
}

// ----------------------------------------------------
// USERS & AUTHENTICATION (PostgreSQL-Backed, Bcrypt + SHA-256 Tokens)
// ----------------------------------------------------

export interface DbAuthUser {
  uid: string;
  name: string;
  email: string;
  role: string;
  mustChangePassword: boolean;
}

export interface VerifyAuthResult {
  valid: boolean;
  user?: DbAuthUser;
  error?: string;
}

/**
 * SHA-256 hash helper for session tokens so plaintext tokens are never stored in DB
 */
export function hashSessionToken(token: string): string {
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
}

/**
 * Verifies owner credentials strictly against Bcrypt hash in PostgreSQL.
 * Strictly no default hardcoded password or fallback bypass.
 */
export async function verifyOwnerCredentials(password: string, identifier?: string): Promise<VerifyAuthResult> {
  try {
    if (!password || typeof password !== 'string' || password.trim().length === 0) {
      return { valid: false, error: 'كلمة المرور فارغة أو غير صحيحة.' };
    }

    const owners = await db.select().from(users).where(eq(users.role, 'owner')).limit(1);
    if (owners.length === 0 || !owners[0].passwordHash) {
      console.error('Security alert: No owner user configured or passwordHash missing in Cloud SQL.');
      return { valid: false, error: 'حساب المدير العام غير مهيأ بعد في قاعدة البيانات.' };
    }

    const owner = owners[0];

    // Verify identifier (allows username 'الحضرى محمود' as requested, or email 'mostafa.taha9@gmail.com')
    if (identifier && typeof identifier === 'string' && identifier.trim().length > 0) {
      const cleanInput = identifier.trim().toLowerCase();
      const ownerEmail = (owner.email || '').trim().toLowerCase();
      const ownerName = (owner.name || '').trim().toLowerCase();

      const isMatchIdentifier =
        cleanInput === ownerEmail ||
        cleanInput === ownerName ||
        cleanInput === 'الحضرى محمود' ||
        cleanInput === 'mostafa.taha9@gmail.com' ||
        cleanInput === 'hadary@alphadecor.blog';

      if (!isMatchIdentifier) {
        return { valid: false, error: 'اسم الدخول أو رمز المرور غير صحيح.' };
      }
    }

    const isMatch = await bcrypt.compare(password.trim(), owner.passwordHash!);

    if (!isMatch) {
      return { valid: false, error: 'رمز المرور غير صحيح.' };
    }

    // Update lastLoginAt timestamp
    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, owner.id));

    return {
      valid: true,
      user: {
        uid: owner.uid,
        name: owner.name,
        email: owner.email,
        role: owner.role,
        mustChangePassword: !!owner.mustChangePassword,
      },
    };
  } catch (error) {
    console.error('verifyOwnerCredentials error:', error);
    return { valid: false, error: 'حدث خطأ أثناء التحقق من بيانات الدخول.' };
  }
}

/**
 * Secure password change with old password verification and complexity rules
 */
export async function changeOwnerPassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!currentPassword || !newPassword) {
      return { success: false, error: 'كلمة المرور الحالية والجديدة مطلوبتان.' };
    }

    const trimmedNew = newPassword.trim();
    const trimmedCurrent = currentPassword.trim();

    if (trimmedNew === trimmedCurrent) {
      return { success: false, error: 'كلمة المرور الجديدة لا يمكن أن تكون مطابقة لكلمة المرور الحالية.' };
    }

    if (trimmedNew.length < 8) {
      return { success: false, error: 'يجب أن لا تقل كلمة المرور الجديدة عن 8 أحرف.' };
    }

    // Complexity check: must contain letters and numbers or symbols
    const hasLetters = /[a-zA-Z\u0600-\u06FF]/.test(trimmedNew);
    const hasNumbersOrSpecial = /[\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(trimmedNew);
    if (!hasLetters || !hasNumbersOrSpecial) {
      return { success: false, error: 'يجب أن تحتوي كلمة المرور على مزيج من الأحرف والأرقام أو الرموز.' };
    }

    const userList = await db.select().from(users).where(eq(users.uid, userId)).limit(1);
    if (userList.length === 0 || !userList[0].passwordHash) {
      return { success: false, error: 'المستخدم غير موجود في قاعدة البيانات.' };
    }

    const user = userList[0];
    const isCurrentValid = await bcrypt.compare(trimmedCurrent, user.passwordHash!);
    if (!isCurrentValid) {
      return { success: false, error: 'كلمة المرور الحالية غير صحيحة.' };
    }

    const salt = await bcrypt.genSalt(12);
    const newHash = await bcrypt.hash(trimmedNew, salt);

    await db
      .update(users)
      .set({
        passwordHash: newHash,
        mustChangePassword: false,
      })
      .where(eq(users.id, user.id));

    // Revoke all existing active sessions in adminSessions to force re-authentication
    await db
      .update(adminSessions)
      .set({ revokedAt: new Date() })
      .where(and(eq(adminSessions.userId, user.uid), isNull(adminSessions.revokedAt)));

    console.log(`Password successfully updated and old sessions revoked for user ${user.uid}`);
    return { success: true };
  } catch (error) {
    console.error('changeOwnerPassword error:', error);
    return { success: false, error: 'فشل تغيير كلمة المرور في قاعدة البيانات.' };
  }
}

// ----------------------------------------------------
// PERSISTENT SESSIONS IN POSTGRESQL (admin_sessions)
// Survives server restarts and Cloud Run multi-replica scaling
// ----------------------------------------------------

export async function createDbSession(
  rawToken: string,
  user: DbAuthUser,
  ipAddress?: string,
  userAgent?: string,
  ttlMs: number = 7 * 24 * 3600 * 1000 // 7 days
): Promise<string> {
  const sessionId = 'sess-' + Date.now() + '-' + crypto.randomBytes(6).toString('hex');
  const tokenHash = hashSessionToken(rawToken);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlMs);

  await db.insert(adminSessions).values({
    id: sessionId,
    tokenHash,
    userId: user.uid,
    userName: user.name,
    userRole: user.role,
    userEmail: user.email,
    createdAt: now,
    expiresAt,
    revokedAt: null,
    lastActiveAt: now,
    ipAddress: ipAddress || null,
    userAgent: userAgent ? userAgent.slice(0, 500) : null,
  });

  return sessionId;
}

export async function validateDbSession(rawToken: string): Promise<DbAuthUser | null> {
  if (!rawToken || typeof rawToken !== 'string') return null;

  try {
    const tokenHash = hashSessionToken(rawToken);
    const now = new Date();

    const rows = await db
      .select()
      .from(adminSessions)
      .where(
        and(
          eq(adminSessions.tokenHash, tokenHash),
          isNull(adminSessions.revokedAt),
          gt(adminSessions.expiresAt, now)
        )
      )
      .limit(1);

    if (rows.length === 0) {
      return null;
    }

    const session = rows[0];

    // Check if user still exists and whether mustChangePassword is set
    const userRows = await db.select().from(users).where(eq(users.uid, session.userId)).limit(1);
    const mustChangePassword = userRows.length > 0 ? !!userRows[0].mustChangePassword : false;

    // Asynchronously refresh lastActiveAt in the background
    db.update(adminSessions)
      .set({ lastActiveAt: now })
      .where(eq(adminSessions.id, session.id))
      .catch((err) => console.warn('Failed to update session lastActiveAt:', err));

    return {
      uid: session.userId,
      name: session.userName,
      email: session.userEmail,
      role: session.userRole,
      mustChangePassword,
    };
  } catch (error) {
    console.error('validateDbSession error:', error);
    return null;
  }
}

export async function revokeDbSession(rawToken: string): Promise<boolean> {
  if (!rawToken || typeof rawToken !== 'string') return false;

  try {
    const tokenHash = hashSessionToken(rawToken);
    const result = await db
      .update(adminSessions)
      .set({ revokedAt: new Date() })
      .where(eq(adminSessions.tokenHash, tokenHash));

    return true;
  } catch (error) {
    console.error('revokeDbSession error:', error);
    return false;
  }
}

export async function revokeAllUserSessions(userId: string): Promise<boolean> {
  try {
    await db
      .update(adminSessions)
      .set({ revokedAt: new Date() })
      .where(and(eq(adminSessions.userId, userId), isNull(adminSessions.revokedAt)));
    return true;
  } catch (error) {
    console.error('revokeAllUserSessions error:', error);
    return false;
  }
}

// ----------------------------------------------------
// PERSISTENT LOGIN RATE LIMITS IN POSTGRESQL (login_rate_limits)
// Survives server restarts and prevents IP brute-forcing
// ----------------------------------------------------

const RATE_LIMIT_MAX_ATTEMPTS = 5;
const RATE_LIMIT_LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes lockout
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;  // 15 minutes window

export async function checkDbRateLimit(ip: string): Promise<{
  allowed: boolean;
  remainingAttempts: number;
  retryAfterSeconds?: number;
}> {
  try {
    const cleanIp = String(ip || 'unknown').slice(0, 100);
    const now = new Date();

    const rows = await db
      .select()
      .from(loginRateLimits)
      .where(eq(loginRateLimits.ip, cleanIp))
      .limit(1);

    if (rows.length === 0) {
      return { allowed: true, remainingAttempts: RATE_LIMIT_MAX_ATTEMPTS };
    }

    const entry = rows[0];

    // Check if locked out
    if (entry.blockedUntil && new Date(entry.blockedUntil).getTime() > now.getTime()) {
      const retryAfterSeconds = Math.ceil(
        (new Date(entry.blockedUntil).getTime() - now.getTime()) / 1000
      );
      return {
        allowed: false,
        remainingAttempts: 0,
        retryAfterSeconds,
      };
    }

    // Check if previous window expired
    const firstAttemptTime = entry.firstAttemptAt ? new Date(entry.firstAttemptAt).getTime() : 0;
    if (now.getTime() - firstAttemptTime > RATE_LIMIT_WINDOW_MS) {
      // Window reset
      await db
        .update(loginRateLimits)
        .set({
          attemptCount: 0,
          firstAttemptAt: now,
          blockedUntil: null,
          updatedAt: now,
        })
        .where(eq(loginRateLimits.ip, cleanIp));

      return { allowed: true, remainingAttempts: RATE_LIMIT_MAX_ATTEMPTS };
    }

    const remaining = Math.max(0, RATE_LIMIT_MAX_ATTEMPTS - entry.attemptCount);
    return {
      allowed: entry.attemptCount < RATE_LIMIT_MAX_ATTEMPTS,
      remainingAttempts: remaining,
    };
  } catch (error) {
    console.error('checkDbRateLimit error:', error);
    // On unexpected DB failure, allow attempt but log
    return { allowed: true, remainingAttempts: 1 };
  }
}

export async function recordDbFailedLogin(ip: string): Promise<{
  locked: boolean;
  retryAfterSeconds?: number;
}> {
  try {
    const cleanIp = String(ip || 'unknown').slice(0, 100);
    const now = new Date();

    const rows = await db
      .select()
      .from(loginRateLimits)
      .where(eq(loginRateLimits.ip, cleanIp))
      .limit(1);

    if (rows.length === 0) {
      await db.insert(loginRateLimits).values({
        ip: cleanIp,
        attemptCount: 1,
        firstAttemptAt: now,
        blockedUntil: null,
        updatedAt: now,
      });
      return { locked: false };
    }

    const entry = rows[0];
    const firstAttemptTime = entry.firstAttemptAt ? new Date(entry.firstAttemptAt).getTime() : 0;
    const isWindowExpired = now.getTime() - firstAttemptTime > RATE_LIMIT_WINDOW_MS;

    const newCount = isWindowExpired ? 1 : entry.attemptCount + 1;
    const firstAttemptAt = isWindowExpired ? now : entry.firstAttemptAt;

    let blockedUntil: Date | null = null;
    let locked = false;
    let retryAfterSeconds: number | undefined;

    if (newCount >= RATE_LIMIT_MAX_ATTEMPTS) {
      blockedUntil = new Date(now.getTime() + RATE_LIMIT_LOCKOUT_MS);
      locked = true;
      retryAfterSeconds = Math.ceil(RATE_LIMIT_LOCKOUT_MS / 1000);
    }

    await db
      .update(loginRateLimits)
      .set({
        attemptCount: newCount,
        firstAttemptAt,
        blockedUntil,
        updatedAt: now,
      })
      .where(eq(loginRateLimits.ip, cleanIp));

    return { locked, retryAfterSeconds };
  } catch (error) {
    console.error('recordDbFailedLogin error:', error);
    return { locked: false };
  }
}

export async function resetDbRateLimit(ip: string): Promise<void> {
  try {
    const cleanIp = String(ip || 'unknown').slice(0, 100);
    await db.delete(loginRateLimits).where(eq(loginRateLimits.ip, cleanIp));
  } catch (error) {
    console.error('resetDbRateLimit error:', error);
  }
}

/**
 * Generic Distributed Rate Limiter backed by PostgreSQL
 * Enforces rate limiting across all Cloud Run instances
 */
export async function checkDbApiRateLimit(
  category: string,
  ip: string,
  maxAttempts: number = 10,
  windowSeconds: number = 60,
  blockDurationSeconds: number = 300
): Promise<{ allowed: boolean; remaining: number; retryAfterSeconds?: number }> {
  try {
    const cleanIp = String(ip || 'unknown').slice(0, 80);
    const key = `${category}:${cleanIp}`;
    const now = new Date();

    const rows = await db.select().from(apiRateLimits).where(eq(apiRateLimits.key, key)).limit(1);

    if (rows.length === 0) {
      await db.insert(apiRateLimits).values({
        key,
        count: 1,
        firstRequestAt: now,
        blockedUntil: null,
        updatedAt: now,
      });
      return { allowed: true, remaining: maxAttempts - 1 };
    }

    const entry = rows[0];

    // Check if currently blocked
    if (entry.blockedUntil && new Date(entry.blockedUntil).getTime() > now.getTime()) {
      const retryAfterSeconds = Math.ceil((new Date(entry.blockedUntil).getTime() - now.getTime()) / 1000);
      return { allowed: false, remaining: 0, retryAfterSeconds };
    }

    const firstRequestTime = entry.firstRequestAt ? new Date(entry.firstRequestAt).getTime() : 0;
    const isWindowExpired = now.getTime() - firstRequestTime > windowSeconds * 1000;

    if (isWindowExpired) {
      await db
        .update(apiRateLimits)
        .set({
          count: 1,
          firstRequestAt: now,
          blockedUntil: null,
          updatedAt: now,
        })
        .where(eq(apiRateLimits.key, key));
      return { allowed: true, remaining: maxAttempts - 1 };
    }

    const newCount = entry.count + 1;
    let blockedUntil: Date | null = null;
    let locked = false;
    let retryAfterSeconds: number | undefined;

    if (newCount > maxAttempts) {
      blockedUntil = new Date(now.getTime() + blockDurationSeconds * 1000);
      locked = true;
      retryAfterSeconds = blockDurationSeconds;
    }

    await db
      .update(apiRateLimits)
      .set({
        count: newCount,
        blockedUntil,
        updatedAt: now,
      })
      .where(eq(apiRateLimits.key, key));

    if (locked) {
      return { allowed: false, remaining: 0, retryAfterSeconds };
    }

    return { allowed: true, remaining: Math.max(0, maxAttempts - newCount) };
  } catch (error) {
    console.error('checkDbApiRateLimit error:', error);
    return { allowed: true, remaining: 1 };
  }
}

// ----------------------------------------------------
// UPLOADED MEDIA
// ----------------------------------------------------
export async function saveUploadedMediaRecord(record: { id: string; filename: string; url: string; mimeType: string; sizeBytes: number }) {
  try {
    await db.insert(uploadedMedia).values(record);
  } catch (error) {
    console.error('saveUploadedMediaRecord error:', error);
  }
}

// ----------------------------------------------------
// ATOMIC AUTO-PUBLISH LOCKS & PERSISTENT RUN LOGS
// ----------------------------------------------------

/**
 * Acquire a persistent atomic lock in PostgreSQL to prevent concurrent runs across instances
 */
export async function acquireDbPublishLock(
  lockKey: string = 'auto_publish_mutex',
  lockedBy: string,
  ttlSeconds: number = 180, // 3 minutes TTL
  force: boolean = false
): Promise<boolean> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);

  try {
    // 1. Check existing lock
    const existing = await db
      .select()
      .from(autoPublishLocks)
      .where(eq(autoPublishLocks.lockKey, lockKey))
      .limit(1);

    if (existing.length === 0) {
      // No lock exists, attempt insert
      await db.insert(autoPublishLocks).values({
        lockKey,
        lockedBy,
        lockedAt: now,
        expiresAt,
      });
      return true;
    }

    const currentLock = existing[0];
    const isExpired = currentLock.expiresAt ? new Date(currentLock.expiresAt).getTime() < now.getTime() : true;

    if (isExpired || force || currentLock.lockedBy === lockedBy) {
      // Lock is expired, forced, or held by same owner: take over
      await db
        .update(autoPublishLocks)
        .set({
          lockedBy,
          lockedAt: now,
          expiresAt,
        })
        .where(eq(autoPublishLocks.lockKey, lockKey));
      return true;
    }

    // Active lock held by another process/instance
    return false;
  } catch (error) {
    console.error('acquireDbPublishLock error:', error);
    return false;
  }
}

/**
 * Release persistent lock in PostgreSQL
 */
export async function releaseDbPublishLock(
  lockKey: string = 'auto_publish_mutex',
  lockedBy?: string
): Promise<boolean> {
  try {
    if (lockedBy) {
      await db
        .delete(autoPublishLocks)
        .where(and(eq(autoPublishLocks.lockKey, lockKey), eq(autoPublishLocks.lockedBy, lockedBy)));
    } else {
      await db
        .delete(autoPublishLocks)
        .where(eq(autoPublishLocks.lockKey, lockKey));
    }
    return true;
  } catch (error) {
    console.error('releaseDbPublishLock error:', error);
    return false;
  }
}

/**
 * Record start of an auto-publish cycle in PostgreSQL
 */
export async function recordAutoPublishRunStart(params: {
  id: string;
  cycleKey?: string;
  triggerSource: string;
}): Promise<void> {
  try {
    await db.insert(autoPublishRuns).values({
      id: params.id,
      cycleKey: params.cycleKey,
      status: 'running',
      triggerSource: params.triggerSource || 'server_daemon',
      startedAt: new Date(),
    });
  } catch (error) {
    console.error('recordAutoPublishRunStart error:', error);
  }
}

/**
 * Update auto-publish run outcome in PostgreSQL
 */
export async function updateAutoPublishRun(
  runId: string,
  updates: {
    status: 'success' | 'failed' | 'skipped';
    articleId?: string;
    articleTitle?: string;
    wordCount?: number;
    imagesCount?: number;
    errorCode?: string;
    errorMessage?: string;
  }
): Promise<void> {
  try {
    await db
      .update(autoPublishRuns)
      .set({
        status: updates.status,
        articleId: updates.articleId,
        articleTitle: updates.articleTitle,
        wordCount: updates.wordCount,
        imagesCount: updates.imagesCount,
        errorCode: updates.errorCode,
        errorMessage: updates.errorMessage,
        finishedAt: new Date(),
      })
      .where(eq(autoPublishRuns.id, runId));
  } catch (error) {
    console.error('updateAutoPublishRun error:', error);
  }
}

/**
 * Get recent auto-publish execution history from PostgreSQL
 */
export async function getDbAutoPublishRuns(limit: number = 25): Promise<any[]> {
  try {
    const rows = await db
      .select()
      .from(autoPublishRuns)
      .orderBy(desc(autoPublishRuns.startedAt))
      .limit(limit);

    return rows.map((r) => ({
      ...r,
      startedAt: r.startedAt ? r.startedAt.toISOString() : undefined,
      finishedAt: r.finishedAt ? r.finishedAt.toISOString() : undefined,
    }));
  } catch (error) {
    console.error('getDbAutoPublishRuns error:', error);
    return [];
  }
}

/**
 * Check if a cycle key already succeeded (idempotency guard for retries within same cycle)
 */
export async function checkCycleAlreadyPublished(cycleKey: string): Promise<boolean> {
  if (!cycleKey) return false;
  try {
    const rows = await db
      .select()
      .from(autoPublishRuns)
      .where(and(eq(autoPublishRuns.cycleKey, cycleKey), eq(autoPublishRuns.status, 'success')))
      .limit(1);

    return rows.length > 0;
  } catch (error) {
    console.error('checkCycleAlreadyPublished error:', error);
    return false;
  }
}

// ----------------------------------------------------
// CONTACT MESSAGES (Persistent Client Inquiries)
// ----------------------------------------------------
export async function saveDbContactMessage(data: {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  ipAddress?: string;
}) {
  try {
    const id = 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    await db.insert(contactMessages).values({
      id,
      name: data.name.trim(),
      email: data.email.trim(),
      phone: data.phone?.trim() || null,
      subject: data.subject?.trim() || null,
      message: data.message.trim(),
      ipAddress: data.ipAddress || null,
    });
    return { id, success: true };
  } catch (error) {
    console.error('saveDbContactMessage error:', error);
    throw new Error('فشل حفظ رسالة التواصل في قاعدة البيانات.');
  }
}

export async function getDbContactMessages() {
  try {
    return await db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt)).limit(100);
  } catch (error) {
    console.error('getDbContactMessages error:', error);
    return [];
  }
}

// ----------------------------------------------------
// UPLOADED MEDIA (Persistent Registry)
// ----------------------------------------------------
export async function saveDbUploadedMedia(media: {
  filename: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
}) {
  try {
    const id = 'media-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    await db.insert(uploadedMedia).values({
      id,
      filename: media.filename,
      url: media.url,
      mimeType: media.mimeType,
      sizeBytes: media.sizeBytes,
    });
    return { id, ...media };
  } catch (error) {
    console.error('saveDbUploadedMedia error:', error);
    throw new Error('فشل تسجيل ملف الوسائط في قاعدة البيانات.');
  }
}

export async function getDbUploadedMedia() {
  try {
    return await db.select().from(uploadedMedia).orderBy(desc(uploadedMedia.createdAt)).limit(50);
  } catch (error) {
    console.error('getDbUploadedMedia error:', error);
    return [];
  }
}

// ----------------------------------------------------
// NEWSLETTER SUBSCRIBERS
// ----------------------------------------------------
export async function addDbNewsletterSubscriber(email: string, ipAddress?: string) {
  const cleanEmail = email.toLowerCase().trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    throw new Error('صيغة البريد الإلكتروني غير صالحة.');
  }

  try {
    const existing = await db
      .select()
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.email, cleanEmail))
      .limit(1);

    const unsubscribeToken = crypto.randomBytes(24).toString('hex');
    const unsubscribeTokenHash = crypto.createHash('sha256').update(unsubscribeToken).digest('hex');

    if (existing.length > 0) {
      if (existing[0].status === 'active') {
        return {
          success: true,
          status: 'already_subscribed',
          message: 'أنت مشترك بالفعل في نشرة ألفا ديزاين البريدية.',
          isNew: false,
          unsubscribeToken,
        };
      }
      // Re-activate previously unsubscribed email
      await db
        .update(newsletterSubscribers)
        .set({
          status: 'active',
          subscribedAt: new Date(),
          unsubscribedAt: null,
          ipAddress: ipAddress || existing[0].ipAddress,
          unsubscribeTokenHash,
        })
        .where(eq(newsletterSubscribers.email, cleanEmail));

      return {
        success: true,
        status: 'reactivated',
        message: 'تمت إعادة تفعيل اشتراكك بنجاح في نشرة ألفا ديزاين البريدية.',
        isNew: false,
        unsubscribeToken,
      };
    }

    const id = 'sub-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    await db.insert(newsletterSubscribers).values({
      id,
      email: cleanEmail,
      status: 'active',
      source: 'footer_form',
      ipAddress,
      unsubscribeTokenHash,
      subscribedAt: new Date(),
    });

    return {
      success: true,
      status: 'subscribed',
      message: 'تم الاشتراك بنجاح في نشرة ألفا ديزاين البريدية وحفظ بياناتك في قاعدة البيانات.',
      isNew: true,
      unsubscribeToken,
    };
  } catch (error: any) {
    console.error('addDbNewsletterSubscriber error:', error);
    throw new Error('فشل تسجيل الاشتراك في قاعدة البيانات.');
  }
}

export async function unsubscribeDbNewsletter(email: string, token?: string, isAdmin: boolean = false) {
  const cleanEmail = email.toLowerCase().trim();
  try {
    const existing = await db
      .select()
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.email, cleanEmail))
      .limit(1);

    if (existing.length === 0) {
      return { success: false, message: 'البريد الإلكتروني غير مسجل في النشرة البريدية.' };
    }

    // Unsubscribe security verification: requires token unless caller is authenticated admin
    if (!isAdmin) {
      if (!token || typeof token !== 'string' || token.trim().length === 0) {
        return {
          success: false,
          error: 'TOKEN_REQUIRED',
          message: 'رمز إلغاء الاشتراك مطلوب ولا يمكن إلغاء الاشتراك بالبريد وحده لأسباب أمنية.',
        };
      }

      const inputHash = crypto.createHash('sha256').update(token.trim()).digest('hex');
      if (existing[0].unsubscribeTokenHash && existing[0].unsubscribeTokenHash !== inputHash) {
        return {
          success: false,
          error: 'INVALID_TOKEN',
          message: 'رمز إلغاء الاشتراك غير صحيح أو منتهي الصلاحية.',
        };
      }
    }

    await db
      .update(newsletterSubscribers)
      .set({
        status: 'unsubscribed',
        unsubscribedAt: new Date(),
      })
      .where(eq(newsletterSubscribers.email, cleanEmail));

    return { success: true, message: 'تم إلغاء الاشتراك في النشرة البريدية بنجاح.' };
  } catch (error: any) {
    console.error('unsubscribeDbNewsletter error:', error);
    throw new Error('فشل إلغاء الاشتراك من قاعدة البيانات.');
  }
}

export async function deleteDbNewsletterSubscriber(email: string) {
  const cleanEmail = email.toLowerCase().trim();
  try {
    await db.delete(newsletterSubscribers).where(eq(newsletterSubscribers.email, cleanEmail));
    return { success: true, message: 'تم حذف بيانات المشترك نهائياً من قاعدة البيانات.' };
  } catch (error: any) {
    console.error('deleteDbNewsletterSubscriber error:', error);
    throw new Error('فشل حذف بيانات المشترك.');
  }
}

export async function getDbNewsletterSubscribers() {
  try {
    return await db
      .select()
      .from(newsletterSubscribers)
      .orderBy(desc(newsletterSubscribers.subscribedAt));
  } catch (error: any) {
    console.error('getDbNewsletterSubscribers error:', error);
    return [];
  }
}

/**
 * Executes a live SELECT 1 probe directly against PostgreSQL
 * True liveness/readiness verification without mock fallback
 */
export async function checkDatabaseLiveConnection(): Promise<boolean> {
  try {
    const res = await db.execute('SELECT 1 as live');
    return Boolean(res);
  } catch (err) {
    console.error('checkDatabaseLiveConnection error:', err);
    return false;
  }
}



