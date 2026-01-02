import { pgTable, uuid, varchar, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';

// Enums
export const blogStatusEnum = pgEnum('blog_status', ['draft', 'published', 'archived']);

// Blogs table
export const blogs = pgTable('blogs', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  content: text('content').notNull(),
  excerpt: varchar('excerpt', { length: 500 }),
  featuredImageUrl: varchar('featured_image_url', { length: 500 }),

  authorId: uuid('author_id'),
  authorName: varchar('author_name', { length: 255 }),

  status: blogStatusEnum('status').default('draft').notNull(),
  publishedAt: timestamp('published_at'),

  // SEO
  metaTitle: varchar('meta_title', { length: 255 }),
  metaDescription: varchar('meta_description', { length: 500 }),
  tags: varchar('tags', { length: 100 }).array(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Types
export type Blog = typeof blogs.$inferSelect;
export type NewBlog = typeof blogs.$inferInsert;
