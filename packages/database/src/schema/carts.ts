import { pgTable, uuid, varchar, integer, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { customers } from './customers';
import { products, productVariants } from './products';

// Carts table
export const carts = pgTable('carts', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'cascade' }),
  sessionId: varchar('session_id', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Cart items table
export const cartItems = pgTable('cart_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  cartId: uuid('cart_id').references(() => carts.id, { onDelete: 'cascade' }).notNull(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  variantId: uuid('variant_id').references(() => productVariants.id, { onDelete: 'cascade' }),
  quantity: integer('quantity').notNull().default(1),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Cart promo codes table (for applied promo codes)
export const cartPromoCodes = pgTable('cart_promo_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  cartId: uuid('cart_id').references(() => carts.id, { onDelete: 'cascade' }).notNull().unique(),
  promoCodeId: uuid('promo_code_id').notNull(),
  code: varchar('code', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const cartsRelations = relations(carts, ({ one, many }) => ({
  customer: one(customers, {
    fields: [carts.customerId],
    references: [customers.id],
  }),
  items: many(cartItems),
  promoCode: one(cartPromoCodes),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, {
    fields: [cartItems.cartId],
    references: [carts.id],
  }),
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [cartItems.variantId],
    references: [productVariants.id],
  }),
}));

export const cartPromoCodesRelations = relations(cartPromoCodes, ({ one }) => ({
  cart: one(carts, {
    fields: [cartPromoCodes.cartId],
    references: [carts.id],
  }),
}));

// Types
export type Cart = typeof carts.$inferSelect;
export type NewCart = typeof carts.$inferInsert;
export type CartItem = typeof cartItems.$inferSelect;
export type NewCartItem = typeof cartItems.$inferInsert;
export type CartPromoCode = typeof cartPromoCodes.$inferSelect;
export type NewCartPromoCode = typeof cartPromoCodes.$inferInsert;
