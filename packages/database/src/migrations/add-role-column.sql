-- Migration: Add role column to customers table
-- Date: 2026-01-10
-- Description: Adds role column for admin authentication support

-- Add role column with default value 'customer'
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'customer' NOT NULL;

-- Add check constraint to ensure only valid roles
ALTER TABLE customers
ADD CONSTRAINT customers_role_check CHECK (role IN ('customer', 'admin'));

-- Create index for faster role-based queries
CREATE INDEX IF NOT EXISTS idx_customers_role ON customers(role);

-- Comment the column for documentation
COMMENT ON COLUMN customers.role IS 'User role: customer or admin';
