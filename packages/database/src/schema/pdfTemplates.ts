import { pgTable, uuid, varchar, text, timestamp, boolean } from 'drizzle-orm/pg-core';

/**
 * PDF Templates table
 * Stores customizable templates for quotation and invoice PDFs
 */
export const pdfTemplates = pgTable('pdf_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  isDefault: boolean('is_default').default(false).notNull(),

  // Branding
  logoUrl: varchar('logo_url', { length: 500 }),
  primaryColor: varchar('primary_color', { length: 7 }).default('#1a1a2e').notNull(),
  accentColor: varchar('accent_color', { length: 7 }).default('#0066cc').notNull(),

  // Display options
  showCompanyLogo: boolean('show_company_logo').default(true).notNull(),
  showLineItemImages: boolean('show_line_item_images').default(false).notNull(),
  showLineItemDescription: boolean('show_line_item_description').default(false).notNull(),
  showSku: boolean('show_sku').default(true).notNull(),

  // Custom text
  headerText: text('header_text'),
  footerText: text('footer_text'),
  thankYouMessage: text('thank_you_message'),

  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Types
export type PdfTemplate = typeof pdfTemplates.$inferSelect;
export type NewPdfTemplate = typeof pdfTemplates.$inferInsert;
