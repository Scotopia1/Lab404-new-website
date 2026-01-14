import { pgTable, foreignKey, unique, uuid, varchar, text, boolean, integer, timestamp, jsonb, numeric, index, uniqueIndex, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const blogStatus = pgEnum("blog_status", ['draft', 'published', 'archived'])
export const discountType = pgEnum("discount_type", ['percentage', 'fixed_amount'])
export const importSource = pgEnum("import_source", ['amazon', 'aliexpress', 'ebay'])
export const importStatus = pgEnum("import_status", ['pending', 'processing', 'completed', 'failed'])
export const orderStatus = pgEnum("order_status", ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'])
export const paymentMethod = pgEnum("payment_method", ['cod', 'stripe', 'paypal', 'bank_transfer', 'cash'])
export const paymentStatus = pgEnum("payment_status", ['pending', 'paid', 'refunded', 'failed'])
export const productStatus = pgEnum("product_status", ['draft', 'active', 'archived'])
export const quotationActivityType = pgEnum("quotation_activity_type", ['created', 'updated', 'sent', 'viewed', 'accepted', 'rejected', 'expired', 'converted', 'duplicated', 'pdf_generated', 'note_added', 'status_changed'])
export const quotationActorType = pgEnum("quotation_actor_type", ['system', 'admin', 'customer'])
export const quotationStatus = pgEnum("quotation_status", ['draft', 'sent', 'accepted', 'rejected', 'expired'])
export const verificationCodeType = pgEnum("verification_code_type", ['password_reset', 'email_verification', 'account_unlock'])


export const categories = pgTable("categories", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	slug: varchar({ length: 255 }).notNull(),
	description: text(),
	imageUrl: varchar("image_url", { length: 500 }),
	parentId: uuid("parent_id"),
	isActive: boolean("is_active").default(true).notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		categoriesParentIdCategoriesIdFk: foreignKey({
			columns: [table.parentId],
			foreignColumns: [table.id],
			name: "categories_parent_id_categories_id_fk"
		}).onDelete("set null"),
		categoriesSlugUnique: unique("categories_slug_unique").on(table.slug),
	}
});

export const customers = pgTable("customers", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	authUserId: varchar("auth_user_id", { length: 255 }),
	email: varchar({ length: 255 }).notNull(),
	firstName: varchar("first_name", { length: 100 }),
	lastName: varchar("last_name", { length: 100 }),
	phone: varchar({ length: 50 }),
	defaultShippingAddress: jsonb("default_shipping_address"),
	defaultBillingAddress: jsonb("default_billing_address"),
	isGuest: boolean("is_guest").default(false).notNull(),
	acceptsMarketing: boolean("accepts_marketing").default(false).notNull(),
	notes: text(),
	tags: varchar({ length: 255 }).array(),
	orderCount: integer("order_count").default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	passwordHash: varchar("password_hash", { length: 255 }),
	emailVerified: boolean("email_verified").default(false).notNull(),
	emailVerifiedAt: timestamp("email_verified_at", { mode: 'string' }),
	role: varchar({ length: 20 }).default('customer').notNull(),
}, (table) => {
	return {
		customersAuthUserIdUnique: unique("customers_auth_user_id_unique").on(table.authUserId),
	}
});

export const addresses = pgTable("addresses", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	customerId: uuid("customer_id").notNull(),
	type: varchar({ length: 50 }).notNull(),
	firstName: varchar("first_name", { length: 100 }).notNull(),
	lastName: varchar("last_name", { length: 100 }).notNull(),
	company: varchar({ length: 255 }),
	addressLine1: varchar("address_line1", { length: 255 }).notNull(),
	addressLine2: varchar("address_line2", { length: 255 }),
	city: varchar({ length: 100 }).notNull(),
	state: varchar({ length: 100 }),
	postalCode: varchar("postal_code", { length: 20 }),
	country: varchar({ length: 100 }).notNull(),
	phone: varchar({ length: 50 }),
	isDefault: boolean("is_default").default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		addressesCustomerIdCustomersIdFk: foreignKey({
			columns: [table.customerId],
			foreignColumns: [customers.id],
			name: "addresses_customer_id_customers_id_fk"
		}).onDelete("cascade"),
	}
});

export const orders = pgTable("orders", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	orderNumber: varchar("order_number", { length: 50 }).notNull(),
	customerId: uuid("customer_id"),
	status: orderStatus().default('pending').notNull(),
	paymentStatus: paymentStatus("payment_status").default('pending').notNull(),
	shippingAddress: jsonb("shipping_address").notNull(),
	billingAddress: jsonb("billing_address").notNull(),
	currency: varchar({ length: 3 }).default('USD').notNull(),
	subtotalSnapshot: numeric("subtotal_snapshot", { precision: 10, scale:  2 }).notNull(),
	taxRateSnapshot: numeric("tax_rate_snapshot", { precision: 5, scale:  4 }).notNull(),
	taxAmountSnapshot: numeric("tax_amount_snapshot", { precision: 10, scale:  2 }).notNull(),
	shippingAmountSnapshot: numeric("shipping_amount_snapshot", { precision: 10, scale:  2 }).default('0').notNull(),
	discountAmountSnapshot: numeric("discount_amount_snapshot", { precision: 10, scale:  2 }).default('0').notNull(),
	totalSnapshot: numeric("total_snapshot", { precision: 10, scale:  2 }).notNull(),
	promoCodeId: uuid("promo_code_id"),
	promoCodeSnapshot: varchar("promo_code_snapshot", { length: 50 }),
	paymentMethod: paymentMethod("payment_method").default('cod').notNull(),
	shippingMethod: varchar("shipping_method", { length: 100 }),
	trackingNumber: varchar("tracking_number", { length: 255 }),
	shippedAt: timestamp("shipped_at", { mode: 'string' }),
	deliveredAt: timestamp("delivered_at", { mode: 'string' }),
	customerNotes: text("customer_notes"),
	adminNotes: text("admin_notes"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	confirmedAt: timestamp("confirmed_at", { mode: 'string' }),
	processingAt: timestamp("processing_at", { mode: 'string' }),
}, (table) => {
	return {
		ordersCustomerIdCustomersIdFk: foreignKey({
			columns: [table.customerId],
			foreignColumns: [customers.id],
			name: "orders_customer_id_customers_id_fk"
		}).onDelete("set null"),
		ordersPromoCodeIdPromoCodesIdFk: foreignKey({
			columns: [table.promoCodeId],
			foreignColumns: [promoCodes.id],
			name: "orders_promo_code_id_promo_codes_id_fk"
		}).onDelete("set null"),
		ordersOrderNumberUnique: unique("orders_order_number_unique").on(table.orderNumber),
	}
});

export const orderItems = pgTable("order_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	orderId: uuid("order_id").notNull(),
	productId: uuid("product_id"),
	variantId: uuid("variant_id"),
	productNameSnapshot: varchar("product_name_snapshot", { length: 255 }).notNull(),
	skuSnapshot: varchar("sku_snapshot", { length: 100 }).notNull(),
	variantOptionsSnapshot: jsonb("variant_options_snapshot"),
	quantity: integer().notNull(),
	unitPriceSnapshot: numeric("unit_price_snapshot", { precision: 10, scale:  2 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		orderItemsOrderIdOrdersIdFk: foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "order_items_order_id_orders_id_fk"
		}).onDelete("cascade"),
		orderItemsProductIdProductsIdFk: foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "order_items_product_id_products_id_fk"
		}).onDelete("set null"),
		orderItemsVariantIdProductVariantsIdFk: foreignKey({
			columns: [table.variantId],
			foreignColumns: [productVariants.id],
			name: "order_items_variant_id_product_variants_id_fk"
		}).onDelete("set null"),
	}
});

export const promoCodes = pgTable("promo_codes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	code: varchar({ length: 50 }).notNull(),
	description: text(),
	discountType: discountType("discount_type").notNull(),
	discountValue: numeric("discount_value", { precision: 10, scale:  2 }).notNull(),
	minimumOrderAmount: numeric("minimum_order_amount", { precision: 10, scale:  2 }),
	maximumDiscountAmount: numeric("maximum_discount_amount", { precision: 10, scale:  2 }),
	usageLimit: integer("usage_limit"),
	usageCount: integer("usage_count").default(0).notNull(),
	usageLimitPerCustomer: integer("usage_limit_per_customer").default(1).notNull(),
	startsAt: timestamp("starts_at", { mode: 'string' }),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	isActive: boolean("is_active").default(true).notNull(),
	appliesToProducts: uuid("applies_to_products").array(),
	appliesToCategories: uuid("applies_to_categories").array(),
	customerIds: uuid("customer_ids").array(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		promoCodesCodeUnique: unique("promo_codes_code_unique").on(table.code),
	}
});

export const products = pgTable("products", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sku: varchar({ length: 100 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	slug: varchar({ length: 255 }).notNull(),
	description: text(),
	shortDescription: varchar("short_description", { length: 500 }),
	categoryId: uuid("category_id"),
	brand: varchar({ length: 255 }),
	basePrice: numeric("base_price", { precision: 10, scale:  2 }).notNull(),
	costPrice: numeric("cost_price", { precision: 10, scale:  2 }),
	compareAtPrice: numeric("compare_at_price", { precision: 10, scale:  2 }),
	stockQuantity: integer("stock_quantity").default(0).notNull(),
	lowStockThreshold: integer("low_stock_threshold").default(5).notNull(),
	trackInventory: boolean("track_inventory").default(true).notNull(),
	allowBackorder: boolean("allow_backorder").default(false).notNull(),
	images: jsonb().default([]),
	thumbnailUrl: varchar("thumbnail_url", { length: 500 }),
	metaTitle: varchar("meta_title", { length: 255 }),
	metaDescription: varchar("meta_description", { length: 500 }),
	status: productStatus().default('draft').notNull(),
	isFeatured: boolean("is_featured").default(false).notNull(),
	importedFrom: varchar("imported_from", { length: 255 }),
	externalUrl: varchar("external_url", { length: 500 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	barcode: varchar({ length: 100 }),
	weight: numeric({ precision: 10, scale:  2 }),
	dimensions: jsonb(),
	videos: jsonb().default([]),
	tags: jsonb().default([]),
	specifications: jsonb().default({}),
	features: jsonb().default([]),
	isDigital: boolean("is_digital").default(false).notNull(),
	requiresShipping: boolean("requires_shipping").default(true).notNull(),
	supplierId: varchar("supplier_id", { length: 255 }),
	supplierSku: varchar("supplier_sku", { length: 255 }),
}, (table) => {
	return {
		productsCategoryIdCategoriesIdFk: foreignKey({
			columns: [table.categoryId],
			foreignColumns: [categories.id],
			name: "products_category_id_categories_id_fk"
		}).onDelete("set null"),
		productsSkuUnique: unique("products_sku_unique").on(table.sku),
		productsSlugUnique: unique("products_slug_unique").on(table.slug),
	}
});

export const carts = pgTable("carts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	customerId: uuid("customer_id"),
	sessionId: varchar("session_id", { length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		cartsCustomerIdCustomersIdFk: foreignKey({
			columns: [table.customerId],
			foreignColumns: [customers.id],
			name: "carts_customer_id_customers_id_fk"
		}).onDelete("cascade"),
	}
});

export const cartItems = pgTable("cart_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	cartId: uuid("cart_id").notNull(),
	productId: uuid("product_id").notNull(),
	variantId: uuid("variant_id"),
	quantity: integer().default(1).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		cartItemsCartIdCartsIdFk: foreignKey({
			columns: [table.cartId],
			foreignColumns: [carts.id],
			name: "cart_items_cart_id_carts_id_fk"
		}).onDelete("cascade"),
		cartItemsProductIdProductsIdFk: foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "cart_items_product_id_products_id_fk"
		}).onDelete("cascade"),
		cartItemsVariantIdProductVariantsIdFk: foreignKey({
			columns: [table.variantId],
			foreignColumns: [productVariants.id],
			name: "cart_items_variant_id_product_variants_id_fk"
		}).onDelete("cascade"),
	}
});

export const blogs = pgTable("blogs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: varchar({ length: 255 }).notNull(),
	slug: varchar({ length: 255 }).notNull(),
	content: text().notNull(),
	excerpt: varchar({ length: 500 }),
	featuredImageUrl: varchar("featured_image_url", { length: 500 }),
	authorId: uuid("author_id"),
	authorName: varchar("author_name", { length: 255 }),
	status: blogStatus().default('draft').notNull(),
	publishedAt: timestamp("published_at", { mode: 'string' }),
	metaTitle: varchar("meta_title", { length: 255 }),
	metaDescription: varchar("meta_description", { length: 500 }),
	tags: varchar({ length: 100 }).array(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		blogsSlugUnique: unique("blogs_slug_unique").on(table.slug),
	}
});

export const adminActivityLogs = pgTable("admin_activity_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	adminUserId: varchar("admin_user_id", { length: 255 }).notNull(),
	action: varchar({ length: 100 }).notNull(),
	entityType: varchar("entity_type", { length: 100 }).notNull(),
	entityId: uuid("entity_id"),
	details: jsonb(),
	ipAddress: varchar("ip_address", { length: 50 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const settings = pgTable("settings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	key: varchar({ length: 100 }).notNull(),
	value: jsonb().notNull(),
	description: text(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		settingsKeyUnique: unique("settings_key_unique").on(table.key),
	}
});

export const cartPromoCodes = pgTable("cart_promo_codes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	cartId: uuid("cart_id").notNull(),
	promoCodeId: uuid("promo_code_id").notNull(),
	code: varchar({ length: 50 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		cartPromoCodesCartIdCartsIdFk: foreignKey({
			columns: [table.cartId],
			foreignColumns: [carts.id],
			name: "cart_promo_codes_cart_id_carts_id_fk"
		}).onDelete("cascade"),
		cartPromoCodesCartIdUnique: unique("cart_promo_codes_cart_id_unique").on(table.cartId),
	}
});

export const productVariants = pgTable("product_variants", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	productId: uuid("product_id").notNull(),
	sku: varchar({ length: 100 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	options: jsonb().notNull(),
	basePrice: numeric("base_price", { precision: 10, scale:  2 }).notNull(),
	stockQuantity: integer("stock_quantity").default(0).notNull(),
	imageUrl: varchar("image_url", { length: 500 }),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		productVariantsProductIdProductsIdFk: foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "product_variants_product_id_products_id_fk"
		}).onDelete("cascade"),
		productVariantsSkuUnique: unique("product_variants_sku_unique").on(table.sku),
	}
});

export const productImportJobs = pgTable("product_import_jobs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	source: importSource().notNull(),
	sourceUrl: varchar("source_url", { length: 500 }).notNull(),
	status: importStatus().default('pending').notNull(),
	importedProductId: uuid("imported_product_id"),
	errorMessage: text("error_message"),
	rawData: jsonb("raw_data"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	completedAt: timestamp("completed_at", { mode: 'string' }),
}, (table) => {
	return {
		productImportJobsImportedProductIdProductsIdFk: foreignKey({
			columns: [table.importedProductId],
			foreignColumns: [products.id],
			name: "product_import_jobs_imported_product_id_products_id_fk"
		}).onDelete("set null"),
	}
});

export const quotationTemplates = pgTable("quotation_templates", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	items: jsonb().default([]).notNull(),
	defaultDiscount: numeric("default_discount", { precision: 10, scale:  2 }),
	defaultDiscountType: varchar("default_discount_type", { length: 20 }),
	defaultTaxRate: numeric("default_tax_rate", { precision: 5, scale:  4 }),
	defaultValidDays: integer("default_valid_days").default(30),
	defaultTerms: text("default_terms"),
	isActive: integer("is_active").default(1).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const quotationItems = pgTable("quotation_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	quotationId: uuid("quotation_id").notNull(),
	productId: uuid("product_id"),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	sku: varchar({ length: 100 }),
	quantity: integer().notNull(),
	unitPrice: numeric("unit_price", { precision: 10, scale:  2 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	variantId: uuid("variant_id"),
}, (table) => {
	return {
		quotationItemsQuotationIdQuotationsIdFk: foreignKey({
			columns: [table.quotationId],
			foreignColumns: [quotations.id],
			name: "quotation_items_quotation_id_quotations_id_fk"
		}).onDelete("cascade"),
		quotationItemsProductIdProductsIdFk: foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "quotation_items_product_id_products_id_fk"
		}).onDelete("set null"),
		quotationItemsVariantIdProductVariantsIdFk: foreignKey({
			columns: [table.variantId],
			foreignColumns: [productVariants.id],
			name: "quotation_items_variant_id_product_variants_id_fk"
		}).onDelete("set null"),
	}
});

export const quotationRevisions = pgTable("quotation_revisions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	quotationId: uuid("quotation_id").notNull(),
	versionNumber: integer("version_number").notNull(),
	snapshot: jsonb().notNull(),
	changeDescription: text("change_description"),
	createdBy: uuid("created_by"),
	createdByName: varchar("created_by_name", { length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		quotationRevisionsQuotationIdQuotationsIdFk: foreignKey({
			columns: [table.quotationId],
			foreignColumns: [quotations.id],
			name: "quotation_revisions_quotation_id_quotations_id_fk"
		}).onDelete("cascade"),
	}
});

export const securityAuditLogs = pgTable("security_audit_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	timestamp: timestamp({ mode: 'string' }).defaultNow().notNull(),
	eventType: varchar("event_type", { length: 100 }).notNull(),
	actorType: varchar("actor_type", { length: 20 }).notNull(),
	actorId: uuid("actor_id"),
	actorEmail: varchar("actor_email", { length: 255 }),
	targetType: varchar("target_type", { length: 50 }),
	targetId: uuid("target_id"),
	action: varchar({ length: 50 }).notNull(),
	status: varchar({ length: 20 }).notNull(),
	ipAddress: varchar("ip_address", { length: 45 }),
	userAgent: text("user_agent"),
	sessionId: uuid("session_id"),
	requestId: uuid("request_id"),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		auditLogsActorIdx: index("audit_logs_actor_idx").using("btree", table.actorId.asc().nullsLast().op("uuid_ops")),
		auditLogsEventTypeIdx: index("audit_logs_event_type_idx").using("btree", table.eventType.asc().nullsLast().op("text_ops")),
		auditLogsIpAddressIdx: index("audit_logs_ip_address_idx").using("btree", table.ipAddress.asc().nullsLast().op("text_ops")),
		auditLogsSessionIdx: index("audit_logs_session_idx").using("btree", table.sessionId.asc().nullsLast().op("uuid_ops")),
		auditLogsTimestampIdx: index("audit_logs_timestamp_idx").using("btree", table.timestamp.asc().nullsLast().op("timestamp_ops")),
	}
});

export const pdfTemplates = pgTable("pdf_templates", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	isDefault: boolean("is_default").default(false).notNull(),
	logoUrl: varchar("logo_url", { length: 500 }),
	primaryColor: varchar("primary_color", { length: 7 }).default('#1a1a2e').notNull(),
	accentColor: varchar("accent_color", { length: 7 }).default('#0066cc').notNull(),
	showCompanyLogo: boolean("show_company_logo").default(true).notNull(),
	showLineItemImages: boolean("show_line_item_images").default(false).notNull(),
	showLineItemDescription: boolean("show_line_item_description").default(false).notNull(),
	showSku: boolean("show_sku").default(true).notNull(),
	headerText: text("header_text"),
	footerText: text("footer_text"),
	thankYouMessage: text("thank_you_message"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const quotationActivities = pgTable("quotation_activities", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	quotationId: uuid("quotation_id").notNull(),
	activityType: quotationActivityType("activity_type").notNull(),
	description: text().notNull(),
	actorType: quotationActorType("actor_type").default('system').notNull(),
	actorId: uuid("actor_id"),
	actorName: varchar("actor_name", { length: 255 }),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		quotationActivitiesQuotationIdQuotationsIdFk: foreignKey({
			columns: [table.quotationId],
			foreignColumns: [quotations.id],
			name: "quotation_activities_quotation_id_quotations_id_fk"
		}).onDelete("cascade"),
	}
});

export const quotations = pgTable("quotations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	quotationNumber: varchar("quotation_number", { length: 50 }).notNull(),
	customerId: uuid("customer_id"),
	customerName: varchar("customer_name", { length: 255 }).notNull(),
	customerEmail: varchar("customer_email", { length: 255 }).notNull(),
	customerPhone: varchar("customer_phone", { length: 50 }),
	customerCompany: varchar("customer_company", { length: 255 }),
	customerAddress: jsonb("customer_address"),
	status: quotationStatus().default('draft').notNull(),
	validUntil: timestamp("valid_until", { mode: 'string' }),
	currency: varchar({ length: 3 }).default('USD').notNull(),
	subtotal: numeric({ precision: 10, scale:  2 }).notNull(),
	taxRate: numeric("tax_rate", { precision: 5, scale:  4 }),
	taxAmount: numeric("tax_amount", { precision: 10, scale:  2 }),
	discountAmount: numeric("discount_amount", { precision: 10, scale:  2 }).default('0').notNull(),
	total: numeric({ precision: 10, scale:  2 }).notNull(),
	notes: text(),
	termsAndConditions: text("terms_and_conditions"),
	pdfUrl: varchar("pdf_url", { length: 500 }),
	convertedToOrderId: uuid("converted_to_order_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	discountType: varchar("discount_type", { length: 20 }),
	discountValue: numeric("discount_value", { precision: 10, scale:  2 }),
	pdfTemplateId: uuid("pdf_template_id"),
	acceptanceToken: varchar("acceptance_token", { length: 64 }),
	tokenExpiresAt: timestamp("token_expires_at", { mode: 'string' }),
	viewedAt: timestamp("viewed_at", { mode: 'string' }),
	validDays: integer("valid_days").default(30),
}, (table) => {
	return {
		quotationsCustomerIdCustomersIdFk: foreignKey({
			columns: [table.customerId],
			foreignColumns: [customers.id],
			name: "quotations_customer_id_customers_id_fk"
		}).onDelete("set null"),
		quotationsConvertedToOrderIdOrdersIdFk: foreignKey({
			columns: [table.convertedToOrderId],
			foreignColumns: [orders.id],
			name: "quotations_converted_to_order_id_orders_id_fk"
		}).onDelete("set null"),
		quotationsPdfTemplateIdPdfTemplatesIdFk: foreignKey({
			columns: [table.pdfTemplateId],
			foreignColumns: [pdfTemplates.id],
			name: "quotations_pdf_template_id_pdf_templates_id_fk"
		}).onDelete("set null"),
		quotationsQuotationNumberUnique: unique("quotations_quotation_number_unique").on(table.quotationNumber),
		quotationsAcceptanceTokenUnique: unique("quotations_acceptance_token_unique").on(table.acceptanceToken),
	}
});

export const verificationCodes = pgTable("verification_codes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: varchar({ length: 255 }).notNull(),
	code: varchar({ length: 6 }).notNull(),
	type: verificationCodeType().notNull(),
	attempts: integer().default(0).notNull(),
	maxAttempts: integer("max_attempts").default(3).notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	isUsed: boolean("is_used").default(false).notNull(),
	usedAt: timestamp("used_at", { mode: 'string' }),
	ipAddress: varchar("ip_address", { length: 45 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		emailIdx: index("verification_codes_email_idx").using("btree", table.email.asc().nullsLast().op("text_ops")),
		expiresAtIdx: index("verification_codes_expires_at_idx").using("btree", table.expiresAt.asc().nullsLast().op("timestamp_ops")),
	}
});

export const ipReputation = pgTable("ip_reputation", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	ipAddress: varchar("ip_address", { length: 45 }).notNull(),
	reputationScore: integer("reputation_score").default(100).notNull(),
	failedLoginAttempts: integer("failed_login_attempts").default(0).notNull(),
	successfulLogins: integer("successful_logins").default(0).notNull(),
	rateLimitViolations: integer("rate_limit_violations").default(0).notNull(),
	abuseReports: integer("abuse_reports").default(0).notNull(),
	isBlocked: boolean("is_blocked").default(false).notNull(),
	blockReason: varchar("block_reason", { length: 255 }),
	blockedAt: timestamp("blocked_at", { mode: 'string' }),
	blockedUntil: timestamp("blocked_until", { mode: 'string' }),
	lastSeenAt: timestamp("last_seen_at", { mode: 'string' }).defaultNow().notNull(),
	firstSeenAt: timestamp("first_seen_at", { mode: 'string' }).defaultNow().notNull(),
	userAgent: text("user_agent"),
	country: varchar({ length: 100 }),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		ipAddressIdx: index("ip_reputation_ip_address_idx").using("btree", table.ipAddress.asc().nullsLast().op("text_ops")),
		isBlockedIdx: index("ip_reputation_is_blocked_idx").using("btree", table.isBlocked.asc().nullsLast().op("bool_ops")),
		scoreIdx: index("ip_reputation_score_idx").using("btree", table.reputationScore.asc().nullsLast().op("int4_ops")),
		ipReputationIpAddressUnique: unique("ip_reputation_ip_address_unique").on(table.ipAddress),
	}
});

export const sessions = pgTable("sessions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	customerId: uuid("customer_id").notNull(),
	tokenHash: varchar("token_hash", { length: 255 }).notNull(),
	deviceName: varchar("device_name", { length: 100 }),
	deviceType: varchar("device_type", { length: 50 }),
	deviceBrowser: varchar("device_browser", { length: 50 }),
	browserVersion: varchar("browser_version", { length: 50 }),
	osName: varchar("os_name", { length: 50 }),
	osVersion: varchar("os_version", { length: 50 }),
	ipAddress: varchar("ip_address", { length: 45 }).notNull(),
	ipCountry: varchar("ip_country", { length: 100 }),
	ipCity: varchar("ip_city", { length: 100 }),
	ipLatitude: numeric("ip_latitude", { precision: 10, scale:  8 }),
	ipLongitude: numeric("ip_longitude", { precision: 11, scale:  8 }),
	userAgent: text("user_agent").notNull(),
	loginAt: timestamp("login_at", { mode: 'string' }).defaultNow().notNull(),
	lastActivityAt: timestamp("last_activity_at", { mode: 'string' }).defaultNow().notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	revokedAt: timestamp("revoked_at", { mode: 'string' }),
	revokeReason: varchar("revoke_reason", { length: 100 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		activeIdx: index("sessions_active_idx").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
		activityIdx: index("sessions_activity_idx").using("btree", table.lastActivityAt.asc().nullsLast().op("timestamp_ops")),
		customerIdx: index("sessions_customer_idx").using("btree", table.customerId.asc().nullsLast().op("uuid_ops")),
		tokenHashIdx: index("sessions_token_hash_idx").using("btree", table.tokenHash.asc().nullsLast().op("text_ops")),
		sessionsCustomerIdCustomersIdFk: foreignKey({
			columns: [table.customerId],
			foreignColumns: [customers.id],
			name: "sessions_customer_id_customers_id_fk"
		}).onDelete("cascade"),
		sessionsTokenHashUnique: unique("sessions_token_hash_unique").on(table.tokenHash),
	}
});

export const newsletterCampaigns = pgTable("newsletter_campaigns", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	subject: varchar({ length: 255 }).notNull(),
	previewText: varchar("preview_text", { length: 255 }),
	content: text().notNull(),
	status: varchar({ length: 20 }).default('draft').notNull(),
	dailyLimit: integer("daily_limit").default(100).notNull(),
	sendTime: varchar("send_time", { length: 5 }),
	totalRecipients: integer("total_recipients").default(0).notNull(),
	sentCount: integer("sent_count").default(0).notNull(),
	failedCount: integer("failed_count").default(0).notNull(),
	openCount: integer("open_count").default(0).notNull(),
	clickCount: integer("click_count").default(0).notNull(),
	scheduledAt: timestamp("scheduled_at", { mode: 'string' }),
	startedAt: timestamp("started_at", { mode: 'string' }),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	lastSentAt: timestamp("last_sent_at", { mode: 'string' }),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		newsletterCampaignsCreatedByCustomersIdFk: foreignKey({
			columns: [table.createdBy],
			foreignColumns: [customers.id],
			name: "newsletter_campaigns_created_by_customers_id_fk"
		}).onDelete("set null"),
	}
});

export const passwordHistory = pgTable("password_history", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	customerId: uuid("customer_id").notNull(),
	passwordHash: varchar("password_hash", { length: 255 }).notNull(),
	changedAt: timestamp("changed_at", { mode: 'string' }).defaultNow().notNull(),
	ipAddress: varchar("ip_address", { length: 45 }),
	userAgent: varchar("user_agent", { length: 500 }),
	changeReason: varchar("change_reason", { length: 50 }),
}, (table) => {
	return {
		changedAtIdx: index("password_history_changed_at_idx").using("btree", table.changedAt.asc().nullsLast().op("timestamp_ops")),
		customerIdx: index("password_history_customer_idx").using("btree", table.customerId.asc().nullsLast().op("uuid_ops")),
		passwordHistoryCustomerIdCustomersIdFk: foreignKey({
			columns: [table.customerId],
			foreignColumns: [customers.id],
			name: "password_history_customer_id_customers_id_fk"
		}).onDelete("cascade"),
	}
});

export const loginAttempts = pgTable("login_attempts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	customerId: uuid("customer_id"),
	email: varchar({ length: 255 }).notNull(),
	success: boolean().notNull(),
	failureReason: varchar("failure_reason", { length: 100 }),
	ipAddress: varchar("ip_address", { length: 45 }).notNull(),
	userAgent: varchar("user_agent", { length: 500 }),
	deviceType: varchar("device_type", { length: 50 }),
	deviceBrowser: varchar("device_browser", { length: 50 }),
	ipCountry: varchar("ip_country", { length: 100 }),
	ipCity: varchar("ip_city", { length: 100 }),
	triggeredLockout: boolean("triggered_lockout").default(false).notNull(),
	consecutiveFailures: integer("consecutive_failures").default(0).notNull(),
	attemptedAt: timestamp("attempted_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		attemptedAtIdx: index("login_attempts_attempted_at_idx").using("btree", table.attemptedAt.asc().nullsLast().op("timestamp_ops")),
		customerIdx: index("login_attempts_customer_idx").using("btree", table.customerId.asc().nullsLast().op("uuid_ops")),
		emailIdx: index("login_attempts_email_idx").using("btree", table.email.asc().nullsLast().op("text_ops")),
		successIdx: index("login_attempts_success_idx").using("btree", table.success.asc().nullsLast().op("bool_ops")),
		loginAttemptsCustomerIdCustomersIdFk: foreignKey({
			columns: [table.customerId],
			foreignColumns: [customers.id],
			name: "login_attempts_customer_id_customers_id_fk"
		}).onDelete("cascade"),
	}
});

export const breachChecks = pgTable("breach_checks", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	customerId: uuid("customer_id"),
	passwordHashPrefix: varchar("password_hash_prefix", { length: 5 }).notNull(),
	isBreached: boolean("is_breached").notNull(),
	breachCount: integer("breach_count").default(0).notNull(),
	checkedAt: timestamp("checked_at", { mode: 'string' }).defaultNow().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	checkReason: varchar("check_reason", { length: 50 }),
	ipAddress: varchar("ip_address", { length: 45 }),
}, (table) => {
	return {
		customerIdx: index("breach_checks_customer_idx").using("btree", table.customerId.asc().nullsLast().op("uuid_ops")),
		expiresAtIdx: index("breach_checks_expires_at_idx").using("btree", table.expiresAt.asc().nullsLast().op("timestamp_ops")),
		prefixIdx: index("breach_checks_prefix_idx").using("btree", table.passwordHashPrefix.asc().nullsLast().op("text_ops")),
		breachChecksCustomerIdCustomersIdFk: foreignKey({
			columns: [table.customerId],
			foreignColumns: [customers.id],
			name: "breach_checks_customer_id_customers_id_fk"
		}).onDelete("cascade"),
	}
});

export const newsletterSends = pgTable("newsletter_sends", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	campaignId: uuid("campaign_id").notNull(),
	subscriberId: uuid("subscriber_id").notNull(),
	email: varchar({ length: 255 }).notNull(),
	status: varchar({ length: 20 }).default('pending').notNull(),
	errorMessage: text("error_message"),
	retryCount: integer("retry_count").default(0).notNull(),
	openedAt: timestamp("opened_at", { mode: 'string' }),
	clickedAt: timestamp("clicked_at", { mode: 'string' }),
	scheduledFor: timestamp("scheduled_for", { mode: 'string' }),
	sentAt: timestamp("sent_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		newsletterSendsCampaignIdNewsletterCampaignsIdFk: foreignKey({
			columns: [table.campaignId],
			foreignColumns: [newsletterCampaigns.id],
			name: "newsletter_sends_campaign_id_newsletter_campaigns_id_fk"
		}).onDelete("cascade"),
		newsletterSendsSubscriberIdNewsletterSubscribersIdFk: foreignKey({
			columns: [table.subscriberId],
			foreignColumns: [newsletterSubscribers.id],
			name: "newsletter_sends_subscriber_id_newsletter_subscribers_id_fk"
		}).onDelete("cascade"),
	}
});

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: varchar({ length: 255 }).notNull(),
	name: varchar({ length: 100 }),
	customerId: uuid("customer_id"),
	status: varchar({ length: 20 }).default('active').notNull(),
	source: varchar({ length: 50 }).default('footer').notNull(),
	unsubscribeToken: varchar("unsubscribe_token", { length: 64 }).notNull(),
	subscribedAt: timestamp("subscribed_at", { mode: 'string' }).defaultNow().notNull(),
	unsubscribedAt: timestamp("unsubscribed_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		emailIdx: uniqueIndex("newsletter_subscribers_email_idx").using("btree", table.email.asc().nullsLast().op("text_ops")),
		newsletterSubscribersCustomerIdCustomersIdFk: foreignKey({
			columns: [table.customerId],
			foreignColumns: [customers.id],
			name: "newsletter_subscribers_customer_id_customers_id_fk"
		}).onDelete("set null"),
	}
});
