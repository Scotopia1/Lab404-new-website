# Deployment Checklist - Production Readiness

**Phase:** 12 - End-to-End Testing & Production Readiness
**Plan:** 12-01
**Task:** 6 - Deployment Documentation and Checklist
**Date:** 2026-01-09

---

## Pre-Deployment Checklist

### 1. Environment Variables Configuration

#### API Server (apps/api)

**Required:**
- [ ] `NODE_ENV=production`
- [ ] `PORT=3001` (or your production port)
- [ ] `DATABASE_URL` - NeonDB production connection string
- [ ] `JWT_SECRET` - ≥32 characters (generate with `openssl rand -base64 32`)
- [ ] `CRON_SECRET` - ≥32 characters (generate with `openssl rand -base64 32`)

**Security:**
- [ ] `CORS_ORIGIN` - Frontend domain(s): `https://yourdomain.com,https://admin.yourdomain.com`
- [ ] `CSRF_SECRET` - (optional, defaults to JWT_SECRET if not set)

**Email (SMTP):**
- [ ] `SMTP_HOST` - e.g., `smtp.gmail.com`, `smtp.sendgrid.net`
- [ ] `SMTP_PORT` - `587` (TLS) or `465` (SSL)
- [ ] `SMTP_USER` - SMTP username/email
- [ ] `SMTP_PASS` - SMTP password or API key
- [ ] `SMTP_FROM_EMAIL` - Sender email (verified with SMTP provider)
- [ ] `SMTP_FROM_NAME` - "Lab404 Electronics"
- [ ] `ADMIN_EMAIL` - Admin notification email

**Optional:**
- [ ] `JWT_EXPIRATION` - Default: `7d`
- [ ] Rate limit overrides (use defaults unless needed)

#### Admin App (apps/admin)

**Required:**
- [ ] `NEXT_PUBLIC_API_URL` - Production API URL: `https://api.yourdomain.com`

#### Website App (apps/lab404-website)

**Required:**
- [ ] `NEXT_PUBLIC_API_URL` - Production API URL: `https://api.yourdomain.com`

---

### 2. Database Setup

**Pre-Production:**
- [ ] Backup existing database (if any)
- [ ] Run all migrations: `pnpm db:migrate` (from `packages/database`)
- [ ] Verify migrations applied successfully
- [ ] Check all tables created

**Post-Migration:**
- [ ] Create admin user(s) in database
  ```sql
  -- Option 1: Register via frontend, then upgrade to admin
  UPDATE customers SET role = 'admin' WHERE email = 'admin@yourdomain.com';

  -- Option 2: Insert directly (hash password first with bcrypt)
  INSERT INTO customers (email, password_hash, role, first_name, last_name, is_guest)
  VALUES ('admin@yourdomain.com', '$2a$12$...', 'admin', 'Admin', 'User', false);
  ```
- [ ] Configure tax rate in settings table
  ```sql
  INSERT INTO settings (key, value, group, type)
  VALUES ('tax_rate', '0.11', 'pricing', 'number')
  ON CONFLICT (key) DO UPDATE SET value = '0.11';
  ```
- [ ] Verify database connectivity from API

---

### 3. Security Verification

**Secrets:**
- [ ] JWT_SECRET ≥32 characters, cryptographically random
- [ ] CRON_SECRET ≥32 characters, cryptographically random
- [ ] No secrets committed to git (check .env.example, not .env)

**Authentication:**
- [ ] Tokens in httpOnly cookies (not localStorage)
- [ ] CSRF protection active on API
- [ ] Rate limiting configured
- [ ] Weak passwords rejected

**HTTPS:**
- [ ] SSL certificate installed
- [ ] HTTPS enforced (redirect HTTP → HTTPS)
- [ ] Secure cookie flag works (`secure: true`)

**CORS:**
- [ ] CORS_ORIGIN set to actual frontend domains
- [ ] No wildcard `*` in production
- [ ] Credentials enabled (`credentials: true`)

---

### 4. SMTP Email Configuration

**Provider Setup:**
- [ ] SMTP provider account created (Gmail, SendGrid, Mailgun, etc.)
- [ ] Sender email verified with provider
- [ ] SPF record configured (if using custom domain)
- [ ] DKIM configured (if supported by provider)

**Test Emails:**
- [ ] Test order confirmation email sends
- [ ] Test admin notification email sends
- [ ] Verify emails land in inbox (not spam)
- [ ] Check rendering on Gmail, Outlook, Apple Mail

**Email Templates:**
- [ ] Customer order confirmation template verified
- [ ] Admin new order notification template verified
- [ ] Contact email in footer correct

---

### 5. Application Build & Deploy

#### Build All Applications

```bash
# From project root

# Build API
cd apps/api
pnpm build

# Build Admin
cd ../admin
pnpm build

# Build Website
cd ../lab404-website
pnpm build

# Verify builds successful (no errors)
```

#### Deployment Order

**1. Deploy API First:**
- [ ] Deploy API server
- [ ] Verify health endpoint: `GET /health`
- [ ] Test database connectivity
- [ ] Verify SMTP configured (check logs)

**2. Deploy Admin App:**
- [ ] Deploy admin frontend
- [ ] Test admin login
- [ ] Verify API connection
- [ ] Check CSRF tokens working

**3. Deploy Website App:**
- [ ] Deploy customer-facing website
- [ ] Test customer registration
- [ ] Test product browsing
- [ ] Complete test checkout

---

### 6. Post-Deployment Verification

**Smoke Tests:**
- [ ] Homepage loads
- [ ] Product listing loads
- [ ] Product detail loads
- [ ] Login works (customer & admin)
- [ ] Registration works
- [ ] Checkout completes
- [ ] Order confirmation email received
- [ ] Admin notification email received
- [ ] Account pages accessible
- [ ] Address management works
- [ ] Profile update works

**Security Tests:**
- [ ] HTTPS enforced (HTTP redirects to HTTPS)
- [ ] Cookies have `secure` flag
- [ ] CSRF protection active (POST without token fails)
- [ ] Rate limiting active (test failed logins)
- [ ] Admin routes require admin role

**Performance Tests:**
- [ ] Run Lighthouse on production
- [ ] Verify Core Web Vitals <3s
- [ ] Check mobile performance
- [ ] Test on real devices

---

## Deployment Platforms

### Option 1: Vercel (Recommended for Next.js Apps)

**Website & Admin:**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy website
cd apps/lab404-website
vercel --prod

# Deploy admin
cd ../admin
vercel --prod
```

**Configuration:**
- Set environment variables in Vercel dashboard
- Configure custom domains
- Enable automatic HTTPS

### Option 2: Railway (Full Stack)

**API + Frontend:**
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Deploy API
cd apps/api
railway up

# Deploy frontends
cd ../lab404-website
railway up
```

**Configuration:**
- Add environment variables in Railway dashboard
- Configure domains
- Set up database connection

### Option 3: Custom VPS (DigitalOcean, AWS, etc.)

**Requirements:**
- Node.js 18+ installed
- PM2 or similar process manager
- Nginx or Apache reverse proxy
- SSL certificate (Let's Encrypt)

**API Deployment:**
```bash
# On server
cd /var/www/lab404-api
git pull
pnpm install
pnpm build
pm2 restart lab404-api
```

**Frontend Deployment:**
```bash
# Build locally, upload build folder
pnpm build
scp -r .next user@server:/var/www/lab404-website/
```

---

## Rollback Plan

### If Critical Issues Found

**1. Identify Issue:**
- Check error logs
- Check monitoring dashboards
- Identify affected component (API, Admin, Website)

**2. Rollback:**

**Option A: Rollback Frontend Only**
```bash
# Revert to previous deployment
vercel rollback  # If using Vercel
# or
git revert [commit]
git push
```

**Option B: Rollback API**
```bash
# SSH to server
pm2 stop lab404-api
git revert [commit]
pnpm install
pnpm build
pm2 restart lab404-api
```

**Option C: Rollback Database**
```bash
# Only if database migration caused issue
pnpm db:rollback
```

**3. Verify Rollback:**
- Test critical user paths
- Verify no data loss
- Confirm users can access site

**4. Investigate & Fix:**
- Review error logs
- Fix issue in development
- Test thoroughly before redeploying

---

## Monitoring & Alerts

### Production Monitoring

**Application Monitoring:**
- [ ] Set up error tracking (Sentry, Rollbar)
- [ ] Set up uptime monitoring (UptimeRobot, Pingdom)
- [ ] Monitor API response times
- [ ] Track error rates

**Performance Monitoring:**
- [ ] Google Search Console (Core Web Vitals)
- [ ] Google Analytics 4 (real user metrics)
- [ ] Lighthouse CI (automated testing)

**Email Monitoring:**
- [ ] Monitor email delivery rates
- [ ] Track bounce rates
- [ ] Check spam reports
- [ ] Verify admin notifications received

**Database Monitoring:**
- [ ] Monitor connection pool usage
- [ ] Track slow queries
- [ ] Monitor database size
- [ ] Set up automated backups

### Alerts Configuration

**Critical Alerts (Immediate Response):**
- [ ] API server down
- [ ] Database unreachable
- [ ] High error rate (>5% of requests)
- [ ] Payment processing failures (if applicable)

**Warning Alerts (Review Within 24h):**
- [ ] High memory usage (>80%)
- [ ] Slow response times (>3s)
- [ ] High failed login attempts
- [ ] Email delivery failures

**Info Alerts (Weekly Review):**
- [ ] Dependency updates available
- [ ] Performance regressions
- [ ] Unusual traffic patterns

---

## Backup Strategy

### Database Backups

**Automated:**
- [ ] Daily full backups (NeonDB automatic or manual script)
- [ ] Hourly incremental backups (optional)
- [ ] Retention: 30 days minimum

**Manual:**
```bash
# Create manual backup before major changes
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql
```

### Application Backups

**Source Code:**
- [ ] Git repository on GitHub/GitLab
- [ ] Tagged releases for each deployment
- [ ] Environment variables documented (not committed)

**Uploaded Files:**
- [ ] Product images backed up
- [ ] User uploads backed up (if applicable)
- [ ] Backup to cloud storage (S3, Cloudinary)

---

## Post-Launch Checklist

**Week 1:**
- [ ] Monitor error logs daily
- [ ] Check email delivery rates
- [ ] Review Core Web Vitals
- [ ] Monitor server resources
- [ ] Collect user feedback

**Week 2-4:**
- [ ] Review analytics data
- [ ] Optimize based on real user metrics
- [ ] Address any bugs reported
- [ ] Monitor conversion rates

**Monthly:**
- [ ] Run security audit
- [ ] Update dependencies
- [ ] Review backup integrity
- [ ] Performance audit

**Quarterly:**
- [ ] Comprehensive security review
- [ ] Performance optimization
- [ ] User experience improvements
- [ ] Feature prioritization

---

## Support & Maintenance

### User Support

**Customer Support:**
- [ ] Support email configured (support@yourdomain.com)
- [ ] FAQ page created
- [ ] Return/refund policy documented
- [ ] Contact page functional

**Technical Support:**
- [ ] On-call schedule for critical issues
- [ ] Escalation procedures defined
- [ ] Documentation for common issues

### Maintenance Windows

**Planned Maintenance:**
- [ ] Schedule during low-traffic hours
- [ ] Notify users 24-48 hours in advance
- [ ] Display maintenance page during downtime
- [ ] Test updates on staging first

**Emergency Maintenance:**
- [ ] Hotfix deployment procedure
- [ ] Rollback plan ready
- [ ] Communication plan (status page, email)

---

## Success Criteria

**Deployment is successful when:**
- ✅ All applications deployed and accessible
- ✅ HTTPS working with valid certificate
- ✅ Database connected and migrations applied
- ✅ Admin user can log in to admin panel
- ✅ Customer can register, login, browse, and checkout
- ✅ Email notifications sent successfully
- ✅ Performance targets met (Lighthouse >90)
- ✅ Security checks passed (HTTPS, CSRF, cookies)
- ✅ Monitoring and alerts configured
- ✅ Backup strategy in place

---

## Deployment Sign-Off

**Pre-Deployment Approvals:**
- [ ] Development team approval
- [ ] QA testing completed
- [ ] Security audit passed
- [ ] Performance testing passed
- [ ] Stakeholder approval

**Post-Deployment Verification:**
- [ ] Smoke tests passed
- [ ] No critical errors in logs
- [ ] Users can complete core actions
- [ ] Team notified of successful deployment

**Deployment Status:** 🚀 READY FOR PRODUCTION

---

**Document Created:** 2026-01-09
**Status:** ✅ DEPLOYMENT READY
**Next Steps:** Execute deployment plan when ready
