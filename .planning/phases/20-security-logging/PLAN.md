# Phase 20: Security Audit Logging - Implementation Plan

## Overview
Implement comprehensive security audit logging system for compliance, forensics, and security monitoring.

**Phase Goals**:
- ✅ Log all security-critical events
- ✅ Provide query/export interfaces
- ✅ 90-day retention with auto-cleanup
- ✅ Customer self-service access

**Dependencies**: Phases 13-19 complete ✅

**Estimated Tasks**: 15 tasks

---

## Task 1: Create Event Type Enum

**Objective**: Define all security event types as TypeScript enum

**File**: `apps/api/src/types/audit-events.ts`

**Event Types** (25):
```typescript
export enum SecurityEventType {
  // Authentication
  AUTH_LOGIN_SUCCESS = 'auth.login.success',
  AUTH_LOGIN_FAILURE = 'auth.login.failure',
  AUTH_LOGIN_LOCKED = 'auth.login.locked',
  AUTH_LOGOUT = 'auth.logout',
  AUTH_SESSION_CREATED = 'auth.session.created',
  AUTH_SESSION_REVOKED = 'auth.session.revoked',

  // Password
  PASSWORD_CHANGED = 'password.changed',
  PASSWORD_RESET_REQUESTED = 'password.reset.requested',
  PASSWORD_RESET_COMPLETED = 'password.reset.completed',
  PASSWORD_BREACH_DETECTED = 'password.breach.detected',
  PASSWORD_REUSE_BLOCKED = 'password.reuse.blocked',

  // Account
  ACCOUNT_CREATED = 'account.created',
  ACCOUNT_VERIFIED = 'account.verified',
  ACCOUNT_LOCKED = 'account.locked',
  ACCOUNT_UNLOCKED = 'account.unlocked',
  ACCOUNT_DISABLED = 'account.disabled',
  EMAIL_CHANGED = 'email.changed',
  EMAIL_VERIFICATION_SENT = 'email.verification.sent',

  // Authorization
  PERMISSION_DENIED = 'permission.denied',
  ADMIN_ACCESS_GRANTED = 'admin.access.granted',
  ADMIN_ACTION = 'admin.action.performed',

  // Security
  RATE_LIMIT_EXCEEDED = 'rate_limit.exceeded',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity.detected',
}
```

**Commit Message**: `feat(20-01): add security audit event types`

---

## Task 2: Create Database Schema

**Objective**: Define Drizzle ORM schema for audit logs

**File**: `packages/database/src/schema/securityAuditLogs.ts`

**Schema**:
```typescript
export const securityAuditLogs = pgTable(
  'security_audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    timestamp: timestamp('timestamp').notNull().defaultNow(),
    eventType: varchar('event_type', { length: 100 }).notNull(),

    // Actor
    actorType: varchar('actor_type', { length: 20 }).notNull(), // customer | admin | system
    actorId: uuid('actor_id'),
    actorEmail: varchar('actor_email', { length: 255 }),

    // Target
    targetType: varchar('target_type', { length: 50 }),
    targetId: uuid('target_id'),

    // Action
    action: varchar('action', { length: 50 }).notNull(),
    status: varchar('status', { length: 20 }).notNull(), // success | failure | denied

    // Context
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: text('user_agent'),
    sessionId: uuid('session_id'),
    requestId: uuid('request_id'),

    // Event-specific data
    metadata: jsonb('metadata'),

    // Timestamp
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    timestampIdx: index('audit_logs_timestamp_idx').on(table.timestamp),
    eventTypeIdx: index('audit_logs_event_type_idx').on(table.eventType),
    actorIdx: index('audit_logs_actor_idx').on(table.actorId),
    ipAddressIdx: index('audit_logs_ip_address_idx').on(table.ipAddress),
    sessionIdx: index('audit_logs_session_idx').on(table.sessionId),
  })
);
```

**Commit Message**: `feat(20-02): add security audit logs schema`

---

## Task 3: Generate Database Migration

**Objective**: Create migration for security_audit_logs table

**Command**:
```bash
cd packages/database && pnpm drizzle-kit generate
```

**Commit Message**: `feat(20-03): create security audit logs migration`

---

## Task 4: Create AuditLogService

**Objective**: Implement audit logging service

**File**: `apps/api/src/services/audit-log.service.ts`

**Key Methods**:
- `log(event)` - Log security event (async, non-blocking)
- `query(filters)` - Query logs with pagination
- `export(filters, format)` - Export to CSV/JSON
- `cleanup()` - Delete logs older than 90 days

**Features**:
- Extract context from Express request
- Async logging (fire-and-forget)
- Error handling (log failures don't break requests)
- Structured metadata

**Commit Message**: `feat(20-04): add audit log service`

---

## Task 5: Add Request ID Middleware

**Objective**: Generate unique request ID for correlation

**File**: `apps/api/src/middleware/request-id.ts`

**Implementation**: Use `uuid` to generate request ID, attach to `req.id`

**Commit Message**: `feat(20-05): add request ID middleware`

---

## Task 6: Update Login Endpoint

**Objective**: Add audit logging to login

**Events to Log**:
- `AUTH_LOGIN_SUCCESS` on successful login
- `AUTH_LOGIN_FAILURE` on failed login
- `AUTH_LOGIN_LOCKED` when account locked

**Metadata**: email, failure reason, consecutive failures

**Commit Message**: `feat(20-06): add audit logging to login`

---

## Task 7: Update Logout Endpoint

**Objective**: Log logout events

**Event**: `AUTH_LOGOUT`

**Metadata**: session ID

**Commit Message**: `feat(20-07): add audit logging to logout`

---

## Task 8: Update Password Change Endpoint

**Objective**: Log password changes

**Events**:
- `PASSWORD_CHANGED` on successful change
- `PASSWORD_BREACH_DETECTED` if password breached
- `PASSWORD_REUSE_BLOCKED` if password reused

**Metadata**: change reason, strength score

**Commit Message**: `feat(20-08): add audit logging to password change`

---

## Task 9: Update Password Reset Endpoint

**Objective**: Log password reset events

**Events**:
- `PASSWORD_RESET_REQUESTED` when code sent
- `PASSWORD_RESET_COMPLETED` when reset succeeds

**Metadata**: reset method (email)

**Commit Message**: `feat(20-09): add audit logging to password reset`

---

## Task 10: Update Registration Endpoint

**Objective**: Log account creation

**Events**:
- `ACCOUNT_CREATED` on registration
- `EMAIL_VERIFICATION_SENT` when verification code sent

**Metadata**: email, verified status

**Commit Message**: `feat(20-10): add audit logging to registration`

---

## Task 11: Update Email Verification Endpoint

**Objective**: Log email verification

**Event**: `ACCOUNT_VERIFIED` when email verified

**Metadata**: verification method (code)

**Commit Message**: `feat(20-11): add audit logging to email verification`

---

## Task 12: Update Account Lockout

**Objective**: Log account lock/unlock events

**Events**:
- `ACCOUNT_LOCKED` when locked by system
- `ACCOUNT_UNLOCKED` when unlocked by admin or timeout

**Metadata**: lockout reason, unlock method

**Commit Message**: `feat(20-12): add audit logging to lockout`

---

## Task 13: Add Admin Audit Log API

**Objective**: Admin endpoints for querying audit logs

**Endpoints**:
- `GET /api/admin/audit-logs` - List logs (paginated, filtered)
- `GET /api/admin/audit-logs/:id` - Get specific log
- `GET /api/admin/audit-logs/export` - Export CSV/JSON

**Filters**: date range, event type, actor, status, IP

**Commit Message**: `feat(20-13): add admin audit log API`

---

## Task 14: Add Customer Audit Log API

**Objective**: Customer self-service audit log access

**Endpoint**: `GET /api/customers/me/audit-logs`

**Filters**: date range, event type (limited to own events)

**Commit Message**: `feat(20-14): add customer audit log API`

---

## Task 15: Add Cleanup Cron Job

**Objective**: Delete logs older than 90 days

**File**: `apps/api/src/cron/audit-log-cleanup.ts`

**Schedule**: Daily at 4:00 AM UTC

**Commit Message**: `feat(20-15): add audit log cleanup cron job`

---

## Success Criteria

- [ ] Event type enum defined (25 types)
- [ ] Database table created with indexes
- [ ] AuditLogService implemented
- [ ] Request ID middleware added
- [ ] All auth endpoints log events
- [ ] All password endpoints log events
- [ ] All account endpoints log events
- [ ] Admin query/export API
- [ ] Customer self-service API
- [ ] Cleanup cron job
- [ ] 15 atomic commits
- [ ] No TypeScript errors
- [ ] <10ms performance overhead

---

## Notes

- Async logging (non-blocking)
- Append-only (immutable)
- 90-day retention
- Privacy-preserving (no sensitive data)
- Test implementation deferred to Phase 22
