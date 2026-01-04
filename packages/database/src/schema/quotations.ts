import { pgTable, uuid, varchar, text, timestamp, decimal, jsonb, pgEnum, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { customers } from './customers';
import { products, productVariants } from './products';
import { orders } from './orders';
import { pdfTemplates } from './pdfTemplates';

// Enums
export const quotationStatusEnum = pgEnum('quotation_status', ['draft', 'sent', 'accepted', 'rejected', 'expired']);

// Address type for JSON column
type AddressJson = {
  firstName: string;
  lastName: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  phone?: string;
};

// Quotations table
export const quotations = pgTable('quotations', {
  id: uuid('id').primaryKey().defaultRandom(),
  quotationNumber: varchar('quotation_number', { length: 50 }).notNull().unique(),
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),

  // Customer info (for non-registered customers)
  customerName: varchar('customer_name', { length: 255 }).notNull(),
  customerEmail: varchar('customer_email', { length: 255 }).notNull(),
  customerPhone: varchar('customer_phone', { length: 50 }),
  customerCompany: varchar('customer_company', { length: 255 }),
  customerAddress: jsonb('customer_address').$type<AddressJson>(),

  // Status
  status: quotationStatusEnum('status').default('draft').notNull(),

  // Validity
  validUntil: timestamp('valid_until'),
  validDays: integer('valid_days').default(30),

  // Pricing (calculated at generation time)
  currency: varchar('currency', { length: 3 }).default('USD').notNull(),
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
  taxRate: decimal('tax_rate', { precision: 5, scale: 4 }),
  taxAmount: decimal('tax_amount', { precision: 10, scale: 2 }),
  discountType: varchar('discount_type', { length: 20 }), // 'percentage' or 'fixed'
  discountValue: decimal('discount_value', { precision: 10, scale: 2 }),
  discountAmount: decimal('discount_amount', { precision: 10, scale: 2 }).default('0').notNull(),
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),

  // Notes
  notes: text('notes'),
  termsAndConditions: text('terms_and_conditions'),

  // PDF
  pdfUrl: varchar('pdf_url', { length: 500 }),
  pdfTemplateId: uuid('pdf_template_id').references(() => pdfTemplates.id, { onDelete: 'set null' }),

  // Converted to order
  convertedToOrderId: uuid('converted_to_order_id').references(() => orders.id, { onDelete: 'set null' }),

  // Customer acceptance link
  acceptanceToken: varchar('acceptance_token', { length: 64 }).unique(),
  tokenExpiresAt: timestamp('token_expires_at'),
  viewedAt: timestamp('viewed_at'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Quotation items table
export const quotationItems = pgTable('quotation_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  quotationId: uuid('quotation_id').references(() => quotations.id, { onDelete: 'cascade' }).notNull(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'set null' }),
  variantId: uuid('variant_id').references(() => productVariants.id, { onDelete: 'set null' }),

  // Item details (can be custom items not in catalog)
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  sku: varchar('sku', { length: 100 }),
  quantity: integer('quantity').notNull(),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const quotationsRelations = relations(quotations, ({ one, many }) => ({
  customer: one(customers, {
    fields: [quotations.customerId],
    references: [customers.id],
  }),
  convertedToOrder: one(orders, {
    fields: [quotations.convertedToOrderId],
    references: [orders.id],
  }),
  pdfTemplate: one(pdfTemplates, {
    fields: [quotations.pdfTemplateId],
    references: [pdfTemplates.id],
  }),
  items: many(quotationItems),
}));

export const quotationItemsRelations = relations(quotationItems, ({ one }) => ({
  quotation: one(quotations, {
    fields: [quotationItems.quotationId],
    references: [quotations.id],
  }),
  product: one(products, {
    fields: [quotationItems.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [quotationItems.variantId],
    references: [productVariants.id],
  }),
}));

// Quotation activities table (for timeline tracking)
export const quotationActivityTypeEnum = pgEnum('quotation_activity_type', [
  'created',
  'updated',
  'sent',
  'viewed',
  'accepted',
  'rejected',
  'expired',
  'converted',
  'duplicated',
  'pdf_generated',
  'note_added',
  'status_changed',
]);

export const quotationActorTypeEnum = pgEnum('quotation_actor_type', [
  'system',
  'admin',
  'customer',
]);

export const quotationActivities = pgTable('quotation_activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  quotationId: uuid('quotation_id').references(() => quotations.id, { onDelete: 'cascade' }).notNull(),

  // Activity type
  activityType: quotationActivityTypeEnum('activity_type').notNull(),
  description: text('description').notNull(),

  // Who performed the action
  actorType: quotationActorTypeEnum('actor_type').default('system').notNull(),
  actorId: uuid('actor_id'), // admin user id or customer id (optional)
  actorName: varchar('actor_name', { length: 255 }), // Display name

  // Additional metadata (JSON for flexibility)
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const quotationActivitiesRelations = relations(quotationActivities, ({ one }) => ({
  quotation: one(quotations, {
    fields: [quotationActivities.quotationId],
    references: [quotations.id],
  }),
}));

// Quotation templates table
interface TemplateItem {
  productId?: string;
  name: string;
  description?: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
}

export const quotationTemplates = pgTable('quotation_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),

  // Template items (stored as JSON)
  items: jsonb('items').$type<TemplateItem[]>().notNull().default([]),

  // Default pricing settings
  defaultDiscount: decimal('default_discount', { precision: 10, scale: 2 }),
  defaultDiscountType: varchar('default_discount_type', { length: 20 }),
  defaultTaxRate: decimal('default_tax_rate', { precision: 5, scale: 4 }),
  defaultValidDays: integer('default_valid_days').default(30),

  // Default terms
  defaultTerms: text('default_terms'),

  isActive: integer('is_active').default(1).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Quotation revisions table (for revision history)
interface RevisionSnapshot {
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  customerCompany?: string | null;
  status: string;
  subtotal: number;
  taxRate?: number;
  taxAmount?: number;
  discountType?: string | null;
  discountValue?: number;
  discountAmount: number;
  total: number;
  validUntil?: Date | null;
  notes?: string | null;
  termsAndConditions?: string | null;
  items: Array<{
    productId?: string | null;
    variantId?: string | null;
    name: string;
    description?: string | null;
    sku?: string | null;
    quantity: number;
    unitPrice: number;
  }>;
}

export const quotationRevisions = pgTable('quotation_revisions', {
  id: uuid('id').primaryKey().defaultRandom(),
  quotationId: uuid('quotation_id').references(() => quotations.id, { onDelete: 'cascade' }).notNull(),
  versionNumber: integer('version_number').notNull(),
  snapshot: jsonb('snapshot').$type<RevisionSnapshot>().notNull(),
  changeDescription: text('change_description'),
  createdBy: uuid('created_by'), // Admin user ID
  createdByName: varchar('created_by_name', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const quotationRevisionsRelations = relations(quotationRevisions, ({ one }) => ({
  quotation: one(quotations, {
    fields: [quotationRevisions.quotationId],
    references: [quotations.id],
  }),
}));

// Types
export type Quotation = typeof quotations.$inferSelect;
export type NewQuotation = typeof quotations.$inferInsert;
export type QuotationItem = typeof quotationItems.$inferSelect;
export type NewQuotationItem = typeof quotationItems.$inferInsert;
export type QuotationActivity = typeof quotationActivities.$inferSelect;
export type NewQuotationActivity = typeof quotationActivities.$inferInsert;
export type QuotationTemplate = typeof quotationTemplates.$inferSelect;
export type NewQuotationTemplate = typeof quotationTemplates.$inferInsert;
export type QuotationRevision = typeof quotationRevisions.$inferSelect;
export type NewQuotationRevision = typeof quotationRevisions.$inferInsert;
