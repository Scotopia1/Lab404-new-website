# Lab404Electronics - Project Folder Structure

## Monorepo Structure

```
lab404-new/
├── apps/
│   ├── api/                     # Express.js Backend API
│   ├── admin/                   # Next.js Admin Dashboard
│   └── web/                     # Next.js Customer Website (Antigravity)
├── packages/
│   ├── shared-types/           # Shared TypeScript types
│   ├── database/               # Drizzle ORM schema & migrations
│   └── config/                 # Shared ESLint, TypeScript configs
├── docs/                        # Documentation
│   ├── PROJECT_PLAN.md
│   ├── TASK_TRACKER.md
│   ├── SECURITY_RULEBOOK.md
│   ├── FEATURE_CHECKLIST.md
│   └── ANTIGRAVITY_PROMPT.md
├── .env.example                 # Environment variables template
├── .gitignore
├── package.json                 # Root package.json (workspace)
├── pnpm-workspace.yaml         # PNPM workspace config
└── turbo.json                  # Turborepo config
```

---

## Backend API Structure (`apps/api/`)

```
apps/api/
├── src/
│   ├── config/
│   │   ├── database.ts          # NeonDB connection
│   │   ├── auth.ts              # Neon Auth configuration
│   │   ├── imagekit.ts          # ImageKit configuration
│   │   ├── email.ts             # Nodemailer configuration
│   │   └── index.ts             # Config exports
│   │
│   ├── middleware/
│   │   ├── auth.middleware.ts    # Authentication middleware
│   │   ├── admin.middleware.ts   # Admin authorization
│   │   ├── rateLimiter.ts        # Rate limiting
│   │   ├── validator.ts          # Request validation
│   │   ├── errorHandler.ts       # Global error handler
│   │   └── index.ts
│   │
│   ├── routes/
│   │   ├── auth.routes.ts        # /api/auth/*
│   │   ├── products.routes.ts    # /api/products/*
│   │   ├── categories.routes.ts  # /api/categories/*
│   │   ├── cart.routes.ts        # /api/cart/*
│   │   ├── orders.routes.ts      # /api/orders/*
│   │   ├── customers.routes.ts   # /api/customers/*
│   │   ├── promoCodes.routes.ts  # /api/promo-codes/*
│   │   ├── quotations.routes.ts  # /api/admin/quotations/*
│   │   ├── blogs.routes.ts       # /api/blogs/*
│   │   ├── settings.routes.ts    # /api/settings/*
│   │   ├── analytics.routes.ts   # /api/admin/analytics/*
│   │   ├── import.routes.ts      # /api/admin/products/import
│   │   └── index.ts              # Route aggregator
│   │
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── products.controller.ts
│   │   ├── categories.controller.ts
│   │   ├── cart.controller.ts
│   │   ├── orders.controller.ts
│   │   ├── customers.controller.ts
│   │   ├── promoCodes.controller.ts
│   │   ├── quotations.controller.ts
│   │   ├── blogs.controller.ts
│   │   ├── settings.controller.ts
│   │   ├── analytics.controller.ts
│   │   ├── import.controller.ts
│   │   └── index.ts
│   │
│   ├── services/
│   │   ├── auth.service.ts       # Authentication logic
│   │   ├── products.service.ts   # Product CRUD
│   │   ├── categories.service.ts
│   │   ├── cart.service.ts       # Cart management
│   │   ├── pricing.service.ts    # CRITICAL: Price calculations
│   │   ├── orders.service.ts     # Order processing
│   │   ├── customers.service.ts
│   │   ├── promoCodes.service.ts # Promo validation & calculation
│   │   ├── quotations.service.ts
│   │   ├── blogs.service.ts
│   │   ├── settings.service.ts
│   │   ├── analytics.service.ts
│   │   ├── email.service.ts      # Email sending
│   │   ├── pdf.service.ts        # PDF generation
│   │   ├── import.service.ts     # Product import logic
│   │   └── index.ts
│   │
│   ├── scrapers/                 # Product import scrapers
│   │   ├── amazon.scraper.ts
│   │   ├── aliexpress.scraper.ts
│   │   ├── ebay.scraper.ts
│   │   ├── base.scraper.ts       # Base scraper class
│   │   └── index.ts
│   │
│   ├── validators/               # Zod schemas
│   │   ├── auth.validator.ts
│   │   ├── products.validator.ts
│   │   ├── orders.validator.ts
│   │   ├── customers.validator.ts
│   │   ├── common.validator.ts   # Shared validators
│   │   └── index.ts
│   │
│   ├── types/
│   │   ├── express.d.ts          # Express type extensions
│   │   ├── api.types.ts          # API-specific types
│   │   └── index.ts
│   │
│   ├── utils/
│   │   ├── response.ts           # API response helpers
│   │   ├── errors.ts             # Custom error classes
│   │   ├── logger.ts             # Logging utility
│   │   ├── helpers.ts            # General helpers
│   │   ├── sanitize.ts           # Input sanitization
│   │   └── index.ts
│   │
│   ├── templates/                # Email templates
│   │   ├── orderConfirmation.ts
│   │   ├── quotation.ts
│   │   ├── passwordReset.ts
│   │   └── index.ts
│   │
│   ├── app.ts                    # Express app setup
│   └── server.ts                 # Server entry point
│
├── tests/
│   ├── unit/
│   │   ├── services/
│   │   └── utils/
│   ├── integration/
│   │   └── routes/
│   └── setup.ts
│
├── .env.example
├── package.json
├── tsconfig.json
└── nodemon.json
```

---

## Admin Dashboard Structure (`apps/admin/`)

```
apps/admin/
├── src/
│   ├── app/
│   │   ├── (auth)/               # Auth pages (no sidebar)
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (dashboard)/          # Dashboard pages (with sidebar)
│   │   │   ├── layout.tsx        # Dashboard layout with sidebar
│   │   │   ├── page.tsx          # Dashboard home/overview
│   │   │   │
│   │   │   ├── products/
│   │   │   │   ├── page.tsx      # Product list
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx  # Create product
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx  # Edit product
│   │   │   │   └── import/
│   │   │   │       └── page.tsx  # Import product
│   │   │   │
│   │   │   ├── categories/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── orders/
│   │   │   │   ├── page.tsx      # Order list
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx  # Order detail
│   │   │   │
│   │   │   ├── customers/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── promo-codes/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── quotations/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── blogs/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── analytics/
│   │   │   │   ├── page.tsx      # Analytics dashboard
│   │   │   │   ├── sales/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── products/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   └── settings/
│   │   │       ├── page.tsx      # General settings
│   │   │       ├── tax/
│   │   │       │   └── page.tsx
│   │   │       └── shipping/
│   │   │           └── page.tsx
│   │   │
│   │   ├── layout.tsx            # Root layout
│   │   ├── globals.css
│   │   └── providers.tsx         # React Query, etc.
│   │
│   ├── components/
│   │   ├── ui/                   # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── table.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── form.tsx
│   │   │   └── ...
│   │   │
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── PageHeader.tsx
│   │   │   └── Breadcrumbs.tsx
│   │   │
│   │   ├── products/
│   │   │   ├── ProductForm.tsx
│   │   │   ├── ProductTable.tsx
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ImageUploader.tsx
│   │   │   ├── VariantManager.tsx
│   │   │   └── ProductImporter.tsx
│   │   │
│   │   ├── orders/
│   │   │   ├── OrderTable.tsx
│   │   │   ├── OrderDetail.tsx
│   │   │   ├── OrderStatusBadge.tsx
│   │   │   └── OrderTimeline.tsx
│   │   │
│   │   ├── customers/
│   │   │   ├── CustomerTable.tsx
│   │   │   └── CustomerDetail.tsx
│   │   │
│   │   ├── quotations/
│   │   │   ├── QuotationForm.tsx
│   │   │   ├── QuotationItemTable.tsx
│   │   │   └── QuotationPreview.tsx
│   │   │
│   │   ├── analytics/
│   │   │   ├── SalesChart.tsx
│   │   │   ├── RevenueCard.tsx
│   │   │   ├── TopProducts.tsx
│   │   │   └── OrdersChart.tsx
│   │   │
│   │   └── common/
│   │       ├── DataTable.tsx
│   │       ├── Pagination.tsx
│   │       ├── SearchInput.tsx
│   │       ├── ConfirmDialog.tsx
│   │       ├── LoadingSpinner.tsx
│   │       └── EmptyState.tsx
│   │
│   ├── lib/
│   │   ├── api.ts                # API client
│   │   ├── utils.ts              # Utility functions
│   │   ├── formatters.ts         # Date, currency formatters
│   │   └── constants.ts          # App constants
│   │
│   ├── hooks/
│   │   ├── useProducts.ts
│   │   ├── useOrders.ts
│   │   ├── useCustomers.ts
│   │   ├── useAuth.ts
│   │   └── useToast.ts
│   │
│   ├── store/
│   │   ├── authStore.ts
│   │   └── uiStore.ts
│   │
│   └── types/
│       └── index.ts
│
├── public/
├── .env.example
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
└── components.json             # shadcn/ui config
```

---

## Customer Website Structure (`apps/web/`)

*Managed by Antigravity AI - See ANTIGRAVITY_PROMPT.md for details*

```
apps/web/
├── src/
│   ├── app/
│   │   ├── (shop)/              # Main shop routes
│   │   │   ├── page.tsx         # Home
│   │   │   ├── products/
│   │   │   │   ├── page.tsx     # Product listing
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx # Product detail
│   │   │   ├── cart/
│   │   │   │   └── page.tsx
│   │   │   ├── checkout/
│   │   │   │   ├── page.tsx
│   │   │   │   └── success/
│   │   │   │       └── page.tsx
│   │   │   ├── about/
│   │   │   │   └── page.tsx
│   │   │   ├── contact/
│   │   │   │   └── page.tsx
│   │   │   └── blogs/
│   │   │       ├── page.tsx
│   │   │       └── [slug]/
│   │   │           └── page.tsx
│   │   │
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── register/
│   │   │       └── page.tsx
│   │   │
│   │   ├── account/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx         # Profile
│   │   │   ├── orders/
│   │   │   │   ├── page.tsx     # Order history
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   └── addresses/
│   │   │       └── page.tsx
│   │   │
│   │   ├── track/
│   │   │   └── [orderNumber]/
│   │   │       └── page.tsx     # Public order tracking
│   │   │
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   └── providers.tsx
│   │
│   ├── components/
│   │   ├── ui/                  # shadcn/ui
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Navigation.tsx
│   │   │   └── MobileMenu.tsx
│   │   ├── products/
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ProductGrid.tsx
│   │   │   ├── ProductFilters.tsx
│   │   │   ├── ProductGallery.tsx
│   │   │   └── AddToCartButton.tsx
│   │   ├── cart/
│   │   │   ├── CartItem.tsx
│   │   │   ├── CartSummary.tsx
│   │   │   └── PromoCodeInput.tsx
│   │   ├── checkout/
│   │   │   ├── AddressForm.tsx
│   │   │   ├── OrderSummary.tsx
│   │   │   └── CheckoutSteps.tsx
│   │   └── home/
│   │       ├── Hero.tsx
│   │       ├── FeaturedProducts.tsx
│   │       └── CategoryShowcase.tsx
│   │
│   ├── lib/
│   │   ├── api.ts
│   │   └── utils.ts
│   │
│   ├── hooks/
│   │   ├── useCart.ts
│   │   └── useAuth.ts
│   │
│   ├── store/
│   │   └── cartStore.ts
│   │
│   └── types/
│       └── index.ts
│
├── public/
├── package.json
└── ...
```

---

## Shared Packages

### `packages/shared-types/`

```
packages/shared-types/
├── src/
│   ├── models/
│   │   ├── product.ts
│   │   ├── category.ts
│   │   ├── order.ts
│   │   ├── customer.ts
│   │   ├── cart.ts
│   │   ├── promoCode.ts
│   │   ├── quotation.ts
│   │   ├── blog.ts
│   │   └── settings.ts
│   │
│   ├── api/
│   │   ├── requests.ts        # API request types
│   │   ├── responses.ts       # API response types
│   │   └── errors.ts          # Error types
│   │
│   └── index.ts               # Main export
│
├── package.json
└── tsconfig.json
```

### `packages/database/`

```
packages/database/
├── src/
│   ├── schema/
│   │   ├── products.ts
│   │   ├── categories.ts
│   │   ├── orders.ts
│   │   ├── customers.ts
│   │   ├── promoCodes.ts
│   │   ├── quotations.ts
│   │   ├── blogs.ts
│   │   ├── settings.ts
│   │   └── index.ts
│   │
│   ├── migrations/
│   │   └── ...
│   │
│   ├── seeds/
│   │   ├── categories.seed.ts
│   │   ├── products.seed.ts
│   │   └── settings.seed.ts
│   │
│   ├── client.ts              # Drizzle client
│   └── index.ts
│
├── drizzle.config.ts
├── package.json
└── tsconfig.json
```

---

## Environment Variables

### `.env.example` (Root)

```env
# Database
DATABASE_URL=postgresql://user:pass@host/db

# Authentication (Neon Auth)
NEON_AUTH_PROJECT_ID=
NEON_AUTH_API_KEY=

# ImageKit
IMAGEKIT_PUBLIC_KEY=
IMAGEKIT_PRIVATE_KEY=
IMAGEKIT_URL_ENDPOINT=

# Email (SMTP)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=noreply@lab404electronics.com

# Stripe (Future)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# App
NODE_ENV=development
API_URL=http://localhost:4000
ADMIN_URL=http://localhost:3001
WEB_URL=http://localhost:3000

# Security
JWT_SECRET=your-secret-key
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

---

## Scripts

### Root `package.json`

```json
{
  "scripts": {
    "dev": "turbo dev",
    "dev:api": "turbo dev --filter=api",
    "dev:admin": "turbo dev --filter=admin",
    "dev:web": "turbo dev --filter=web",
    "build": "turbo build",
    "lint": "turbo lint",
    "db:generate": "turbo db:generate --filter=database",
    "db:migrate": "turbo db:migrate --filter=database",
    "db:seed": "turbo db:seed --filter=database"
  }
}
```

---

**Last Updated:** 2025-12-28
