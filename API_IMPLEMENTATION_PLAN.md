# Lab404Electronics - Complete API Implementation Plan

## Overview

This document provides a detailed implementation plan for ALL APIs needed to complete the Lab404Electronics platform, including CRUD operations, imports, exports, calculations, and backup strategies.

---

## Table of Contents

1. [API Architecture](#1-api-architecture)
2. [Authentication & Authorization APIs](#2-authentication--authorization-apis)
3. [Product Management APIs](#3-product-management-apis)
4. [Category Management APIs](#4-category-management-apis)
5. [Customer Management APIs](#5-customer-management-apis)
6. [Cart & Pricing APIs](#6-cart--pricing-apis)
7. [Order Management APIs](#7-order-management-apis)
8. [Promo Code APIs](#8-promo-code-apis)
9. [Quotation APIs](#9-quotation-apis)
10. [Blog APIs](#10-blog-apis)
11. [Settings APIs](#11-settings-apis)
12. [Analytics APIs](#12-analytics-apis)
13. [Import/Export APIs](#13-importexport-apis)
14. [Backup & Recovery APIs](#14-backup--recovery-apis)
15. [File Upload APIs](#15-file-upload-apis)
16. [Email & Notification APIs](#16-email--notification-apis)
17. [Implementation Priority](#17-implementation-priority)

---

## 1. API Architecture

### Base Structure

```
/api
├── /auth                    # Authentication
├── /products                # Product management
├── /categories              # Category management
├── /customers               # Customer management
├── /cart                    # Shopping cart
├── /orders                  # Order management
├── /promo-codes             # Promo code management
├── /blogs                   # Blog management
├── /settings                # Settings management
├── /contact                 # Contact form
├── /admin
│   ├── /quotations          # Quotation management
│   ├── /analytics           # Analytics & reports
│   ├── /import              # Product import
│   ├── /export              # Data export
│   ├── /backup              # Backup management
│   └── /activity-logs       # Admin activity logs
└── /upload                  # File uploads
```

### Authentication Levels

| Level | Description | Endpoints |
|-------|-------------|-----------|
| Public | No auth required | Product listing, categories, blogs |
| Guest | Session-based | Cart operations |
| Customer | JWT required | Orders, profile, addresses |
| Admin | Admin JWT required | All admin operations |

### Response Standards

```typescript
// Success
{
  "success": true,
  "data": T,
  "meta": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 }
}

// Error
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": [{ "field": "name", "message": "Required" }]
  }
}
```

---

## 2. Authentication & Authorization APIs

### 2.1 Customer Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new customer | Public |
| POST | `/api/auth/login` | Customer login | Public |
| POST | `/api/auth/logout` | Logout (invalidate token) | Customer |
| GET | `/api/auth/me` | Get current user | Customer |
| POST | `/api/auth/forgot-password` | Request password reset | Public |
| POST | `/api/auth/reset-password` | Reset password with token | Public |
| POST | `/api/auth/change-password` | Change password | Customer |
| POST | `/api/auth/refresh-token` | Refresh JWT token | Customer |
| POST | `/api/auth/verify-email` | Verify email address | Public |
| POST | `/api/auth/resend-verification` | Resend verification email | Public |

### 2.2 Admin Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/admin/login` | Admin login | Public |
| POST | `/api/auth/admin/logout` | Admin logout | Admin |
| GET | `/api/auth/admin/me` | Get admin user | Admin |
| POST | `/api/auth/admin/change-password` | Change admin password | Admin |

### 2.3 Implementation Details

```typescript
// Register Input
{
  email: string;           // Required, unique
  password: string;        // Min 8 chars, complexity rules
  firstName?: string;
  lastName?: string;
  phone?: string;
  acceptsMarketing?: boolean;
}

// Login Input
{
  email: string;
  password: string;
  rememberMe?: boolean;    // Extended token expiry
}

// Auth Response
{
  user: {
    id: string;
    email: string;
    role: 'customer' | 'admin';
    customerId?: string;
    firstName?: string;
    lastName?: string;
  };
  token: string;
  refreshToken: string;
  expiresAt: string;
}

// Password Reset Flow
1. POST /forgot-password → Send email with reset token
2. POST /reset-password → Validate token, set new password
```

### 2.4 Security Measures

- Password hashing: bcrypt with cost factor 12
- JWT expiry: 7 days (configurable)
- Refresh token: 30 days, stored in httpOnly cookie
- Rate limiting: 5 attempts per 15 minutes for auth endpoints
- Account lockout: After 10 failed attempts, lock for 1 hour
- Password requirements: 8+ chars, 1 uppercase, 1 number

---

## 3. Product Management APIs

### 3.1 Public Product APIs

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/products` | List products (paginated) | Public |
| GET | `/api/products/featured` | Get featured products | Public |
| GET | `/api/products/new-arrivals` | Get newest products | Public |
| GET | `/api/products/best-sellers` | Get best selling products | Public |
| GET | `/api/products/search` | Search products | Public |
| GET | `/api/products/:slug` | Get product by slug | Public |
| GET | `/api/products/:id/related` | Get related products | Public |

### 3.2 Admin Product APIs

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/products` | List all products (inc. drafts) | Admin |
| GET | `/api/admin/products/:id` | Get product details | Admin |
| POST | `/api/admin/products` | Create product | Admin |
| PUT | `/api/admin/products/:id` | Update product | Admin |
| DELETE | `/api/admin/products/:id` | Delete product | Admin |
| PATCH | `/api/admin/products/:id/status` | Update status only | Admin |
| PATCH | `/api/admin/products/:id/featured` | Toggle featured | Admin |
| POST | `/api/admin/products/bulk-update` | Bulk update products | Admin |
| POST | `/api/admin/products/bulk-delete` | Bulk delete products | Admin |
| POST | `/api/admin/products/:id/duplicate` | Duplicate product | Admin |

### 3.3 Product Variant APIs

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/products/:id/variants` | List variants | Admin |
| POST | `/api/admin/products/:id/variants` | Create variant | Admin |
| PUT | `/api/admin/products/:id/variants/:variantId` | Update variant | Admin |
| DELETE | `/api/admin/products/:id/variants/:variantId` | Delete variant | Admin |
| POST | `/api/admin/products/:id/variants/bulk` | Create multiple variants | Admin |

### 3.4 Product Query Parameters

```typescript
// GET /api/products query params
{
  page?: number;           // Default: 1
  limit?: number;          // Default: 20, Max: 100
  search?: string;         // Search in name, sku, description
  categoryId?: string;     // Filter by category
  categorySlug?: string;   // Filter by category slug
  brand?: string;          // Filter by brand
  minPrice?: number;       // Minimum price
  maxPrice?: number;       // Maximum price
  inStock?: boolean;       // Only in-stock products
  status?: string;         // draft, active, archived (admin only)
  isFeatured?: boolean;    // Only featured
  sortBy?: 'name' | 'price' | 'createdAt' | 'popularity';
  sortOrder?: 'asc' | 'desc';
  tags?: string[];         // Filter by tags
}
```

### 3.5 Product Data Structure

```typescript
// Create/Update Product Input
{
  sku?: string;                    // Auto-generated if empty
  name: string;                    // Required
  slug?: string;                   // Auto-generated from name
  description?: string;            // Rich text (sanitized)
  shortDescription?: string;       // Max 500 chars
  categoryId?: string;
  brand?: string;

  // Pricing
  basePrice: number;               // Required, positive
  costPrice?: number;              // For profit calculation
  compareAtPrice?: number;         // Original/compare price

  // Inventory
  stockQuantity?: number;          // Default: 0
  lowStockThreshold?: number;      // Default: 5
  trackInventory?: boolean;        // Default: true
  allowBackorder?: boolean;        // Default: false

  // Media
  images?: ImageObject[];
  thumbnailUrl?: string;

  // SEO
  metaTitle?: string;
  metaDescription?: string;

  // Status
  status?: 'draft' | 'active' | 'archived';
  isFeatured?: boolean;

  // Additional
  tags?: string[];
  specifications?: Record<string, string>;
  weight?: number;
  dimensions?: { length: number; width: number; height: number };
}
```

### 3.6 Inventory Management

```typescript
// Stock adjustment endpoint
POST /api/admin/products/:id/stock-adjustment
{
  adjustment: number;      // Positive or negative
  reason: string;          // 'received' | 'sold' | 'damaged' | 'returned' | 'manual'
  notes?: string;
}

// Stock history endpoint
GET /api/admin/products/:id/stock-history
Response: [{
  id: string;
  adjustment: number;
  previousQuantity: number;
  newQuantity: number;
  reason: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}]

// Low stock alerts
GET /api/admin/products/low-stock
Response: Products where stockQuantity <= lowStockThreshold
```

---

## 4. Category Management APIs

### 4.1 Category Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/categories` | List all categories (tree) | Public |
| GET | `/api/categories/flat` | List categories (flat) | Public |
| GET | `/api/categories/:slug` | Get category with products | Public |
| GET | `/api/categories/:id/breadcrumb` | Get category path | Public |
| POST | `/api/admin/categories` | Create category | Admin |
| PUT | `/api/admin/categories/:id` | Update category | Admin |
| DELETE | `/api/admin/categories/:id` | Delete category | Admin |
| PATCH | `/api/admin/categories/:id/sort-order` | Update sort order | Admin |
| POST | `/api/admin/categories/reorder` | Bulk reorder | Admin |

### 4.2 Category Data Structure

```typescript
// Create/Update Category Input
{
  name: string;                    // Required
  slug?: string;                   // Auto-generated
  description?: string;
  imageUrl?: string;
  parentId?: string;               // For subcategories
  isActive?: boolean;              // Default: true
  sortOrder?: number;              // Default: 0
  metaTitle?: string;
  metaDescription?: string;
}

// Category Response (with hierarchy)
{
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
  isActive: boolean;
  sortOrder: number;
  productCount: number;            // Calculated
  children: Category[];            // Nested categories
  breadcrumb: { id: string; name: string; slug: string }[];
}
```

---

## 5. Customer Management APIs

### 5.1 Customer Self-Service APIs

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/customers/me` | Get profile | Customer |
| PUT | `/api/customers/me` | Update profile | Customer |
| DELETE | `/api/customers/me` | Delete account | Customer |
| GET | `/api/customers/me/addresses` | List addresses | Customer |
| POST | `/api/customers/me/addresses` | Add address | Customer |
| PUT | `/api/customers/me/addresses/:id` | Update address | Customer |
| DELETE | `/api/customers/me/addresses/:id` | Delete address | Customer |
| PATCH | `/api/customers/me/addresses/:id/default` | Set default | Customer |
| GET | `/api/customers/me/orders` | Order history | Customer |
| GET | `/api/customers/me/wishlist` | Get wishlist | Customer |
| POST | `/api/customers/me/wishlist` | Add to wishlist | Customer |
| DELETE | `/api/customers/me/wishlist/:productId` | Remove from wishlist | Customer |

### 5.2 Admin Customer APIs

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/customers` | List all customers | Admin |
| GET | `/api/admin/customers/:id` | Get customer details | Admin |
| PUT | `/api/admin/customers/:id` | Update customer | Admin |
| DELETE | `/api/admin/customers/:id` | Delete customer | Admin |
| GET | `/api/admin/customers/:id/orders` | Customer orders | Admin |
| GET | `/api/admin/customers/:id/activity` | Customer activity | Admin |
| POST | `/api/admin/customers/:id/notes` | Add note | Admin |
| PATCH | `/api/admin/customers/:id/tags` | Update tags | Admin |

### 5.3 Customer Query Parameters

```typescript
// GET /api/admin/customers query params
{
  page?: number;
  limit?: number;
  search?: string;             // Search email, name, phone
  isGuest?: boolean;
  hasOrders?: boolean;
  minOrders?: number;
  maxOrders?: number;
  minSpent?: number;
  maxSpent?: number;
  tags?: string[];
  createdAfter?: string;       // ISO date
  createdBefore?: string;
  sortBy?: 'createdAt' | 'orderCount' | 'totalSpent' | 'email';
  sortOrder?: 'asc' | 'desc';
}
```

### 5.4 Customer Data Structure

```typescript
// Update Customer Input
{
  firstName?: string;
  lastName?: string;
  phone?: string;
  acceptsMarketing?: boolean;
}

// Admin Update Customer Input
{
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;              // Admin can change email
  acceptsMarketing?: boolean;
  notes?: string;
  tags?: string[];
  isActive?: boolean;          // Can deactivate customer
}

// Customer Response (Admin)
{
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName: string;            // Computed
  phone?: string;
  isGuest: boolean;
  isActive: boolean;
  acceptsMarketing: boolean;
  notes?: string;
  tags: string[];
  orderCount: number;
  totalSpent: number;          // Calculated
  averageOrderValue: number;   // Calculated
  lastOrderAt?: string;
  addresses: Address[];
  createdAt: string;
  updatedAt: string;
}
```

---

## 6. Cart & Pricing APIs

### 6.1 Cart Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/cart` | Get cart | Guest/Customer |
| POST | `/api/cart/items` | Add item | Guest/Customer |
| PUT | `/api/cart/items/:id` | Update quantity | Guest/Customer |
| DELETE | `/api/cart/items/:id` | Remove item | Guest/Customer |
| DELETE | `/api/cart` | Clear cart | Guest/Customer |
| GET | `/api/cart/calculate` | **Calculate totals** | Guest/Customer |
| POST | `/api/cart/apply-promo` | Apply promo code | Guest/Customer |
| DELETE | `/api/cart/promo` | Remove promo code | Guest/Customer |
| POST | `/api/cart/merge` | Merge guest cart to user | Customer |
| GET | `/api/cart/validate` | Validate cart items | Guest/Customer |

### 6.2 Cart Calculation (CRITICAL)

```typescript
// GET /api/cart/calculate Response
{
  items: [{
    id: string;
    productId: string;
    variantId?: string;
    product: {
      id: string;
      name: string;
      slug: string;
      sku: string;
      thumbnailUrl?: string;
      basePrice: number;        // Current DB price
      stockQuantity: number;
      inStock: boolean;
    };
    variant?: {
      id: string;
      name: string;
      sku: string;
      options: Record<string, string>;
      basePrice: number;
    };
    quantity: number;
    unitPrice: number;          // Backend calculated
    lineTotal: number;          // Backend calculated
    isAvailable: boolean;       // Stock check
    maxQuantity: number;        // Max available
  }];

  itemCount: number;

  // ALL CALCULATED BY BACKEND
  subtotal: number;             // Sum of line totals
  taxRate: number;              // From settings
  taxAmount: number;            // subtotal * taxRate
  shippingAmount: number;       // Based on shipping rules
  discountAmount: number;       // From promo code
  promoCode?: string;
  promoCodeId?: string;
  total: number;                // Final total
  currency: string;

  // Validation
  hasErrors: boolean;
  errors?: string[];            // e.g., "Item X out of stock"
}
```

### 6.3 Pricing Service Methods

```typescript
class PricingService {
  // Main calculation method
  async calculateCart(
    items: CartItemInput[],
    promoCode?: string,
    shippingAddress?: Address
  ): Promise<CartCalculation>;

  // Calculate order totals at checkout
  async calculateOrderTotals(
    items: CartItemInput[],
    promoCode?: string,
    shippingAddress?: Address
  ): Promise<OrderTotals>;

  // Validate promo code
  async validatePromoCode(
    code: string,
    subtotal: number,
    customerId?: string,
    productIds?: string[],
    categoryIds?: string[]
  ): Promise<PromoCodeValidation>;

  // Calculate shipping
  async calculateShipping(
    items: CartItemInput[],
    address: Address
  ): Promise<ShippingCalculation>;

  // Get current tax rate
  async getTaxRate(
    address?: Address
  ): Promise<number>;

  // Calculate discount
  calculateDiscount(
    promoCode: PromoCode,
    subtotal: number,
    items: CartItem[]
  ): number;
}
```

### 6.4 Shipping Calculation (Future)

```typescript
// Shipping methods
GET /api/shipping/methods
Query: { address: Address, weight?: number }
Response: [{
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedDays: { min: number; max: number };
  carrier?: string;
}]

// Shipping rules (Admin)
GET /api/admin/shipping/rules
POST /api/admin/shipping/rules
PUT /api/admin/shipping/rules/:id
DELETE /api/admin/shipping/rules/:id

// Shipping rule structure
{
  id: string;
  name: string;
  type: 'flat' | 'weight_based' | 'price_based' | 'free';
  conditions: {
    minOrderAmount?: number;
    maxOrderAmount?: number;
    minWeight?: number;
    maxWeight?: number;
    countries?: string[];
    regions?: string[];
  };
  price: number;
  isActive: boolean;
}
```

---

## 7. Order Management APIs

### 7.1 Public/Customer Order APIs

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/orders` | Create order (checkout) | Guest/Customer |
| GET | `/api/orders` | Customer orders | Customer |
| GET | `/api/orders/:id` | Order details | Customer |
| GET | `/api/orders/track/:orderNumber` | Track order | Public |
| POST | `/api/orders/:id/cancel` | Cancel order | Customer |

### 7.2 Admin Order APIs

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/orders` | List all orders | Admin |
| GET | `/api/admin/orders/:id` | Order details | Admin |
| PUT | `/api/admin/orders/:id` | Update order | Admin |
| PATCH | `/api/admin/orders/:id/status` | Update status | Admin |
| PATCH | `/api/admin/orders/:id/payment-status` | Update payment | Admin |
| POST | `/api/admin/orders/:id/ship` | Mark as shipped | Admin |
| POST | `/api/admin/orders/:id/deliver` | Mark as delivered | Admin |
| POST | `/api/admin/orders/:id/refund` | Process refund | Admin |
| POST | `/api/admin/orders/:id/notes` | Add admin note | Admin |
| GET | `/api/admin/orders/:id/timeline` | Order timeline | Admin |
| POST | `/api/admin/orders/:id/resend-confirmation` | Resend email | Admin |
| GET | `/api/admin/orders/:id/invoice` | Generate invoice PDF | Admin |

### 7.3 Order Query Parameters

```typescript
// GET /api/admin/orders query params
{
  page?: number;
  limit?: number;
  search?: string;              // Order number, customer email
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  customerId?: string;
  minTotal?: number;
  maxTotal?: number;
  createdAfter?: string;
  createdBefore?: string;
  hasPromoCode?: boolean;
  promoCode?: string;
  sortBy?: 'createdAt' | 'total' | 'orderNumber';
  sortOrder?: 'asc' | 'desc';
}
```

### 7.4 Order Creation (Checkout)

```typescript
// POST /api/orders
{
  // Addresses
  shippingAddress: {
    firstName: string;
    lastName: string;
    company?: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state?: string;
    postalCode?: string;
    country: string;
    phone: string;
  };
  billingAddress?: Address;     // Optional, defaults to shipping
  sameAsShipping?: boolean;     // Default: true

  // Customer
  customerEmail: string;
  customerPhone?: string;

  // Payment
  paymentMethod: 'cod';         // Currently only COD

  // Notes
  customerNotes?: string;

  // Shipping (future)
  shippingMethodId?: string;
}

// Checkout Flow
1. Validate cart (GET /api/cart/validate)
2. Calculate totals (GET /api/cart/calculate)
3. Create order (POST /api/orders)
   - Validate all items available
   - Calculate final totals from DB
   - Create order with snapshot data
   - Create order items
   - Decrement stock
   - Clear cart
   - Update promo code usage
   - Update customer order count
   - Send confirmation email
4. Return order confirmation
```

### 7.5 Order Status Flow

```
pending → confirmed → processing → shipped → delivered
    ↓         ↓           ↓           ↓
cancelled cancelled   cancelled   (no cancel)
```

```typescript
// Status transitions allowed
{
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: []
}

// Payment status transitions
{
  pending: ['paid', 'failed'],
  paid: ['refunded'],
  failed: ['pending', 'paid'],
  refunded: []
}
```

### 7.6 Order Timeline Events

```typescript
// Automatically tracked events
[
  { event: 'order_created', timestamp: '...', details: {} },
  { event: 'status_changed', timestamp: '...', details: { from: 'pending', to: 'confirmed' } },
  { event: 'payment_received', timestamp: '...', details: { method: 'cod' } },
  { event: 'shipped', timestamp: '...', details: { trackingNumber: '...', carrier: '...' } },
  { event: 'delivered', timestamp: '...', details: {} },
  { event: 'note_added', timestamp: '...', details: { note: '...', addedBy: '...' } },
  { event: 'email_sent', timestamp: '...', details: { type: 'confirmation' } },
]
```

---

## 8. Promo Code APIs

### 8.1 Promo Code Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/promo-codes/validate` | Validate code | Guest/Customer |
| GET | `/api/admin/promo-codes` | List all codes | Admin |
| GET | `/api/admin/promo-codes/:id` | Get code details | Admin |
| POST | `/api/admin/promo-codes` | Create code | Admin |
| PUT | `/api/admin/promo-codes/:id` | Update code | Admin |
| DELETE | `/api/admin/promo-codes/:id` | Delete code | Admin |
| PATCH | `/api/admin/promo-codes/:id/status` | Toggle active | Admin |
| GET | `/api/admin/promo-codes/:id/usage` | Usage history | Admin |
| POST | `/api/admin/promo-codes/generate` | Generate codes | Admin |

### 8.2 Promo Code Data Structure

```typescript
// Create/Update Promo Code
{
  code: string;                    // Unique, uppercase
  description?: string;

  // Discount
  discountType: 'percentage' | 'fixed_amount';
  discountValue: number;           // Percentage (0-100) or fixed amount

  // Constraints
  minimumOrderAmount?: number;
  maximumDiscountAmount?: number;  // Cap for percentage discounts

  // Usage limits
  usageLimit?: number;             // Total uses allowed
  usageLimitPerCustomer?: number;  // Per customer limit (default: 1)

  // Validity
  startsAt?: string;               // ISO date
  expiresAt?: string;              // ISO date
  isActive?: boolean;              // Default: true

  // Restrictions
  appliesToProducts?: string[];    // Specific products only
  appliesToCategories?: string[];  // Specific categories only
  customerIds?: string[];          // Specific customers only
  excludeProducts?: string[];      // Exclude products
  excludeCategories?: string[];    // Exclude categories
  firstOrderOnly?: boolean;        // New customers only
}

// Validation Response
{
  isValid: boolean;
  code: string;
  discountType?: 'percentage' | 'fixed_amount';
  discountValue?: number;
  calculatedDiscount?: number;     // Actual discount amount
  message?: string;
  errorCode?: 'INVALID_CODE' | 'EXPIRED' | 'NOT_STARTED' |
              'USAGE_LIMIT' | 'CUSTOMER_LIMIT' | 'MINIMUM_NOT_MET' |
              'NOT_APPLICABLE' | 'INACTIVE' | 'FIRST_ORDER_ONLY';
}
```

### 8.3 Generate Multiple Codes

```typescript
// POST /api/admin/promo-codes/generate
{
  prefix: string;                  // e.g., "SUMMER"
  quantity: number;                // How many to generate
  codeLength: number;              // Random suffix length
  // ... same options as create
}

// Response
{
  generated: string[];             // List of generated codes
  count: number;
}
```

---

## 9. Quotation APIs

### 9.1 Quotation Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/quotations` | List quotations | Admin |
| GET | `/api/admin/quotations/:id` | Get quotation | Admin |
| POST | `/api/admin/quotations` | Create quotation | Admin |
| PUT | `/api/admin/quotations/:id` | Update quotation | Admin |
| DELETE | `/api/admin/quotations/:id` | Delete quotation | Admin |
| PATCH | `/api/admin/quotations/:id/status` | Update status | Admin |
| POST | `/api/admin/quotations/:id/send` | Send to customer | Admin |
| GET | `/api/admin/quotations/:id/pdf` | Generate PDF | Admin |
| POST | `/api/admin/quotations/:id/convert` | Convert to order | Admin |
| POST | `/api/admin/quotations/:id/duplicate` | Duplicate | Admin |

### 9.2 Quotation Data Structure

```typescript
// Create Quotation
{
  // Customer info
  customerId?: string;             // Existing customer
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerCompany?: string;
  customerAddress?: Address;

  // Validity
  validUntil?: string;             // ISO date

  // Items
  items: [{
    productId?: string;            // Optional - can be custom item
    name: string;
    description?: string;
    sku?: string;
    quantity: number;
    unitPrice: number;
  }];

  // Pricing (calculated)
  taxRate?: number;
  discountAmount?: number;

  // Notes
  notes?: string;
  termsAndConditions?: string;
}

// Quotation Response
{
  id: string;
  quotationNumber: string;         // QUO-2025-0001

  // Customer
  customerId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerCompany?: string;
  customerAddress?: Address;

  // Status
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  validUntil?: string;

  // Items
  items: QuotationItem[];

  // Pricing (calculated on creation/update)
  currency: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  total: number;

  // Content
  notes?: string;
  termsAndConditions?: string;

  // PDF
  pdfUrl?: string;

  // Conversion
  convertedToOrderId?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
}
```

### 9.3 PDF Generation

```typescript
// PDF Template includes:
- Company logo and info
- Quotation number and date
- Customer details
- Item table with prices
- Subtotal, tax, discount, total
- Terms and conditions
- Validity period
- Notes

// PDF stored in ImageKit
// URL returned in response
```

---

## 10. Blog APIs

### 10.1 Blog Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/blogs` | List published blogs | Public |
| GET | `/api/blogs/:slug` | Get blog by slug | Public |
| GET | `/api/blogs/tags` | Get all tags | Public |
| GET | `/api/blogs/tag/:tag` | Blogs by tag | Public |
| GET | `/api/admin/blogs` | List all blogs | Admin |
| GET | `/api/admin/blogs/:id` | Get blog | Admin |
| POST | `/api/admin/blogs` | Create blog | Admin |
| PUT | `/api/admin/blogs/:id` | Update blog | Admin |
| DELETE | `/api/admin/blogs/:id` | Delete blog | Admin |
| PATCH | `/api/admin/blogs/:id/status` | Update status | Admin |
| POST | `/api/admin/blogs/:id/publish` | Publish blog | Admin |
| POST | `/api/admin/blogs/:id/unpublish` | Unpublish blog | Admin |

### 10.2 Blog Data Structure

```typescript
// Create/Update Blog
{
  title: string;
  slug?: string;                   // Auto-generated
  content: string;                 // Rich text (sanitized)
  excerpt?: string;                // Max 500 chars
  featuredImageUrl?: string;
  status?: 'draft' | 'published' | 'archived';
  publishedAt?: string;            // Schedule publish
  metaTitle?: string;
  metaDescription?: string;
  tags?: string[];
}

// Blog Response
{
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featuredImageUrl?: string;
  authorId?: string;
  authorName?: string;
  status: 'draft' | 'published' | 'archived';
  publishedAt?: string;
  metaTitle?: string;
  metaDescription?: string;
  tags: string[];
  readTime?: number;               // Calculated
  createdAt: string;
  updatedAt: string;
}
```

---

## 11. Settings APIs

### 11.1 Settings Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/settings/public` | Get public settings | Public |
| GET | `/api/admin/settings` | Get all settings | Admin |
| PUT | `/api/admin/settings` | Update settings | Admin |
| PUT | `/api/admin/settings/:key` | Update single setting | Admin |
| GET | `/api/admin/settings/tax` | Get tax settings | Admin |
| PUT | `/api/admin/settings/tax` | Update tax settings | Admin |
| GET | `/api/admin/settings/email` | Get email settings | Admin |
| PUT | `/api/admin/settings/email` | Update email settings | Admin |
| POST | `/api/admin/settings/email/test` | Send test email | Admin |

### 11.2 Settings Structure

```typescript
// Public Settings
{
  storeName: string;
  storeEmail: string;
  storePhone?: string;
  storeAddress?: Address;
  currency: string;
  currencySymbol: string;
  taxRate: number;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
  };
  footerText?: string;
  supportEmail?: string;
}

// Admin Settings (extends public)
{
  // ... public settings

  // Tax
  taxEnabled: boolean;
  taxIncludedInPrice: boolean;
  taxRates?: [{
    name: string;
    rate: number;
    countries?: string[];
    isDefault: boolean;
  }];

  // Shipping
  shippingEnabled: boolean;
  freeShippingThreshold?: number;

  // Email
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpConfigured: boolean;
  emailFromName: string;
  emailFromAddress: string;

  // Notifications
  orderNotificationEmail?: string;
  lowStockAlertEnabled: boolean;
  lowStockAlertEmail?: string;

  // Payment
  codEnabled: boolean;
  stripeEnabled: boolean;

  // Integrations
  imagekitConfigured: boolean;

  // Maintenance
  maintenanceMode: boolean;
  maintenanceMessage?: string;
}
```

---

## 12. Analytics APIs

### 12.1 Analytics Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/analytics/overview` | Dashboard overview | Admin |
| GET | `/api/admin/analytics/sales` | Sales analytics | Admin |
| GET | `/api/admin/analytics/orders` | Order analytics | Admin |
| GET | `/api/admin/analytics/products` | Product analytics | Admin |
| GET | `/api/admin/analytics/customers` | Customer analytics | Admin |
| GET | `/api/admin/analytics/revenue` | Revenue breakdown | Admin |
| GET | `/api/admin/analytics/trends` | Trend analysis | Admin |
| GET | `/api/admin/analytics/compare` | Period comparison | Admin |

### 12.2 Analytics Query Parameters

```typescript
// Common query params for all analytics endpoints
{
  period?: 'today' | 'yesterday' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
  startDate?: string;              // ISO date (for custom)
  endDate?: string;                // ISO date (for custom)
  compareWithPrevious?: boolean;   // Include comparison data
  groupBy?: 'day' | 'week' | 'month';
}
```

### 12.3 Analytics Response Structures

```typescript
// Overview
{
  period: string;

  // Key metrics with change percentage
  revenue: { value: number; change: number; };
  orders: { value: number; change: number; };
  customers: { value: number; change: number; };
  averageOrderValue: { value: number; change: number; };

  // Quick stats
  pendingOrders: number;
  lowStockProducts: number;
  newCustomersToday: number;
}

// Sales Analytics
{
  period: string;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;

  // Time series data
  data: [{
    date: string;
    revenue: number;
    orders: number;
    averageOrderValue: number;
  }];

  // Comparison (if requested)
  comparison?: {
    previousPeriod: { revenue: number; orders: number; };
    changePercent: { revenue: number; orders: number; };
  };
}

// Product Analytics
{
  period: string;

  topProducts: [{
    productId: string;
    productName: string;
    sku: string;
    thumbnailUrl?: string;
    unitsSold: number;
    revenue: number;
    averagePrice: number;
  }];

  lowStockProducts: [{
    productId: string;
    productName: string;
    sku: string;
    stockQuantity: number;
    lowStockThreshold: number;
    daysUntilOutOfStock?: number;  // Estimated
  }];

  categoryPerformance: [{
    categoryId: string;
    categoryName: string;
    revenue: number;
    unitsSold: number;
    percentOfTotal: number;
  }];
}

// Customer Analytics
{
  period: string;

  overview: {
    totalCustomers: number;
    newCustomers: number;
    returningCustomers: number;
    guestCheckouts: number;
    conversionRate: number;
  };

  topCustomers: [{
    customerId: string;
    customerName: string;
    customerEmail: string;
    orderCount: number;
    totalSpent: number;
    lastOrderAt: string;
  }];

  customerGrowth: [{
    date: string;
    newCustomers: number;
    totalCustomers: number;
  }];
}

// Order Analytics
{
  period: string;

  overview: {
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    averageProcessingTime: number;  // In hours
  };

  byStatus: [{
    status: string;
    count: number;
    percentage: number;
  }];

  byPaymentMethod: [{
    method: string;
    count: number;
    revenue: number;
  }];

  fulfillmentMetrics: {
    averageTimeToShip: number;      // Hours
    averageTimeToDeliver: number;   // Days
    onTimeDeliveryRate: number;     // Percentage
  };
}
```

### 12.4 Analytics Calculations

```typescript
// Revenue calculation
totalRevenue = SUM(orders.totalSnapshot) WHERE status NOT IN ('cancelled', 'refunded')

// Average order value
averageOrderValue = totalRevenue / completedOrderCount

// Customer lifetime value
clv = totalSpent / daysSinceFirstOrder * 365

// Conversion rate
conversionRate = completedOrders / totalVisitors * 100

// Year-over-year growth
yoyGrowth = (currentPeriod - previousPeriod) / previousPeriod * 100
```

---

## 13. Import/Export APIs

### 13.1 Product Import APIs

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/admin/import/products/url` | Import from URL | Admin |
| GET | `/api/admin/import/products/url/preview` | Preview import | Admin |
| POST | `/api/admin/import/products/csv` | Import from CSV | Admin |
| GET | `/api/admin/import/products/csv/template` | Download template | Admin |
| GET | `/api/admin/import/jobs` | List import jobs | Admin |
| GET | `/api/admin/import/jobs/:id` | Get job status | Admin |
| POST | `/api/admin/import/jobs/:id/cancel` | Cancel job | Admin |

### 13.2 URL Import (Amazon, AliExpress, eBay)

```typescript
// POST /api/admin/import/products/url
{
  sourceUrl: string;               // Product URL
  categoryId?: string;             // Override category
  skuPrefix?: string;              // Custom SKU prefix
  priceMultiplier?: number;        // e.g., 1.5 for 50% markup
  importImages?: boolean;          // Default: true
}

// Preview Response
{
  source: 'amazon' | 'aliexpress' | 'ebay';
  extractedData: {
    name: string;
    description: string;
    price: number;
    originalPrice?: number;
    currency: string;
    images: string[];
    specifications: Record<string, string>;
    brand?: string;
    rating?: number;
    reviewCount?: number;
  };
  suggestions: {
    category?: { id: string; name: string; };
    suggestedPrice: number;
  };
}

// Import Job Response
{
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  source: string;
  sourceUrl: string;
  progress: number;                // 0-100
  importedProductId?: string;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
}
```

### 13.3 CSV Import

```typescript
// CSV Template Columns
[
  'sku',                           // Required
  'name',                          // Required
  'description',
  'short_description',
  'category',                      // Category name or slug
  'brand',
  'base_price',                    // Required
  'cost_price',
  'compare_at_price',
  'stock_quantity',
  'low_stock_threshold',
  'track_inventory',
  'allow_backorder',
  'image_urls',                    // Comma-separated
  'status',
  'is_featured',
  'meta_title',
  'meta_description',
  'tags',                          // Comma-separated
  'weight',
  'dimensions',                    // LxWxH format
]

// Import Options
{
  file: File;                      // CSV file
  updateExisting?: boolean;        // Update by SKU match
  skipErrors?: boolean;            // Continue on errors
  dryRun?: boolean;                // Validate only
}

// Import Result
{
  jobId: string;
  total: number;
  created: number;
  updated: number;
  skipped: number;
  errors: [{
    row: number;
    sku: string;
    errors: string[];
  }];
}
```

### 13.4 Scraper Implementation

```typescript
// Base scraper interface
interface ProductScraper {
  canHandle(url: string): boolean;
  extract(url: string): Promise<ExtractedProduct>;
}

// Amazon scraper
class AmazonScraper implements ProductScraper {
  // Uses cheerio for HTML parsing
  // Extracts: name, price, description, images, specs
  // Handles different Amazon domains (.com, .co.uk, etc.)
}

// AliExpress scraper
class AliExpressScraper implements ProductScraper {
  // Uses API if available, otherwise HTML parsing
  // Handles variations/options
}

// eBay scraper
class EbayScraper implements ProductScraper {
  // Uses eBay API for better reliability
  // Handles auctions vs fixed price
}

// Scraper registry
const scrapers = [
  new AmazonScraper(),
  new AliExpressScraper(),
  new EbayScraper(),
];

// Get scraper for URL
function getScraperForUrl(url: string): ProductScraper | null {
  return scrapers.find(s => s.canHandle(url)) || null;
}
```

### 13.5 Export APIs

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/export/products` | Export products | Admin |
| GET | `/api/admin/export/orders` | Export orders | Admin |
| GET | `/api/admin/export/customers` | Export customers | Admin |
| GET | `/api/admin/export/analytics` | Export analytics | Admin |
| GET | `/api/admin/export/jobs` | List export jobs | Admin |
| GET | `/api/admin/export/jobs/:id` | Get export file | Admin |

### 13.6 Export Options

```typescript
// Export request
{
  format: 'csv' | 'xlsx' | 'json';

  // Filters (same as list endpoints)
  filters?: Record<string, any>;

  // Fields to include
  fields?: string[];

  // Date range
  startDate?: string;
  endDate?: string;
}

// Export job response
{
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  type: 'products' | 'orders' | 'customers' | 'analytics';
  format: string;
  recordCount?: number;
  fileUrl?: string;                // Download URL
  expiresAt?: string;              // URL expiration
  createdAt: string;
  completedAt?: string;
}
```

---

## 14. Backup & Recovery APIs

### 14.1 Backup Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/backup/list` | List backups | Admin |
| POST | `/api/admin/backup/create` | Create backup | Admin |
| GET | `/api/admin/backup/:id` | Download backup | Admin |
| DELETE | `/api/admin/backup/:id` | Delete backup | Admin |
| POST | `/api/admin/backup/:id/restore` | Restore backup | Admin |
| GET | `/api/admin/backup/schedule` | Get schedule | Admin |
| PUT | `/api/admin/backup/schedule` | Set schedule | Admin |

### 14.2 Backup Types

```typescript
// Backup types
{
  type: 'full' | 'incremental' | 'data_only' | 'media_only';

  // Full: Complete database + media
  // Incremental: Changes since last backup
  // Data only: Database without media
  // Media only: Images and files only
}

// Backup response
{
  id: string;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  size: number;                    // Bytes
  fileUrl?: string;
  expiresAt?: string;
  createdAt: string;
  completedAt?: string;

  // Contents
  tables: string[];
  recordCounts: Record<string, number>;
  mediaCount?: number;
}
```

### 14.3 Backup Schedule

```typescript
// Schedule configuration
{
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;                    // HH:MM UTC
  dayOfWeek?: number;              // 0-6 for weekly
  dayOfMonth?: number;             // 1-31 for monthly
  type: 'full' | 'incremental';
  retention: number;               // Days to keep
  notifyOnComplete: boolean;
  notifyOnFailure: boolean;
  notificationEmail?: string;
}
```

### 14.4 Backup Strategy

```typescript
// Recommended backup strategy
{
  // Daily incremental at 2 AM
  daily: {
    frequency: 'daily',
    time: '02:00',
    type: 'incremental',
    retention: 7,
  },

  // Weekly full on Sunday at 3 AM
  weekly: {
    frequency: 'weekly',
    time: '03:00',
    dayOfWeek: 0,
    type: 'full',
    retention: 30,
  },

  // Monthly full on 1st at 4 AM
  monthly: {
    frequency: 'monthly',
    time: '04:00',
    dayOfMonth: 1,
    type: 'full',
    retention: 365,
  },
}
```

### 14.5 Restore Process

```typescript
// Restore request
{
  backupId: string;
  options: {
    tables?: string[];             // Specific tables only
    overwrite: boolean;            // Overwrite existing data
    dryRun?: boolean;              // Validate only
  };
}

// Restore process
1. Validate backup file integrity
2. Create pre-restore backup
3. Stop incoming requests (maintenance mode)
4. Restore database tables
5. Restore media files (if included)
6. Validate restored data
7. Resume operations
8. Send notification

// Restore response
{
  status: 'success' | 'partial' | 'failed';
  restoredTables: string[];
  restoredRecords: Record<string, number>;
  skippedRecords: Record<string, number>;
  errors?: string[];
  preRestoreBackupId: string;
}
```

---

## 15. File Upload APIs

### 15.1 Upload Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/upload/image` | Upload single image | Admin |
| POST | `/api/upload/images` | Upload multiple images | Admin |
| POST | `/api/upload/file` | Upload file (PDF, etc.) | Admin |
| DELETE | `/api/upload/:fileId` | Delete file | Admin |
| GET | `/api/upload/auth` | Get ImageKit auth params | Admin |

### 15.2 Upload Configuration

```typescript
// Image upload options
{
  folder?: string;                 // ImageKit folder
  fileName?: string;               // Custom filename
  tags?: string[];
  useUniqueFileName?: boolean;     // Default: true

  // Transformations
  transformation?: {
    width?: number;
    height?: number;
    quality?: number;              // 1-100
    format?: 'jpg' | 'png' | 'webp';
  };
}

// Upload response
{
  fileId: string;
  name: string;
  url: string;
  thumbnailUrl: string;
  size: number;
  width?: number;
  height?: number;
  fileType: string;
}

// Allowed file types
{
  images: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  documents: ['application/pdf'],
  maxSize: {
    image: 5 * 1024 * 1024,        // 5MB
    document: 10 * 1024 * 1024,    // 10MB
  },
}
```

### 15.3 Client-Side Upload (ImageKit)

```typescript
// Get auth parameters for client-side upload
GET /api/upload/auth
Response: {
  token: string;
  expire: number;
  signature: string;
  publicKey: string;
  urlEndpoint: string;
}

// Client uses ImageKit SDK with these params
```

---

## 16. Email & Notification APIs

### 16.1 Email Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/admin/email/send` | Send custom email | Admin |
| POST | `/api/admin/email/test` | Send test email | Admin |
| GET | `/api/admin/email/templates` | List templates | Admin |
| PUT | `/api/admin/email/templates/:id` | Update template | Admin |
| POST | `/api/admin/email/templates/:id/preview` | Preview template | Admin |

### 16.2 Email Templates

```typescript
// Template types
[
  'order_confirmation',
  'order_shipped',
  'order_delivered',
  'order_cancelled',
  'password_reset',
  'email_verification',
  'welcome',
  'quotation',
  'invoice',
  'low_stock_alert',
  'contact_form',
]

// Template structure
{
  id: string;
  type: string;
  name: string;
  subject: string;
  htmlBody: string;                // Handlebars template
  textBody?: string;
  variables: string[];             // Available variables
  isActive: boolean;
}

// Example variables
{
  order: {
    orderNumber, status, total, items[],
    shippingAddress, trackingNumber
  },
  customer: {
    firstName, lastName, email
  },
  store: {
    name, email, phone, address
  },
}
```

### 16.3 Notification Events

```typescript
// Automatic notifications
{
  // Order events
  'order.created': ['customer_email', 'admin_email'],
  'order.confirmed': ['customer_email'],
  'order.shipped': ['customer_email'],
  'order.delivered': ['customer_email'],
  'order.cancelled': ['customer_email', 'admin_email'],

  // Stock events
  'product.low_stock': ['admin_email'],
  'product.out_of_stock': ['admin_email'],

  // Customer events
  'customer.registered': ['customer_email'],
  'customer.password_reset': ['customer_email'],

  // Quotation events
  'quotation.created': [],
  'quotation.sent': ['customer_email'],

  // Contact form
  'contact.submitted': ['admin_email'],
}
```

---

## 17. Implementation Priority

### Phase 1: Core APIs (Week 1-2)

**Already Completed:**
- [x] Authentication APIs (basic)
- [x] Products CRUD
- [x] Categories CRUD
- [x] Cart APIs
- [x] Orders (create, list, track)
- [x] Pricing Service

**To Complete:**
```
Priority 1 (Critical for launch):
├── Auth - Password reset flow
├── Auth - Email verification
├── Products - Bulk operations
├── Products - Stock management
├── Orders - Full admin management
├── Orders - Invoice PDF generation
├── Customers - Full CRUD
├── Settings - Core settings
└── Upload - Image upload
```

### Phase 2: Business Features (Week 3-4)

```
Priority 2 (Important for operations):
├── Promo Codes - Full implementation
├── Quotations - Full implementation
├── Blogs - Full implementation
├── Email - Templates & notifications
├── Settings - Email configuration
├── Settings - Tax configuration
└── Analytics - Basic dashboard
```

### Phase 3: Advanced Features (Week 5-6)

```
Priority 3 (Enhanced functionality):
├── Import - URL scraping (Amazon, AliExpress, eBay)
├── Import - CSV import
├── Export - Products, Orders, Customers
├── Analytics - Full analytics suite
├── Backup - Automated backups
└── Activity Logs - Admin actions
```

### Phase 4: Polish & Optimization (Week 7+)

```
Priority 4 (Nice to have):
├── Wishlist
├── Product reviews
├── Advanced shipping rules
├── Multi-currency
├── Scheduled reports
└── Performance optimization
```

---

## API Checklist

### For Each API Endpoint:

- [ ] Route definition
- [ ] Input validation (Zod schema)
- [ ] Authentication check
- [ ] Authorization check
- [ ] Rate limiting
- [ ] Error handling
- [ ] Response formatting
- [ ] Database queries (optimized)
- [ ] Logging
- [ ] Unit tests
- [ ] Integration tests
- [ ] Documentation

### Security Checklist:

- [ ] SQL injection prevention (Drizzle ORM)
- [ ] XSS prevention (sanitize HTML)
- [ ] CSRF protection
- [ ] Rate limiting applied
- [ ] Input validation
- [ ] Output encoding
- [ ] Secure headers (Helmet)
- [ ] CORS configured
- [ ] Sensitive data not logged
- [ ] Errors don't leak info

---

## File Structure for Remaining APIs

```
apps/api/src/
├── routes/
│   ├── auth.routes.ts           ✅ Created
│   ├── products.routes.ts       ✅ Created
│   ├── categories.routes.ts     ✅ Created
│   ├── cart.routes.ts           ✅ Created
│   ├── orders.routes.ts         ✅ Created
│   ├── customers.routes.ts      📝 To create
│   ├── promoCodes.routes.ts     📝 To create
│   ├── quotations.routes.ts     📝 To create
│   ├── blogs.routes.ts          📝 To create
│   ├── settings.routes.ts       📝 To create
│   ├── analytics.routes.ts      📝 To create
│   ├── import.routes.ts         📝 To create
│   ├── export.routes.ts         📝 To create
│   ├── backup.routes.ts         📝 To create
│   ├── upload.routes.ts         📝 To create
│   └── contact.routes.ts        📝 To create
│
├── services/
│   ├── pricing.service.ts       ✅ Created
│   ├── email.service.ts         📝 To create
│   ├── pdf.service.ts           📝 To create
│   ├── analytics.service.ts     📝 To create
│   ├── import.service.ts        📝 To create
│   ├── export.service.ts        📝 To create
│   ├── backup.service.ts        📝 To create
│   └── upload.service.ts        📝 To create
│
├── scrapers/
│   ├── base.scraper.ts          📝 To create
│   ├── amazon.scraper.ts        📝 To create
│   ├── aliexpress.scraper.ts    📝 To create
│   └── ebay.scraper.ts          📝 To create
│
└── templates/
    ├── orderConfirmation.ts     📝 To create
    ├── invoice.ts               📝 To create
    ├── quotation.ts             📝 To create
    └── passwordReset.ts         📝 To create
```

---

**Last Updated:** 2025-12-28
**Total Endpoints Planned:** 150+
**Completed:** ~25 (Core foundation)
**Remaining:** ~125 (To be implemented)
