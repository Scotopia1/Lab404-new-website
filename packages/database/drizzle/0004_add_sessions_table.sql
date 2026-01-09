-- Migration: Add sessions table for persistent session tracking
-- Created: 2026-01-09

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

  -- Token tracking (hashed for security)
  token_hash VARCHAR(255) UNIQUE NOT NULL,

  -- Device information
  device_name VARCHAR(100),
  device_type VARCHAR(50),           -- desktop | mobile | tablet
  device_browser VARCHAR(50),
  browser_version VARCHAR(50),
  os_name VARCHAR(50),
  os_version VARCHAR(50),

  -- Network information
  ip_address VARCHAR(45) NOT NULL,   -- IPv4 or IPv6
  ip_country VARCHAR(100),
  ip_city VARCHAR(100),
  ip_latitude DECIMAL(10, 8),
  ip_longitude DECIMAL(11, 8),

  -- Full user agent string
  user_agent TEXT NOT NULL,

  -- Activity tracking
  login_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_activity_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Session status
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  revoked_at TIMESTAMP,
  revoke_reason VARCHAR(100),        -- user_action | security | admin_action

  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS sessions_customer_idx ON sessions(customer_id);
CREATE INDEX IF NOT EXISTS sessions_active_idx ON sessions(is_active);
CREATE INDEX IF NOT EXISTS sessions_activity_idx ON sessions(last_activity_at);
CREATE INDEX IF NOT EXISTS sessions_token_hash_idx ON sessions(token_hash);

-- Comments for documentation
COMMENT ON TABLE sessions IS 'Tracks user sessions across devices for security and management';
COMMENT ON COLUMN sessions.token_hash IS 'Bcrypt hash of JWT token for revocation lookup';
COMMENT ON COLUMN sessions.device_name IS 'Human-readable device name (e.g., "Chrome on Windows 10")';
COMMENT ON COLUMN sessions.device_type IS 'Device category: desktop, mobile, or tablet';
COMMENT ON COLUMN sessions.ip_address IS 'IP address from which session was created';
COMMENT ON COLUMN sessions.last_activity_at IS 'Last API request timestamp for this session';
COMMENT ON COLUMN sessions.is_active IS 'Whether session is currently valid (false = revoked)';
COMMENT ON COLUMN sessions.revoke_reason IS 'Reason for revocation: user_action, security, or admin_action';
