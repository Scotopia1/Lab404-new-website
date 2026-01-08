# Technology Stack

## Languages & Runtime

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| **Primary Language** | TypeScript | ^5.3.0 | Full-stack type safety |
| **Runtime** | Node.js | >=18.0.0 | Backend execution |
| **Package Manager** | pnpm | 9.0.0 | Monorepo package management |

## Monorepo Architecture

**Framework:** Turborepo 2.3.0

**Applications:**
- `@lab404/admin` - Admin dashboard (Next.js)
- `@lab404/api` - Backend API (Express)
- `lab404-website` - Public website (Next.js)

**Packages:**
- `@lab404/database` - Shared database layer (Drizzle ORM)
- `@lab404/shared-types` - Shared TypeScript types

## Frontend Stack

### Web Framework
- **Next.js** 16.1.1 (React 19.2.3)
- App Router with Server Components
- Two separate applications (Admin + Public Website)

### Styling & UI
- **Tailwind CSS** 4
- **Radix UI** - Extensive primitive components
  - Dialog, Dropdown, Label, Scroll Area, Separator, Slot, Switch, Tabs, Toast, Tooltip
  - Alert Dialog, Avatar, Checkbox, Collapsible, Popover, Select
- **shadcn/ui** component pattern

### State Management
- **Zustand** 5.0.9 - Client state (cart, auth)
- **TanStack React Query** 5.90.14 - Server state with DevTools
- **React Hook Form** 7.69.0 - Form state

### Data & Validation
- **Zod** 3.24.1/3.25.76 - Schema validation
- **Axios** 1.13.2 - HTTP client
- **TanStack React Table** 8.21.2 - Data tables (admin)

### Rich Content
- **TipTap** 3.14.0 - Rich text editor
  - Extensions: code-block-lowlight, image, link, placeholder, text-align, underline

### Visualization
- **Tremor** 3.18.7 - Chart components
- **Recharts** 2.15.3 - Chart library

### Utilities
- **date-fns** 4.1.0 - Date handling
- **lucide-react** 0.562.0 - Icon library
- **clsx** + **tailwind-merge** 3.4.0 - Class utilities
- **class-variance-authority** 0.7.1 - Variant management
- **cmdk** 1.1.1 - Command palette
- **sonner** 2.0.3/2.0.7 - Toast notifications
- **next-themes** 0.4.6 - Theme management

## Backend Stack

### Web Framework
- **Express.js** 4.21.0
- TypeScript with strict mode

### Database
- **PostgreSQL** (via NeonDB serverless)
- **Drizzle ORM** 0.36.0 + Drizzle Kit 0.28.0
- **Drivers:**
  - @neondatabase/serverless 0.9.0 (production)
  - postgres 3.4.7 + pg 8.16.3 (development)

### Authentication & Security
- **jsonwebtoken** 9.0.2 - JWT tokens
- **bcryptjs** 2.4.3 - Password hashing (12 rounds)
- **helmet** 8.0.0 - Security headers
- **cors** 2.8.5 - CORS handling
- **express-rate-limit** 7.4.0 - Rate limiting

### Request/Response
- **morgan** 1.10.0 - Request logging
- **compression** 1.7.4 - Response compression
- **Zod** 3.23.0 - Request validation

### Utilities
- **dotenv** 16.3.0 - Environment variables
- **uuid** 10.0.0 - ID generation
- **slugify** 1.6.6 - URL slugs

## Build & Development Tools

### Monorepo Tooling
- **Turborepo** 2.3.0 - Build orchestration, caching
- **pnpm workspaces** - Package management
- **tsup** 8.0.0 - Package bundling
- **tsx** 4.7.0 - TypeScript execution

### Code Quality
- **TypeScript** 5.3.0 - Type checking
- **ESLint** 9 - Linting
- No Prettier config (relies on ESLint + editor)

### Testing
- **Playwright** 1.57.0 - E2E testing (admin)
- **Cypress** 15.8.1 - E2E testing (website)
- Custom test runner for API integration tests

## Database Schema

**13 Core Tables:**
- `products` + `product_variants` - Product catalog
- `categories` - Product categorization
- `customers` + `addresses` - User accounts
- `orders` + `order_items` - Order management
- `carts` + `cart_items` - Shopping carts
- `quotations` + `quotation_items` - B2B quotes
- `promo_codes` - Discount management
- `blogs` - Blog content
- `settings` - Store configuration
- `pdf_templates` - Custom PDF templates
- `imports` - Product import history

## Key Design Patterns

- **Monorepo** with shared packages for code reuse
- **Type-safe** across frontend and backend
- **API-first** architecture with Express REST API
- **Server-side rendering** with Next.js
- **Component composition** with Radix UI primitives
- **Schema-driven validation** with Zod
- **Migration-based** database evolution

## Development Environment

- **Node.js** 18+ required
- **pnpm** for package management
- **Turborepo** for parallel builds
- **Environment variables** via `.env` files
- **Development ports:**
  - API: 4000
  - Website: 3000
  - Admin: 3001
