# Phase 18: Session Management System - Implementation Plan

## Overview
Add persistent session tracking and management, enabling users to view active sessions across devices, manage device access, and revoke specific sessions for enhanced account security.

**Phase Goals**:
- ✅ Database schema with comprehensive session tracking
- ✅ Device fingerprinting with ua-parser-js
- ✅ Session creation on login
- ✅ Session validation in auth middleware
- ✅ API endpoints for session management
- ✅ Frontend security page with session list
- ✅ Session cleanup cron job

**Dependencies**: Phase 13-17 complete ✅

**Estimated Tasks**: 16 tasks

---

## Task 1: Install ua-parser-js Library

**Objective**: Add device fingerprinting dependency

**Files to Modify**:
- `apps/api/package.json`

**Implementation Steps**:

1. **Install library**:
```bash
cd apps/api
pnpm add ua-parser-js@2.0.2
pnpm add -D @types/ua-parser-js
```

2. **Verify installation**:
```bash
pnpm list ua-parser-js
```

**Expected Output**: `ua-parser-js 2.0.2`

**Commit Message**: `feat(18-01): add ua-parser-js for device fingerprinting`

---

## Task 2: Database Migration - Create Sessions Table

**Objective**: Add sessions table with comprehensive tracking

**Files to Create**:
- `packages/database/drizzle/0004_add_sessions_table.sql`

**Implementation Steps**:

1. **Create migration SQL file**:

```sql
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
```

2. **Apply migration** (using Node.js script like previous phases):

```javascript
// apply-sessions-migration.js
require('dotenv').config({ path: '../../.env' });
const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const fs = require('fs');

const connectionString = process.env.DATABASE_URL;
const sql = postgres(connectionString);
const db = drizzle(sql);

async function applyMigration() {
  try {
    const migration = fs.readFileSync('./drizzle/0004_add_sessions_table.sql', 'utf-8');
    await db.execute(migration);
    console.log('✅ Sessions table migration applied successfully');
    await sql.end();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await sql.end();
    process.exit(1);
  }
}

applyMigration();
```

3. **Run migration**:
```bash
cd packages/database
node apply-sessions-migration.js
rm apply-sessions-migration.js
```

**Verification**:
```sql
\d sessions  -- Describe table structure
SELECT COUNT(*) FROM sessions;  -- Should return 0
```

**Commit Message**: `feat(18-02): create sessions table with device tracking`

---

## Task 3: Update Database Schema TypeScript

**Objective**: Add sessions schema to Drizzle

**Files to Create**:
- `packages/database/src/schema/sessions.ts`

**Implementation Steps**:

1. **Create sessions schema file**:

```typescript
import { pgTable, uuid, varchar, text, timestamp, boolean, decimal, index } from 'drizzle-orm/pg-core';
import { customers } from './customers';

export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'cascade' }),

    // Token tracking
    tokenHash: varchar('token_hash', { length: 255 }).unique().notNull(),

    // Device information
    deviceName: varchar('device_name', { length: 100 }),
    deviceType: varchar('device_type', { length: 50 }), // desktop | mobile | tablet
    deviceBrowser: varchar('device_browser', { length: 50 }),
    browserVersion: varchar('browser_version', { length: 50 }),
    osName: varchar('os_name', { length: 50 }),
    osVersion: varchar('os_version', { length: 50 }),

    // Network information
    ipAddress: varchar('ip_address', { length: 45 }).notNull(),
    ipCountry: varchar('ip_country', { length: 100 }),
    ipCity: varchar('ip_city', { length: 100 }),
    ipLatitude: decimal('ip_latitude', { precision: 10, scale: 8 }),
    ipLongitude: decimal('ip_longitude', { precision: 11, scale: 8 }),

    // Full user agent
    userAgent: text('user_agent').notNull(),

    // Activity tracking
    loginAt: timestamp('login_at').notNull().defaultNow(),
    lastActivityAt: timestamp('last_activity_at').notNull().defaultNow(),

    // Session status
    isActive: boolean('is_active').default(true).notNull(),
    revokedAt: timestamp('revoked_at'),
    revokeReason: varchar('revoke_reason', { length: 100 }), // user_action | security | admin_action

    // Timestamps
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    customerIdx: index('sessions_customer_idx').on(table.customerId),
    activeIdx: index('sessions_active_idx').on(table.isActive),
    activityIdx: index('sessions_activity_idx').on(table.lastActivityAt),
    tokenHashIdx: index('sessions_token_hash_idx').on(table.tokenHash),
  })
);

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
```

2. **Export from schema index** (packages/database/src/schema/index.ts):

```typescript
export * from './sessions';
```

3. **Rebuild database package**:
```bash
cd packages/database
pnpm build
```

**Commit Message**: `feat(18-03): add sessions schema to Drizzle ORM`

---

## Task 4: Create SessionService

**Objective**: Build service for session CRUD operations

**Files to Create**:
- `apps/api/src/services/session.service.ts`

**Implementation Steps**:

1. **Create session service** (~200 lines):

```typescript
import { db } from '@lab404/database';
import { sessions } from '@lab404/database/schema';
import { eq, and, or, lt } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { UAParser } from 'ua-parser-js';
import { logger } from '../utils/logger';

interface CreateSessionOptions {
  customerId: string;
  userAgent: string;
  ipAddress: string;
}

interface SessionInfo {
  id: string;
  customerId: string;
  deviceName: string;
  deviceType: string;
  deviceBrowser: string;
  browserVersion: string;
  osName: string;
  osVersion: string;
  ipAddress: string;
  ipCity: string | null;
  ipCountry: string | null;
  loginAt: Date;
  lastActivityAt: Date;
  isActive: boolean;
}

class SessionService {
  /**
   * Parse User-Agent string to extract device information
   */
  private parseUserAgent(userAgent: string) {
    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    const browser = result.browser.name || 'Unknown Browser';
    const browserVersion = result.browser.version || '';
    const os = result.os.name || 'Unknown OS';
    const osVersion = result.os.version || '';
    const deviceType = result.device.type || 'desktop'; // desktop | mobile | tablet

    const deviceName = `${browser} on ${os}${osVersion ? ` ${osVersion}` : ''}`;

    return {
      deviceName,
      deviceType,
      deviceBrowser: browser,
      browserVersion,
      osName: os,
      osVersion,
    };
  }

  /**
   * Create new session on login
   * Returns sessionId for JWT embedding
   */
  async createSession(options: CreateSessionOptions): Promise<string> {
    const { customerId, userAgent, ipAddress } = options;

    // Parse device information
    const deviceInfo = this.parseUserAgent(userAgent);

    // Create session record (tokenHash will be set after JWT generation)
    const [session] = await db
      .insert(sessions)
      .values({
        customerId,
        userAgent,
        ipAddress,
        ...deviceInfo,
        tokenHash: 'pending', // Placeholder, will be updated after token generation
        loginAt: new Date(),
        lastActivityAt: new Date(),
      })
      .returning();

    logger.info('Session created', {
      sessionId: session.id,
      customerId,
      deviceName: deviceInfo.deviceName,
      ipAddress,
    });

    return session.id;
  }

  /**
   * Update session with token hash after JWT generation
   */
  async setTokenHash(sessionId: string, token: string): Promise<void> {
    const tokenHash = await bcrypt.hash(token, 10); // 10 rounds (faster than 12)

    await db
      .update(sessions)
      .set({ tokenHash, updatedAt: new Date() })
      .where(eq(sessions.id, sessionId));

    logger.debug('Token hash set for session', { sessionId });
  }

  /**
   * Validate session is active
   */
  async validateSession(sessionId: string): Promise<SessionInfo | null> {
    const [session] = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.id, sessionId), eq(sessions.isActive, true)))
      .limit(1);

    if (!session) {
      return null;
    }

    return {
      id: session.id,
      customerId: session.customerId,
      deviceName: session.deviceName || 'Unknown Device',
      deviceType: session.deviceType || 'desktop',
      deviceBrowser: session.deviceBrowser || '',
      browserVersion: session.browserVersion || '',
      osName: session.osName || '',
      osVersion: session.osVersion || '',
      ipAddress: session.ipAddress,
      ipCity: session.ipCity,
      ipCountry: session.ipCountry,
      loginAt: session.loginAt,
      lastActivityAt: session.lastActivityAt,
      isActive: session.isActive,
    };
  }

  /**
   * Update last activity timestamp (async, non-blocking)
   */
  async updateActivity(sessionId: string): Promise<void> {
    await db
      .update(sessions)
      .set({ lastActivityAt: new Date(), updatedAt: new Date() })
      .where(eq(sessions.id, sessionId));
  }

  /**
   * Get all active sessions for customer
   */
  async getActiveSessions(customerId: string): Promise<SessionInfo[]> {
    const sessionList = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.customerId, customerId), eq(sessions.isActive, true)))
      .orderBy(sessions.lastActivityAt);

    return sessionList.map((session) => ({
      id: session.id,
      customerId: session.customerId,
      deviceName: session.deviceName || 'Unknown Device',
      deviceType: session.deviceType || 'desktop',
      deviceBrowser: session.deviceBrowser || '',
      browserVersion: session.browserVersion || '',
      osName: session.osName || '',
      osVersion: session.osVersion || '',
      ipAddress: session.ipAddress,
      ipCity: session.ipCity,
      ipCountry: session.ipCountry,
      loginAt: session.loginAt,
      lastActivityAt: session.lastActivityAt,
      isActive: session.isActive,
    }));
  }

  /**
   * Revoke specific session
   */
  async revokeSession(
    sessionId: string,
    reason: 'user_action' | 'security' | 'admin_action'
  ): Promise<void> {
    await db
      .update(sessions)
      .set({
        isActive: false,
        revokedAt: new Date(),
        revokeReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(sessions.id, sessionId));

    logger.info('Session revoked', { sessionId, reason });
  }

  /**
   * Revoke all sessions except current
   */
  async revokeOtherSessions(customerId: string, currentSessionId: string): Promise<number> {
    const result = await db
      .update(sessions)
      .set({
        isActive: false,
        revokedAt: new Date(),
        revokeReason: 'user_action',
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(sessions.customerId, customerId),
          eq(sessions.isActive, true),
          // NOT equal to current session
          db.$with('current').as(db.select().from(sessions).where(eq(sessions.id, currentSessionId)))
        )
      );

    logger.info('Other sessions revoked', { customerId, count: result.rowCount });
    return result.rowCount || 0;
  }

  /**
   * Revoke all sessions for customer
   */
  async revokeAllSessions(customerId: string): Promise<number> {
    const result = await db
      .update(sessions)
      .set({
        isActive: false,
        revokedAt: new Date(),
        revokeReason: 'user_action',
        updatedAt: new Date(),
      })
      .where(and(eq(sessions.customerId, customerId), eq(sessions.isActive, true)));

    logger.info('All sessions revoked', { customerId, count: result.rowCount });
    return result.rowCount || 0;
  }

  /**
   * Cleanup old/revoked sessions (for cron job)
   */
  async cleanupSessions(): Promise<number> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const result = await db
      .delete(sessions)
      .where(
        or(
          // Revoked sessions older than 30 days
          and(eq(sessions.isActive, false), lt(sessions.revokedAt, thirtyDaysAgo)),
          // Inactive sessions older than 7 days
          and(eq(sessions.isActive, false), lt(sessions.lastActivityAt, sevenDaysAgo)),
          // Very old sessions (90+ days)
          lt(sessions.createdAt, ninetyDaysAgo)
        )
      );

    logger.info('Sessions cleaned up', { count: result.rowCount });
    return result.rowCount || 0;
  }
}

export const sessionService = new SessionService();
```

**Commit Message**: `feat(18-04): create session service with device fingerprinting`

---

## Task 5: Modify JWT Generation

**Objective**: Include sessionId in JWT payload

**Files to Modify**:
- `apps/api/src/utils/jwt.ts` (if exists)
- `apps/api/src/middleware/auth.ts`

**Implementation Steps**:

1. **Update JWT payload interface** in auth.ts (around line 15):

```typescript
interface TokenPayload {
  userId: string;
  email: string;
  role: 'customer' | 'admin';
  customerId?: string;
  sessionId?: string;  // NEW (optional for backward compatibility)
}
```

2. **Update generateToken function** (around line 25):

```typescript
function generateToken(data: {
  userId: string;
  email: string;
  role: 'customer' | 'admin';
  customerId?: string;
  sessionId?: string;  // NEW
}): string {
  const payload: TokenPayload = {
    userId: data.userId,
    email: data.email,
    role: data.role,
    customerId: data.customerId,
    sessionId: data.sessionId,  // NEW
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}
```

**Commit Message**: `feat(18-05): add sessionId to JWT payload`

---

## Task 6: Update Auth Middleware

**Objective**: Validate session on every protected request

**Files to Modify**:
- `apps/api/src/middleware/auth.ts`

**Implementation Steps**:

1. **Import sessionService** (top of file):

```typescript
import { sessionService } from '../services/session.service';
```

2. **Add session validation** in requireAuth middleware (after JWT verification, around line 50):

```typescript
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // ... existing JWT extraction and verification

    // NEW: Validate session if sessionId present
    if (payload.sessionId) {
      const session = await sessionService.validateSession(payload.sessionId);

      if (!session) {
        return sendError(res, 'Session not found', 401);
      }

      if (!session.isActive) {
        return sendError(res, 'Session has been revoked', 401, {
          code: 'SESSION_REVOKED',
        });
      }

      // Update activity (async, non-blocking)
      sessionService.updateActivity(session.id).catch((err) =>
        logger.error('Failed to update session activity', { sessionId: session.id, error: err })
      );

      // Attach session to request
      req.session = session;
    }

    // Continue with existing flow
    req.user = payload;
    next();
  } catch (error) {
    next(error);
  }
};
```

3. **Update Request type** (add session property):

```typescript
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
      session?: any;  // Session type from session service
    }
  }
}
```

**Commit Message**: `feat(18-06): add session validation to auth middleware`

---

## Task 7: Update Login Endpoint

**Objective**: Create session on login

**Files to Modify**:
- `apps/api/src/routes/auth.routes.ts`

**Implementation Steps**:

1. **Import sessionService** (top of file):

```typescript
import { sessionService } from '../services/session.service';
```

2. **Modify login flow** (after password and email verification, around line ~285):

```typescript
// After email verification check...

// NEW: Create session
const sessionId = await sessionService.createSession({
  customerId: customer.id,
  userAgent: req.headers['user-agent'] || '',
  ipAddress: req.ip || '',
});

// Generate JWT with sessionId
const token = generateToken({
  userId: customer.authUserId!,
  email: customer.email,
  role: 'customer',
  customerId: customer.id,
  sessionId,  // NEW
});

// Store token hash in session
await sessionService.setTokenHash(sessionId, token);

// Set cookie and respond (existing)
res.cookie('auth_token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});

sendSuccess(res, {
  message: 'Login successful',
  user: { ... },
  token,
  expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
});
```

**Commit Message**: `feat(18-07): create session on login with device tracking`

---

## Task 8: Update Logout Endpoint

**Objective**: Revoke session on logout

**Files to Modify**:
- `apps/api/src/routes/auth.routes.ts`

**Implementation Steps**:

1. **Modify logout endpoint** (around line ~320):

```typescript
authRoutes.post('/logout', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = req.user?.sessionId;

    // NEW: Revoke session if present
    if (sessionId) {
      await sessionService.revokeSession(sessionId, 'user_action');
      logger.info('Session revoked on logout', {
        sessionId,
        customerId: req.user?.customerId,
      });
    }

    // Clear cookie (existing)
    res.clearCookie('auth_token');

    sendSuccess(res, { message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
});
```

**Commit Message**: `feat(18-08): revoke session on logout`

---

## Task 9: Create Session Management Routes

**Objective**: Add API endpoints for session management

**Files to Create**:
- `apps/api/src/routes/sessions.routes.ts`

**Implementation Steps**:

1. **Create sessions routes file** (~150 lines):

```typescript
import { Router, Request, Response, NextFunction } from 'express';
import { sessionService } from '../services/session.service';
import { requireAuth } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/response';
import { logger } from '../utils/logger';

const sessionsRoutes = Router();

/**
 * GET /api/auth/sessions
 * List all active sessions for current user
 */
sessionsRoutes.get(
  '/',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const customerId = req.user?.customerId;
      const currentSessionId = req.user?.sessionId;

      if (!customerId) {
        return sendError(res, 'Customer ID not found', 400);
      }

      // Get all active sessions
      const sessions = await sessionService.getActiveSessions(customerId);

      // Add isCurrent flag
      const sessionsWithCurrent = sessions.map((session) => ({
        ...session,
        isCurrent: session.id === currentSessionId,
      }));

      sendSuccess(res, {
        sessions: sessionsWithCurrent,
        currentSessionId,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/auth/sessions/:sessionId
 * Revoke specific session
 */
sessionsRoutes.delete(
  '/:sessionId',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.params;
      const customerId = req.user?.customerId;

      if (!customerId) {
        return sendError(res, 'Customer ID not found', 400);
      }

      // Verify session belongs to customer
      const sessions = await sessionService.getActiveSessions(customerId);
      const session = sessions.find((s) => s.id === sessionId);

      if (!session) {
        return sendError(res, 'Session not found or already revoked', 404);
      }

      // Revoke session
      await sessionService.revokeSession(sessionId, 'user_action');

      logger.info('Session revoked via API', {
        sessionId,
        customerId,
        deviceName: session.deviceName,
      });

      sendSuccess(res, { message: 'Session revoked successfully' });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/auth/sessions/logout-others
 * Logout all other sessions except current
 */
sessionsRoutes.post(
  '/logout-others',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const customerId = req.user?.customerId;
      const currentSessionId = req.user?.sessionId;

      if (!customerId || !currentSessionId) {
        return sendError(res, 'Session information not found', 400);
      }

      const count = await sessionService.revokeOtherSessions(customerId, currentSessionId);

      logger.info('Other sessions revoked', { customerId, count });

      sendSuccess(res, {
        message: `${count} session(s) logged out successfully`,
        count,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/auth/sessions/logout-all
 * Logout all sessions including current
 */
sessionsRoutes.post(
  '/logout-all',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const customerId = req.user?.customerId;

      if (!customerId) {
        return sendError(res, 'Customer ID not found', 400);
      }

      const count = await sessionService.revokeAllSessions(customerId);

      // Clear current cookie
      res.clearCookie('auth_token');

      logger.info('All sessions revoked', { customerId, count });

      sendSuccess(res, {
        message: `All ${count} session(s) logged out successfully`,
        count,
      });
    } catch (error) {
      next(error);
    }
  }
);

export { sessionsRoutes };
```

2. **Register routes** in `apps/api/src/routes/index.ts`:

```typescript
import { sessionsRoutes } from './sessions.routes';

// ... existing routes

app.use('/api/auth/sessions', sessionsRoutes);
```

**Commit Message**: `feat(18-09): add session management API endpoints`

---

## Task 10: Create Session Cleanup Cron Job

**Objective**: Schedule nightly cleanup of old/revoked sessions

**Files to Create**:
- `apps/api/src/jobs/session-cleanup.job.ts`

**Implementation Steps**:

1. **Create cleanup job file**:

```typescript
import cron from 'node-cron';
import { sessionService } from '../services/session.service';
import { logger } from '../utils/logger';

/**
 * Session cleanup cron job
 * Runs daily at 3:00 AM UTC
 * Cleans up:
 * - Revoked sessions older than 30 days
 * - Inactive sessions older than 7 days
 * - Very old sessions (90+ days)
 */
export function startSessionCleanupJob() {
  // Run daily at 3:00 AM UTC
  cron.schedule('0 3 * * *', async () => {
    try {
      logger.info('Starting session cleanup job');

      const deletedCount = await sessionService.cleanupSessions();

      logger.info('Session cleanup job completed', {
        deletedCount,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Session cleanup job failed', { error });
    }
  });

  logger.info('Session cleanup cron job scheduled (daily at 3:00 AM UTC)');
}
```

2. **Register job** in `apps/api/src/index.ts` (or wherever jobs are registered):

```typescript
import { startSessionCleanupJob } from './jobs/session-cleanup.job';

// After server starts
startSessionCleanupJob();
```

**Commit Message**: `feat(18-10): add session cleanup cron job`

---

## Task 11: Create Frontend Session Types

**Objective**: Define TypeScript types for sessions

**Files to Create**:
- `apps/lab404-website/src/types/session.ts`

**Implementation Steps**:

1. **Create types file**:

```typescript
export interface Session {
  id: string;
  customerId: string;
  deviceName: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  deviceBrowser: string;
  browserVersion: string;
  osName: string;
  osVersion: string;
  ipAddress: string;
  ipCity: string | null;
  ipCountry: string | null;
  loginAt: string;
  lastActivityAt: string;
  isActive: boolean;
  isCurrent: boolean; // Computed server-side
}

export interface SessionListResponse {
  sessions: Session[];
  currentSessionId: string;
}

export interface RevokeSessionResponse {
  message: string;
}

export interface LogoutOthersResponse {
  message: string;
  count: number;
}
```

**Commit Message**: `feat(18-11): add session TypeScript types`

---

## Task 12: Extend Auth Store

**Objective**: Add session management methods to Zustand store

**Files to Modify**:
- `apps/lab404-website/src/stores/useAuthStore.ts`

**Implementation Steps**:

1. **Update AuthState interface** (around line 15):

```typescript
interface AuthState {
  // ... existing fields
  currentSessionId: string | null;
  activeSessions: Session[];
  sessionsLoading: boolean;
  sessionsError: string | null;

  // ... existing methods
  fetchActiveSessions: () => Promise<void>;
  revokeSession: (sessionId: string) => Promise<void>;
  logoutOthers: () => Promise<void>;
  logoutAll: () => Promise<void>;
}
```

2. **Add state fields** (in create function):

```typescript
currentSessionId: null,
activeSessions: [],
sessionsLoading: false,
sessionsError: null,
```

3. **Add methods** (after existing auth methods):

```typescript
/**
 * Fetch all active sessions
 */
fetchActiveSessions: async () => {
  set({ sessionsLoading: true, sessionsError: null });

  try {
    const response = await fetch(`${API_BASE_URL}/auth/sessions`, {
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch sessions');
    }

    set({
      activeSessions: data.data.sessions,
      currentSessionId: data.data.currentSessionId,
      sessionsLoading: false,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch sessions';
    set({ sessionsError: message, sessionsLoading: false });
    throw error;
  }
},

/**
 * Revoke specific session
 */
revokeSession: async (sessionId: string) => {
  set({ sessionsLoading: true, sessionsError: null });

  try {
    const response = await fetch(`${API_BASE_URL}/auth/sessions/${sessionId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to revoke session');
    }

    // Remove session from local state
    set((state) => ({
      activeSessions: state.activeSessions.filter((s) => s.id !== sessionId),
      sessionsLoading: false,
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to revoke session';
    set({ sessionsError: message, sessionsLoading: false });
    throw error;
  }
},

/**
 * Logout all other sessions
 */
logoutOthers: async () => {
  set({ sessionsLoading: true, sessionsError: null });

  try {
    const response = await fetch(`${API_BASE_URL}/auth/sessions/logout-others`, {
      method: 'POST',
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to logout other sessions');
    }

    // Keep only current session
    set((state) => ({
      activeSessions: state.activeSessions.filter((s) => s.isCurrent),
      sessionsLoading: false,
    }));

    return data.data;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to logout others';
    set({ sessionsError: message, sessionsLoading: false });
    throw error;
  }
},

/**
 * Logout all sessions
 */
logoutAll: async () => {
  set({ sessionsLoading: true, sessionsError: null });

  try {
    const response = await fetch(`${API_BASE_URL}/auth/sessions/logout-all`, {
      method: 'POST',
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to logout all sessions');
    }

    // Clear all state (user logged out)
    set({
      user: null,
      isAuthenticated: false,
      currentSessionId: null,
      activeSessions: [],
      sessionsLoading: false,
    });

    return data.data;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to logout all';
    set({ sessionsError: message, sessionsLoading: false });
    throw error;
  }
},
```

**Commit Message**: `feat(18-12): add session management to auth store`

---

## Task 13: Create SessionItem Component

**Objective**: Build reusable session card component

**Files to Create**:
- `apps/lab404-website/src/components/account/SessionItem.tsx`

**Implementation Steps**:

1. **Create component** (~150 lines):

```typescript
'use client';

import { useState } from 'react';
import { Monitor, Smartphone, Tablet, Trash2 } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Session } from '@/types/session';

interface SessionItemProps {
  session: Session;
  onRevoke: (sessionId: string) => void;
  isRevoking: boolean;
}

export function SessionItem({ session, onRevoke, isRevoking }: SessionItemProps) {
  const [showDetails, setShowDetails] = useState(false);

  // Device icon based on type
  const DeviceIcon = session.deviceType === 'mobile'
    ? Smartphone
    : session.deviceType === 'tablet'
    ? Tablet
    : Monitor;

  // Format activity time
  const formatActivityTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const diffMs = Date.now() - date.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays < 7) {
      return formatDistanceToNow(date, { addSuffix: true });
    }
    return format(date, 'MMM d, yyyy');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-1">
              <DeviceIcon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base">
                  {session.deviceName}
                </CardTitle>
                {session.isCurrent && (
                  <Badge variant="secondary" className="text-xs">
                    This device
                  </Badge>
                )}
              </div>
              <CardDescription className="mt-1">
                {session.deviceBrowser} {session.browserVersion && `(${session.browserVersion})`}
                {' • '}
                {session.osName} {session.osVersion}
              </CardDescription>
            </div>
          </div>

          {/* Logout button (hidden for current session) */}
          {!session.isCurrent && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onRevoke(session.id)}
              disabled={isRevoking}
              className="h-9 w-9 flex-shrink-0"
              style={{ minWidth: '44px', minHeight: '44px' }}
              aria-label="Logout this session"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-2 text-sm text-muted-foreground">
          {/* IP Address */}
          <div className="flex items-center justify-between">
            <span>IP Address:</span>
            <span className="font-mono">{session.ipAddress}</span>
          </div>

          {/* Last Activity */}
          <div className="flex items-center justify-between">
            <span>Last Activity:</span>
            <span>{formatActivityTime(session.lastActivityAt)}</span>
          </div>

          {/* Login Time */}
          <div className="flex items-center justify-between">
            <span>Signed in:</span>
            <span>{formatActivityTime(session.loginAt)}</span>
          </div>

          {/* Location (if available) */}
          {(session.ipCity || session.ipCountry) && (
            <div className="flex items-center justify-between">
              <span>Location:</span>
              <span>
                {session.ipCity}
                {session.ipCity && session.ipCountry && ', '}
                {session.ipCountry}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

**Commit Message**: `feat(18-13): create SessionItem component`

---

## Task 14: Create SessionList Component

**Objective**: Build session list container with bulk actions

**Files to Create**:
- `apps/lab404-website/src/components/account/SessionList.tsx`

**Implementation Steps**:

1. **Create component** (~200 lines):

```typescript
'use client';

import { useEffect } from 'react';
import { AlertCircle, LogOut, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { SessionItem } from './SessionItem';
import { useAuthStore } from '@/stores/useAuthStore';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

export function SessionList() {
  const {
    activeSessions,
    sessionsLoading,
    sessionsError,
    fetchActiveSessions,
    revokeSession,
    logoutOthers,
  } = useAuthStore();

  const { toast } = useToast();
  const [revoking SessionId, setRevokingSessionId] = useState<string | null>(null);
  const [showLogoutOthersDialog, setShowLogoutOthersDialog] = useState(false);

  // Fetch sessions on mount
  useEffect(() => {
    fetchActiveSessions();
  }, [fetchActiveSessions]);

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingSessionId(sessionId);
    try {
      await revokeSession(sessionId);
      toast({
        title: 'Session Logged Out',
        description: 'The session has been successfully revoked.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to Logout Session',
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setRevokingSessionId(null);
    }
  };

  const handleLogoutOthers = async () => {
    try {
      const result = await logoutOthers();
      toast({
        title: 'Other Sessions Logged Out',
        description: `${result.count} session(s) have been logged out.`,
      });
      setShowLogoutOthersDialog(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to Logout Sessions',
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    }
  };

  // Loading state
  if (sessionsLoading && activeSessions.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading sessions...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (sessionsError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{sessionsError}</AlertDescription>
      </Alert>
    );
  }

  // Empty state
  if (activeSessions.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Active Sessions</AlertTitle>
        <AlertDescription>
          You don't have any active sessions. This is unusual - you should see at least your current session.
        </AlertDescription>
      </Alert>
    );
  }

  // Count other sessions
  const otherSessionsCount = activeSessions.filter((s) => !s.isCurrent).length;

  return (
    <div className="space-y-6">
      {/* Header with bulk action */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-lg font-semibold">Active Sessions</h3>
          <p className="text-sm text-muted-foreground">
            {activeSessions.length} active session{activeSessions.length !== 1 && 's'}
          </p>
        </div>

        {otherSessionsCount > 0 && (
          <Button
            variant="outline"
            onClick={() => setShowLogoutOthersDialog(true)}
            disabled={sessionsLoading}
            style={{ minHeight: '44px' }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout All Other Sessions ({otherSessionsCount})
          </Button>
        )}
      </div>

      {/* Session list */}
      <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
        {activeSessions.map((session) => (
          <SessionItem
            key={session.id}
            session={session}
            onRevoke={handleRevokeSession}
            isRevoking={revokingSessionId === session.id}
          />
        ))}
      </div>

      {/* Logout Others Confirmation Dialog */}
      <AlertDialog open={showLogoutOthersDialog} onOpenChange={setShowLogoutOthersDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Logout All Other Sessions?</AlertDialogTitle>
            <AlertDialogDescription>
              This will log you out of all devices except this one. You'll need to sign in again on those devices.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogoutOthers}>
              Logout {otherSessionsCount} Session{otherSessionsCount !== 1 && 's'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
```

**Commit Message**: `feat(18-14): create SessionList component with bulk actions`

---

## Task 15: Create Security Page

**Objective**: Add /account/security page with session list

**Files to Create**:
- `apps/lab404-website/src/app/account/security/page.tsx`

**Implementation Steps**:

1. **Create page component**:

```typescript
import { Metadata } from 'next';
import { SessionList } from '@/components/account/SessionList';

export const metadata: Metadata = {
  title: 'Security | Lab404 Electronics',
  description: 'Manage your active sessions and account security',
};

export default function SecurityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Security</h1>
        <p className="text-muted-foreground mt-2">
          Manage your active sessions and devices
        </p>
      </div>

      <SessionList />
    </div>
  );
}
```

**Commit Message**: `feat(18-15): create security page with session management`

---

## Task 16: Add Security Navigation Link

**Objective**: Add "Security" link to account navigation

**Files to Modify**:
- `apps/lab404-website/src/app/account/layout.tsx` (or wherever account navigation is defined)

**Implementation Steps**:

1. **Add navigation item**:

```typescript
const accountNavItems = [
  { href: '/account', label: 'Overview', icon: User },
  { href: '/account/orders', label: 'Orders', icon: Package },
  { href: '/account/addresses', label: 'Addresses', icon: MapPin },
  { href: '/account/profile', label: 'Profile', icon: Settings },
  { href: '/account/security', label: 'Security', icon: Shield },  // NEW
];
```

2. **Import Shield icon**:

```typescript
import { User, Package, MapPin, Settings, Shield } from 'lucide-react';
```

**Commit Message**: `feat(18-16): add security navigation link`

---

## Task 17: Create Test Structure Documentation

**Objective**: Document comprehensive test scenarios for Phase 22

**Files to Create**:
- `apps/api/src/services/__tests__/session.service.test.ts`
- `apps/api/src/routes/__tests__/sessions.routes.test.ts`
- `apps/lab404-website/src/components/account/__tests__/SessionList.test.tsx`

**Implementation Steps**:

1. **Create backend service test structure**:

```typescript
/**
 * Session Service Tests
 *
 * NOTE: Comprehensive testing will be performed in Phase 22.
 *
 * Test Coverage Required:
 *
 * 1. Device Fingerprinting:
 *    - Parses User-Agent correctly (Chrome, Firefox, Safari, Edge)
 *    - Handles mobile User-Agents (iOS, Android)
 *    - Handles tablet User-Agents (iPad, Android tablets)
 *    - Generates correct device names
 *    - Classifies device types correctly
 *    - Handles unknown/malformed User-Agents gracefully
 *
 * 2. Session Creation:
 *    - Creates session with valid data
 *    - Stores device information correctly
 *    - Stores IP address and user-agent
 *    - Sets initial timestamps (loginAt, lastActivityAt)
 *    - Returns sessionId
 *    - Logs session creation event
 *
 * 3. Token Hash Management:
 *    - Sets token hash after session creation
 *    - Uses bcrypt with 10 rounds
 *    - Updates session record correctly
 *
 * 4. Session Validation:
 *    - Returns session for valid active sessionId
 *    - Returns null for invalid sessionId
 *    - Returns null for revoked session
 *    - Returns correct session data
 *
 * 5. Activity Tracking:
 *    - Updates lastActivityAt timestamp
 *    - Updates updatedAt timestamp
 *    - Handles non-existent sessionId gracefully
 *
 * 6. Session Revocation:
 *    - Revokes session by ID
 *    - Sets isActive = false
 *    - Sets revokedAt timestamp
 *    - Sets revoke reason correctly
 *    - Logs revocation event
 *
 * 7. Bulk Revocation:
 *    - revokeOtherSessions excludes current session
 *    - revokeOtherSessions revokes all others
 *    - revokeAllSessions revokes all including current
 *    - Returns correct count
 *    - Logs bulk revocation events
 *
 * 8. Session Cleanup:
 *    - Deletes revoked sessions older than 30 days
 *    - Deletes inactive sessions older than 7 days
 *    - Deletes very old sessions (90+ days)
 *    - Returns correct deletion count
 *    - Logs cleanup completion
 *
 * Full test implementation scheduled for Phase 22.
 */

import { describe, it } from '@jest/globals';

describe('SessionService', () => {
  it.todo('Full test suite in Phase 22');

  describe('Device Fingerprinting', () => {
    it.todo('should parse Chrome User-Agent');
    it.todo('should parse mobile User-Agent');
    it.todo('should generate device name');
    it.todo('should classify device type');
  });

  describe('Session Creation', () => {
    it.todo('should create session with valid data');
    it.todo('should store device information');
    it.todo('should return sessionId');
  });

  describe('Session Validation', () => {
    it.todo('should return session for valid ID');
    it.todo('should return null for revoked session');
  });

  describe('Session Revocation', () => {
    it.todo('should revoke specific session');
    it.todo('should revoke all other sessions');
    it.todo('should revoke all sessions');
  });

  describe('Session Cleanup', () => {
    it.todo('should delete old revoked sessions');
    it.todo('should delete inactive sessions');
    it.todo('should return correct count');
  });
});
```

2. **Create API routes test structure**:

```typescript
/**
 * Session Management API Tests
 *
 * NOTE: Comprehensive testing will be performed in Phase 22.
 *
 * Test Coverage Required:
 *
 * 1. GET /api/auth/sessions:
 *    - Returns all active sessions for authenticated user
 *    - Includes isCurrent flag correctly
 *    - Returns currentSessionId
 *    - Requires authentication (401 if not authenticated)
 *    - Excludes revoked sessions
 *    - Sorts by lastActivityAt DESC
 *
 * 2. DELETE /api/auth/sessions/:sessionId:
 *    - Revokes specific session
 *    - Validates session ownership (403 if not owner)
 *    - Returns 404 for non-existent session
 *    - Logs revocation event
 *    - Requires authentication
 *
 * 3. POST /api/auth/sessions/logout-others:
 *    - Revokes all other sessions
 *    - Preserves current session
 *    - Returns count of revoked sessions
 *    - Requires authentication
 *    - Logs bulk revocation
 *
 * 4. POST /api/auth/sessions/logout-all:
 *    - Revokes all sessions including current
 *    - Clears auth_token cookie
 *    - Returns count of revoked sessions
 *    - Requires authentication
 *    - Logs bulk revocation
 *
 * 5. Login Endpoint (Modified):
 *    - Creates session on successful login
 *    - Generates JWT with sessionId
 *    - Stores token hash in session
 *    - Returns token in cookie
 *
 * 6. Logout Endpoint (Modified):
 *    - Revokes session on logout
 *    - Clears cookie
 *    - Logs logout event
 *
 * 7. Auth Middleware (Modified):
 *    - Validates session if sessionId in JWT
 *    - Rejects revoked sessions (401)
 *    - Updates lastActivityAt (async)
 *    - Attaches session to request
 *
 * Full test implementation scheduled for Phase 22.
 */

import { describe, it } from '@jest/globals';

describe('Session Management API', () => {
  it.todo('Full test suite in Phase 22');

  describe('GET /api/auth/sessions', () => {
    it.todo('should return all active sessions');
    it.todo('should include isCurrent flag');
    it.todo('should require authentication');
  });

  describe('DELETE /api/auth/sessions/:sessionId', () => {
    it.todo('should revoke specific session');
    it.todo('should validate ownership');
    it.todo('should return 404 for non-existent');
  });

  describe('POST /api/auth/sessions/logout-others', () => {
    it.todo('should revoke all other sessions');
    it.todo('should preserve current session');
    it.todo('should return count');
  });

  describe('POST /api/auth/sessions/logout-all', () => {
    it.todo('should revoke all sessions');
    it.todo('should clear cookie');
  });

  describe('Login (Modified)', () => {
    it.todo('should create session on login');
    it.todo('should generate JWT with sessionId');
  });

  describe('Auth Middleware (Modified)', () => {
    it.todo('should validate session');
    it.todo('should reject revoked session');
    it.todo('should update activity');
  });
});
```

3. **Create frontend component test structure**:

```typescript
/**
 * SessionList Component Tests
 *
 * NOTE: Comprehensive testing will be performed in Phase 22.
 *
 * Test Coverage Required:
 *
 * 1. Rendering:
 *    - Displays loading state while fetching
 *    - Displays error state on fetch failure
 *    - Displays empty state when no sessions
 *    - Displays session list with multiple sessions
 *    - Shows "This device" badge on current session
 *    - Hides logout button on current session
 *
 * 2. Session Item Display:
 *    - Shows correct device icon (desktop/mobile/tablet)
 *    - Displays device name correctly
 *    - Shows browser and OS information
 *    - Displays IP address
 *    - Shows last activity time (relative format)
 *    - Shows login time
 *
 * 3. Session Revocation:
 *    - Calls revokeSession on logout button click
 *    - Shows loading state during revocation
 *    - Removes session from list after revocation
 *    - Shows success toast on revocation
 *    - Shows error toast on revocation failure
 *
 * 4. Bulk Actions:
 *    - Shows "Logout Others" button when other sessions exist
 *    - Hides "Logout Others" button when only current session
 *    - Opens confirmation dialog on "Logout Others" click
 *    - Calls logoutOthers on dialog confirmation
 *    - Keeps only current session after logout others
 *    - Shows success toast with count
 *
 * 5. Activity Time Formatting:
 *    - Shows "Just now" for very recent activity
 *    - Shows "X minutes ago" for recent activity
 *    - Shows "X hours ago" for today
 *    - Shows "X days ago" for this week
 *    - Shows absolute date for older activity
 *
 * 6. Mobile Optimization:
 *    - Touch targets are 44x44px minimum
 *    - Cards stack properly on mobile
 *    - Buttons are touch-friendly
 *    - Responsive layout works correctly
 *
 * 7. Accessibility:
 *    - Proper ARIA labels on buttons
 *    - Keyboard navigation works
 *    - Screen reader announcements correct
 *    - Focus management in dialog
 *
 * Full test implementation scheduled for Phase 22.
 */

import { describe, it } from '@jest/globals';

describe('SessionList Component', () => {
  it.todo('Full test suite in Phase 22');

  describe('Rendering', () => {
    it.todo('should display loading state');
    it.todo('should display error state');
    it.todo('should display session list');
    it.todo('should show This device badge');
  });

  describe('Session Revocation', () => {
    it.todo('should call revokeSession');
    it.todo('should show loading state');
    it.todo('should remove session from list');
    it.todo('should show success toast');
  });

  describe('Bulk Actions', () => {
    it.todo('should show Logout Others button');
    it.todo('should open confirmation dialog');
    it.todo('should call logoutOthers');
  });

  describe('Accessibility', () => {
    it.todo('should have proper ARIA labels');
    it.todo('should support keyboard navigation');
  });
});
```

**Commit Message**: `test(18-17): add session management test structure`

---

## Success Criteria

- [ ] ua-parser-js library installed
- [ ] Sessions table created with indexes
- [ ] Sessions schema added to Drizzle
- [ ] SessionService implemented with CRUD operations
- [ ] JWT includes sessionId
- [ ] Auth middleware validates sessions
- [ ] Login creates session
- [ ] Logout revokes session
- [ ] Session management API endpoints functional
- [ ] Session cleanup cron job scheduled
- [ ] Frontend session types defined
- [ ] Auth store extended with session methods
- [ ] SessionItem component created
- [ ] SessionList component created
- [ ] Security page created
- [ ] Security navigation link added
- [ ] Test structure documented
- [ ] 17 atomic git commits created
- [ ] No TypeScript errors
- [ ] No breaking changes

---

## Testing Checklist (Manual Validation)

**Session Creation**:
- [ ] Login creates session record
- [ ] Session appears in security page
- [ ] Device name is human-readable
- [ ] IP address captured correctly
- [ ] "This device" badge shown on current session

**Session Management**:
- [ ] Can view all active sessions
- [ ] Can logout specific session from another device
- [ ] Logged-out session cannot make API requests
- [ ] "Logout others" button works correctly
- [ ] Only current session remains after "logout others"

**Activity Tracking**:
- [ ] lastActivityAt updates on API requests
- [ ] Relative time displays correctly ("5 minutes ago")
- [ ] Login time displayed correctly

**Cleanup**:
- [ ] Cron job scheduled correctly
- [ ] Old sessions deleted as expected

**UI/UX**:
- [ ] Mobile-responsive layout works
- [ ] Touch targets are 44x44px minimum
- [ ] Confirmation dialog for bulk actions
- [ ] Toast notifications show correctly
- [ ] Loading and error states work

---

## Dependencies

**Existing Services**:
- ✅ JWT authentication (Phase 1)
- ✅ Auth middleware
- ✅ PostgreSQL with Drizzle ORM
- ✅ Logging infrastructure

**New Dependencies**:
- `ua-parser-js@2.0.2`
- `@types/ua-parser-js` (dev)

**No New Infrastructure**:
- ✅ No Redis needed (yet)
- ✅ No new services
- ✅ No new environment variables

---

## Phase Completion

After completing all 17 tasks:

1. **Manual Testing**:
   - Test complete login → session creation flow
   - Test session list display
   - Test single session logout
   - Test "logout others" bulk action
   - Test token revocation enforcement
   - Verify cleanup job scheduling

2. **Git Commits**:
   - 17 atomic commits (feat/test types)
   - Meaningful commit messages
   - All commits pushed

3. **Documentation**:
   - ASSUMPTIONS.md ✅
   - PLAN.md ✅
   - Test structure documented ✅

4. **Move to Phase 19**:
   - Phase 18 complete
   - Ready for advanced password security features
   - Session management infrastructure operational

---

## Notes

- **Focused scope**: Core session management only
- **Performance**: Minimal impact (5-10ms per request)
- **Security**: Token hashing, session validation, audit logging
- **UX**: Mobile-optimized, clear device identification
- **Scalability**: Can add Redis caching in Phase 19+ if needed
- **Test implementation deferred**: Phase 22 will add comprehensive tests
