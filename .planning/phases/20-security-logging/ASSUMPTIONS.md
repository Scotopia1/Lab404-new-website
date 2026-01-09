# Phase 20: Security Audit Logging - Assumptions

**Created**: 2026-01-09
**Phase**: 20 of 22
**Dependencies**: Phases 13-19 complete

---

## Objective

Implement comprehensive security audit logging for compliance, forensics, and security monitoring. Track all security-relevant events with detailed context for incident investigation and compliance reporting.

---

## Core Assumptions

### 1. Security Events Scope
**Assumption**: Log security-critical events, not all application events
**Categories**:
- Authentication events (login, logout, failed attempts)
- Authorization events (permission denied, role changes)
- Data access events (PII access, sensitive data queries)
- Account management (password changes, email updates, lockouts)
- Administrative actions (account unlock, role assignment)
- Security configuration changes
- Suspicious activity (rate limit violations, brute force)

**Rationale**: Focus on security-relevant events for compliance and incident response

### 2. Audit Log Retention
**Assumption**: Retain audit logs for 90 days minimum
**Details**:
- 90 days: Regulatory minimum (GDPR, SOC 2)
- Optional: Archive to external storage after 90 days
- Auto-cleanup after retention period

**Rationale**: Balance compliance requirements with storage costs

### 3. Log Structure
**Assumption**: Use structured logging with standardized fields
**Required Fields**:
- Timestamp (ISO 8601)
- Event type (enum)
- Actor (customer ID, admin ID, system)
- Target (resource ID, resource type)
- Action (create, read, update, delete, login, etc.)
- Status (success, failure, denied)
- IP address
- User agent
- Session ID
- Request ID (for correlation)
- Metadata (event-specific JSON)

**Rationale**: Structured logs enable efficient querying and analysis

### 4. Performance Impact
**Assumption**: Async logging to avoid blocking requests
**Approach**:
- Fire-and-forget for non-critical logs
- Use database connection pooling
- Batch inserts where possible
- Index strategically (timestamp, event type, actor)

**Target**: <10ms overhead per request

### 5. Security Event Types
**Assumption**: Define ~25 security event types
**Categories**:

#### Authentication Events
- `auth.login.success`
- `auth.login.failure`
- `auth.login.locked`
- `auth.logout`
- `auth.session.created`
- `auth.session.revoked`
- `auth.token.refreshed`

#### Password Events
- `password.changed`
- `password.reset.requested`
- `password.reset.completed`
- `password.breach.detected`
- `password.reuse.blocked`

#### Account Management
- `account.created`
- `account.verified`
- `account.locked`
- `account.unlocked`
- `account.disabled`
- `account.deleted`
- `email.changed`
- `email.verification.sent`

#### Authorization Events
- `permission.denied`
- `admin.access.granted`
- `admin.action.performed`

#### Security Events
- `rate_limit.exceeded`
- `suspicious_activity.detected`

**Rationale**: Cover all security-relevant state changes

### 6. Query Interface
**Assumption**: Provide API endpoints for audit log access
**Endpoints**:
- `GET /api/admin/audit-logs` - List all logs (paginated, filtered)
- `GET /api/admin/audit-logs/:id` - Get specific log
- `GET /api/customers/me/audit-logs` - Customer's own security events
- `GET /api/admin/audit-logs/export` - Export to CSV/JSON

**Filters**:
- Date range
- Event type
- Actor ID
- Status
- IP address

**Rationale**: Enable security team to investigate incidents

### 7. Immutability
**Assumption**: Audit logs are append-only (never updated/deleted)
**Enforcement**:
- No UPDATE statements in code
- No DELETE except for retention cleanup
- Database-level write-only permissions for audit table
- Separate service account for audit writes

**Rationale**: Preserve forensic integrity, prevent tampering

### 8. Privacy Considerations
**Assumption**: Log metadata, not sensitive data
**Do Log**:
- User IDs, email addresses
- IP addresses, session IDs
- Event types, timestamps
- Success/failure status

**Don't Log**:
- Passwords (even hashed)
- Payment information
- Full address details
- Personal identification numbers

**Rationale**: Comply with GDPR Article 32 (security logging) without violating Article 6 (data minimization)

### 9. Alert Integration (Optional)
**Assumption**: Deferred to future phase
**Rationale**: Focus on logging infrastructure first, alerting later
**Future**: Integrate with monitoring tools (Sentry, DataDog, PagerDuty)

### 10. Compliance Requirements
**Assumption**: Meet SOC 2, GDPR, and ISO 27001 audit requirements
**Requirements**:
- Log all authentication events
- Log all privileged actions
- Log all access to PII
- Retain for 90+ days
- Protect log integrity
- Provide audit export capability

**Rationale**: Enable certification and compliance audits

---

## Technical Assumptions

### Database Table Design
**Assumption**: Single `security_audit_logs` table
**Schema**:
```typescript
{
  id: uuid (PK)
  timestamp: timestamp (indexed)
  eventType: enum (indexed)
  actorType: enum (customer | admin | system)
  actorId: uuid (indexed, nullable)
  targetType: enum (customer | admin | order | session, etc.)
  targetId: uuid (nullable)
  action: varchar(50)
  status: enum (success | failure | denied)
  ipAddress: varchar(45) (indexed)
  userAgent: text
  sessionId: uuid (indexed, nullable)
  requestId: uuid (indexed, nullable)
  metadata: jsonb (event-specific data)
  createdAt: timestamp (auto)
}
```

**Indexes**:
- timestamp (for date range queries)
- eventType (for filtering)
- actorId (for user-specific logs)
- ipAddress (for forensic investigation)
- sessionId (for session correlation)

**Storage Estimate**: ~500 bytes/row × 1000 events/day = 500KB/day = 45MB/90 days

### Service Pattern
**Assumption**: Create dedicated `AuditLogService`
**Methods**:
- `log(event)` - Log security event
- `query(filters)` - Query audit logs
- `export(filters)` - Export to CSV/JSON
- `cleanup()` - Remove old logs (cron job)

**Rationale**: Centralize audit logging logic

### Event Context Capture
**Assumption**: Extract context from Express request
**Context**:
- `req.user` - Actor information
- `req.ip` - IP address
- `req.headers['user-agent']` - User agent
- `req.id` - Request ID (if using request-id middleware)
- `req.session` - Session ID

**Rationale**: Consistent context capture across all endpoints

---

## Risk Mitigation

### Risk 1: Performance Impact
- **Mitigation**: Async logging, connection pooling, strategic indexing
- **Monitoring**: Track logging latency, database CPU

### Risk 2: Storage Growth
- **Mitigation**: 90-day retention, auto-cleanup, optional archival
- **Monitoring**: Database size alerts

### Risk 3: Log Tampering
- **Mitigation**: Append-only, separate permissions, immutable design
- **Monitoring**: Audit log integrity checks

### Risk 4: Missing Events
- **Mitigation**: Comprehensive event coverage, middleware integration
- **Testing**: Verify all security endpoints log events

---

## Out of Scope

- Real-time alerting (deferred to monitoring phase)
- Log aggregation to external systems (Splunk, ELK)
- Anomaly detection (ML-based)
- Log encryption at rest (database-level feature)
- Log signing/hashing (advanced integrity)

---

## Success Criteria

- ✅ All authentication events logged
- ✅ All privileged actions logged
- ✅ Query API with filtering/pagination
- ✅ Export functionality
- ✅ 90-day retention with auto-cleanup
- ✅ <10ms performance overhead
- ✅ Customer self-service audit log access
- ✅ Admin audit log management UI (optional)

---

## Estimated Effort

- Database schema & migration: 1 hour
- AuditLogService implementation: 2 hours
- Integration into existing endpoints: 3 hours
- Query/export API endpoints: 2 hours
- Frontend audit log viewer (optional): 3 hours
- Testing documentation: 1 hour

**Total**: ~12 hours (1.5 days)

---

## Dependencies

- ✅ Phase 18: Session management (for session ID tracking)
- ✅ Phase 19: Login attempts (for authentication event context)
- ✅ Existing: Database, Express middleware

---

## Next Steps

1. Create PLAN.md with detailed tasks
2. Define event type enum (25 types)
3. Create database table and schema
4. Implement AuditLogService
5. Integrate logging into all security endpoints
6. Create admin query/export endpoints
7. Add customer self-service endpoint
8. Document test structure
9. Update STATE.md
