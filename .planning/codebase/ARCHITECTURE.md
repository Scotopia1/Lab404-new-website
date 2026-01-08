# System Architecture

## Architecture Pattern

**Monorepo with Modular Three-Tier Architecture**

This is a modern PNPM monorepo using Turborepo for orchestration. The system follows a modular three-tier architecture with clear separation of concerns.

## System Layers

### 1. Presentation Layer (Client-Side)

Two separate Next.js 15 applications with React 19:

**Admin Dashboard** (`@lab404/admin` - Port 3001)
- Internal management interface
- Protected routes requiring authentication
- Real-time analytics and reporting
- Product, order, and customer management
- B2B quotation system

**Customer Website** (`lab404-website` - Port 3000)
- Public-facing e-commerce site
- Product catalog and search
- Shopping cart and checkout
- User account management
- Blog content

### 2. Business Logic Layer (Middle Tier)

**Express.js REST API** (`@lab404/api` - Port 4000)
- Centralized business logic
- TypeScript with strong typing
- Service-oriented architecture
- Authentication and authorization
- Data validation and transformation

### 3. Data Layer (Backend)

**PostgreSQL via NeonDB**
- Serverless database
- Drizzle ORM for type safety
- Migration-based schema evolution
- Shared database package for consistency

## Data Flow Architecture

```
Client Request (Browser)
    ↓
Next.js App (Admin/Website)
    ↓
API Client (Axios with interceptors)
    ↓
Express.js API Layer
    ├── Auth Middleware (JWT validation)
    ├── Validation Middleware (Zod schemas)
    ├── Rate Limiting Middleware
    └── Route Handlers
        ↓
    Service Layer
    ├── PricingService (server-side calculations)
    ├── OrderService
    ├── CartService
    ├── QuotationService
    ├── MailerService
    └── SearchService
        ↓
    Database Layer (Drizzle ORM)
    ↓
PostgreSQL (NeonDB)
    ↓
Response (ApiResponse wrapper)
```

## Key Architectural Patterns

### 1. Request-Response Cycle

**Standardized Response Format:**
```typescript
ApiResponse<T> {
  success: boolean
  data: T
  meta?: { pagination, etc. }
}
```

**Error Handling:**
- Custom `ApiError` classes hierarchy
- Global error handling middleware
- Field-level validation errors
- HTTP status codes mapped to error types

### 2. Authentication & Authorization

**JWT-Based Authentication:**
- 7-day token expiration (configurable)
- Role-based access control (customer, admin)
- Optional auth middleware (some routes public)
- Tokens stored in localStorage (client-side)

**Security Layers:**
- Password hashing with bcryptjs (12 rounds)
- Rate limiting per endpoint
- CORS configuration
- Helmet security headers
- SQL injection prevention via ORM

### 3. State Management Strategy

**Backend:**
- Database as single source of truth
- No caching layer (direct DB queries)

**Frontend - Admin Dashboard:**
- React Query for server state (cache + sync)
- Local UI state (React hooks)

**Frontend - Website:**
- Zustand store for cart and auth state
- React Query for API data
- React Hook Form for form state

### 4. Data Validation

**Multi-Layer Validation:**
1. Client-side: Zod schemas with React Hook Form
2. API middleware: Zod schema validation before route handler
3. Database: Drizzle ORM type safety

### 5. Security Architecture

**CRITICAL RULE: Server-Side Price Calculations**
- All price calculations happen on backend
- Client sends quantities only
- Prevents price manipulation attacks
- Order snapshots capture prices at checkout

**Security Measures:**
- Helmet for security headers
- CORS configuration per environment
- Rate limiting (tiered by endpoint sensitivity)
- Input sanitization (DOMPurify client-side)
- SQL injection prevention (parameterized queries)

## Service Layer Abstractions

### Core Services

**PricingService**
- Complex cart calculations
- Tax computation
- Discount application
- Shipping calculations
- Server-side price enforcement

**PDFService**
- Quote PDF generation
- Order invoice generation
- Customizable templates
- Server-side rendering

**ExportService**
- Data export functionality
- CSV generation
- Order/product exports

**ImportService**
- Product import from marketplaces
- Amazon/AliExpress/eBay support
- Validation and transformation

**SearchService**
- MeiliSearch integration
- Product indexing
- Full-text search
- Faceted filtering

**MailerService**
- Email notifications
- SMTP integration
- Template-based emails
- Order confirmations

**QuotationActivityService**
- Audit trail tracking
- Activity logging
- Change history

## Component Relationships

### Middleware Chain
```
Request
  → Auth extraction & verification
  → Zod schema validation
  → Rate limiting
  → Route handler
  → Response normalization
  → Error handling
```

### Route Organization
- **Public routes:** Products, categories, cart
- **Authenticated routes:** Orders, profile
- **Admin routes:** Analytics, quotations, settings

### Database Relationships
```
customers
  ├── addresses (1:many)
  ├── orders (1:many)
  ├── quotations (1:many)
  └── carts (1:many)

products
  ├── product_variants (1:many)
  ├── order_items (1:many via snapshot)
  ├── quotation_items (1:many via snapshot)
  └── cart_items (1:many)

orders
  ├── order_items (1:many)
  └── customer (many:1)

quotations
  ├── quotation_items (1:many)
  └── customer (many:1)
```

## Critical Architectural Decisions

### 1. Server-Side Price Calculations
All pricing logic computed on backend to prevent fraud. Client never determines prices.

### 2. JWT Authentication
Stateless authentication with tokens. No server-side session storage. 7-day expiration with refresh capability.

### 3. Snapshot Pattern
Order and quotation data snapshot prices and product details at creation time. Creates immutable historical records.

### 4. Modular Services
Each domain has dedicated service class. Services handle business logic and external integrations.

### 5. Type Safety
Shared types package ensures consistency across all apps. TypeScript strict mode enforced.

### 6. Unified API Response
All endpoints return standardized format. Simplifies error handling and client-side logic.

### 7. Monorepo Structure
Shared code in packages. Apps reference packages via workspace protocol. Single version control.

## Scalability Considerations

**Current State:**
- Direct database queries (no caching layer)
- Synchronous request processing
- Single API server

**Bottlenecks:**
- CSV import processing (synchronous)
- No background job queue
- No CDN for static assets (Next.js handles)

**Future Improvements:**
- Add Redis for caching
- Implement job queue for imports
- Add read replicas for analytics
- Implement CDN for images
