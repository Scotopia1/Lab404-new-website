# Lab404Electronics E-commerce Platform

## Project Overview

A modern, secure e-commerce platform for Lab404Electronics, built with a parallel development approach using two AI assistants:

- **Claude Code**: Backend API (Express.js) + Admin Dashboard (Next.js)
- **Antigravity AI**: Customer Website (Next.js)

## Quick Links

| Document | Description |
|----------|-------------|
| [PROJECT_PLAN.md](./PROJECT_PLAN.md) | Full project specification & API documentation |
| [TASK_TRACKER.md](./TASK_TRACKER.md) | Task status & coordination between AIs |
| [SECURITY_RULEBOOK.md](./SECURITY_RULEBOOK.md) | Security requirements & rules |
| [FEATURE_CHECKLIST.md](./FEATURE_CHECKLIST.md) | Checklist for implementing features |
| [ANTIGRAVITY_PROMPT.md](./ANTIGRAVITY_PROMPT.md) | Prompt for Antigravity AI |
| [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md) | Project folder structure |
| [API_TYPES.md](./API_TYPES.md) | TypeScript interfaces |

## Technology Stack

### Backend API
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: NeonDB (PostgreSQL)
- **ORM**: Drizzle ORM
- **Authentication**: Neon Auth
- **File Storage**: ImageKit.io
- **Email**: Nodemailer + SMTP
- **Payment (Future)**: Stripe

### Admin Dashboard
- **Framework**: Next.js 15
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: React Query

### Customer Website
- **Framework**: Next.js 15
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: Zustand + React Query

## Key Features

### Admin Dashboard
- Product & Category Management
- Order Management
- Customer Management
- Promo Code Management
- Quotation System (with PDF generation)
- Product Import (Amazon, AliExpress, eBay)
- Analytics Dashboard
- Settings (Tax rates, etc.)

### Customer Website
- Home, Products, About, Contact, Blogs
- Shopping Cart
- Guest & Logged-in Checkout
- Cash on Delivery Payment
- User Account & Order History

## Security Highlights

1. **All price calculations done server-side** - Never trust client totals
2. **Input validation with Zod** - All inputs validated
3. **SQL injection prevention** - Using Drizzle ORM
4. **XSS prevention** - Content sanitization
5. **Rate limiting** - On all public endpoints
6. **Secure authentication** - Neon Auth integration

## Getting Started

### Prerequisites
- Node.js 18+
- PNPM
- PostgreSQL (NeonDB account)
- ImageKit account
- SMTP server access

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd lab404-new

# Install dependencies
pnpm install

# Setup environment variables
cp .env.example .env
# Edit .env with your credentials

# Setup database
pnpm db:generate
pnpm db:migrate
pnpm db:seed

# Start development servers
pnpm dev
```

### Project URLs

| Service | URL |
|---------|-----|
| Backend API | http://localhost:4000 |
| Admin Dashboard | http://localhost:3001 |
| Customer Website | http://localhost:3000 |

## Parallel Development Workflow

1. **Read TASK_TRACKER.md** before starting work
2. **Update task status** when starting/completing work
3. **Check dependencies** - Website tasks may depend on API completion
4. **Add notes** in the Communication Log section
5. **Follow security checklist** for all new features

## API Documentation

See [PROJECT_PLAN.md](./PROJECT_PLAN.md) for full API endpoint documentation.

### Base URL
- Development: `http://localhost:4000/api`
- Production: `https://api.lab404electronics.com`

### Response Format
```json
{
  "success": true,
  "data": { ... },
  "meta": { "page": 1, "limit": 20, "total": 100 }
}
```

## Critical Rule: Price Calculations

**NEVER calculate prices on the client side.**

All prices must come from the `/api/cart/calculate` endpoint:

```typescript
// WRONG
const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);

// CORRECT
const { data } = await api.get('/api/cart/calculate');
// data.total is the source of truth
```

## Contributing

1. Read the [SECURITY_RULEBOOK.md](./SECURITY_RULEBOOK.md)
2. Complete the [FEATURE_CHECKLIST.md](./FEATURE_CHECKLIST.md) for each feature
3. Update [TASK_TRACKER.md](./TASK_TRACKER.md) with progress

## License

Proprietary - Lab404Electronics

---

**Last Updated:** 2025-12-28
