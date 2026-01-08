# External Integrations

## Database & Cloud Platform

### Neon Database (PostgreSQL)

**Purpose:** Primary database (serverless PostgreSQL)

**Configuration:**
```typescript
DATABASE_URL=postgresql://...
NEON_AUTH_PROJECT_ID=...     // Future auth integration
NEON_AUTH_API_KEY=...        // Future auth integration
```

**Implementation:**
- **Driver:** @neondatabase/serverless 0.9.0
- **ORM:** Drizzle ORM 0.36.0
- **Connection:** Singleton pattern via `packages/database/client.ts`

**Features:**
- Serverless auto-scaling
- Branch-based development
- Migration system via Drizzle Kit
- Seeding capability

**Commands:**
```bash
pnpm db:migrate    # Run migrations
pnpm db:push       # Push schema changes
pnpm db:seed       # Seed database
pnpm db:studio     # Open database studio
```

**Status:** ✅ Active (production)

---

## File Storage & CDN

### ImageKit

**Purpose:** Image hosting, optimization, and transformation

**Configuration:**
```typescript
IMAGEKIT_PUBLIC_KEY=...
IMAGEKIT_PRIVATE_KEY=...
IMAGEKIT_URL_ENDPOINT=...
```

**Implementation:**
- **SDK:** imagekit 5.0.0
- **Location:** `apps/api/src/routes/upload.routes.ts`
- **Client:** Singleton pattern with authentication

**Features:**
- Image upload (base64, URL, file)
- Bulk operations
- Image transformation (resize, crop, quality, format)
- Delete operations
- List uploaded files
- Client-side and server-side upload

**Endpoints:**
- `POST /api/upload` - Upload single image
- `POST /api/upload/bulk` - Upload multiple images
- `DELETE /api/upload/:fileId` - Delete image
- `GET /api/upload` - List images
- `POST /api/upload/transform` - Transform image

**Transformations:**
```typescript
{
  width: number;
  height: number;
  quality: number;
  format: 'jpg' | 'png' | 'webp';
  crop: 'maintain_ratio' | 'force' | 'at_max';
}
```

**Status:** ✅ Active (production)

---

### Cloudinary

**Purpose:** Alternative image source (remote patterns only)

**Implementation:**
- Configured in Next.js remote patterns
- No direct SDK integration
- Used for external image loading

**Status:** 🟡 Passive (image loading only)

---

## Search & Discovery

### Meilisearch

**Purpose:** Full-text product search engine

**Configuration:**
```typescript
MEILISEARCH_HOST=...
MEILISEARCH_API_KEY=...
```

**Implementation:**
- **SDK:** meilisearch 0.54.0
- **Location:** `apps/api/src/services/search.service.ts`
- **Pattern:** Singleton with health checks

**Features:**

**Searchable Attributes:**
- Product name, description, SKU
- Brand, category, tags

**Filterable Attributes:**
- Category, stock status
- Price range, brand, tags

**Sortable Attributes:**
- Name, price
- Creation date, stock quantity

**Advanced:**
- Typo tolerance enabled
- Faceted search support
- Result caching (5-minute TTL)
- Index statistics tracking

**Endpoints:**
- `GET /api/search` - Search products
- `POST /api/search/sync` - Sync products to index
- `GET /api/search/stats` - Index statistics
- `GET /api/search/health` - Health check

**Cache:**
- In-memory cache
- 5-minute TTL
- Max 100 cached queries

**Status:** ✅ Active (production)

---

## Email Services

### SMTP (Gmail)

**Purpose:** Transactional email notifications

**Configuration:**
```typescript
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587            // or 465 for SSL
SMTP_USER=...
SMTP_PASS=...            // App password
SMTP_FROM_EMAIL=...
SMTP_FROM_NAME=Lab404 Electronics
```

**Implementation:**
- **SDK:** nodemailer 6.10.1
- **Location:** `apps/api/src/services/mailer.service.ts`
- **Pattern:** Singleton with fallback

**Features:**
- HTML + text email support
- File attachments (PDF)
- Custom FROM address
- Connection verification
- Graceful degradation if not configured

**Email Types:**
- Order confirmations
- Quotation PDFs
- Password reset (planned)
- Contact form notifications
- Newsletter (planned)

**Endpoints:**
- `POST /api/notifications/send-order-email` - Order confirmation
- `POST /api/notifications/send-quotation-email` - Quote with PDF

**Error Handling:**
- Logs warning if SMTP not configured
- Continues without email capability
- Returns success: false for failed sends

**Status:** ✅ Active (production)

---

## Payment Processing

### Stripe

**Purpose:** Payment processing (planned)

**Configuration:**
```typescript
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
STRIPE_PUBLISHABLE_KEY=...
```

**Implementation:**
- Config placeholders in place
- No SDK integration yet
- Infrastructure ready

**Planned Features:**
- Credit card processing
- Webhook handling
- Payment intent creation
- Refund processing

**Status:** 🔴 Planned (not implemented)

---

## Search & Analytics APIs

### Google Custom Search

**Purpose:** Image search for product imports

**Configuration:**
```typescript
GOOGLE_API_KEY=...
GOOGLE_SEARCH_ENGINE_ID=...
```

**Implementation:**
- **SDK:** googleapis 144.0.0
- **Location:** `apps/api/src/routes/google-images.routes.ts`
- **Cache:** In-memory (5-minute TTL, max 100 entries)

**Features:**

**Search Filters:**
- Query text
- Result limit and pagination
- Safe search level (off/medium/high)
- Image size filtering
- Image type filtering
- File type filtering

**Endpoints:**
- `GET /api/google-images/search` - Search images
- `POST /api/google-images/batch-upload` - Search + upload to ImageKit
- `GET /api/google-images/cache-stats` - Cache statistics
- `POST /api/google-images/clear-cache` - Clear cache

**Error Handling:**
- Quota exceeded (429)
- Invalid credentials (403)
- Network errors

**Status:** ✅ Active (production)

---

## PDF Generation

### PDFKit

**Purpose:** Server-side PDF generation

**Configuration:** None (library-based)

**Implementation:**
- **SDK:** pdfkit 0.15.0
- **Location:** `apps/api/src/services/pdf.service.ts`
- **Pattern:** Service class

**Features:**

**Quotation PDFs:**
- Company logo
- Customer details
- Line items with images
- SKU display
- Tax and shipping
- Custom color scheme
- Thank you message

**Invoice PDFs:**
- Similar to quotations
- Order number
- Payment status
- Total breakdown

**Customization:**
```typescript
{
  primaryColor: string;
  accentColor: string;
  logoUrl?: string;
  showLineItemImages: boolean;
  showSKU: boolean;
  headerText?: string;
  footerText?: string;
  thankYouMessage?: string;
}
```

**Endpoints:**
- `GET /api/quotations/:id/pdf` - Generate quotation PDF
- `GET /api/orders/:id/pdf` - Generate invoice PDF (planned)

**Status:** ✅ Active (production)

---

## Authentication & Authorization

### Custom JWT

**Purpose:** User authentication

**Configuration:**
```typescript
JWT_SECRET=...
JWT_EXPIRES_IN=7d
```

**Implementation:**
- **SDK:** jsonwebtoken 9.0.2
- **Location:** `apps/api/src/middleware/auth.ts`
- **Pattern:** Middleware-based

**Features:**
- JWT token generation
- Token validation
- Role-based access (customer, admin)
- 7-day expiration (configurable)
- Optional auth middleware

**Token Payload:**
```typescript
{
  userId: string;
  email: string;
  role: 'customer' | 'admin';
  iat: number;
  exp: number;
}
```

**Endpoints:**
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Get token
- `POST /api/auth/logout` - Invalidate token (client-side)

**Storage:**
- Client-side: localStorage
- ⚠️ Should use httpOnly cookies

**Status:** ✅ Active (production)

---

## Security & Rate Limiting

### Express Rate Limit

**Purpose:** Prevent abuse and DDoS

**Configuration:** Embedded in code

**Implementation:**
- **SDK:** express-rate-limit 7.4.0
- **Location:** `apps/api/src/middleware/rateLimiter.ts`

**Rate Limits:**

| Endpoint Type | Limit | Window | Environment |
|--------------|-------|--------|-------------|
| Auth | 5 requests | 15 min | Production |
| Auth | 1000 requests | 15 min | Development |
| API | 30 requests | 1 min | All |
| Strict | 10 requests | 1 min | Checkout |
| Default | 100 requests | 1 min | General |

**Features:**
- IP-based limiting
- Standardized error responses
- Dev vs prod configuration
- Per-endpoint customization

**Status:** ✅ Active (production)

---

### Helmet

**Purpose:** Security headers

**Configuration:** None (defaults)

**Implementation:**
- **SDK:** helmet 8.0.0
- **Location:** `apps/api/src/app.ts`

**Headers:**
- Content Security Policy
- X-Frame-Options
- X-Content-Type-Options
- Strict-Transport-Security

**Status:** ✅ Active (production)

---

## Content Management

### Blog System

**Purpose:** Blog content management

**Implementation:**
- Custom database-backed system
- Table: `blogs`
- Rich content support

**Features:**
- Blog posts with rich HTML
- Published/draft states
- Author metadata
- Published date tracking
- Slug-based URLs

**Endpoints:**
- `GET /api/blogs` - List published blogs
- `GET /api/blogs/:slug` - Get blog by slug
- `POST /api/blogs` - Create blog (admin)
- `PUT /api/blogs/:id` - Update blog (admin)
- `DELETE /api/blogs/:id` - Delete blog (admin)

**Frontend:**
- Public blog listing: `/blog`
- Blog detail pages: `/blog/[slug]`

**Status:** ✅ Active (production)

---

## Environment Configuration

### Required Variables

**Core:**
```bash
NODE_ENV=development|production
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_EXPIRES_IN=7d
```

**Storage:**
```bash
IMAGEKIT_PUBLIC_KEY=...
IMAGEKIT_PRIVATE_KEY=...
IMAGEKIT_URL_ENDPOINT=...
```

**Email:**
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM_EMAIL=...
SMTP_FROM_NAME=...
```

**Search:**
```bash
MEILISEARCH_HOST=...
MEILISEARCH_API_KEY=...
```

**Google APIs:**
```bash
GOOGLE_API_KEY=...
GOOGLE_SEARCH_ENGINE_ID=...
```

**Payment (Planned):**
```bash
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
STRIPE_PUBLISHABLE_KEY=...
```

**URLs:**
```bash
API_URL=http://localhost:4000
ADMIN_URL=http://localhost:3001
WEB_URL=http://localhost:3000
```

**Security:**
```bash
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
CRON_SECRET=...
```

**Store Defaults:**
```bash
STORE_NAME=Lab404 Electronics
STORE_CURRENCY=USD
STORE_TAX_RATE=0.10
```

---

## Integration Status Summary

| Service | Status | Priority | Usage |
|---------|--------|----------|-------|
| NeonDB | ✅ Active | Critical | Database |
| ImageKit | ✅ Active | High | Images |
| Meilisearch | ✅ Active | High | Search |
| SMTP | ✅ Active | High | Email |
| Google Search | ✅ Active | Medium | Import |
| PDFKit | ✅ Active | Medium | PDFs |
| JWT | ✅ Active | Critical | Auth |
| Rate Limiting | ✅ Active | High | Security |
| Helmet | ✅ Active | High | Security |
| Stripe | 🔴 Planned | High | Payment |
| Cloudinary | 🟡 Passive | Low | Images |

---

## Integration Health Checks

**Available Health Endpoints:**
- `GET /api/health` - API health
- `GET /api/search/health` - Meilisearch health
- Database health checked on startup

**Missing Health Checks:**
- ImageKit availability
- SMTP connection status
- Google API quota
