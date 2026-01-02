# Lab404 Electronics API Documentation

**Version:** 1.0.0
**Base URL:** `http://localhost:4000/api` (Development) | `https://api.lab404.com/api` (Production)
**Last Updated:** December 28, 2024

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Response Format](#response-format)
4. [Error Handling](#error-handling)
5. [Rate Limiting](#rate-limiting)
6. [Endpoints](#endpoints)
   - [Health](#health)
   - [Authentication](#authentication-endpoints)
   - [Products](#products)
   - [Categories](#categories)
   - [Cart](#cart)
   - [Orders](#orders)
   - [Customers](#customers)
   - [Promo Codes](#promo-codes)
   - [Blogs](#blogs)
   - [Settings](#settings)
   - [Contact](#contact)
   - [Admin](#admin-endpoints)

---

## Overview

The Lab404 Electronics API is a RESTful API built with Express.js and TypeScript. It uses:
- **Database:** NeonDB (PostgreSQL)
- **ORM:** Drizzle ORM
- **Authentication:** JWT tokens
- **Validation:** Zod schemas

### Headers

All requests should include:
```
Content-Type: application/json
```

Authenticated requests should include:
```
Authorization: Bearer <token>
```

---

## Authentication

### JWT Token Structure

Tokens are valid for **7 days** and contain:
- `customerId` or `adminId`
- `email`
- `role` ("customer" or "admin")
- `exp` (expiration timestamp)

### Token Usage

Include the token in the Authorization header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Response Format

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
    "message": "Validation failed",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ]
  }
}
```

---

## Error Handling

| Status Code | Error Code | Description |
|-------------|------------|-------------|
| 400 | BAD_REQUEST | Invalid request data |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Resource not found |
| 409 | CONFLICT | Resource already exists |
| 422 | VALIDATION_ERROR | Input validation failed |
| 429 | RATE_LIMIT | Too many requests |
| 500 | INTERNAL_ERROR | Server error |

---

## Rate Limiting

| Endpoint | Limit |
|----------|-------|
| `/auth/login` | 5 requests per 15 minutes |
| `/auth/register` | 5 requests per 15 minutes |
| `/contact` | 5 requests per 15 minutes |
| All other endpoints | 100 requests per 15 minutes |

---

## Endpoints

---

## Health

### GET /health
Check API health status.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2024-12-28T12:00:00.000Z",
    "uptime": 3600
  }
}
```

### GET /api/health/db
Check database health (Admin only).

**Response:**
```json
{
  "success": true,
  "data": {
    "connected": true,
    "latency": 15,
    "version": "PostgreSQL 15.4",
    "tables": ["products", "categories", ...]
  }
}
```

---

## Authentication Endpoints

### POST /api/auth/register
Register a new customer account.

**Request Body:**
```json
{
  "email": "customer@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "acceptsMarketing": true
}
```

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- Cannot be a common password (123456, password, etc.)

**Response (201):**
```json
{
  "success": true,
  "data": {
    "customer": {
      "id": "uuid",
      "email": "customer@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "expiresAt": "2024-01-04T12:00:00.000Z"
  }
}
```

### POST /api/auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "customer@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "customer": {
      "id": "uuid",
      "email": "customer@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "expiresAt": "2024-01-04T12:00:00.000Z"
  }
}
```

### GET /api/auth/me
Get current user profile. **Requires Authentication.**

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "customer@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "customer"
  }
}
```

### POST /api/auth/logout
Logout current user. **Requires Authentication.**

**Response (204):** No content

---

## Products

### GET /api/products
List all active products with pagination and filtering.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page (max 100) |
| search | string | - | Search in name/description |
| category | string | - | Filter by category slug |
| minPrice | number | - | Minimum price |
| maxPrice | number | - | Maximum price |
| inStock | boolean | - | Filter by stock availability |
| sortBy | string | createdAt | Sort field |
| sortOrder | string | desc | Sort direction (asc/desc) |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Arduino Uno R3",
      "slug": "arduino-uno-r3",
      "sku": "ARD-UNO-001",
      "description": "Microcontroller board...",
      "shortDescription": "Popular microcontroller",
      "price": "24.99",
      "compareAtPrice": "29.99",
      "costPrice": "15.00",
      "stockQuantity": 150,
      "lowStockThreshold": 10,
      "status": "active",
      "featured": true,
      "images": [
        { "url": "https://...", "alt": "Arduino Uno", "isPrimary": true }
      ],
      "categoryId": "uuid",
      "category": { "id": "uuid", "name": "Microcontrollers", "slug": "microcontrollers" },
      "variants": [],
      "createdAt": "2024-12-28T12:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### GET /api/products/:slug
Get a single product by slug.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Arduino Uno R3",
    "slug": "arduino-uno-r3",
    "sku": "ARD-UNO-001",
    "description": "Full description...",
    "specifications": {
      "voltage": "5V",
      "memory": "32KB"
    },
    "variants": [
      {
        "id": "uuid",
        "name": "With Cable",
        "sku": "ARD-UNO-001-C",
        "price": "27.99",
        "stockQuantity": 50,
        "attributes": { "cable": "USB-B" }
      }
    ],
    "relatedProducts": [...]
  }
}
```

### GET /api/products/featured
Get featured products.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| limit | number | 8 | Number of products |

### POST /api/products
Create a new product. **Admin only.**

**Request Body:**
```json
{
  "name": "New Product",
  "sku": "PROD-001",
  "description": "Product description",
  "price": "49.99",
  "compareAtPrice": "59.99",
  "costPrice": "25.00",
  "stockQuantity": 100,
  "categoryId": "uuid",
  "status": "active",
  "featured": false,
  "images": [
    { "url": "https://...", "alt": "Image", "isPrimary": true }
  ],
  "specifications": { "key": "value" }
}
```

### PUT /api/products/:id
Update a product. **Admin only.**

### DELETE /api/products/:id
Delete a product. **Admin only.**

---

## Categories

### GET /api/categories
List all categories in tree structure.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Electronics",
      "slug": "electronics",
      "description": "Electronic components",
      "imageUrl": "https://...",
      "parentId": null,
      "sortOrder": 1,
      "productCount": 150,
      "children": [
        {
          "id": "uuid",
          "name": "Microcontrollers",
          "slug": "microcontrollers",
          "parentId": "uuid",
          "productCount": 45
        }
      ]
    }
  ]
}
```

### GET /api/categories/:slug
Get category by slug with products.

### POST /api/categories
Create category. **Admin only.**

**Request Body:**
```json
{
  "name": "New Category",
  "slug": "new-category",
  "description": "Category description",
  "parentId": null,
  "imageUrl": "https://...",
  "sortOrder": 1
}
```

### PUT /api/categories/:id
Update category. **Admin only.**

### DELETE /api/categories/:id
Delete category. **Admin only.**

---

## Cart

Cart supports both authenticated users and guest sessions via `x-session-id` header.

### GET /api/cart
Get current cart.

**Headers (for guests):**
```
x-session-id: <session-uuid>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "sessionId": "uuid",
    "items": [
      {
        "id": "uuid",
        "productId": "uuid",
        "variantId": null,
        "quantity": 2,
        "product": {
          "name": "Arduino Uno",
          "price": "24.99",
          "image": "https://..."
        }
      }
    ],
    "itemCount": 2
  }
}
```

### GET /api/cart/calculate
Calculate cart totals (CRITICAL - server-side calculation).

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "itemCount": 3,
    "subtotal": 74.97,
    "taxRate": 0.11,
    "taxAmount": 8.25,
    "shippingAmount": 10.00,
    "discountAmount": 5.00,
    "total": 88.22,
    "currency": "USD",
    "promoCode": {
      "code": "SAVE10",
      "discountType": "percentage",
      "discountValue": 10
    }
  }
}
```

### POST /api/cart/items
Add item to cart.

**Request Body:**
```json
{
  "productId": "uuid",
  "variantId": "uuid",
  "quantity": 1
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "cartId": "uuid",
    "productId": "uuid",
    "quantity": 1
  }
}
```

### PUT /api/cart/items/:id
Update cart item quantity.

**Request Body:**
```json
{
  "quantity": 3
}
```

### DELETE /api/cart/items/:id
Remove item from cart.

**Response (204):** No content

### POST /api/cart/apply-promo
Apply promo code to cart.

**Request Body:**
```json
{
  "code": "SAVE10"
}
```

### DELETE /api/cart/promo
Remove promo code from cart.

---

## Orders

### POST /api/orders
Create a new order from cart.

**Request Body:**
```json
{
  "shippingAddress": {
    "firstName": "John",
    "lastName": "Doe",
    "company": "Optional Company",
    "addressLine1": "123 Main St",
    "addressLine2": "Apt 4",
    "city": "New York",
    "state": "NY",
    "postalCode": "10001",
    "country": "US",
    "phone": "+1234567890"
  },
  "billingAddress": {
    "sameAsShipping": true
  },
  "customerEmail": "john@example.com",
  "customerPhone": "+1234567890",
  "notes": "Please leave at door"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "orderNumber": "ORD-20241228-001",
    "status": "pending",
    "paymentStatus": "pending",
    "subtotalSnapshot": 74.97,
    "taxAmountSnapshot": 8.25,
    "shippingAmountSnapshot": 10.00,
    "discountAmountSnapshot": 5.00,
    "totalSnapshot": 88.22,
    "items": [...],
    "createdAt": "2024-12-28T12:00:00.000Z"
  }
}
```

### GET /api/orders
List customer orders. **Requires Authentication.**

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page |
| status | string | - | Filter by status |

### GET /api/orders/:id
Get order details. **Requires Authentication.**

### GET /api/orders/track/:orderNumber
Track order by order number (Public - email verification).

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| email | string | Yes | Customer email for verification |

---

## Customers

### GET /api/customers/me
Get current customer profile. **Requires Authentication.**

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "orderCount": 5,
    "addresses": [...]
  }
}
```

### PUT /api/customers/me
Update customer profile. **Requires Authentication.**

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}
```

### GET /api/customers/me/addresses
Get customer addresses. **Requires Authentication.**

### POST /api/customers/me/addresses
Add new address. **Requires Authentication.**

**Request Body:**
```json
{
  "type": "shipping",
  "isDefault": true,
  "firstName": "John",
  "lastName": "Doe",
  "company": "Optional",
  "addressLine1": "123 Main St",
  "addressLine2": "Apt 4",
  "city": "New York",
  "state": "NY",
  "postalCode": "10001",
  "country": "US",
  "phone": "+1234567890"
}
```

### PUT /api/customers/me/addresses/:id
Update address. **Requires Authentication.**

### DELETE /api/customers/me/addresses/:id
Delete address. **Requires Authentication.**

---

## Promo Codes

### POST /api/promo-codes/validate
Validate a promo code (Public).

**Request Body:**
```json
{
  "code": "SAVE10",
  "subtotal": 100.00
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "code": "SAVE10",
    "discountType": "percentage",
    "discountValue": 10,
    "discountAmount": 10.00,
    "minimumOrder": 50.00
  }
}
```

### GET /api/promo-codes
List all promo codes. **Admin only.**

### POST /api/promo-codes
Create promo code. **Admin only.**

**Request Body:**
```json
{
  "code": "SUMMER20",
  "discountType": "percentage",
  "discountValue": 20,
  "minimumOrder": 50,
  "maxUses": 100,
  "startsAt": "2024-06-01T00:00:00.000Z",
  "expiresAt": "2024-08-31T23:59:59.000Z",
  "isActive": true
}
```

---

## Blogs

### GET /api/blogs
List published blog posts.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page |
| search | string | - | Search in title/excerpt |
| tag | string | - | Filter by tag |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Getting Started with Arduino",
      "slug": "getting-started-with-arduino",
      "excerpt": "Learn how to...",
      "featuredImageUrl": "https://...",
      "tags": ["arduino", "tutorial"],
      "status": "published",
      "publishedAt": "2024-12-28T12:00:00.000Z"
    }
  ],
  "meta": { ... }
}
```

### GET /api/blogs/tags
Get all unique tags.

### GET /api/blogs/:slug
Get blog post by slug.

### GET /api/blogs/:slug/related
Get related blog posts.

### POST /api/blogs
Create blog post. **Admin only.**

**Request Body:**
```json
{
  "title": "New Blog Post",
  "slug": "new-blog-post",
  "excerpt": "Short description",
  "content": "<p>Full HTML content...</p>",
  "featuredImageUrl": "https://...",
  "tags": ["tag1", "tag2"],
  "status": "draft",
  "metaTitle": "SEO Title",
  "metaDescription": "SEO Description"
}
```

### PUT /api/blogs/:id
Update blog post. **Admin only.**

### DELETE /api/blogs/:id
Delete blog post. **Admin only.**

### POST /api/blogs/:id/publish
Publish blog post. **Admin only.**

### POST /api/blogs/:id/unpublish
Unpublish blog post. **Admin only.**

---

## Settings

### GET /api/settings/public
Get public settings (no auth required).

**Response:**
```json
{
  "success": true,
  "data": {
    "company_name": "Lab404 Electronics",
    "company_email": "info@lab404.com",
    "company_phone": "+1234567890",
    "company_logo": "https://...",
    "tax_name": "VAT",
    "free_shipping_threshold": "100",
    "default_shipping_rate": "10",
    "default_currency": "USD",
    "currency_symbol": "$"
  }
}
```

### GET /api/settings
Get all settings organized by category. **Admin only.**

### PUT /api/settings/:key
Update a setting. **Admin only.**

**Request Body:**
```json
{
  "value": "New Value",
  "description": "Optional description"
}
```

### PUT /api/settings
Bulk update settings. **Admin only.**

**Request Body:**
```json
{
  "settings": [
    { "key": "company_name", "value": "Lab404" },
    { "key": "tax_rate", "value": "0.11" }
  ]
}
```

---

## Contact

### POST /api/contact
Submit contact form.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "subject": "Product Inquiry",
  "message": "I would like to know more about..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Thank you for your message. We will respond shortly."
  }
}
```

### POST /api/contact/newsletter
Subscribe to newsletter.

**Request Body:**
```json
{
  "email": "subscriber@example.com",
  "name": "John"
}
```

---

## Admin Endpoints

All admin endpoints require authentication with admin role.

### Analytics

#### GET /api/analytics/dashboard
Get dashboard statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalRevenue": 15000.00,
    "totalOrders": 150,
    "totalCustomers": 500,
    "totalProducts": 200,
    "recentOrders": [...],
    "topProducts": [...],
    "salesByDay": [...]
  }
}
```

### Quotations

#### GET /api/quotations
List all quotations.

#### POST /api/quotations
Create quotation.

#### PUT /api/quotations/:id
Update quotation.

#### POST /api/quotations/:id/send
Send quotation to customer.

#### POST /api/quotations/:id/convert
Convert quotation to order.

### Import/Export

#### GET /api/export/products
Export products as CSV.

#### POST /api/import/products
Import products from CSV.

#### GET /api/import/jobs
Get import job status.

### Admin Activity Logs

#### GET /api/settings/activity-logs
Get admin activity logs.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | number | Page number |
| limit | number | Items per page |
| adminId | uuid | Filter by admin |
| action | string | Filter by action type |
| entityType | string | Filter by entity type |
| startDate | string | Start date (ISO 8601) |
| endDate | string | End date (ISO 8601) |

---

## WebSocket Events (Future)

Coming soon: Real-time updates for order status, inventory changes, etc.

---

## SDK Example (TypeScript)

```typescript
// Example API client usage
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:4000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Set auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Example: Get products
const { data } = await api.get('/products', {
  params: { page: 1, limit: 20, category: 'microcontrollers' }
});

// Example: Add to cart
await api.post('/cart/items', {
  productId: 'uuid',
  quantity: 1
});

// Example: Create order
await api.post('/orders', {
  shippingAddress: { ... },
  customerEmail: 'test@example.com'
});
```

---

## Support

For API support, contact:
- Email: api-support@lab404.com
- Documentation: https://docs.lab404.com

---

*This documentation is auto-generated and maintained by the Lab404 development team.*
