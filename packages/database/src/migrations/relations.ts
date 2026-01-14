import { relations } from "drizzle-orm/relations";
import { categories, customers, addresses, orders, promoCodes, orderItems, products, productVariants, carts, cartItems, cartPromoCodes, productImportJobs, quotations, quotationItems, quotationRevisions, quotationActivities, pdfTemplates, sessions, newsletterCampaigns, passwordHistory, loginAttempts, breachChecks, newsletterSends, newsletterSubscribers } from "./schema";

export const categoriesRelations = relations(categories, ({one, many}) => ({
	category: one(categories, {
		fields: [categories.parentId],
		references: [categories.id],
		relationName: "categories_parentId_categories_id"
	}),
	categories: many(categories, {
		relationName: "categories_parentId_categories_id"
	}),
	products: many(products),
}));

export const addressesRelations = relations(addresses, ({one}) => ({
	customer: one(customers, {
		fields: [addresses.customerId],
		references: [customers.id]
	}),
}));

export const customersRelations = relations(customers, ({many}) => ({
	addresses: many(addresses),
	orders: many(orders),
	carts: many(carts),
	quotations: many(quotations),
	sessions: many(sessions),
	newsletterCampaigns: many(newsletterCampaigns),
	passwordHistories: many(passwordHistory),
	loginAttempts: many(loginAttempts),
	breachChecks: many(breachChecks),
	newsletterSubscribers: many(newsletterSubscribers),
}));

export const ordersRelations = relations(orders, ({one, many}) => ({
	customer: one(customers, {
		fields: [orders.customerId],
		references: [customers.id]
	}),
	promoCode: one(promoCodes, {
		fields: [orders.promoCodeId],
		references: [promoCodes.id]
	}),
	orderItems: many(orderItems),
	quotations: many(quotations),
}));

export const promoCodesRelations = relations(promoCodes, ({many}) => ({
	orders: many(orders),
}));

export const orderItemsRelations = relations(orderItems, ({one}) => ({
	order: one(orders, {
		fields: [orderItems.orderId],
		references: [orders.id]
	}),
	product: one(products, {
		fields: [orderItems.productId],
		references: [products.id]
	}),
	productVariant: one(productVariants, {
		fields: [orderItems.variantId],
		references: [productVariants.id]
	}),
}));

export const productsRelations = relations(products, ({one, many}) => ({
	orderItems: many(orderItems),
	category: one(categories, {
		fields: [products.categoryId],
		references: [categories.id]
	}),
	cartItems: many(cartItems),
	productVariants: many(productVariants),
	productImportJobs: many(productImportJobs),
	quotationItems: many(quotationItems),
}));

export const productVariantsRelations = relations(productVariants, ({one, many}) => ({
	orderItems: many(orderItems),
	cartItems: many(cartItems),
	product: one(products, {
		fields: [productVariants.productId],
		references: [products.id]
	}),
	quotationItems: many(quotationItems),
}));

export const cartsRelations = relations(carts, ({one, many}) => ({
	customer: one(customers, {
		fields: [carts.customerId],
		references: [customers.id]
	}),
	cartItems: many(cartItems),
	cartPromoCodes: many(cartPromoCodes),
}));

export const cartItemsRelations = relations(cartItems, ({one}) => ({
	cart: one(carts, {
		fields: [cartItems.cartId],
		references: [carts.id]
	}),
	product: one(products, {
		fields: [cartItems.productId],
		references: [products.id]
	}),
	productVariant: one(productVariants, {
		fields: [cartItems.variantId],
		references: [productVariants.id]
	}),
}));

export const cartPromoCodesRelations = relations(cartPromoCodes, ({one}) => ({
	cart: one(carts, {
		fields: [cartPromoCodes.cartId],
		references: [carts.id]
	}),
}));

export const productImportJobsRelations = relations(productImportJobs, ({one}) => ({
	product: one(products, {
		fields: [productImportJobs.importedProductId],
		references: [products.id]
	}),
}));

export const quotationItemsRelations = relations(quotationItems, ({one}) => ({
	quotation: one(quotations, {
		fields: [quotationItems.quotationId],
		references: [quotations.id]
	}),
	product: one(products, {
		fields: [quotationItems.productId],
		references: [products.id]
	}),
	productVariant: one(productVariants, {
		fields: [quotationItems.variantId],
		references: [productVariants.id]
	}),
}));

export const quotationsRelations = relations(quotations, ({one, many}) => ({
	quotationItems: many(quotationItems),
	quotationRevisions: many(quotationRevisions),
	quotationActivities: many(quotationActivities),
	customer: one(customers, {
		fields: [quotations.customerId],
		references: [customers.id]
	}),
	order: one(orders, {
		fields: [quotations.convertedToOrderId],
		references: [orders.id]
	}),
	pdfTemplate: one(pdfTemplates, {
		fields: [quotations.pdfTemplateId],
		references: [pdfTemplates.id]
	}),
}));

export const quotationRevisionsRelations = relations(quotationRevisions, ({one}) => ({
	quotation: one(quotations, {
		fields: [quotationRevisions.quotationId],
		references: [quotations.id]
	}),
}));

export const quotationActivitiesRelations = relations(quotationActivities, ({one}) => ({
	quotation: one(quotations, {
		fields: [quotationActivities.quotationId],
		references: [quotations.id]
	}),
}));

export const pdfTemplatesRelations = relations(pdfTemplates, ({many}) => ({
	quotations: many(quotations),
}));

export const sessionsRelations = relations(sessions, ({one}) => ({
	customer: one(customers, {
		fields: [sessions.customerId],
		references: [customers.id]
	}),
}));

export const newsletterCampaignsRelations = relations(newsletterCampaigns, ({one, many}) => ({
	customer: one(customers, {
		fields: [newsletterCampaigns.createdBy],
		references: [customers.id]
	}),
	newsletterSends: many(newsletterSends),
}));

export const passwordHistoryRelations = relations(passwordHistory, ({one}) => ({
	customer: one(customers, {
		fields: [passwordHistory.customerId],
		references: [customers.id]
	}),
}));

export const loginAttemptsRelations = relations(loginAttempts, ({one}) => ({
	customer: one(customers, {
		fields: [loginAttempts.customerId],
		references: [customers.id]
	}),
}));

export const breachChecksRelations = relations(breachChecks, ({one}) => ({
	customer: one(customers, {
		fields: [breachChecks.customerId],
		references: [customers.id]
	}),
}));

export const newsletterSendsRelations = relations(newsletterSends, ({one}) => ({
	newsletterCampaign: one(newsletterCampaigns, {
		fields: [newsletterSends.campaignId],
		references: [newsletterCampaigns.id]
	}),
	newsletterSubscriber: one(newsletterSubscribers, {
		fields: [newsletterSends.subscriberId],
		references: [newsletterSubscribers.id]
	}),
}));

export const newsletterSubscribersRelations = relations(newsletterSubscribers, ({one, many}) => ({
	newsletterSends: many(newsletterSends),
	customer: one(customers, {
		fields: [newsletterSubscribers.customerId],
		references: [customers.id]
	}),
}));