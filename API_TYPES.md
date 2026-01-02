# Lab404Electronics - API Types & Interfaces

## Overview

This document defines all TypeScript interfaces used across the API. These types will be exported from the `@lab404/shared-types` package for use in both frontend and backend.

---

## Base Types

### API Response Wrapper

```typescript
// Base API response types
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: PaginationMeta;
}

interface ApiError {
  code: string;
  message: string;
  details?: FieldError[];
}

interface FieldError {
  field: string;
  message: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Success response helper
type SuccessResponse<T> = {
  success: true;
  data: T;
  meta?: PaginationMeta;
};

// Error response helper
type ErrorResponse = {
  success: false;
  error: ApiError;
};
```

### Common Types

```typescript
// UUID type alias
type UUID = string;

// ISO date string
type ISODateString = string;

// Currency code
type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'AED' | string;

// Decimal number (for prices)
type Decimal = number;

// Image object
interface ImageObject {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
}

// Address
interface Address {
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
}
```

---

## Product Types

```typescript
// Product status enum
type ProductStatus = 'draft' | 'active' | 'archived';

// Base product interface
interface Product {
  id: UUID;
  sku: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  categoryId?: UUID;
  category?: Category;
  brand?: string;

  // Pricing
  basePrice: Decimal;
  costPrice?: Decimal;
  compareAtPrice?: Decimal;

  // Inventory
  stockQuantity: number;
  lowStockThreshold: number;
  trackInventory: boolean;
  allowBackorder: boolean;
  inStock: boolean; // Computed field

  // Media
  images: ImageObject[];
  thumbnailUrl?: string;

  // SEO
  metaTitle?: string;
  metaDescription?: string;

  // Status
  status: ProductStatus;
  isFeatured: boolean;

  // Import tracking
  importedFrom?: string;
  externalUrl?: string;

  // Timestamps
  createdAt: ISODateString;
  updatedAt: ISODateString;

  // Relations
  variants?: ProductVariant[];
}

// Product variant
interface ProductVariant {
  id: UUID;
  productId: UUID;
  sku: string;
  name: string;
  options: Record<string, string>; // e.g., { color: "Red", size: "Large" }
  basePrice: Decimal;
  stockQuantity: number;
  imageUrl?: string;
  isActive: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// Product list item (lighter version for lists)
interface ProductListItem {
  id: UUID;
  sku: string;
  name: string;
  slug: string;
  thumbnailUrl?: string;
  basePrice: Decimal;
  compareAtPrice?: Decimal;
  stockQuantity: number;
  inStock: boolean;
  status: ProductStatus;
  isFeatured: boolean;
  category?: {
    id: UUID;
    name: string;
    slug: string;
  };
}

// Product creation input
interface CreateProductInput {
  sku: string;
  name: string;
  slug?: string; // Auto-generated if not provided
  description?: string;
  shortDescription?: string;
  categoryId?: UUID;
  brand?: string;
  basePrice: Decimal;
  costPrice?: Decimal;
  compareAtPrice?: Decimal;
  stockQuantity?: number;
  lowStockThreshold?: number;
  trackInventory?: boolean;
  allowBackorder?: boolean;
  images?: ImageObject[];
  thumbnailUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
  status?: ProductStatus;
  isFeatured?: boolean;
}

// Product update input
interface UpdateProductInput extends Partial<CreateProductInput> {
  id: UUID;
}

// Product filter options
interface ProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: UUID;
  categorySlug?: string;
  status?: ProductStatus;
  isFeatured?: boolean;
  minPrice?: Decimal;
  maxPrice?: Decimal;
  inStock?: boolean;
  sortBy?: 'name' | 'price' | 'createdAt' | 'stockQuantity';
  sortOrder?: 'asc' | 'desc';
}
```

---

## Category Types

```typescript
interface Category {
  id: UUID;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentId?: UUID;
  parent?: Category;
  children?: Category[];
  isActive: boolean;
  sortOrder: number;
  productCount?: number; // Computed
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

interface CreateCategoryInput {
  name: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  parentId?: UUID;
  isActive?: boolean;
  sortOrder?: number;
}

interface UpdateCategoryInput extends Partial<CreateCategoryInput> {
  id: UUID;
}
```

---

## Cart Types

```typescript
// Cart item
interface CartItem {
  id: UUID;
  productId: UUID;
  variantId?: UUID;
  product: {
    id: UUID;
    name: string;
    slug: string;
    sku: string;
    thumbnailUrl?: string;
    basePrice: Decimal;
    stockQuantity: number;
    inStock: boolean;
  };
  variant?: {
    id: UUID;
    name: string;
    sku: string;
    options: Record<string, string>;
    basePrice: Decimal;
  };
  quantity: number;
  unitPrice: Decimal; // Current price from backend
  lineTotal: Decimal; // quantity * unitPrice (calculated by backend)
}

// Full cart object
interface Cart {
  id: UUID;
  customerId?: UUID;
  sessionId?: string;
  items: CartItem[];
  itemCount: number;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// Cart calculation response (CRITICAL - from backend only)
interface CartCalculation {
  items: CartItem[];
  itemCount: number;
  subtotal: Decimal;          // Sum of line totals
  taxRate: Decimal;           // e.g., 0.11 for 11%
  taxAmount: Decimal;         // subtotal * taxRate
  shippingAmount: Decimal;    // Shipping cost
  discountAmount: Decimal;    // Promo code discount
  promoCode?: string;         // Applied promo code
  promoCodeId?: UUID;
  total: Decimal;             // Final total
  currency: CurrencyCode;
}

// Add to cart input
interface AddToCartInput {
  productId: UUID;
  variantId?: UUID;
  quantity: number;
}

// Update cart item input
interface UpdateCartItemInput {
  quantity: number;
}

// Apply promo code input
interface ApplyPromoCodeInput {
  code: string;
}
```

---

## Order Types

```typescript
// Order status enum
type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

// Payment status enum
type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed';

// Payment method
type PaymentMethod = 'cod' | 'stripe' | 'paypal';

// Order item
interface OrderItem {
  id: UUID;
  orderId: UUID;
  productId: UUID;
  variantId?: UUID;

  // Snapshot data (preserved from order time)
  productNameSnapshot: string;
  skuSnapshot: string;
  variantOptionsSnapshot?: Record<string, string>;

  quantity: number;
  unitPriceSnapshot: Decimal;
  lineTotalSnapshot: Decimal; // Computed: quantity * unitPriceSnapshot

  createdAt: ISODateString;
}

// Full order
interface Order {
  id: UUID;
  orderNumber: string; // LAB-2025-0001
  customerId?: UUID;
  customer?: Customer;

  // Status
  status: OrderStatus;
  paymentStatus: PaymentStatus;

  // Addresses (snapshots)
  shippingAddress: Address;
  billingAddress: Address;

  // Pricing (snapshots - calculated at checkout time)
  currency: CurrencyCode;
  subtotalSnapshot: Decimal;
  taxRateSnapshot: Decimal;
  taxAmountSnapshot: Decimal;
  shippingAmountSnapshot: Decimal;
  discountAmountSnapshot: Decimal;
  totalSnapshot: Decimal;

  // Promo code
  promoCodeId?: UUID;
  promoCodeSnapshot?: string;

  // Payment
  paymentMethod: PaymentMethod;

  // Shipping
  shippingMethod?: string;
  trackingNumber?: string;
  shippedAt?: ISODateString;
  deliveredAt?: ISODateString;

  // Notes
  customerNotes?: string;
  adminNotes?: string;

  // Items
  items: OrderItem[];

  // Timestamps
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// Order list item
interface OrderListItem {
  id: UUID;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalSnapshot: Decimal;
  itemCount: number;
  createdAt: ISODateString;
}

// Create order input (checkout)
interface CreateOrderInput {
  shippingAddress: Address;
  billingAddress?: Address;
  sameAsShipping?: boolean;
  customerEmail: string;
  customerNotes?: string;
  paymentMethod: PaymentMethod;
}

// Update order input (admin)
interface UpdateOrderInput {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  trackingNumber?: string;
  adminNotes?: string;
}

// Order filters
interface OrderFilters {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  customerId?: UUID;
  search?: string;
  startDate?: ISODateString;
  endDate?: ISODateString;
  sortBy?: 'createdAt' | 'totalSnapshot' | 'orderNumber';
  sortOrder?: 'asc' | 'desc';
}

// Order tracking response (public)
interface OrderTrackingResponse {
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingMethod?: string;
  trackingNumber?: string;
  estimatedDelivery?: ISODateString;
  timeline: OrderTimelineEvent[];
}

interface OrderTimelineEvent {
  status: OrderStatus;
  timestamp: ISODateString;
  description: string;
}
```

---

## Customer Types

```typescript
interface Customer {
  id: UUID;
  authUserId?: string; // Neon Auth user ID
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string; // Computed
  phone?: string;

  // Addresses
  defaultShippingAddress?: Address;
  defaultBillingAddress?: Address;
  addresses?: SavedAddress[];

  // Customer data
  isGuest: boolean;
  acceptsMarketing: boolean;
  notes?: string;
  tags?: string[];

  // Stats
  orderCount: number;
  totalSpent?: Decimal; // Calculated, not stored

  createdAt: ISODateString;
  updatedAt: ISODateString;
}

interface SavedAddress extends Address {
  id: UUID;
  customerId: UUID;
  type: 'shipping' | 'billing';
  isDefault: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

interface CreateCustomerInput {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  acceptsMarketing?: boolean;
}

interface UpdateCustomerInput extends Partial<CreateCustomerInput> {
  notes?: string;
  tags?: string[];
}

interface CustomerFilters {
  page?: number;
  limit?: number;
  search?: string;
  isGuest?: boolean;
  hasOrders?: boolean;
  sortBy?: 'createdAt' | 'orderCount' | 'email';
  sortOrder?: 'asc' | 'desc';
}
```

---

## Promo Code Types

```typescript
type DiscountType = 'percentage' | 'fixed_amount';

interface PromoCode {
  id: UUID;
  code: string;
  description?: string;

  // Discount configuration
  discountType: DiscountType;
  discountValue: Decimal;

  // Constraints
  minimumOrderAmount?: Decimal;
  maximumDiscountAmount?: Decimal;
  usageLimit?: number;
  usageCount: number;
  usageLimitPerCustomer: number;

  // Validity
  startsAt?: ISODateString;
  expiresAt?: ISODateString;
  isActive: boolean;

  // Restrictions
  appliesToProducts?: UUID[];
  appliesToCategories?: UUID[];
  customerIds?: UUID[];

  createdAt: ISODateString;
  updatedAt: ISODateString;
}

interface CreatePromoCodeInput {
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: Decimal;
  minimumOrderAmount?: Decimal;
  maximumDiscountAmount?: Decimal;
  usageLimit?: number;
  usageLimitPerCustomer?: number;
  startsAt?: ISODateString;
  expiresAt?: ISODateString;
  isActive?: boolean;
  appliesToProducts?: UUID[];
  appliesToCategories?: UUID[];
  customerIds?: UUID[];
}

// Promo code validation response
interface PromoCodeValidation {
  isValid: boolean;
  code: string;
  discountType?: DiscountType;
  discountValue?: Decimal;
  message?: string;
  errorCode?: 'INVALID_CODE' | 'EXPIRED' | 'NOT_STARTED' | 'USAGE_LIMIT' | 'MINIMUM_NOT_MET' | 'NOT_APPLICABLE';
}
```

---

## Quotation Types

```typescript
type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';

interface QuotationItem {
  id: UUID;
  quotationId: UUID;
  productId?: UUID;
  name: string;
  description?: string;
  sku?: string;
  quantity: number;
  unitPrice: Decimal;
  lineTotal: Decimal; // Computed
  createdAt: ISODateString;
}

interface Quotation {
  id: UUID;
  quotationNumber: string; // QUO-2025-0001
  customerId?: UUID;

  // Customer info
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerCompany?: string;
  customerAddress?: Address;

  // Status
  status: QuotationStatus;
  validUntil?: ISODateString;

  // Pricing
  currency: CurrencyCode;
  subtotal: Decimal;
  taxRate?: Decimal;
  taxAmount?: Decimal;
  discountAmount: Decimal;
  total: Decimal;

  // Content
  items: QuotationItem[];
  notes?: string;
  termsAndConditions?: string;

  // PDF
  pdfUrl?: string;

  // Conversion
  convertedToOrderId?: UUID;

  createdAt: ISODateString;
  updatedAt: ISODateString;
}

interface CreateQuotationInput {
  customerId?: UUID;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerCompany?: string;
  customerAddress?: Address;
  validUntil?: ISODateString;
  items: {
    productId?: UUID;
    name: string;
    description?: string;
    sku?: string;
    quantity: number;
    unitPrice: Decimal;
  }[];
  notes?: string;
  termsAndConditions?: string;
  taxRate?: Decimal;
  discountAmount?: Decimal;
}
```

---

## Blog Types

```typescript
type BlogStatus = 'draft' | 'published' | 'archived';

interface Blog {
  id: UUID;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featuredImageUrl?: string;
  authorId?: UUID;
  authorName?: string;
  status: BlogStatus;
  publishedAt?: ISODateString;
  metaTitle?: string;
  metaDescription?: string;
  tags?: string[];
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

interface BlogListItem {
  id: UUID;
  title: string;
  slug: string;
  excerpt?: string;
  featuredImageUrl?: string;
  authorName?: string;
  publishedAt?: ISODateString;
  tags?: string[];
}

interface CreateBlogInput {
  title: string;
  slug?: string;
  content: string;
  excerpt?: string;
  featuredImageUrl?: string;
  status?: BlogStatus;
  publishedAt?: ISODateString;
  metaTitle?: string;
  metaDescription?: string;
  tags?: string[];
}
```

---

## Settings Types

```typescript
interface PublicSettings {
  storeName: string;
  storeEmail: string;
  storePhone?: string;
  storeAddress?: Address;
  currency: CurrencyCode;
  taxRate: Decimal;
  shippingEnabled: boolean;
  freeShippingThreshold?: Decimal;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
  };
}

interface AdminSettings extends PublicSettings {
  smtpHost?: string;
  smtpPort?: number;
  stripeEnabled: boolean;
  imagekitPublicKey?: string;
  // Other admin-only settings
}

interface UpdateSettingInput {
  key: string;
  value: any;
}
```

---

## Analytics Types

```typescript
interface AnalyticsOverview {
  period: string;
  revenue: Decimal;
  revenueChange: Decimal; // Percentage change from previous period
  orders: number;
  ordersChange: Decimal;
  customers: number;
  customersChange: Decimal;
  averageOrderValue: Decimal;
  aovChange: Decimal;
}

interface SalesAnalytics {
  period: string;
  data: {
    date: string;
    revenue: Decimal;
    orders: number;
  }[];
  totalRevenue: Decimal;
  totalOrders: number;
}

interface ProductAnalytics {
  topProducts: {
    productId: UUID;
    productName: string;
    unitsSold: number;
    revenue: Decimal;
  }[];
  lowStockProducts: {
    productId: UUID;
    productName: string;
    stockQuantity: number;
    lowStockThreshold: number;
  }[];
}

interface CustomerAnalytics {
  newCustomers: number;
  returningCustomers: number;
  topCustomers: {
    customerId: UUID;
    customerName: string;
    orderCount: number;
    totalSpent: Decimal;
  }[];
}
```

---

## Authentication Types

```typescript
interface AuthUser {
  id: string; // Neon Auth user ID
  email: string;
  role: 'customer' | 'admin';
  customerId?: UUID;
}

interface LoginInput {
  email: string;
  password: string;
}

interface RegisterInput {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

interface AuthResponse {
  user: AuthUser;
  token: string;
  expiresAt: ISODateString;
}

interface PasswordResetInput {
  email: string;
}

interface ResetPasswordInput {
  token: string;
  newPassword: string;
}
```

---

## Product Import Types

```typescript
type ImportSource = 'amazon' | 'aliexpress' | 'ebay';
type ImportStatus = 'pending' | 'processing' | 'completed' | 'failed';

interface ProductImportJob {
  id: UUID;
  source: ImportSource;
  sourceUrl: string;
  status: ImportStatus;
  importedProductId?: UUID;
  errorMessage?: string;
  rawData?: Record<string, any>;
  createdAt: ISODateString;
  completedAt?: ISODateString;
}

interface ProductImportPreview {
  source: ImportSource;
  sourceUrl: string;
  extractedData: {
    name: string;
    description?: string;
    price?: Decimal;
    images?: string[];
    specifications?: Record<string, string>;
  };
}

interface CreateProductImportInput {
  sourceUrl: string;
  // Optional overrides
  categoryId?: UUID;
  sku?: string;
  priceOverride?: Decimal;
}
```

---

## File Upload Types

```typescript
interface UploadedFile {
  url: string;
  fileId: string;
  name: string;
  size: number;
  type: string;
  thumbnailUrl?: string;
}

interface UploadResponse {
  file: UploadedFile;
}

interface MultipleUploadResponse {
  files: UploadedFile[];
  failed?: {
    name: string;
    error: string;
  }[];
}
```

---

**Last Updated:** 2025-12-28
**Usage:** Import from `@lab404/shared-types` package
