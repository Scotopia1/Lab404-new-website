# Vercel Environment Variables Setup Guide

This document lists all environment variables that need to be configured on Vercel for each application.

---

## 🔴 API (apps/api) - api.lab404electronics.com

### Required Variables

```bash
# Database
DATABASE_URL=postgresql://neondb_owner:npg_4R5urnjFLPUV@ep-fancy-wave-ag6fo16i-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require

# Authentication
JWT_SECRET=0a28f9bd7d333ca1e1bfeedf88bb55f4321d68d06bfc2ff7915a961c3af33986
JWT_EXPIRES_IN=7d

# ImageKit (File Storage)
IMAGEKIT_PUBLIC_KEY=public_y2n49QdOVlmC8YJk8PJ9M+UYe8Y=
IMAGEKIT_PRIVATE_KEY=private_nUBEPVuRTBaLkM8UpTp0Hf2A8tc=
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/7ajexgk5x/

# Email (SMTP) - ⚠️ CRITICAL: These must be updated
SMTP_HOST=mail.spacemail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=anthony@lab404electronics.com
SMTP_PASS=Lab4@4electronics
SMTP_FROM_EMAIL=anthony@lab404electronics.com
SMTP_FROM_NAME=Lab404 Electronics

# Application URLs
API_URL=https://api.lab404electronics.com
API_PORT=4000
ADMIN_URL=https://admin.lab404electronics.com
WEB_URL=https://lab404electronics.com

# CORS Configuration
CORS_ORIGINS=https://lab404electronics.com,https://admin.lab404electronics.com

# Store Settings
STORE_NAME=Lab404Electronics
STORE_CURRENCY=USD
DEFAULT_TAX_RATE=0.11

# Google APIs (Image Search)
GOOGLE_API_KEY=AIzaSyCtG7WyXlSHkY5fJOqmP9hhE_q7cFQrSlw
GOOGLE_SEARCH_ENGINE_ID=8759f31957d1c40ba

# Environment
NODE_ENV=production
```

### Optional Variables

```bash
# Stripe (Payment - Future)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PUBLISHABLE_KEY=

# Meilisearch (Full-text Search - Railway hosted)
MEILISEARCH_HOST=https://meilisearch-production-c24a.up.railway.app
MEILISEARCH_API_KEY=
```

---

## 🟢 Website (apps/lab404-website) - lab404electronics.com

### Required Variables

```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://api.lab404electronics.com/api

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://lab404electronics.com
NEXT_PUBLIC_SITE_NAME=Lab404 Electronics

# Environment
NODE_ENV=production
```

### Optional Variables

```bash
# Analytics (add when ready)
NEXT_PUBLIC_GA_ID=
```

---

## 🔵 Admin Dashboard (apps/admin) - admin.lab404electronics.com

### Required Variables

```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://api.lab404electronics.com/api

# Environment
NODE_ENV=production
```

---

## 📋 Vercel Setup Instructions

### Step 1: Access Vercel Dashboard
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project

### Step 2: Configure Each App

For each app (API, Website, Admin):

1. Go to **Settings** → **Environment Variables**
2. Add all the required variables listed above for that specific app
3. Select the appropriate environment:
   - **Production** (for live deployments)
   - **Preview** (for PR previews - optional)
   - **Development** (for local development - optional)

### Step 3: Redeploy

After adding/updating environment variables:
1. Go to **Deployments** tab
2. Find the latest deployment
3. Click the three dots menu → **Redeploy**
4. Or push a new commit to trigger automatic deployment

---

## ⚠️ Critical Updates Required

### 1. SMTP Email Configuration (API)

**Current Issue:** The deployed API doesn't have the updated SMTP environment variables, causing the 500 error on notifications.

**Action Required:**
Add these variables to the API deployment on Vercel:
```bash
SMTP_FROM_EMAIL=anthony@lab404electronics.com
SMTP_FROM_NAME=Lab404 Electronics
```

### 2. CORS Origins (API)

**Current Issue:** May need to be updated to match production URLs.

**Action Required:**
Verify `CORS_ORIGINS` includes both production domains:
```bash
CORS_ORIGINS=https://lab404electronics.com,https://admin.lab404electronics.com
```

---

## 🔒 Security Notes

1. **Never commit `.env` files** to git (already in .gitignore)
2. **Rotate secrets regularly** (JWT_SECRET, API keys, passwords)
3. **Use different secrets** for production vs development
4. **Restrict CORS origins** to only your domains in production
5. **Keep SMTP credentials secure** - consider using environment-specific email accounts

---

## 🧪 Testing After Setup

### Test Email Notifications:
1. Deploy API with new environment variables
2. Go to Admin Dashboard → Settings → Notifications
3. Click "Send Test Email"
4. Should succeed without 500 error

### Test Tax Calculations:
1. Go to Admin Dashboard → Settings
2. Update tax rate to a test value (e.g., 15%)
3. Create a test order
4. Verify tax calculation uses the configured rate

---

## 📝 Maintenance

- Review and update environment variables when:
  - Rotating secrets/credentials
  - Changing third-party service keys
  - Updating URLs or domains
  - Modifying feature flags

- Keep this document updated when adding new environment variables

---

Last Updated: 2026-01-08
