import { pgTable, uuid, varchar, text, boolean, integer, timestamp, decimal, pgEnum } from 'drizzle-orm/pg-core';

// Enums
export const discountTypeEnum = pgEnum('discount_type', ['percentage', 'fixed_amount']);

// Promo codes table
export const promoCodes = pgTable('promo_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  description: text('description'),

  // Discount type
  discountType: discountTypeEnum('discount_type').notNull(),
  discountValue: decimal('discount_value', { precision: 10, scale: 2 }).notNull(),

  // Constraints
  minimumOrderAmount: decimal('minimum_order_amount', { precision: 10, scale: 2 }),
  maximumDiscountAmount: decimal('maximum_discount_amount', { precision: 10, scale: 2 }),
  usageLimit: integer('usage_limit'),
  usageCount: integer('usage_count').default(0).notNull(),
  usageLimitPerCustomer: integer('usage_limit_per_customer').default(1).notNull(),

  // Validity
  startsAt: timestamp('starts_at'),
  expiresAt: timestamp('expires_at'),
  isActive: boolean('is_active').default(true).notNull(),

  // Restrictions (stored as UUID arrays)
  appliesToProducts: uuid('applies_to_products').array(),
  appliesToCategories: uuid('applies_to_categories').array(),
  customerIds: uuid('customer_ids').array(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Types
export type PromoCode = typeof promoCodes.$inferSelect;
export type NewPromoCode = typeof promoCodes.$inferInsert;
