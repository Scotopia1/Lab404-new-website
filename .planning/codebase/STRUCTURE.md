# Codebase Structure

## Repository Layout

```
lab404-new/ (Monorepo Root)
├── apps/                   # Applications
│   ├── api/               # Express.js Backend API
│   ├── admin/             # Next.js Admin Dashboard
│   └── lab404-website/    # Next.js Customer Website
│
├── packages/              # Shared packages
│   ├── database/          # @lab404/database - Drizzle ORM
│   └── shared-types/      # @lab404/shared-types - TypeScript types
│
├── .planning/             # GSD project management
│
├── Config Files
│   ├── package.json       # Workspace manifest
│   ├── pnpm-workspace.yaml
│   ├── turbo.json
│   ├── tsconfig.json
│   └── .env.example
│
└── node_modules/          # PNPM managed dependencies
```

## API Application (`apps/api/`)

```
api/
├── src/
│   ├── config/
│   │   └── index.ts              # Centralized environment config
│   │
│   ├── middleware/
│   │   ├── auth.ts               # JWT authentication
│   │   ├── validator.ts          # Zod validation
│   │   ├── error.ts              # Error handling
│   │   └── rateLimiter.ts        # Rate limiting
│   │
│   ├── routes/                   # 22 route files
│   │   ├── auth.routes.ts        # Register, login, logout
│   │   ├── products.routes.ts    # Product CRUD
│   │   ├── categories.routes.ts  # Category management
│   │   ├── cart.routes.ts        # Shopping cart
│   │   ├── orders.routes.ts      # Order management (1002 lines)
│   │   ├── customers.routes.ts   # Customer management (963 lines)
│   │   ├── quotations.routes.ts  # B2B quotes (1875 lines ⚠️)
│   │   ├── promo-codes.routes.ts # Discount codes
│   │   ├── blogs.routes.ts       # Blog management
│   │   ├── settings.routes.ts    # Store settings
│   │   ├── analytics.routes.ts   # Dashboard data
│   │   ├── export.routes.ts      # Data export
│   │   ├── import.routes.ts      # Product import
│   │   ├── upload.routes.ts      # ImageKit integration
│   │   ├── search.routes.ts      # MeiliSearch
│   │   ├── notifications.routes.ts
│   │   ├── contact.routes.ts
│   │   ├── cron.routes.ts
│   │   ├── health.routes.ts
│   │   └── index.ts              # Route aggregation
│   │
│   ├── services/
│   │   ├── pricing.service.ts    # Cart calculations
│   │   ├── pdf.service.ts        # PDF generation
│   │   ├── export.service.ts     # Data export
│   │   ├── import.service.ts     # Product import
│   │   ├── search.service.ts     # MeiliSearch client
│   │   └── mailer.service.ts     # Email notifications
│   │
│   ├── utils/
│   │   ├── errors.ts             # Custom error classes
│   │   ├── response.ts           # ApiResponse wrapper
│   │   ├── logger.ts             # Logging utility
│   │   ├── crypto.ts             # Token generation
│   │   └── helpers.ts            # General utilities
│   │
│   ├── app.ts                    # Express app factory
│   └── server.ts                 # Entry point
│
├── tests/
│   ├── run-tests.ts              # Custom test runner
│   ├── security-audit.ts         # Security tests
│   └── setup.ts                  # Test utilities
│
├── package.json
├── tsconfig.json
├── tsup.config.ts
└── .env.example
```

## Admin Application (`apps/admin/`)

```
admin/
├── src/
│   ├── app/
│   │   ├── (auth)/               # Auth layout group
│   │   │   └── login/
│   │   │
│   │   ├── (dashboard)/          # Protected dashboard layout
│   │   │   ├── page.tsx          # Dashboard home
│   │   │   ├── analytics/        # Customer, Product, Sales analytics
│   │   │   ├── products/         # Product CRUD pages
│   │   │   ├── categories/       # Category management
│   │   │   ├── orders/           # Order management
│   │   │   ├── customers/        # Customer management
│   │   │   ├── quotations/       # B2B quotation system
│   │   │   ├── promo-codes/      # Discount codes
│   │   │   ├── blogs/            # Blog management
│   │   │   ├── import-export/    # Data import/export
│   │   │   └── settings/         # App settings
│   │   │       ├── notifications/
│   │   │       ├── activity/
│   │   │       ├── pdf-templates/
│   │   │       └── tax/
│   │   │
│   │   ├── layout.tsx            # Root layout
│   │   ├── globals.css
│   │   └── providers.tsx
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── header.tsx
│   │   │   └── sidebar.tsx
│   │   │
│   │   ├── data-table/           # Reusable table component
│   │   ├── quotations/           # Quotation-specific UI
│   │   ├── orders/               # Order-specific UI
│   │   ├── promo-codes/
│   │   ├── ui/                   # shadcn/ui components
│   │   └── shared/               # Common components
│   │
│   ├── lib/
│   │   ├── api-client.ts         # Axios instance + interceptors
│   │   ├── query-client.ts       # React Query setup
│   │   └── utils.ts
│   │
│   └── store/                    # Zustand stores
│
├── tests/                        # Playwright E2E tests
│   ├── auth.spec.ts
│   ├── customers.spec.ts
│   ├── dashboard.spec.ts
│   ├── navigation.spec.ts
│   └── fixtures.ts
│
├── public/                       # Static assets
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── playwright.config.ts
└── tsconfig.json
```

## Website Application (`apps/lab404-website/`)

```
lab404-website/
├── src/
│   ├── app/
│   │   ├── (auth)/               # Login/Register pages
│   │   │   ├── login/
│   │   │   └── register/
│   │   │
│   │   ├── layout.tsx            # Root layout with SEO
│   │   ├── page.tsx              # Home page
│   │   │
│   │   ├── products/             # Product pages
│   │   │   ├── page.tsx          # Product listing
│   │   │   └── [id]/             # Product detail
│   │   │
│   │   ├── blog/                 # Blog pages
│   │   │   ├── page.tsx          # Blog listing
│   │   │   └── [slug]/           # Blog post
│   │   │
│   │   ├── checkout/             # Checkout flow
│   │   │   └── page.tsx
│   │   │
│   │   ├── account/              # User account
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx          # Profile
│   │   │   ├── orders/           # Order history
│   │   │   └── addresses/        # Address management
│   │   │
│   │   ├── order-tracking/       # Track orders
│   │   │   └── page.tsx
│   │   │
│   │   ├── quotations/           # View quotations
│   │   │   └── [id]/
│   │   │
│   │   ├── about/
│   │   ├── contact/
│   │   ├── privacy-policy/
│   │   ├── terms-and-conditions/
│   │   ├── return-policy/
│   │   └── sitemap.ts
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── header.tsx
│   │   │   ├── footer.tsx
│   │   │   └── main-layout.tsx
│   │   │
│   │   ├── cart/                 # Cart UI
│   │   │   ├── cart-sheet.tsx
│   │   │   └── cart-item.tsx
│   │   │
│   │   ├── checkout/             # Checkout form
│   │   ├── forms/                # Login/Register forms
│   │   ├── products/             # Product cards, filters
│   │   ├── search/               # Search bar
│   │   ├── seo/                  # JSON-LD structured data
│   │   └── ui/                   # shadcn/ui components
│   │
│   ├── hooks/
│   │   └── use-blogs.ts
│   │
│   ├── lib/
│   │   ├── api.ts                # Axios client
│   │   ├── validations.ts        # Zod schemas
│   │   └── checkout-validation.ts
│   │
│   ├── store/
│   │   └── auth-store.ts         # Zustand auth store
│   │
│   └── types/                    # Local TypeScript types
│
├── public/                       # Static assets
├── package.json
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

## Database Package (`packages/database/`)

```
database/
├── src/
│   ├── schema/                   # Drizzle ORM schemas
│   │   ├── products.ts           # Products + variants
│   │   ├── categories.ts
│   │   ├── customers.ts          # User accounts
│   │   ├── addresses.ts
│   │   ├── orders.ts             # Orders + items
│   │   ├── carts.ts              # Carts + items
│   │   ├── quotations.ts         # Quotations + items
│   │   ├── promoCodes.ts
│   │   ├── blogs.ts
│   │   ├── settings.ts
│   │   ├── pdfTemplates.ts
│   │   └── imports.ts
│   │
│   ├── client.ts                 # NeonDB + Drizzle singleton
│   │
│   ├── migrations/               # Drizzle migrations
│   │   ├── 0001_*.sql
│   │   ├── 0002_*.sql
│   │   ├── 0003_*.sql
│   │   └── meta/
│   │
│   ├── seeds/                    # Database seeding
│   │
│   ├── scripts/                  # Migration helpers
│   │   └── add-password-hash.ts
│   │
│   └── index.ts
│
├── package.json
├── drizzle.config.ts
└── tsconfig.json
```

## Shared Types Package (`packages/shared-types/`)

```
shared-types/
├── src/
│   ├── common.ts                 # Base types (UUID, Decimal, ISODate)
│   ├── auth.ts                   # Auth types
│   ├── product.ts                # Product domain types
│   ├── order.ts                  # Order domain types
│   ├── cart.ts                   # Cart types with calculations
│   ├── promo.ts                  # Promo code types
│   ├── quotation.ts              # Quotation types
│   ├── blog.ts                   # Blog types
│   ├── settings.ts               # Settings types
│   ├── analytics.ts              # Analytics types
│   └── index.ts
│
├── package.json
└── tsconfig.json
```

## Key Organizational Principles

### Module Boundaries

**API Routes (22 files):**
- Each route file handles one domain
- Routes export configured Express Router
- Aggregated in `routes/index.ts`

**Services:**
- One service per domain concern
- Services encapsulate external integrations
- Pure functions where possible

**Components:**
- Organized by feature, not type
- UI primitives in `ui/` directory
- Layout components separate

### Entry Points

**Backend:**
- `apps/api/src/server.ts` - Starts Express, validates config
- `apps/api/src/app.ts` - Creates Express app

**Admin:**
- `apps/admin/src/app/layout.tsx` - Root layout
- `apps/admin/src/app/(dashboard)/page.tsx` - Dashboard home

**Website:**
- `apps/lab404-website/src/app/layout.tsx` - Root layout with SEO
- `apps/lab404-website/src/app/page.tsx` - Home page

### Configuration Files

**Root Level:**
- `package.json` - Workspace definition
- `pnpm-workspace.yaml` - Workspace config
- `turbo.json` - Build orchestration
- `tsconfig.json` - Base TypeScript config
- `.env.example` - Environment template

**App Level:**
- Each app has own `package.json`, `tsconfig.json`
- Next.js apps have `next.config.ts`, `tailwind.config.ts`
- API has `tsup.config.ts` for bundling

## Naming Conventions

**Files:**
- Routes: `kebab-case.routes.ts`
- Services: `camelCase.service.ts`
- Components: `PascalCase.tsx` or `kebab-case.tsx`
- Hooks: `use-*.ts`
- Tests: `*.spec.ts`

**Directories:**
- All lowercase with hyphens: `promo-codes/`
- Route groups in Next.js: `(auth)/`, `(dashboard)/`
