import { pgTable, uuid, varchar, text, timestamp, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { products } from './products';

// Enums
export const importSourceEnum = pgEnum('import_source', ['amazon', 'aliexpress', 'ebay']);
export const importStatusEnum = pgEnum('import_status', ['pending', 'processing', 'completed', 'failed']);

// Product import jobs table
export const productImportJobs = pgTable('product_import_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  source: importSourceEnum('source').notNull(),
  sourceUrl: varchar('source_url', { length: 500 }).notNull(),
  status: importStatusEnum('status').default('pending').notNull(),
  importedProductId: uuid('imported_product_id').references(() => products.id, { onDelete: 'set null' }),
  errorMessage: text('error_message'),
  rawData: jsonb('raw_data'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});

// Relations
export const productImportJobsRelations = relations(productImportJobs, ({ one }) => ({
  importedProduct: one(products, {
    fields: [productImportJobs.importedProductId],
    references: [products.id],
  }),
}));

// Types
export type ProductImportJob = typeof productImportJobs.$inferSelect;
export type NewProductImportJob = typeof productImportJobs.$inferInsert;
