# Operations Documentation - Production Readiness

**Phase:** 12 - End-to-End Testing & Production Readiness
**Plan:** 12-01
**Task:** 6 - Operations Documentation
**Date:** 2026-01-09

---

## System Overview

### Architecture

**Technology Stack:**
- **Frontend:** Next.js 14 (React 18, TypeScript)
  - Website: Customer-facing e-commerce
  - Admin: Admin dashboard for order/product management
- **Backend:** Express.js (Node.js, TypeScript)
- **Database:** PostgreSQL (NeonDB serverless)
- **ORM:** Drizzle ORM
- **Authentication:** JWT in httpOnly cookies
- **Email:** Nodemailer (SMTP)

**Deployment:**
- API: Node.js server (Express)
- Frontend Apps: Next.js static export or SSR
- Database: NeonDB (cloud-hosted PostgreSQL)

---

## Environment Setup

### Local Development

**Prerequisites:**
- Node.js 18+
- pnpm 8+
- PostgreSQL (or NeonDB account)
- SMTP credentials (for email testing)

**Setup Steps:**
```bash
# Clone repository
git clone https://github.com/yourusername/lab404-new.git
cd lab404-new

# Install dependencies
pnpm install

# Configure environment variables
cp .env.example .env
# Edit .env with your values

# Run database migrations
cd packages/database
pnpm db:migrate
cd ../..

# Start development servers
pnpm dev  # Starts all apps (API + Admin + Website)
```

**Development URLs:**
- API: `http://localhost:3001`
- Admin: `http://localhost:3000`
- Website: `http://localhost:3002`

---

### Production Environment

**Required Services:**
- Node.js hosting (Railway, Vercel, VPS)
- PostgreSQL database (NeonDB recommended)
- SMTP email service (SendGrid, Mailgun, Gmail)
- Domain with SSL certificate

**Environment Variables:**
See `12-01-DEPLOYMENT.md` for complete list.

---

## Database Management

### Connection

**NeonDB (Recommended):**
```env
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
```

**Local PostgreSQL:**
```env
DATABASE_URL=postgresql://localhost:5432/lab404
```

### Migrations

**Run Migrations:**
```bash
cd packages/database
pnpm db:migrate
```

**Create New Migration:**
```bash
pnpm db:generate
```

**Rollback Last Migration:**
```bash
pnpm db:rollback
```

**Check Migration Status:**
```bash
pnpm db:check
```

### Database Schema

**Core Tables:**
- `customers` - User accounts (customers and admins)
- `products` - Product catalog
- `product_variants` - Product variations (size, color)
- `orders` - Customer orders
- `order_items` - Line items in orders
- `carts` - Shopping carts (session or customer)
- `cart_items` - Items in carts
- `customer_addresses` - Saved shipping/billing addresses
- `settings` - Application settings (tax rate, etc.)
- `promo_codes` - Discount codes
- `blogs` - Blog posts

**Indexes:**
- Recommended indexes in Phase 11 database verification
- Apply indexes based on query patterns

### Data Seeding

**Admin User Creation:**
```sql
-- Method 1: Register via frontend, then upgrade
UPDATE customers
SET role = 'admin'
WHERE email = 'admin@yourdomain.com';

-- Method 2: Direct insert (hash password with bcrypt first)
INSERT INTO customers (
  email,
  password_hash,
  role,
  first_name,
  last_name,
  is_guest,
  created_at,
  updated_at
) VALUES (
  'admin@yourdomain.com',
  '$2a$12$...', -- bcrypt hash
  'admin',
  'Admin',
  'User',
  false,
  NOW(),
  NOW()
);
```

**Tax Rate Configuration:**
```sql
INSERT INTO settings (key, value, "group", type, created_at, updated_at)
VALUES ('tax_rate', '0.11', 'pricing', 'number', NOW(), NOW())
ON CONFLICT (key) DO UPDATE
SET value = '0.11', updated_at = NOW();
```

---

## API Operations

### Starting the API

**Development:**
```bash
cd apps/api
pnpm dev
```

**Production:**
```bash
cd apps/api
pnpm build
pnpm start

# Or with PM2
pm2 start dist/server.js --name lab404-api
```

### Health Check

```bash
# Check API health
curl http://localhost:3001/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2026-01-09T12:34:56.789Z",
  "uptime": 123.456
}
```

### Logs

**View Logs:**
```bash
# PM2 logs
pm2 logs lab404-api

# Docker logs
docker logs lab404-api

# File logs (if configured)
tail -f /var/log/lab404-api/error.log
```

**Log Levels:**
- `error` - Errors and exceptions
- `warn` - Warnings (SMTP not configured, etc.)
- `info` - Important events (email sent, order created)
- `debug` - Detailed debugging info (development only)

---

## Settings Management

### Application Settings

**Access Settings:**
- Admin panel: Settings page
- API: `GET /api/settings`
- Database: `settings` table

**Common Settings:**

**Tax Rate:**
```sql
-- View current tax rate
SELECT * FROM settings WHERE key = 'tax_rate';

-- Update tax rate (11%)
UPDATE settings
SET value = '0.11', updated_at = NOW()
WHERE key = 'tax_rate';
```

**Shipping (if configured):**
```sql
-- View shipping settings
SELECT * FROM settings WHERE "group" = 'shipping';

-- Update shipping rate
UPDATE settings
SET value = '5.00', updated_at = NOW()
WHERE key = 'shipping_rate';
```

**Email Templates:**
- Managed in code: `apps/api/src/services/email-templates.service.ts`
- Customization requires code change and redeployment

---

## Admin Access

### Creating Admin Users

**Option 1: Via Database (Recommended for First Admin):**
```sql
-- Register as customer first, then upgrade
UPDATE customers
SET role = 'admin'
WHERE email = 'newadmin@yourdomain.com';
```

**Option 2: Via Admin Panel (If Already Admin):**
- Login as existing admin
- Go to Customers page (if implemented)
- Edit customer
- Change role to 'admin'

### Admin Permissions

**Admin Role (`role='admin'`):**
- Access admin panel
- Manage products
- View all orders
- Manage customers (if implemented)
- View analytics
- Update settings

**Customer Role (`role='customer'` or null):**
- Access customer account pages
- View own orders
- Manage own addresses
- Update own profile

---

## Email Configuration

### SMTP Setup

**Gmail (Development/Small Scale):**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=yourapp@gmail.com
SMTP_PASS=app-specific-password
SMTP_FROM_EMAIL=yourapp@gmail.com
SMTP_FROM_NAME=Lab404 Electronics
```

**SendGrid (Recommended for Production):**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
SMTP_FROM_EMAIL=noreply@yourdomain.com
SMTP_FROM_NAME=Lab404 Electronics
```

**Mailgun:**
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASS=your-mailgun-password
SMTP_FROM_EMAIL=noreply@yourdomain.com
SMTP_FROM_NAME=Lab404 Electronics
```

### Email Testing

**Test Order Confirmation:**
1. Complete test checkout
2. Check email inbox (and spam folder)
3. Verify order details correct
4. Check rendering in Gmail/Outlook

**Test Admin Notification:**
1. Check admin email inbox after order
2. Verify admin email address correct
3. Confirm all order information present

**Troubleshooting:**
- Check API logs for email send errors
- Verify SMTP credentials correct
- Check SMTP provider dashboard
- Ensure sender email verified with provider

---

## Backup & Restore

### Database Backup

**Automated Backups (NeonDB):**
- NeonDB provides automatic backups
- Point-in-time recovery available
- Check NeonDB dashboard for backup status

**Manual Backup:**
```bash
# Create backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql

# Compress backup
gzip backup-*.sql

# Upload to cloud storage (S3, etc.)
aws s3 cp backup-*.sql.gz s3://your-backup-bucket/
```

**Scheduled Backups (Cron):**
```bash
# Add to crontab
0 2 * * * /path/to/backup-script.sh
```

### Database Restore

**From Backup File:**
```bash
# Restore database
psql $DATABASE_URL < backup-20260109-120000.sql

# Or with gunzip
gunzip -c backup-20260109-120000.sql.gz | psql $DATABASE_URL
```

**Point-in-Time Restore (NeonDB):**
- Use NeonDB dashboard
- Select restore point
- Create new branch or restore to existing

---

## Monitoring

### Application Monitoring

**Health Checks:**
```bash
# API health
curl https://api.yourdomain.com/health

# Expected: 200 OK
```

**Key Metrics to Monitor:**
- API uptime (target: 99.9%)
- Response time (target: <500ms p95)
- Error rate (target: <1%)
- Database connection pool usage
- Memory usage
- CPU usage

### Error Monitoring

**Recommended Tools:**
- Sentry (error tracking)
- Rollbar (error tracking)
- Datadog (APM)
- New Relic (APM)

**Setup Sentry (Example):**
```typescript
// apps/api/src/app.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});

app.use(Sentry.Handlers.errorHandler());
```

### Performance Monitoring

**Google Search Console:**
- Monitor Core Web Vitals
- Track search performance
- Identify mobile usability issues

**Google Analytics 4:**
- Track page views
- Monitor user flows
- Measure conversion rates

**Custom Metrics:**
- Order completion rate
- Cart abandonment rate
- Average order value
- Email open rates

---

## Troubleshooting

### Common Issues

#### API Won't Start

**Symptoms:** Server crashes on startup

**Checks:**
1. Verify JWT_SECRET set and ≥32 characters
2. Verify DATABASE_URL correct
3. Check database migrations applied
4. Review startup logs

**Solution:**
```bash
# Verify environment variables
printenv | grep JWT_SECRET
printenv | grep DATABASE_URL

# Run migrations
cd packages/database
pnpm db:migrate

# Check logs
pm2 logs lab404-api --lines 100
```

#### Database Connection Failed

**Symptoms:** API returns 500 errors, logs show database connection errors

**Checks:**
1. Verify DATABASE_URL correct
2. Check database server running
3. Verify network connectivity
4. Check database credentials

**Solution:**
```bash
# Test database connection
psql $DATABASE_URL -c "SELECT 1;"

# Check NeonDB dashboard for database status
# Verify connection string format
```

#### Emails Not Sending

**Symptoms:** Orders created but no emails received

**Checks:**
1. Check API logs for email errors
2. Verify SMTP credentials
3. Check SMTP provider dashboard
4. Verify sender email verified

**Solution:**
```bash
# Check logs for email errors
pm2 logs lab404-api | grep -i email

# Test SMTP connection manually
node -e "const nodemailer = require('nodemailer'); /* test code */"

# Verify environment variables
printenv | grep SMTP
```

#### Login Not Working

**Symptoms:** Users can't log in, receive 401 errors

**Checks:**
1. Verify JWT_SECRET configured
2. Check password hash format (bcrypt)
3. Verify cookies sent correctly
4. Check CORS configuration

**Solution:**
```bash
# Check if cookies set
# In browser DevTools: Application > Cookies > auth_token

# Verify CORS origin
printenv | grep CORS_ORIGIN

# Check API logs for auth errors
pm2 logs lab404-api | grep -i auth
```

---

## Security Operations

### Secrets Rotation

**Rotate JWT_SECRET:**
1. Generate new secret: `openssl rand -base64 32`
2. Update production environment variable
3. Restart API server
4. **Note:** Existing user sessions invalidated (users must re-login)

**Rotate CRON_SECRET:**
1. Generate new secret: `openssl rand -base64 32`
2. Update environment variable
3. Update cron job configuration
4. Restart API server

### Security Audits

**Monthly:**
- [ ] Review dependency vulnerabilities: `pnpm audit`
- [ ] Check for new CVEs
- [ ] Review access logs for suspicious activity

**Quarterly:**
- [ ] Comprehensive security audit
- [ ] Update dependencies
- [ ] Review and update secrets
- [ ] Penetration testing (if budget allows)

---

## Scaling Operations

### Horizontal Scaling

**API Servers:**
- Deploy multiple API instances
- Use load balancer (nginx, AWS ALB)
- Ensure stateless API (JWT in cookies, no in-memory sessions)

**Database:**
- Use NeonDB autoscaling
- Implement read replicas for read-heavy operations
- Add connection pooling (pgBouncer)

### Vertical Scaling

**Increase Resources:**
- Monitor CPU/memory usage
- Scale up when consistently >70% usage
- NeonDB: upgrade plan for more storage/connections

### Caching

**Frontend:**
- Next.js automatic static optimization
- CDN for static assets
- Browser caching headers

**Backend:**
- React Query caching on frontend
- Database query caching (if needed)
- Redis for session caching (advanced)

---

## Disaster Recovery

### Incident Response Plan

**1. Detect:**
- Monitoring alerts
- User reports
- Error spikes

**2. Assess:**
- Determine severity (critical, high, medium, low)
- Identify affected components
- Estimate user impact

**3. Respond:**
- Critical: Immediate rollback
- High: Deploy hotfix within 4 hours
- Medium: Deploy fix within 24 hours
- Low: Deploy fix in next release

**4. Communicate:**
- Update status page
- Notify affected users (if applicable)
- Post-incident report

**5. Recover:**
- Deploy fix or rollback
- Verify resolution
- Monitor for recurrence

**6. Review:**
- Post-mortem meeting
- Document lessons learned
- Update procedures

### Data Recovery

**Database Corruption:**
1. Stop accepting new writes
2. Assess corruption extent
3. Restore from latest backup
4. Replay transaction logs (if available)
5. Verify data integrity

**Accidental Data Deletion:**
1. Identify affected records
2. Restore from point-in-time backup
3. Merge restored data with current state
4. Verify data consistency

---

## Operational Runbook

### Daily Tasks

- [ ] Check error logs
- [ ] Monitor server health (uptime, CPU, memory)
- [ ] Review customer support tickets
- [ ] Verify email delivery rates

### Weekly Tasks

- [ ] Review performance metrics
- [ ] Check database size and growth
- [ ] Update documentation (if needed)
- [ ] Review security logs

### Monthly Tasks

- [ ] Update dependencies
- [ ] Security vulnerability scan
- [ ] Database optimization (analyze, vacuum)
- [ ] Review backup integrity
- [ ] Performance audit

### Quarterly Tasks

- [ ] Comprehensive security audit
- [ ] Major dependency updates
- [ ] Disaster recovery drill
- [ ] Capacity planning review

---

## Contact Information

### Emergency Contacts

**On-Call Team:**
- Technical Lead: [Name, Phone, Email]
- DevOps: [Name, Phone, Email]
- Database Admin: [Name, Phone, Email]

**Escalation Path:**
1. On-Call Engineer
2. Technical Lead
3. CTO/Engineering Manager

### Service Providers

**Hosting:**
- Provider: [Vercel/Railway/AWS]
- Support: [Support URL/Email]
- Account: [Account ID]

**Database:**
- Provider: NeonDB
- Support: support@neon.tech
- Dashboard: https://console.neon.tech

**Email:**
- Provider: [SendGrid/Mailgun/Gmail]
- Support: [Support URL]
- API Dashboard: [Dashboard URL]

---

## Operations Checklist

**Daily Operations:**
- ✅ Monitor system health
- ✅ Check error rates
- ✅ Review email delivery
- ✅ Respond to support tickets

**Weekly Operations:**
- ✅ Review metrics and analytics
- ✅ Check database performance
- ✅ Update documentation

**Monthly Operations:**
- ✅ Update dependencies
- ✅ Security scan
- ✅ Database maintenance
- ✅ Backup verification

**As Needed:**
- ✅ Deploy code updates
- ✅ Scale resources
- ✅ Rotate secrets
- ✅ Respond to incidents

---

**Document Created:** 2026-01-09
**Status:** ✅ OPERATIONS READY
**Maintained By:** Operations Team
