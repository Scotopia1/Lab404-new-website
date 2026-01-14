import { Router } from 'express';
import { z } from 'zod';
import { getDb, blogs, eq, sql, desc, and, or, like, gte, lte } from '@lab404/database';
import { validateBody, validateQuery } from '../middleware/validator';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { sendSuccess, sendCreated, sendNoContent, createPaginationMeta, parsePaginationParams } from '../utils/response';
import { NotFoundError, ConflictError } from '../utils/errors';
import { generateSlug } from '../utils/helpers';
import { sanitizeRichContent } from '../middleware/xss';

export const blogsRoutes = Router();

// ===========================================
// Validation Schemas
// ===========================================

const createBlogSchema = z.object({
  title: z.string().min(1).max(255),
  slug: z.string().max(255).optional(),
  excerpt: z.string().max(500).optional(),
  content: z.string().min(1),
  featuredImageUrl: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['draft', 'published']).optional().default('draft'),
  publishedAt: z.string().datetime().optional(),
  metaTitle: z.string().max(100).optional(),
  metaDescription: z.string().max(200).optional(),
});

const updateBlogSchema = createBlogSchema.partial();

const blogFiltersSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  status: z.enum(['draft', 'published']).optional(),
  tag: z.string().optional(),
});

// ===========================================
// Public Routes
// ===========================================

/**
 * GET /api/blogs
 * List published blog posts (Public)
 */
blogsRoutes.get('/', validateQuery(blogFiltersSchema), async (req, res, next) => {
  try {
    const db = getDb();
    const { page, limit, offset } = parsePaginationParams(req.query as Record<string, string>);
    const { search, tag } = req.query;
    const isAdmin = req.user?.role === 'admin';

    const conditions = [];

    // Non-admins only see published posts
    if (!isAdmin) {
      conditions.push(eq(blogs.status, 'published'));
      conditions.push(lte(blogs.publishedAt, new Date()));
    }

    if (search) {
      conditions.push(
        or(
          like(blogs.title, `%${search}%`),
          like(blogs.excerpt, `%${search}%`)
        )
      );
    }

    if (tag) {
      conditions.push(sql`${tag} = ANY(${blogs.tags})`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(blogs)
      .where(whereClause);
    const count = countResult[0]?.count ?? 0;

    const blogList = await db
      .select({
        id: blogs.id,
        title: blogs.title,
        slug: blogs.slug,
        excerpt: blogs.excerpt,
        featuredImageUrl: blogs.featuredImageUrl,
        tags: blogs.tags,
        status: blogs.status,
        publishedAt: blogs.publishedAt,
        createdAt: blogs.createdAt,
      })
      .from(blogs)
      .where(whereClause)
      .orderBy(desc(blogs.publishedAt))
      .limit(limit)
      .offset(offset);

    sendSuccess(res, blogList, 200, createPaginationMeta(page, limit, Number(count)));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/blogs/tags
 * Get all unique tags (Public)
 */
blogsRoutes.get('/tags', async (_req, res, next) => {
  try {
    const db = getDb();

    // Get all unique tags from published posts
    const result = await db
      .select({ tags: blogs.tags })
      .from(blogs)
      .where(eq(blogs.status, 'published'));

    // Flatten and get unique tags
    const allTags = result
      .flatMap(r => r.tags || [])
      .filter((tag, index, self) => self.indexOf(tag) === index)
      .sort();

    sendSuccess(res, allTags);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/blogs/:slug
 * Get blog post by slug (Public)
 */
blogsRoutes.get('/:slug', async (req, res, next) => {
  try {
    const db = getDb();
    const { slug } = req.params;
    const isAdmin = req.user?.role === 'admin';

    const [blog] = await db
      .select()
      .from(blogs)
      .where(eq(blogs.slug, slug));

    if (!blog) {
      throw new NotFoundError('Blog post not found');
    }

    // Non-admins can only view published posts
    if (!isAdmin && blog.status !== 'published') {
      throw new NotFoundError('Blog post not found');
    }

    // Note: viewCount tracking removed - not in current schema

    sendSuccess(res, blog);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/blogs/:slug/related
 * Get related blog posts (Public)
 */
blogsRoutes.get('/:slug/related', async (req, res, next) => {
  try {
    const db = getDb();
    const { slug } = req.params;
    const limitParam = parseInt(req.query['limit'] as string) || 3;

    // Get current blog
    const [currentBlog] = await db
      .select({ id: blogs.id, tags: blogs.tags })
      .from(blogs)
      .where(eq(blogs.slug, slug));

    if (!currentBlog) {
      throw new NotFoundError('Blog post not found');
    }

    // Find related posts by tags
    let relatedPosts: Array<{
      id: string;
      title: string;
      slug: string;
      excerpt: string | null;
      featuredImageUrl: string | null;
      publishedAt: Date | null;
    }> = [];

    if (currentBlog.tags && currentBlog.tags.length > 0) {
      // Get posts with matching tags
      relatedPosts = await db
        .select({
          id: blogs.id,
          title: blogs.title,
          slug: blogs.slug,
          excerpt: blogs.excerpt,
          featuredImageUrl: blogs.featuredImageUrl,
          publishedAt: blogs.publishedAt,
        })
        .from(blogs)
        .where(
          and(
            eq(blogs.status, 'published'),
            sql`${blogs.id} != ${currentBlog.id}`,
            sql`${blogs.tags} && ${currentBlog.tags}` // Array overlap
          )
        )
        .orderBy(desc(blogs.publishedAt))
        .limit(limitParam);
    }

    // If not enough related posts, get recent posts
    if (relatedPosts.length < limitParam) {
      const existing = relatedPosts.map(p => p.id);
      const needed = limitParam - relatedPosts.length;

      const recentPosts = await db
        .select({
          id: blogs.id,
          title: blogs.title,
          slug: blogs.slug,
          excerpt: blogs.excerpt,
          featuredImageUrl: blogs.featuredImageUrl,
          publishedAt: blogs.publishedAt,
        })
        .from(blogs)
        .where(
          and(
            eq(blogs.status, 'published'),
            sql`${blogs.id} != ${currentBlog.id}`,
            existing.length > 0 ? sql`${blogs.id} != ALL(${existing})` : sql`true`
          )
        )
        .orderBy(desc(blogs.publishedAt))
        .limit(needed);

      relatedPosts = [...relatedPosts, ...recentPosts];
    }

    sendSuccess(res, relatedPosts);
  } catch (error) {
    next(error);
  }
});

// ===========================================
// Admin Routes
// ===========================================

/**
 * GET /api/blogs/admin/all
 * List all blog posts including drafts (Admin only)
 */
blogsRoutes.get(
  '/admin/all',
  requireAuth,
  requireAdmin,
  validateQuery(blogFiltersSchema),
  async (req, res, next) => {
    try {
      const db = getDb();
      const { page, limit, offset } = parsePaginationParams(req.query as Record<string, string>);
      const { search, status, tag } = req.query;

      const conditions = [];

      if (search) {
        conditions.push(
          or(
            like(blogs.title, `%${search}%`),
            like(blogs.excerpt, `%${search}%`)
          )
        );
      }

      if (status) {
        conditions.push(eq(blogs.status, status as 'draft' | 'published' | 'archived'));
      }

      if (tag) {
        conditions.push(sql`${tag} = ANY(${blogs.tags})`);
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(blogs)
        .where(whereClause);
      const count = countResult[0]?.count ?? 0;

      const blogList = await db
        .select()
        .from(blogs)
        .where(whereClause)
        .orderBy(desc(blogs.createdAt))
        .limit(limit)
        .offset(offset);

      sendSuccess(res, blogList, 200, createPaginationMeta(page, limit, Number(count)));
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/blogs/admin/:id
 * Get blog post by ID (Admin only)
 */
blogsRoutes.get(
  '/admin/:id',
  requireAuth,
  requireAdmin,
  async (req, res, next) => {
    try {
      const db = getDb();
      const id = req.params['id'] as string;

      const [blog] = await db
        .select()
        .from(blogs)
        .where(eq(blogs.id, id));

      if (!blog) {
        throw new NotFoundError('Blog post not found');
      }

      sendSuccess(res, blog);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/blogs
 * Create a new blog post (Admin only)
 */
blogsRoutes.post(
  '/',
  requireAuth,
  requireAdmin,
  validateBody(createBlogSchema),
  async (req, res, next) => {
    try {
      const db = getDb();
      const data = req.body;

      // Generate slug if not provided
      let slug = data.slug || generateSlug(data.title);

      // Check if slug exists
      const [existingSlug] = await db
        .select({ id: blogs.id })
        .from(blogs)
        .where(eq(blogs.slug, slug));

      if (existingSlug) {
        slug = `${slug}-${Date.now()}`;
      }

      // Set publishedAt if publishing
      let publishedAt = data.publishedAt ? new Date(data.publishedAt) : undefined;
      if (data.status === 'published' && !publishedAt) {
        publishedAt = new Date();
      }

      // Generate excerpt if not provided
      let excerpt = data.excerpt;
      if (!excerpt && data.content) {
        // Strip HTML and truncate
        const plainText = data.content.replace(/<[^>]*>/g, '');
        excerpt = plainText.substring(0, 200) + (plainText.length > 200 ? '...' : '');
      }

      // Sanitize rich content (allow safe HTML for blog content)
      const sanitizedContent = sanitizeRichContent(data.content);

      // Only set authorId if it's a valid UUID
      const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.user?.id || '');

      const [blog] = await db
        .insert(blogs)
        .values({
          title: data.title,
          slug,
          excerpt,
          content: sanitizedContent,
          featuredImageUrl: data.featuredImageUrl,
          tags: data.tags || [],
          status: data.status || 'draft',
          publishedAt,
          metaTitle: data.metaTitle || data.title,
          metaDescription: data.metaDescription || excerpt,
          authorId: isValidUuid ? req.user?.id : undefined,
          authorName: req.user?.email?.split('@')[0] || 'Admin',
        })
        .returning();

      sendCreated(res, blog);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/blogs/:id
 * Update a blog post (Admin only)
 */
blogsRoutes.put(
  '/:id',
  requireAuth,
  requireAdmin,
  validateBody(updateBlogSchema),
  async (req, res, next) => {
    try {
      const db = getDb();
      const id = req.params['id'] as string;
      const data = req.body;

      const [existing] = await db
        .select()
        .from(blogs)
        .where(eq(blogs.id, id));

      if (!existing) {
        throw new NotFoundError('Blog post not found');
      }

      // Sanitize content if provided (allow safe HTML for blog content)
      const updateData: Record<string, unknown> = {
        ...data,
        updatedAt: new Date(),
      };

      if (data['content']) {
        updateData['content'] = sanitizeRichContent(data['content']);
      }

      // Handle slug update
      if (data.slug && data.slug !== existing.slug) {
        const [existingSlug] = await db
          .select({ id: blogs.id })
          .from(blogs)
          .where(and(eq(blogs.slug, data.slug), sql`${blogs.id} != ${id}`));

        if (existingSlug) {
          throw new ConflictError('Slug already exists');
        }
      }

      // Handle publishedAt
      if (data['publishedAt']) {
        updateData['publishedAt'] = new Date(data['publishedAt']);
      } else if (data.status === 'published' && !existing.publishedAt) {
        updateData['publishedAt'] = new Date();
      }

      const [blog] = await db
        .update(blogs)
        .set(updateData)
        .where(eq(blogs.id, id))
        .returning();

      sendSuccess(res, blog);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/blogs/:id
 * Delete a blog post (Admin only)
 */
blogsRoutes.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const db = getDb();
    const id = req.params['id'] as string;

    const [existing] = await db
      .select({ id: blogs.id })
      .from(blogs)
      .where(eq(blogs.id, id));

    if (!existing) {
      throw new NotFoundError('Blog post not found');
    }

    await db.delete(blogs).where(eq(blogs.id, id));

    sendNoContent(res);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/blogs/:id/publish
 * Publish a blog post (Admin only)
 */
blogsRoutes.post('/:id/publish', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const db = getDb();
    const id = req.params['id'] as string;

    const [existing] = await db
      .select()
      .from(blogs)
      .where(eq(blogs.id, id));

    if (!existing) {
      throw new NotFoundError('Blog post not found');
    }

    const [blog] = await db
      .update(blogs)
      .set({
        status: 'published',
        publishedAt: existing.publishedAt || new Date(),
        updatedAt: new Date(),
      })
      .where(eq(blogs.id, id))
      .returning();

    sendSuccess(res, blog);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/blogs/:id/unpublish
 * Unpublish a blog post (Admin only)
 */
blogsRoutes.post('/:id/unpublish', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const db = getDb();
    const id = req.params['id'] as string;

    const [existing] = await db
      .select({ id: blogs.id })
      .from(blogs)
      .where(eq(blogs.id, id));

    if (!existing) {
      throw new NotFoundError('Blog post not found');
    }

    const [blog] = await db
      .update(blogs)
      .set({
        status: 'draft',
        updatedAt: new Date(),
      })
      .where(eq(blogs.id, id))
      .returning();

    sendSuccess(res, blog);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/blogs/:id/duplicate
 * Duplicate a blog post (Admin only)
 */
blogsRoutes.post('/:id/duplicate', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const db = getDb();
    const id = req.params['id'] as string;

    const [original] = await db
      .select()
      .from(blogs)
      .where(eq(blogs.id, id));

    if (!original) {
      throw new NotFoundError('Blog post not found');
    }

    // Generate new slug
    const slug = `${original.slug}-copy-${Date.now()}`;

    const [blog] = await db
      .insert(blogs)
      .values({
        title: `${original.title} (Copy)`,
        slug,
        excerpt: original.excerpt,
        content: original.content,
        featuredImageUrl: original.featuredImageUrl,
        tags: original.tags,
        status: 'draft',
        metaTitle: original.metaTitle,
        metaDescription: original.metaDescription,
        authorId: req.user?.id,
      })
      .returning();

    sendCreated(res, blog);
  } catch (error) {
    next(error);
  }
});
