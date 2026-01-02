import { pgTable, uuid, varchar, text, timestamp, decimal, jsonb, pgEnum, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { customers } from './customers';
import { products } from './products';
import { orders } from './orders';

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

  // Pricing (calculated at generation time)
  currency: varchar('currency', { length: 3 }).default('USD').notNull(),
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
  taxRate: decimal('tax_rate', { precision: 5, scale: 4 }),
  taxAmount: decimal('tax_amount', { precision: 10, scale: 2 }),
  discountAmount: decimal('discount_amount', { precision: 10, scale: 2 }).default('0').notNull(),
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),

  // Notes
  notes: text('notes'),
  termsAndConditions: text('terms_and_conditions'),

  // PDF
  pdfUrl: varchar('pdf_url', { length: 500 }),

  // Converted to order
  convertedToOrderId: uuid('converted_to_order_id').references(() => orders.id, { onDelete: 'set null' }),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Quotation items table
export const quotationItems = pgTable('quotation_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  quotationId: uuid('quotation_id').references(() => quotations.id, { onDelete: 'cascade' }).notNull(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'set null' }),

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
}));

// Types
export type Quotation = typeof quotations.$inferSelect;
export type NewQuotation = typeof quotations.$inferInsert;
export type QuotationItem = typeof quotationItems.$inferSelect;
export type NewQuotationItem = typeof quotationItems.$inferInsert;
