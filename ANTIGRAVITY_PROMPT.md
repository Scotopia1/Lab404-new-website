# Antigravity AI - Lab404Electronics Website Development Prompt

## System Context

You are working on the **customer-facing website** for Lab404Electronics, an electronics e-commerce platform. You are part of a parallel development team where:

- **You (Antigravity AI)**: Responsible for the Customer Website (frontend)
- **Claude Code**: Responsible for the Backend API (Express.js) and Admin Dashboard (Next.js)

Both AIs share documentation and must stay synchronized through the shared task tracker.

---

## Project Information

### Business Overview
- **Company Name:** Lab404Electronics
- **Business Type:** Electronics E-commerce Store
- **Target Audience:** Electronics enthusiasts, hobbyists, professionals
- **Currency:** USD (with multi-currency support planned)
- **Shipping:** Worldwide
- **Payment:** Cash on Delivery (initially), Stripe (future)

### Your Responsibilities
You are building the **Customer Website** with the following pages:
1. **Home** - Landing page with hero, featured products, categories
2. **Products** - Product listing with filters, search, pagination
3. **Product Detail** - Individual product page with images, description, add to cart
4. **About** - Company information page
5. **Contact Us** - Contact form and business information
6. **Blogs** - Blog listing and individual blog posts
7. **Cart** - Shopping cart with quantity management, promo codes
8. **Checkout** - Guest or logged-in checkout with COD payment
9. **User Account** - Login, Register, Profile, Order History, Addresses

---

## Technical Stack

### Your Technology Stack
| Component | Technology |
|-----------|------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui |
| State Management | Zustand (client) + React Query (server state) |
| Forms | React Hook Form + Zod |
| HTTP Client | Axios or fetch |
| Icons | Lucide React |

### Backend API (built by Claude Code)
| Component | Technology |
|-----------|------------|
| Framework | Express.js |
| Database | NeonDB (PostgreSQL) |
| Authentication | Neon Auth |
| File Storage | ImageKit.io |

---

## Critical Rules & Guidelines

### RULE 1: Never Calculate Prices Client-Side

**This is the most critical security rule.** All price calculations must come from the backend API.

```typescript
// WRONG - Never do this
const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
const tax = total * 0.11;
const grandTotal = total + tax;

// CORRECT - Always fetch calculated totals from API
const { data } = await api.get('/api/cart/calculate');
// data.subtotal, data.taxAmount, data.total come from backend
```

**Why?** If prices are calculated client-side, hackers can manipulate the JavaScript to change prices before sending to the server. The backend recalculates everything from database prices.

### RULE 2: Input Validation

Always validate inputs on the frontend for UX, but know that the backend will re-validate everything.

```typescript
// Use Zod schemas that match backend expectations
const checkoutSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().min(10).max(20),
  addressLine1: z.string().min(1).max(255),
  city: z.string().min(1).max(100),
  country: z.string().min(1).max(100),
});
```

### RULE 3: Authentication Flow

Use Neon Auth tokens for authenticated requests:

```typescript
// Store token after login
localStorage.setItem('auth_token', response.data.token);

// Include in requests
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
  },
});
```

### RULE 4: Guest Checkout Support

Support both guest and authenticated checkout:

```typescript
// Cart identification
// - Authenticated users: Cart linked to user ID via token
// - Guests: Cart linked to session ID stored in localStorage/cookies

const getCartId = () => {
  const token = getAuthToken();
  if (token) return null; // Backend uses user ID from token

  let sessionId = localStorage.getItem('cart_session_id');
  if (!sessionId) {
    sessionId = generateUUID();
    localStorage.setItem('cart_session_id', sessionId);
  }
  return sessionId;
};
```

---

## API Integration Guide

### Base Configuration

```typescript
// lib/api.ts
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### API Response Format

All API responses follow this format:

```typescript
// Success response
interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Error response
interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
}
```

### Key API Endpoints

#### Products
```typescript
// Get products list
GET /api/products?page=1&limit=20&category=electronics&search=arduino

// Get single product
GET /api/products/:slug

// Get featured products
GET /api/products/featured

// Search products
GET /api/products/search?q=raspberry
```

#### Categories
```typescript
// Get all categories
GET /api/categories

// Get category with products
GET /api/categories/:slug
```

#### Cart (IMPORTANT)
```typescript
// Get cart
GET /api/cart
Headers: { Authorization: Bearer <token> } OR { X-Session-ID: <guest-session-id> }

// Add item to cart
POST /api/cart/items
Body: { productId: string, variantId?: string, quantity: number }

// Update cart item
PUT /api/cart/items/:id
Body: { quantity: number }

// Remove cart item
DELETE /api/cart/items/:id

// Apply promo code
POST /api/cart/apply-promo
Body: { code: string }

// CRITICAL: Get calculated totals
GET /api/cart/calculate
Response: {
  success: true,
  data: {
    items: [...],
    itemCount: 3,
    subtotal: 299.97,        // From backend
    taxRate: 0.11,           // From backend settings
    taxAmount: 32.99,        // Calculated by backend
    shippingAmount: 0,       // Calculated by backend
    discountAmount: 29.99,   // Calculated by backend
    promoCode: "SAVE10",
    total: 302.97,           // Final total from backend
    currency: "USD"
  }
}
```

#### Checkout
```typescript
// Create order
POST /api/orders
Body: {
  shippingAddress: {
    firstName: string,
    lastName: string,
    addressLine1: string,
    addressLine2?: string,
    city: string,
    state?: string,
    postalCode?: string,
    country: string,
    phone: string,
  },
  billingAddress: { ... }, // Same structure or "same_as_shipping": true
  customerEmail: string,
  customerNotes?: string,
  paymentMethod: "cod", // Cash on delivery
}

Response: {
  success: true,
  data: {
    orderId: "uuid",
    orderNumber: "LAB-2025-0001",
    total: 302.97,
    status: "pending"
  }
}
```

#### Authentication
```typescript
// Register
POST /api/auth/register
Body: { email, password, firstName, lastName }

// Login
POST /api/auth/login
Body: { email, password }

// Get current user
GET /api/auth/me

// Logout
POST /api/auth/logout
```

#### User Account
```typescript
// Get profile
GET /api/customers/me

// Update profile
PUT /api/customers/me

// Get orders
GET /api/orders

// Get order detail
GET /api/orders/:id

// Track order (public)
GET /api/orders/track/:orderNumber
```

#### Blogs
```typescript
// Get blogs
GET /api/blogs?page=1&limit=10

// Get single blog
GET /api/blogs/:slug
```

#### Contact
```typescript
// Submit contact form
POST /api/contact
Body: { name, email, subject, message }
```

---

## Page Requirements

### Home Page
- Hero section with call-to-action
- Featured products section (GET /api/products/featured)
- Category showcase (GET /api/categories)
- Newsletter signup section
- Recent blog posts (GET /api/blogs?limit=3)

### Products Page
- Product grid with cards
- Sidebar with category filters
- Price range filter
- Search functionality
- Sort options (price, name, newest)
- Pagination
- Loading states

### Product Detail Page
- Image gallery with zoom
- Product information
- Price display (from API)
- Quantity selector
- Add to cart button
- Related products
- Product specifications

### Cart Page
- Cart items list
- Quantity adjustment (+/-)
- Remove item
- Promo code input
- **Order summary showing calculated totals from API**
- Proceed to checkout button

### Checkout Page
- Guest/Login option
- Shipping address form
- Billing address form (with "same as shipping" checkbox)
- Order summary (read-only, from API)
- Place order button
- Order confirmation page

### User Account
- Login form
- Registration form
- Profile edit form
- Order history list
- Order detail view
- Address management

### About Page
- Company story
- Mission/values
- Team section (optional)

### Contact Page
- Contact form (name, email, subject, message)
- Business information (address, phone, email)
- Map (optional)
- Business hours

### Blog Pages
- Blog listing with cards
- Blog detail page
- Tags/categories sidebar

---

## Shared Documents

Please check these files regularly for updates:

1. **PROJECT_PLAN.md** - Full project specification and API documentation
2. **TASK_TRACKER.md** - Task status and dependencies
3. **SECURITY_RULEBOOK.md** - Security requirements
4. **FEATURE_CHECKLIST.md** - Checklist for completing features

---

## Synchronization Protocol

### When Starting Work
1. Read TASK_TRACKER.md for current status
2. Check which backend endpoints are ready
3. Update your task status to "In Progress"

### When Completing Work
1. Update TASK_TRACKER.md with completion status
2. Add any notes about implementation
3. Note any issues or blockers

### When Blocked
1. Mark task as "Blocked" in TASK_TRACKER.md
2. Add note explaining what's needed from backend
3. Continue with other non-blocked tasks

---

## UI/UX Guidelines

### Design Principles
- Clean, modern, professional design
- Mobile-first responsive design
- Fast loading times
- Accessible (WCAG 2.1 AA)
- Consistent styling throughout

### Color Palette (Suggested)
```css
--primary: #2563eb;      /* Blue */
--secondary: #64748b;    /* Slate */
--accent: #f59e0b;       /* Amber */
--success: #22c55e;      /* Green */
--error: #ef4444;        /* Red */
--background: #ffffff;
--foreground: #0f172a;
```

### Typography
- Headings: Inter or similar sans-serif
- Body: System font stack
- Consistent sizing scale

### Components to Build
- Header with navigation
- Footer
- Product card
- Cart item row
- Form inputs
- Buttons (primary, secondary, outline)
- Modal/dialog
- Toast notifications
- Loading spinners/skeletons
- Pagination
- Breadcrumbs

---

## Development Workflow

### Folder Structure
```
lab404-website/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (shop)/            # Shop routes group
│   │   │   ├── page.tsx       # Home
│   │   │   ├── products/
│   │   │   ├── cart/
│   │   │   ├── checkout/
│   │   │   ├── about/
│   │   │   ├── contact/
│   │   │   └── blogs/
│   │   ├── (auth)/            # Auth routes group
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── account/           # Protected account routes
│   │   │   ├── profile/
│   │   │   ├── orders/
│   │   │   └── addresses/
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── layout/            # Header, Footer, etc.
│   │   ├── products/          # Product-related components
│   │   ├── cart/              # Cart-related components
│   │   └── forms/             # Form components
│   ├── lib/
│   │   ├── api.ts            # API client
│   │   ├── utils.ts          # Utility functions
│   │   └── validations.ts    # Zod schemas
│   ├── hooks/                 # Custom hooks
│   ├── store/                 # Zustand stores
│   └── types/                 # TypeScript types
├── public/
└── package.json
```

### Getting Started Commands
```bash
# Create Next.js project
npx create-next-app@latest lab404-website --typescript --tailwind --eslint --app

# Install dependencies
npm install axios zustand @tanstack/react-query react-hook-form @hookform/resolvers zod lucide-react

# Install shadcn/ui
npx shadcn@latest init

# Add commonly used shadcn components
npx shadcn@latest add button input card dialog toast form table badge
```

---

## Questions for Backend Team

If you need clarification from Claude Code, add questions to the TASK_TRACKER.md Communication Log section. Common questions might include:

1. "When will endpoint X be ready?"
2. "What's the exact response format for X?"
3. "How should authentication errors be handled?"
4. "Is there a specific rate limit I should handle?"

---

## Final Notes

1. **Always display prices from API responses** - Never calculate totals
2. **Handle loading and error states** - Show spinners, error messages
3. **Mobile-first design** - Test on mobile viewports
4. **Optimistic updates** - Update UI immediately, then sync with server
5. **SEO optimization** - Use Next.js metadata, semantic HTML
6. **Image optimization** - Use Next.js Image component with ImageKit URLs

Good luck with the development! Remember to check TASK_TRACKER.md regularly for updates from the backend team.
