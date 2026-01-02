# Lab404 API Endpoints Quick Reference

Base URL: `http://localhost:4000/api`

## Authentication Legend
- **Public** - No authentication required
- **Auth** - Requires customer JWT token
- **Admin** - Requires admin JWT token

---

## Health & Status
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | Public | API health check |
| GET | `/api/health/db` | Admin | Database health check |

## Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | Public | Register new customer |
| POST | `/api/auth/login` | Public | Login customer |
| GET | `/api/auth/me` | Auth | Get current user |
| POST | `/api/auth/logout` | Auth | Logout |

## Products
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/products` | Public | List products (paginated, filterable) |
| GET | `/api/products/featured` | Public | Get featured products |
| GET | `/api/products/:slug` | Public | Get product by slug |
| POST | `/api/products` | Admin | Create product |
| PUT | `/api/products/:id` | Admin | Update product |
| DELETE | `/api/products/:id` | Admin | Delete product |

## Categories
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/categories` | Public | List all categories (tree) |
| GET | `/api/categories/:slug` | Public | Get category with products |
| POST | `/api/categories` | Admin | Create category |
| PUT | `/api/categories/:id` | Admin | Update category |
| DELETE | `/api/categories/:id` | Admin | Delete category |

## Cart
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/cart` | Public* | Get current cart |
| GET | `/api/cart/calculate` | Public* | Calculate cart totals |
| POST | `/api/cart/items` | Public* | Add item to cart |
| PUT | `/api/cart/items/:id` | Public* | Update cart item quantity |
| DELETE | `/api/cart/items/:id` | Public* | Remove cart item |
| POST | `/api/cart/apply-promo` | Public* | Apply promo code |
| DELETE | `/api/cart/promo` | Public* | Remove promo code |

*Guest carts use `x-session-id` header

## Orders
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/orders` | Public* | Create order from cart |
| GET | `/api/orders` | Auth | List customer orders |
| GET | `/api/orders/:id` | Auth | Get order details |
| GET | `/api/orders/track/:orderNumber` | Public | Track order (requires email) |

## Customers
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/customers/me` | Auth | Get profile |
| PUT | `/api/customers/me` | Auth | Update profile |
| GET | `/api/customers/me/addresses` | Auth | Get addresses |
| POST | `/api/customers/me/addresses` | Auth | Add address |
| PUT | `/api/customers/me/addresses/:id` | Auth | Update address |
| DELETE | `/api/customers/me/addresses/:id` | Auth | Delete address |
| GET | `/api/customers` | Admin | List all customers |
| GET | `/api/customers/:id` | Admin | Get customer details |
| PUT | `/api/customers/:id` | Admin | Update customer |
| DELETE | `/api/customers/:id` | Admin | Deactivate customer |
| GET | `/api/customers/:id/orders` | Admin | Get customer orders |

## Promo Codes
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/promo-codes/validate` | Public | Validate promo code |
| GET | `/api/promo-codes` | Admin | List all promo codes |
| POST | `/api/promo-codes` | Admin | Create promo code |
| PUT | `/api/promo-codes/:id` | Admin | Update promo code |
| DELETE | `/api/promo-codes/:id` | Admin | Delete promo code |

## Blogs
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/blogs` | Public | List published blogs |
| GET | `/api/blogs/tags` | Public | Get all tags |
| GET | `/api/blogs/:slug` | Public | Get blog post |
| GET | `/api/blogs/:slug/related` | Public | Get related posts |
| GET | `/api/blogs/admin/all` | Admin | List all blogs (incl. drafts) |
| POST | `/api/blogs` | Admin | Create blog |
| PUT | `/api/blogs/:id` | Admin | Update blog |
| DELETE | `/api/blogs/:id` | Admin | Delete blog |
| POST | `/api/blogs/:id/publish` | Admin | Publish blog |
| POST | `/api/blogs/:id/unpublish` | Admin | Unpublish blog |
| POST | `/api/blogs/:id/duplicate` | Admin | Duplicate blog |

## Settings
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/settings/public` | Public | Get public settings |
| GET | `/api/settings` | Admin | Get all settings |
| GET | `/api/settings/:key` | Admin | Get single setting |
| PUT | `/api/settings/:key` | Admin | Update setting |
| PUT | `/api/settings` | Admin | Bulk update settings |
| POST | `/api/settings/reset` | Admin | Reset to defaults |
| GET | `/api/settings/activity-logs` | Admin | Get activity logs |

## Contact
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/contact` | Public | Submit contact form |
| POST | `/api/contact/newsletter` | Public | Subscribe to newsletter |

## Analytics (Admin)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/analytics/dashboard` | Admin | Dashboard stats |
| GET | `/api/analytics/sales` | Admin | Sales analytics |
| GET | `/api/analytics/products` | Admin | Product analytics |

## Quotations (Admin)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/quotations` | Admin | List quotations |
| POST | `/api/quotations` | Admin | Create quotation |
| GET | `/api/quotations/:id` | Admin | Get quotation |
| PUT | `/api/quotations/:id` | Admin | Update quotation |
| DELETE | `/api/quotations/:id` | Admin | Delete quotation |
| POST | `/api/quotations/:id/send` | Admin | Send to customer |
| POST | `/api/quotations/:id/convert` | Admin | Convert to order |

## Import/Export (Admin)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/export/products` | Admin | Export products CSV |
| GET | `/api/export/orders` | Admin | Export orders CSV |
| GET | `/api/export/customers` | Admin | Export customers CSV |
| POST | `/api/import/products` | Admin | Import products CSV |
| GET | `/api/import/jobs` | Admin | Get import job status |
| GET | `/api/import/jobs/:id` | Admin | Get specific job |

## Upload
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/upload/auth` | Admin | Get upload credentials |

---

## Common Query Parameters

### Pagination
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)

### Sorting
- `sortBy` - Field to sort by
- `sortOrder` - `asc` or `desc`

### Products Filter
- `search` - Search term
- `category` - Category slug
- `minPrice` / `maxPrice` - Price range
- `inStock` - Boolean

---

## Response Codes
| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Validation Error |
| 429 | Rate Limited |
| 500 | Server Error |
