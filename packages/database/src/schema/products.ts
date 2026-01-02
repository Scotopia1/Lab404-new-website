import { pgTable, uuid, varchar, text, boolean, integer, timestamp, decimal, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { categories } from './categories';

// Enums
export const productStatusEnum = pgEnum('product_status', ['draft', 'active', 'archived']);

// Products table
export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  sku: varchar('sku', { length: 100 }).notNull().unique(),
  barcode: varchar('barcode', { length: 100 }),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  description: text('description'),
  shortDescription: varchar('short_description', { length: 500 }),
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
  brand: varchar('brand', { length: 255 }),

  // Pricing - base price only, calculations done in backend
  basePrice: decimal('base_price', { precision: 10, scale: 2 }).notNull(),
  costPrice: decimal('cost_price', { precision: 10, scale: 2 }),
  compareAtPrice: decimal('compare_at_price', { precision: 10, scale: 2 }),

  // Physical attributes
  weight: decimal('weight', { precision: 10, scale: 2 }), // in grams
  dimensions: jsonb('dimensions').$type<{ width?: number; height?: number; depth?: number }>(),

  // Inventory
  stockQuantity: integer('stock_quantity').default(0).notNull(),
  lowStockThreshold: integer('low_stock_threshold').default(5).notNull(),
  trackInventory: boolean('track_inventory').default(true).notNull(),
  allowBackorder: boolean('allow_backorder').default(false).notNull(),

  // Media - stored as JSON arrays
  images: jsonb('images').default([]).$type<Array<{ url: string; alt?: string; width?: number; height?: number }>>(),
  videos: jsonb('videos').default([]).$type<Array<{ url: string; title?: string }>>(),
  thumbnailUrl: varchar('thumbnail_url', { length: 500 }),

  // Organization & categorization
  tags: jsonb('tags').default([]).$type<string[]>(),
  specifications: jsonb('specifications').default({}).$type<Record<string, string>>(),
  features: jsonb('features').default([]).$type<string[]>(),

  // SEO
  metaTitle: varchar('meta_title', { length: 255 }),
  metaDescription: varchar('meta_description', { length: 500 }),

  // Status & flags
  status: productStatusEnum('status').default('draft').notNull(),
  isFeatured: boolean('is_featured').default(false).notNull(),
  isDigital: boolean('is_digital').default(false).notNull(),
  requiresShipping: boolean('requires_shipping').default(true).notNull(),

  // Supplier information
  supplierId: varchar('supplier_id', { length: 255 }),
  supplierSku: varchar('supplier_sku', { length: 255 }),

  // Import tracking
  importedFrom: varchar('imported_from', { length: 255 }),
  externalUrl: varchar('external_url', { length: 500 }),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Product variants table
export const productVariants = pgTable('product_variants', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  sku: varchar('sku', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  options: jsonb('options').notNull().$type<Record<string, string>>(),
  basePrice: decimal('base_price', { precision: 10, scale: 2 }).notNull(),
  stockQuantity: integer('stock_quantity').default(0).notNull(),
  imageUrl: varchar('image_url', { length: 500 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  variants: many(productVariants),
}));

export const productVariantsRelations = relations(productVariants, ({ one }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
}));

// Types
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type ProductVariant = typeof productVariants.$inferSelect;
export type NewProductVariant = typeof productVariants.$inferInsert;
