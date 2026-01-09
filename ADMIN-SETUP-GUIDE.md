# Admin User Setup Guide

This guide explains how to set up and manage admin users in the Lab404 Electronics platform.

## Overview

The system uses a role-based authentication system where users in the `customers` table can have either a `customer` or `admin` role. Admin users have access to the admin dashboard and admin-only API endpoints.

## Initial Setup

### Step 1: Apply Database Migration

First, add the `role` column to your database:

```sql
-- This migration adds the role column to the customers table
psql $DATABASE_URL -f packages/database/src/migrations/add-role-column.sql
```

Or execute the SQL directly:

```sql
-- Add role column with default value 'customer'
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'customer' NOT NULL;

-- Add check constraint to ensure only valid roles
ALTER TABLE customers
ADD CONSTRAINT customers_role_check CHECK (role IN ('customer', 'admin'));

-- Create index for faster role-based queries
CREATE INDEX IF NOT EXISTS idx_customers_role ON customers(role);
```

### Step 2: Create or Check Admin Users

Use the admin setup script to manage admin users:

```bash
# Check for existing admin users
pnpm tsx scripts/setup-admin-user.ts check

# Create a new admin user interactively
pnpm tsx scripts/setup-admin-user.ts create

# Promote an existing user to admin
pnpm tsx scripts/setup-admin-user.ts promote admin@lab404electronics.com
```

## Admin Setup Script Features

### Check Command
```bash
pnpm tsx scripts/setup-admin-user.ts check
```
Lists all admin users with:
- Email address
- Full name
- Account status (Active/Inactive)
- Email verification status
- Creation date

### Create Command
```bash
pnpm tsx scripts/setup-admin-user.ts create
```
Interactively creates a new admin user:
- Prompts for email, password, first name, last name
- Validates password strength (min 8 chars, uppercase, lowercase, number)
- Hashes password with bcrypt (12 rounds)
- Auto-verifies email for admin users
- Creates user with `role='admin'`

### Promote Command
```bash
pnpm tsx scripts/setup-admin-user.ts promote user@example.com
```
Promotes an existing customer to admin:
- Finds user by email
- Updates role to 'admin'
- Preserves all existing user data

## Manual Database Setup (Alternative)

If you prefer to manage admin users directly via SQL:

### Create New Admin User
```sql
-- Note: You'll need to hash the password first using bcrypt
-- You can use: bcryptjs.hash('your-password', 12)

INSERT INTO customers (
  email,
  password_hash,
  role,
  first_name,
  last_name,
  is_guest,
  is_active,
  email_verified,
  email_verified_at,
  auth_user_id
) VALUES (
  'admin@lab404electronics.com',
  '$2a$12$YOUR_HASHED_PASSWORD_HERE',
  'admin',
  'Admin',
  'User',
  false,
  true,
  true,
  NOW(),
  'admin_' || extract(epoch from now())::bigint
);
```

### Promote Existing User to Admin
```sql
UPDATE customers
SET role = 'admin', updated_at = NOW()
WHERE email = 'user@example.com';
```

### Check Admin Users
```sql
SELECT
  id,
  email,
  first_name,
  last_name,
  role,
  is_active,
  email_verified,
  created_at
FROM customers
WHERE role = 'admin';
```

## Login Process

Once an admin user is created:

1. **Navigate to Admin Login**: Visit `http://localhost:3001/login` (or your admin URL)

2. **Enter Credentials**:
   - Email: `admin@lab404electronics.com` (or your admin email)
   - Password: Your chosen password

3. **Authentication Flow**:
   - System verifies email and password
   - Checks the `role` column in the database
   - Generates JWT token with role embedded
   - Sets secure httpOnly cookie
   - Redirects to admin dashboard

4. **Access Control**:
   - Admin endpoints check `req.user.role === 'admin'`
   - Regular users (role='customer') cannot access admin routes
   - All API routes requiring admin use `requireAdmin` middleware

## Test Admin Credentials

For testing purposes, the test suite uses:
- **Email**: `admin@lab404electronics.com`
- **Password**: `Lab404Admin2024!`

These credentials are defined in `apps/admin/tests/fixtures.ts:4-5`

## Security Notes

1. **Password Requirements**:
   - Minimum 8 characters
   - At least one uppercase letter
   - At least one lowercase letter
   - At least one number
   - Not in common password list

2. **Token Storage**:
   - Tokens stored in httpOnly cookies (XSS protection)
   - Secure flag enabled in production
   - SameSite policy configured

3. **Role Verification**:
   - Role stored in database, not client-side
   - Role embedded in JWT and verified on each request
   - Database constraint ensures only 'customer' or 'admin' roles

4. **Admin Best Practices**:
   - Use strong, unique passwords for admin accounts
   - Enable email verification
   - Regularly audit admin user list
   - Monitor admin activity in audit logs

## Troubleshooting

### "No admin users found"
- Run the migration first: `add-role-column.sql`
- Create an admin user with the setup script
- Or manually promote a user in the database

### "Email already exists"
- Use the `promote` command instead of `create`
- Or delete the existing user first (not recommended)

### "Invalid email or password"
- Verify the email is correct (case-insensitive)
- Check that `email_verified = true`
- Ensure `is_active = true`
- Confirm password hash was generated correctly

### "Admin access required"
- Verify user role: `SELECT role FROM customers WHERE email = 'your@email.com'`
- Check that role is 'admin', not 'customer'
- Clear browser cookies and log in again

## Files Modified

- `packages/database/src/schema/customers.ts` - Added role column to schema
- `packages/database/src/migrations/add-role-column.sql` - Database migration
- `apps/api/src/routes/auth.routes.ts` - Updated login to use database role
- `scripts/setup-admin-user.ts` - Admin user management script
- `.env.example` - Updated admin setup instructions

## Related Documentation

- Authentication: `docs/OWASP-SECURITY-AUDIT.md`
- Security: `docs/SECURITY-TEST-SUITE.md`
- API Routes: `.planning/codebase/ARCHITECTURE.md`
