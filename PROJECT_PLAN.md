# Lab404Electronics - Project Implementation Plan

## Project Overview

**Project Name:** Lab404Electronics E-commerce Platform
**Version:** 2.0 (Complete Redesign)
**Last Updated:** 2025-12-28
**Status:** Planning Phase

### Project Components
1. **Backend API** - Node.js/Next.js API routes with NeonDB
2. **Admin Dashboard** - Next.js application for store management
3. **Customer Website** - Frontend (managed by Antigravity AI)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND LAYER                           │
├─────────────────────────────┬───────────────────────────────────┤
│   Customer Website          │      Admin Dashboard              │
│   (Antigravity AI)          │      (Claude Code)                │
│   - Home                    │      - Product Management         │
│   - Products                │      - Order Management           │
│   - About                   │      - Customer Management        │
│   - Contact Us              │      - Promo Codes                │
│   - Blogs                   │      - Quotations                 │
│   - Cart                    │      - Analytics                  │
│   - Checkout                │      - Settings                   │
└─────────────────────────────┴───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND API LAYER                           │
│                       (Express.js)                              │
├─────────────────────────────────────────────────────────────────┤
│  Authentication │ Products │ Orders │ Customers │ Analytics     │
│  (Neon Auth)    │   API    │  API   │    API    │    API        │
├─────────────────────────────────────────────────────────────────┤
│  Product Import │ Quotations │ Promo Codes │ Blogs │ Settings   │
│  (Amazon/Ali/eBay)│   API    │     API     │  API  │    API     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES                          │
├──────────────┬──────────────┬──────────────┬────────────────────┤
│   NeonDB     │  ImageKit.io │   Stripe     │   Nodemailer       │
│ (PostgreSQL) │   (Media)    │  (Payments)  │    (Email)         │
└──────────────┴──────────────┴──────────────┴────────────────────┘
```

---

## Configuration Settings

### Currency & Localization
| Setting | Value |
|---------|-------|
| Default Currency | USD |
| Multi-Currency Support | Yes |
| Supported Currencies | USD, EUR, GBP, AED, etc. |
| Shipping Regions | Worldwide |

### Product Import Sources
| Source | Status | Notes |
|--------|--------|-------|
| Amazon | Supported | Product data scraping |
| AliExpress | Supported | Product data scraping |
| eBay | Supported | Product data scraping |

### Payment Methods
| Method | Status | Notes |
|--------|--------|-------|
| Cash on Delivery | Active | Default payment method |
| Stripe | Future | Credit/debit cards |

---

## Recommended Additional Features

Based on best practices for e-commerce platforms, the following features are recommended:

### Admin Features (Claude Code)

| Feature | Priority | Description |
|---------|----------|-------------|
| **Inventory Alerts** | High | Email notifications when stock falls below threshold |
| **Bulk Product Operations** | High | Import/export products via CSV |
| **Order Invoice PDF** | High | Generate and email invoice PDFs |
| **Activity Log** | Medium | Track all admin actions for audit |
| **Dashboard Widgets** | Medium | Customizable dashboard with key metrics |
| **Email Templates** | Medium | Customizable email templates for notifications |
| **Backup & Export** | Medium | Export database/orders for backup |
| **Multi-Admin Roles** | Low | Different permission levels for staff |
| **Scheduled Reports** | Low | Automated weekly/monthly reports |

### Customer Website Features (Antigravity AI)

| Feature | Priority | Description |
|---------|----------|-------------|
| **Wishlist** | High | Save products for later |
| **Product Reviews** | High | Customer ratings and reviews |
| **Recently Viewed** | Medium | Track and display recently viewed products |
| **Product Comparison** | Medium | Compare multiple products side by side |
| **Newsletter Signup** | Medium | Email subscription with discount |
| **Social Sharing** | Low | Share products on social media |
| **Quick View Modal** | Low | Preview product without leaving page |

### Future Enhancements

| Feature | Timeline | Description |
|---------|----------|-------------|
| **Live Chat** | Phase 2 | Customer support chat integration |
| **Multi-language** | Phase 2 | Arabic/English language support |
| **Mobile App** | Phase 3 | React Native mobile application |
| **Loyalty Program** | Phase 3 | Points and rewards system |
| **Subscriptions** | Phase 3 | Recurring product subscriptions |

---

## Technology Stack

### Backend API (Express.js)
| Component | Technology | Purpose |
|-----------|------------|---------|
| Framework | Express.js | REST API server |
| Language | TypeScript | Type safety |
| Database | NeonDB (PostgreSQL) | Data storage |
| Authentication | Neon Auth | User authentication |
| ORM | Drizzle ORM | Database queries |
| Validation | Zod | Schema validation |
| File Storage | ImageKit.io | Images, PDFs |
| Email | Nodemailer + SMTP | Notifications |
| PDF Generation | @react-pdf/renderer | Quotations |
| Payment (Future) | Stripe | Payment processing |

### Admin Dashboard (Next.js)
| Component | Technology | Purpose |
|-----------|------------|---------|
| Framework | Next.js 15 | Admin interface |
| Language | TypeScript | Type safety |
| Styling | Tailwind CSS + shadcn/ui | UI components |
| State | React Query | Server state |
| Forms | React Hook Form + Zod | Form handling |

### Customer Website (Antigravity AI)
| Component | Technology | Purpose |
|-----------|------------|---------|
| Framework | Next.js 15 | Frontend framework |
| Styling | Tailwind CSS | Styling |
| State | Zustand/React Query | State management |
| Forms | React Hook Form + Zod | Form handling |

---

## Database Schema

### Core Tables

```sql
-- Users (managed by Neon Auth)
-- Extended with custom profile data

-- Categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  image_url VARCHAR(500),
  parent_id UUID REFERENCES categories(id),
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  short_description VARCHAR(500),
  category_id UUID REFERENCES categories(id),
  brand VARCHAR(255),

  -- Pricing (base price only, calculations done in backend)
  base_price DECIMAL(10,2) NOT NULL,
  cost_price DECIMAL(10,2),
  compare_at_price DECIMAL(10,2),

  -- Inventory
  stock_quantity INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 5,
  track_inventory BOOLEAN DEFAULT true,
  allow_backorder BOOLEAN DEFAULT false,

  -- Media
  images JSONB DEFAULT '[]',
  thumbnail_url VARCHAR(500),

  -- SEO
  meta_title VARCHAR(255),
  meta_description VARCHAR(500),

  -- Status
  status VARCHAR(50) DEFAULT 'draft', -- draft, active, archived
  is_featured BOOLEAN DEFAULT false,

  -- Import tracking
  imported_from VARCHAR(255),
  external_url VARCHAR(500),

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Product Variants (for products with options)
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  sku VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  options JSONB NOT NULL, -- {"color": "Red", "size": "Large"}
  base_price DECIMAL(10,2) NOT NULL,
  stock_quantity INTEGER DEFAULT 0,
  image_url VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Customers (extended from Neon Auth users)
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id VARCHAR(255) UNIQUE, -- Neon Auth user ID (null for guests)
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(50),

  -- Default addresses stored as JSONB
  default_shipping_address JSONB,
  default_billing_address JSONB,

  -- Customer data
  is_guest BOOLEAN DEFAULT false,
  accepts_marketing BOOLEAN DEFAULT false,
  notes TEXT,
  tags VARCHAR(255)[],

  -- Stats (calculated, not stored totals)
  order_count INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Addresses
CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- shipping, billing
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  company VARCHAR(255),
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100) NOT NULL,
  phone VARCHAR(50),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) UNIQUE NOT NULL, -- LAB-2025-0001
  customer_id UUID REFERENCES customers(id),

  -- Status tracking
  status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, processing, shipped, delivered, cancelled
  payment_status VARCHAR(50) DEFAULT 'pending', -- pending, paid, refunded, failed

  -- Addresses (snapshot at time of order)
  shipping_address JSONB NOT NULL,
  billing_address JSONB NOT NULL,

  -- Pricing stored as snapshot (calculated at checkout time)
  currency VARCHAR(3) DEFAULT 'USD',
  subtotal_snapshot DECIMAL(10,2) NOT NULL,
  tax_rate_snapshot DECIMAL(5,4) NOT NULL, -- e.g., 0.1100 for 11%
  tax_amount_snapshot DECIMAL(10,2) NOT NULL,
  shipping_amount_snapshot DECIMAL(10,2) DEFAULT 0,
  discount_amount_snapshot DECIMAL(10,2) DEFAULT 0,
  total_snapshot DECIMAL(10,2) NOT NULL,

  -- Promo code used
  promo_code_id UUID REFERENCES promo_codes(id),
  promo_code_snapshot VARCHAR(50),

  -- Payment
  payment_method VARCHAR(50) DEFAULT 'cod', -- cod, stripe, paypal

  -- Shipping
  shipping_method VARCHAR(100),
  tracking_number VARCHAR(255),
  shipped_at TIMESTAMP,
  delivered_at TIMESTAMP,

  -- Notes
  customer_notes TEXT,
  admin_notes TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Order Items
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),

  -- Snapshot data (in case product changes later)
  product_name_snapshot VARCHAR(255) NOT NULL,
  sku_snapshot VARCHAR(100) NOT NULL,
  variant_options_snapshot JSONB,

  quantity INTEGER NOT NULL,
  unit_price_snapshot DECIMAL(10,2) NOT NULL,

  created_at TIMESTAMP DEFAULT NOW()
);

-- Promo Codes
CREATE TABLE promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,

  -- Discount type
  discount_type VARCHAR(20) NOT NULL, -- percentage, fixed_amount
  discount_value DECIMAL(10,2) NOT NULL,

  -- Constraints
  minimum_order_amount DECIMAL(10,2),
  maximum_discount_amount DECIMAL(10,2),
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  usage_limit_per_customer INTEGER DEFAULT 1,

  -- Validity
  starts_at TIMESTAMP,
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,

  -- Restrictions
  applies_to_products UUID[], -- null means all products
  applies_to_categories UUID[], -- null means all categories
  customer_ids UUID[], -- null means all customers

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Quotations
CREATE TABLE quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_number VARCHAR(50) UNIQUE NOT NULL, -- QUO-2025-0001
  customer_id UUID REFERENCES customers(id),

  -- Customer info (for non-registered customers)
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),
  customer_company VARCHAR(255),
  customer_address JSONB,

  -- Status
  status VARCHAR(50) DEFAULT 'draft', -- draft, sent, accepted, rejected, expired

  -- Validity
  valid_until TIMESTAMP,

  -- Pricing (calculated at generation time)
  currency VARCHAR(3) DEFAULT 'USD',
  subtotal DECIMAL(10,2) NOT NULL,
  tax_rate DECIMAL(5,4),
  tax_amount DECIMAL(10,2),
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,

  -- Notes
  notes TEXT,
  terms_and_conditions TEXT,

  -- PDF
  pdf_url VARCHAR(500),

  -- Converted to order
  converted_to_order_id UUID REFERENCES orders(id),

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Quotation Items
CREATE TABLE quotation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID REFERENCES quotations(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),

  -- Item details (can be custom items not in catalog)
  name VARCHAR(255) NOT NULL,
  description TEXT,
  sku VARCHAR(100),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,

  created_at TIMESTAMP DEFAULT NOW()
);

-- Blogs
CREATE TABLE blogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt VARCHAR(500),
  featured_image_url VARCHAR(500),

  author_id UUID, -- Admin user ID
  author_name VARCHAR(255),

  status VARCHAR(50) DEFAULT 'draft', -- draft, published, archived
  published_at TIMESTAMP,

  -- SEO
  meta_title VARCHAR(255),
  meta_description VARCHAR(500),
  tags VARCHAR(100)[],

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Settings
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Admin Activity Log
CREATE TABLE admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id VARCHAR(255) NOT NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID,
  details JSONB,
  ip_address VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Product Import Jobs
CREATE TABLE product_import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source VARCHAR(100) NOT NULL, -- amazon, aliexpress, etc.
  source_url VARCHAR(500) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
  imported_product_id UUID REFERENCES products(id),
  error_message TEXT,
  raw_data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);
```

---

## API Endpoints Documentation

### Base URL
```
Production: https://api.lab404electronics.com
Development: http://localhost:3000/api
```

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new customer | No |
| POST | `/api/auth/login` | Login customer | No |
| POST | `/api/auth/logout` | Logout customer | Yes |
| GET | `/api/auth/me` | Get current user | Yes |
| POST | `/api/auth/forgot-password` | Request password reset | No |
| POST | `/api/auth/reset-password` | Reset password | No |
| POST | `/api/auth/admin/login` | Admin login | No |

### Products Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/products` | List products (paginated) | No |
| GET | `/api/products/:slug` | Get product by slug | No |
| GET | `/api/products/featured` | Get featured products | No |
| GET | `/api/products/search` | Search products | No |
| POST | `/api/admin/products` | Create product | Admin |
| PUT | `/api/admin/products/:id` | Update product | Admin |
| DELETE | `/api/admin/products/:id` | Delete product | Admin |
| POST | `/api/admin/products/import` | Import product from URL | Admin |

### Categories Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/categories` | List all categories | No |
| GET | `/api/categories/:slug` | Get category with products | No |
| POST | `/api/admin/categories` | Create category | Admin |
| PUT | `/api/admin/categories/:id` | Update category | Admin |
| DELETE | `/api/admin/categories/:id` | Delete category | Admin |

### Cart Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/cart` | Get cart | No* |
| POST | `/api/cart/items` | Add item to cart | No* |
| PUT | `/api/cart/items/:id` | Update cart item | No* |
| DELETE | `/api/cart/items/:id` | Remove cart item | No* |
| POST | `/api/cart/apply-promo` | Apply promo code | No* |
| DELETE | `/api/cart/promo` | Remove promo code | No* |
| GET | `/api/cart/calculate` | Calculate cart totals | No* |

*Cart identified by session token or user ID

### Order Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/orders` | Create order (checkout) | No* |
| GET | `/api/orders` | List customer orders | Yes |
| GET | `/api/orders/:id` | Get order details | Yes |
| GET | `/api/orders/track/:orderNumber` | Track order by number | No |
| GET | `/api/admin/orders` | List all orders | Admin |
| PUT | `/api/admin/orders/:id` | Update order status | Admin |
| PUT | `/api/admin/orders/:id/ship` | Mark as shipped | Admin |

### Customer Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/customers/me` | Get customer profile | Yes |
| PUT | `/api/customers/me` | Update profile | Yes |
| GET | `/api/customers/me/addresses` | Get addresses | Yes |
| POST | `/api/customers/me/addresses` | Add address | Yes |
| PUT | `/api/customers/me/addresses/:id` | Update address | Yes |
| DELETE | `/api/customers/me/addresses/:id` | Delete address | Yes |
| GET | `/api/admin/customers` | List all customers | Admin |
| GET | `/api/admin/customers/:id` | Get customer details | Admin |
| PUT | `/api/admin/customers/:id` | Update customer | Admin |

### Promo Code Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/promo-codes/validate` | Validate promo code | No |
| GET | `/api/admin/promo-codes` | List all promo codes | Admin |
| POST | `/api/admin/promo-codes` | Create promo code | Admin |
| PUT | `/api/admin/promo-codes/:id` | Update promo code | Admin |
| DELETE | `/api/admin/promo-codes/:id` | Delete promo code | Admin |

### Quotation Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/admin/quotations` | List all quotations | Admin |
| GET | `/api/admin/quotations/:id` | Get quotation details | Admin |
| POST | `/api/admin/quotations` | Create quotation | Admin |
| PUT | `/api/admin/quotations/:id` | Update quotation | Admin |
| DELETE | `/api/admin/quotations/:id` | Delete quotation | Admin |
| POST | `/api/admin/quotations/:id/send` | Send quotation email | Admin |
| GET | `/api/admin/quotations/:id/pdf` | Generate PDF | Admin |
| POST | `/api/admin/quotations/:id/convert` | Convert to order | Admin |

### Blog Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/blogs` | List published blogs | No |
| GET | `/api/blogs/:slug` | Get blog by slug | No |
| GET | `/api/admin/blogs` | List all blogs | Admin |
| POST | `/api/admin/blogs` | Create blog | Admin |
| PUT | `/api/admin/blogs/:id` | Update blog | Admin |
| DELETE | `/api/admin/blogs/:id` | Delete blog | Admin |

### Settings Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/settings/public` | Get public settings | No |
| GET | `/api/admin/settings` | Get all settings | Admin |
| PUT | `/api/admin/settings/:key` | Update setting | Admin |

### Analytics Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/admin/analytics/overview` | Dashboard overview | Admin |
| GET | `/api/admin/analytics/sales` | Sales analytics | Admin |
| GET | `/api/admin/analytics/products` | Product analytics | Admin |
| GET | `/api/admin/analytics/customers` | Customer analytics | Admin |
| GET | `/api/admin/analytics/orders` | Order analytics | Admin |

---

## API Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

### Cart Calculation Response
```json
{
  "success": true,
  "data": {
    "items": [...],
    "itemCount": 3,
    "subtotal": 299.97,
    "taxRate": 0.11,
    "taxAmount": 32.99,
    "shippingAmount": 0,
    "discountAmount": 29.99,
    "promoCode": "SAVE10",
    "total": 302.97,
    "currency": "USD"
  }
}
```

---

## Price Calculation Rules

### CRITICAL: All calculations MUST be done in the backend

```typescript
// Backend calculation service - prices.service.ts

interface CartCalculation {
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  total: number;
}

function calculateCartTotals(
  items: CartItem[],
  taxRate: number,
  promoCode?: PromoCode,
  shippingMethod?: ShippingMethod
): CartCalculation {
  // 1. Calculate subtotal from current product prices (not stored prices)
  const subtotal = items.reduce((sum, item) => {
    const product = getProductCurrentPrice(item.productId, item.variantId);
    return sum + (product.price * item.quantity);
  }, 0);

  // 2. Apply promo code discount
  let discountAmount = 0;
  if (promoCode && isPromoCodeValid(promoCode)) {
    if (promoCode.discountType === 'percentage') {
      discountAmount = subtotal * (promoCode.discountValue / 100);
      if (promoCode.maximumDiscountAmount) {
        discountAmount = Math.min(discountAmount, promoCode.maximumDiscountAmount);
      }
    } else {
      discountAmount = promoCode.discountValue;
    }
  }

  // 3. Calculate taxable amount (after discount)
  const taxableAmount = subtotal - discountAmount;

  // 4. Calculate tax
  const taxAmount = taxableAmount * taxRate;

  // 5. Calculate shipping
  const shippingAmount = shippingMethod?.price || 0;

  // 6. Calculate total
  const total = taxableAmount + taxAmount + shippingAmount;

  return {
    subtotal: round(subtotal, 2),
    taxRate,
    taxAmount: round(taxAmount, 2),
    shippingAmount: round(shippingAmount, 2),
    discountAmount: round(discountAmount, 2),
    total: round(total, 2),
  };
}
```

### What gets stored vs calculated:

| Data | Stored | Calculated |
|------|--------|------------|
| Product base price | Yes | - |
| Cart item prices | No | Yes (real-time) |
| Cart totals | No | Yes (real-time) |
| Order totals | Yes* | - |

*Order totals are calculated at checkout time and stored as snapshots

---

## Parallel Development Tasks

See `TASK_TRACKER.md` for detailed task assignments and status.

