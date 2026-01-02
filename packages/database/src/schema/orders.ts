import { pgTable, uuid, varchar, text, integer, timestamp, decimal, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { customers } from './customers';
import { products, productVariants } from './products';
import { promoCodes } from './promoCodes';

// Enums
export const orderStatusEnum = pgEnum('order_status', ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'paid', 'refunded', 'failed']);
export const paymentMethodEnum = pgEnum('payment_method', ['cod', 'stripe', 'paypal']);

// Address type for JSON columns
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

// Orders table
export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderNumber: varchar('order_number', { length: 50 }).notNull().unique(),
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),

  // Status tracking
  status: orderStatusEnum('status').default('pending').notNull(),
  paymentStatus: paymentStatusEnum('payment_status').default('pending').notNull(),

  // Addresses (snapshot at time of order)
  shippingAddress: jsonb('shipping_address').notNull().$type<AddressJson>(),
  billingAddress: jsonb('billing_address').notNull().$type<AddressJson>(),

  // Pricing stored as snapshot (calculated at checkout time)
  // CRITICAL: These are snapshots, not live calculated values
  currency: varchar('currency', { length: 3 }).default('USD').notNull(),
  subtotalSnapshot: decimal('subtotal_snapshot', { precision: 10, scale: 2 }).notNull(),
  taxRateSnapshot: decimal('tax_rate_snapshot', { precision: 5, scale: 4 }).notNull(),
  taxAmountSnapshot: decimal('tax_amount_snapshot', { precision: 10, scale: 2 }).notNull(),
  shippingAmountSnapshot: decimal('shipping_amount_snapshot', { precision: 10, scale: 2 }).default('0').notNull(),
  discountAmountSnapshot: decimal('discount_amount_snapshot', { precision: 10, scale: 2 }).default('0').notNull(),
  totalSnapshot: decimal('total_snapshot', { precision: 10, scale: 2 }).notNull(),

  // Promo code used
  promoCodeId: uuid('promo_code_id').references(() => promoCodes.id, { onDelete: 'set null' }),
  promoCodeSnapshot: varchar('promo_code_snapshot', { length: 50 }),

  // Payment
  paymentMethod: paymentMethodEnum('payment_method').default('cod').notNull(),

  // Shipping
  shippingMethod: varchar('shipping_method', { length: 100 }),
  trackingNumber: varchar('tracking_number', { length: 255 }),
  shippedAt: timestamp('shipped_at'),
  deliveredAt: timestamp('delivered_at'),

  // Notes
  customerNotes: text('customer_notes'),
  adminNotes: text('admin_notes'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Order items table
export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'set null' }),
  variantId: uuid('variant_id').references(() => productVariants.id, { onDelete: 'set null' }),

  // Snapshot data (in case product changes later)
  productNameSnapshot: varchar('product_name_snapshot', { length: 255 }).notNull(),
  skuSnapshot: varchar('sku_snapshot', { length: 100 }).notNull(),
  variantOptionsSnapshot: jsonb('variant_options_snapshot').$type<Record<string, string>>(),

  quantity: integer('quantity').notNull(),
  unitPriceSnapshot: decimal('unit_price_snapshot', { precision: 10, scale: 2 }).notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  promoCode: one(promoCodes, {
    fields: [orders.promoCodeId],
    references: [promoCodes.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [orderItems.variantId],
    references: [productVariants.id],
  }),
}));

// Types
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
