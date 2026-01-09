-- Migration: Add email verification columns to customers table
-- Created: 2026-01-09

-- Add email verification columns
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP;

-- Create index for faster lookups by verification status
CREATE INDEX IF NOT EXISTS customers_email_verified_idx ON customers(email_verified);

-- Comment columns for documentation
COMMENT ON COLUMN customers.email_verified IS 'Whether the customer has verified their email address';
COMMENT ON COLUMN customers.email_verified_at IS 'Timestamp when the email was verified';
