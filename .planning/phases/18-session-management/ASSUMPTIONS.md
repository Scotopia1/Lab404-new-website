# Phase 18: Session Management System - Implementation Assumptions

## Phase Overview
Add persistent session tracking and management capabilities allowing users to view active sessions, manage devices, and revoke access from specific devices for enhanced account security.

## Critical Assumptions

### 1. Infrastructure Dependencies
**Assumption**: Build on existing JWT + httpOnly cookie authentication

- ✅ JWT tokens with 7-day expiration (Phase 1)
- ✅ httpOnly cookies with Secure + SameSite flags
- ✅ auth middleware validates tokens (apps/api/src/middleware/auth.ts)
- ✅ PostgreSQL database with Drizzle ORM
- ✅ Logging infrastructure operational

**Rationale**: Don't rebuild authentication, extend it with session tracking

### 2. Database Schema Design
**Assumption**: Create dedicated sessions table with comprehensive tracking

**New Table**: `sessions`

**Columns**:
```sql
id                UUID PRIMARY KEY
customerId        UUID NOT NULL (FK to customers)
tokenHash         VARCHAR(255) UNIQUE NOT NULL
deviceName        VARCHAR(100)
deviceType        VARCHAR(50)        -- desktop | mobile | tablet
deviceBrowser     VARCHAR(50)
browserVersion    VARCHAR(50)
osName            VARCHAR(50)
osVersion         VARCHAR(50)
ipAddress         VARCHAR(45) NOT NULL
ipCountry         VARCHAR(100)
ipCity            VARCHAR(100)
userAgent         TEXT NOT NULL
loginAt           TIMESTAMP NOT NULL
lastActivityAt    TIMESTAMP NOT NULL
isActive          BOOLEAN DEFAULT TRUE
revokedAt         TIMESTAMP
revokeReason      VARCHAR(100)      -- user_action | security | admin_action
createdAt         TIMESTAMP NOT NULL
updatedAt         TIMESTAMP NOT NULL
```

**Indexes**:
- `sessions_customer_idx` on `customerId`
- `sessions_active_idx` on `isActive`
- `sessions_activity_idx` on `lastActivityAt`
- `sessions_unique_token` unique constraint on `tokenHash`

**Rationale**: Comprehensive tracking for security analysis and user control

### 3. JWT Token Modification
**Assumption**: Embed `sessionId` in JWT payload for validation

**Current Payload** (apps/api/src/middleware/auth.ts):
```typescript
{
  userId: string,
  email: string,
  role: 'customer' | 'admin',
  customerId?: UUID
}
```

**New Payload**:
```typescript
{
  userId: string,
  email: string,
  role: 'customer' | 'admin',
  customerId?: UUID,
  sessionId: UUID  // NEW
}
```

**Rationale**: Bind token to session for revocation capability

### 4. Token Hash Storage Strategy
**Assumption**: Store bcrypt hash of token, never plaintext

**Implementation**:
```typescript
// When creating session
const tokenHash = await bcrypt.hash(token, 10);  // 10 rounds (faster than 12 for lookup perf)
await db.insert(sessions).values({ tokenHash, ... });

// For revocation lookup (if needed)
const isMatch = await bcrypt.compare(token, session.tokenHash);
```

**Alternative Considered**: SHA-256 hash (faster but less secure)
**Decision**: bcrypt for consistency with password hashing patterns

**Rationale**: Protect against database leakage attacks

### 5. Session Creation Trigger Point
**Assumption**: Create session record during login, after password validation

**Modified Login Flow** (apps/api/src/routes/auth.routes.ts line ~280):
```typescript
// 1. Validate password (existing)
const isPasswordValid = await bcrypt.compare(password, customer.passwordHash);

// 2. Check email verification (Phase 17)
if (!customer.emailVerified) { ... }

// 3. NEW: Create session record
const session = await sessionService.createSession({
  customerId: customer.id,
  userAgent: req.headers['user-agent'] || '',
  ipAddress: req.ip || '',
});

// 4. Generate JWT with sessionId
const token = generateToken({
  userId: customer.authUserId!,
  email: customer.email,
  role: 'customer',
  customerId: customer.id,
  sessionId: session.id,  // NEW
});

// 5. Hash and store token in session
await db.update(sessions)
  .set({ tokenHash: await bcrypt.hash(token, 10) })
  .where(eq(sessions.id, session.id));

// 6. Set cookie and respond (existing)
```

**Rationale**: Session created before token generation ensures database consistency

### 6. Session Validation in Middleware
**Assumption**: Validate session on every protected request

**Modified requireAuth Middleware** (apps/api/src/middleware/auth.ts):
```typescript
export const requireAuth = async (req, res, next) => {
  // Existing: Extract and verify JWT token
  const token = extractToken(req);
  const payload = jwt.verify(token, JWT_SECRET);

  // NEW: Validate session if sessionId present
  if (payload.sessionId) {
    const [session] = await db.select()
      .from(sessions)
      .where(eq(sessions.id, payload.sessionId))
      .limit(1);

    if (!session) {
      return sendError(res, 'Session not found', 401);
    }

    if (!session.isActive) {
      return sendError(res, 'Session has been revoked', 401, {
        code: 'SESSION_REVOKED',
      });
    }

    // Update last activity (async, non-blocking)
    updateSessionActivity(session.id).catch((err) =>
      logger.error('Failed to update session activity', err)
    );

    // Attach session to request
    req.session = session;
  }

  // Continue with existing flow
  req.user = payload;
  next();
};
```

**Performance Note**: Session validation adds 1 DB query per request (~5-10ms)

**Rationale**: Real-time session revocation enforcement

### 7. Activity Tracking Strategy
**Assumption**: Update `lastActivityAt` asynchronously on every request

**Simple Approach** (Phase 18):
```typescript
async function updateSessionActivity(sessionId: string): Promise<void> {
  await db
    .update(sessions)
    .set({ lastActivityAt: new Date() })
    .where(eq(sessions.id, sessionId));
}
```

**Optimized Approach** (Future Phase 19+):
- Use Redis cache to batch updates (update every 5 minutes)
- Reduces DB write load by ~95%

**Deferred**: Redis optimization to Phase 19+ (performance tuning)

**Rationale**: Start simple, optimize if performance issues arise

### 8. Device Fingerprinting Library
**Assumption**: Use `ua-parser-js` for User-Agent parsing

**Library**: `ua-parser-js` v2.0.2
- Size: 15KB gzipped
- Zero dependencies
- Battle-tested (350M+ downloads)
- MIT license

**Installation**:
```bash
cd apps/api
pnpm add ua-parser-js
pnpm add -D @types/ua-parser-js
```

**Alternative Considered**: `user-agent-parser` (heavier, more features)
**Decision**: ua-parser-js (lighter, sufficient for our needs)

**Rationale**: Industry standard, minimal overhead

### 9. Device Name Generation
**Assumption**: Auto-generate friendly device names from User-Agent

**Format**: `{Browser} on {OS}`

**Examples**:
- "Chrome on Windows 10"
- "Safari on iOS 17"
- "Firefox on macOS"
- "Edge on Windows 11"

**Implementation**:
```typescript
import { UAParser } from 'ua-parser-js';

function generateDeviceName(userAgent: string): string {
  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  const browser = result.browser.name || 'Unknown Browser';
  const os = result.os.name || 'Unknown OS';
  const osVersion = result.os.version ? ` ${result.os.version}` : '';

  return `${browser} on ${os}${osVersion}`;
}
```

**User Customization**: Users can rename devices (Phase 18b)

**Rationale**: Human-readable default names, customizable later

### 10. Device Type Classification
**Assumption**: Classify devices into desktop/mobile/tablet

**Logic**:
```typescript
function getDeviceType(userAgent: string): string {
  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  if (result.device.type === 'mobile') return 'mobile';
  if (result.device.type === 'tablet') return 'tablet';
  return 'desktop';  // Default
}
```

**UI Usage**: Display appropriate icon (desktop, mobile, tablet)

**Rationale**: Visual device identification in UI

### 11. IP Geolocation
**Assumption**: NOT implemented in Phase 18 (future enhancement)

**Reason**: Requires external API (ipinfo.io, MaxMind, etc.)
**Current**: Store `ipAddress` only
**Deferred**: Add `ipCountry`, `ipCity`, `ipLatitude`, `ipLongitude` in Phase 20

**Fallback**: Show IP address only in UI

**Rationale**: Keep Phase 18 scope focused, add geolocation later

### 12. Session Revocation Methods
**Assumption**: Support multiple revocation scenarios

**Revocation Types**:
1. **User Logout** (current session): `revokeReason = 'user_action'`
2. **User "Logout Others"**: Revoke all sessions except current
3. **User "Logout All"**: Revoke all sessions including current
4. **Specific Session Logout**: Revoke by sessionId from session list
5. **System/Security Revoke** (future): `revokeReason = 'security'`
6. **Admin Revoke** (future): `revokeReason = 'admin_action'`

**Implementation**:
```typescript
async revokeSession(sessionId: string, reason: string): Promise<void> {
  await db
    .update(sessions)
    .set({
      isActive: false,
      revokedAt: new Date(),
      revokeReason: reason,
    })
    .where(eq(sessions.id, sessionId));
}
```

**Rationale**: Flexible revocation for various use cases

### 13. Logout Endpoint Modification
**Assumption**: Modify existing logout to revoke session

**Current Behavior** (apps/api/src/routes/auth.routes.ts line ~320):
- Clears `auth_token` cookie
- No server-side cleanup

**New Behavior**:
```typescript
authRoutes.post('/logout', requireAuth, async (req, res) => {
  const sessionId = req.user?.sessionId;

  if (sessionId) {
    await sessionService.revokeSession(sessionId, 'user_action');
    logger.info('Session revoked on logout', { sessionId });
  }

  res.clearCookie('auth_token');
  sendSuccess(res, { message: 'Logged out successfully' });
});
```

**Rationale**: Clean logout with server-side session cleanup

### 14. API Endpoints Design
**Assumption**: Create dedicated `/api/auth/sessions` namespace

**New Endpoints**:

1. **GET /api/auth/sessions** - List all active sessions
   - Returns: Array of session objects
   - Excludes current session by default (query param to include)
   - Sorted by `lastActivityAt` DESC

2. **DELETE /api/auth/sessions/:sessionId** - Revoke specific session
   - Returns: Success confirmation
   - Validates ownership (session.customerId === req.user.customerId)

3. **POST /api/auth/sessions/logout-others** - Logout all other sessions
   - Revokes all sessions except current
   - Returns: Count of revoked sessions

4. **POST /api/auth/sessions/logout-all** - Logout all sessions
   - Revokes all sessions including current
   - Clears cookie
   - Returns: Count of revoked sessions

5. **PUT /api/auth/sessions/:sessionId** (Phase 18b) - Update session
   - Allows renaming device
   - Body: `{ deviceName: string }`
   - Returns: Updated session

**Rationale**: RESTful design, clear ownership boundaries

### 15. Session List Response Format
**Assumption**: Return comprehensive session data with security awareness

**Response**:
```typescript
{
  success: true,
  data: {
    sessions: [
      {
        id: "uuid",
        deviceName: "Chrome on Windows 10",
        deviceType: "desktop",
        deviceBrowser: "Chrome",
        browserVersion: "120.0",
        osName: "Windows",
        osVersion: "10",
        ipAddress: "203.0.113.45",
        ipCity: null,           // null until Phase 20
        ipCountry: null,
        loginAt: "2026-01-08T14:30:00Z",
        lastActivityAt: "2026-01-09T10:15:00Z",
        isCurrent: false,       // Calculated server-side
        isActive: true
      }
    ],
    currentSessionId: "uuid"
  }
}
```

**Excluded Fields**: `tokenHash`, `customerId`, `revokedAt`, `revokeReason`

**Rationale**: Security (hide sensitive data), usability (show relevant info)

### 16. Current Session Identification
**Assumption**: Mark current session in response for UI highlighting

**Implementation**:
```typescript
const currentSessionId = req.user?.sessionId;
const sessions = await db.select()
  .from(sessions)
  .where(
    and(
      eq(sessions.customerId, req.user.customerId),
      eq(sessions.isActive, true)
    )
  );

// Add isCurrent flag
const sessionsWithCurrent = sessions.map((session) => ({
  ...session,
  isCurrent: session.id === currentSessionId,
}));
```

**Rationale**: Users need to identify "this device" to avoid accidentally logging out

### 17. Session Cleanup Strategy
**Assumption**: Nightly cron job cleans up old/inactive sessions

**Cleanup Rules**:
1. Delete revoked sessions older than 30 days (audit trail retention)
2. Delete inactive sessions (no activity for 7+ days and revoked)
3. Delete expired sessions (created > 90 days ago, even if active)

**Cron Job** (apps/api/src/jobs/session-cleanup.job.ts):
```typescript
async function cleanupSessions(): Promise<number> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const deleted = await db
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

  return deleted.rowCount;
}
```

**Schedule**: Daily at 3:00 AM UTC (low-traffic period)

**Rationale**: Manage database size, maintain audit trail for security

### 18. Concurrent Session Limit
**Assumption**: NO limit on concurrent sessions in Phase 18

**Reason**: Most users have 2-4 devices (phone, laptop, tablet, work PC)
**Future**: Can add limit (e.g., max 10 sessions) in Phase 19+ if abuse detected

**Rationale**: User convenience over theoretical security risk

### 19. Session Token Regeneration
**Assumption**: NO token regeneration in Phase 18 (future enhancement)

**Deferred Features**:
- Token refresh endpoint
- Rotating refresh tokens
- Short-lived access tokens (5min) + long-lived refresh tokens (7 days)

**Current Approach**: Single JWT with 7-day expiration (existing pattern)

**Rationale**: Keep Phase 18 scope manageable, token refresh in Phase 19+

### 20. Frontend Session Page Location
**Assumption**: Add sessions under account settings

**Route**: `/account/security` or `/account/sessions`

**Navigation**:
- Sidebar: "Security" or "Active Sessions"
- Icon: Shield or lock icon
- Description: "Manage your active sessions and devices"

**Alternative Considered**: `/account/settings/security`
**Decision**: `/account/security` (shorter, clearer hierarchy)

**Rationale**: Logical location, consistent with other settings pages

### 21. Session List UI Layout
**Assumption**: Card-based layout for sessions

**Desktop Layout**:
- Table or card grid (2 columns)
- Each card shows device, browser, OS, IP, times, logout button
- "This device" badge on current session

**Mobile Layout**:
- Stacked cards (1 column)
- Expandable details (IP, login time, last activity)
- Swipe-to-delete (future enhancement)

**Rationale**: Mobile-first design, touch-friendly

### 22. Session Item Component
**Assumption**: Reusable `SessionItem` component

**Props**:
```typescript
interface SessionItemProps {
  session: Session;
  isCurrent: boolean;
  onLogout: (sessionId: string) => void;
  onRename?: (sessionId: string, name: string) => void;  // Phase 18b
}
```

**Features**:
- Device icon (based on deviceType)
- Device name (editable in Phase 18b)
- Browser and OS info
- IP address
- Login and last activity times (relative: "5 minutes ago")
- Logout button (disabled for current session in "logout" mode)
- "This device" badge

**Rationale**: Reusable, testable, accessible component

### 23. Auth Store Extensions
**Assumption**: Extend Zustand auth store with session management

**New State Fields**:
```typescript
interface AuthState {
  // ... existing fields
  currentSessionId: string | null;
  activeSessions: Session[];
  sessionsLoading: boolean;
  sessionsError: string | null;
}
```

**New Methods**:
```typescript
fetchActiveSessions: () => Promise<void>;
revokeSession: (sessionId: string) => Promise<void>;
logoutOthers: () => Promise<void>;
logoutAll: () => Promise<void>;
updateSessionName: (sessionId, name) => Promise<void>;  // Phase 18b
```

**Rationale**: Centralized session state, consistent with auth patterns

### 24. Security Warning for Logout Others
**Assumption**: Show confirmation dialog for destructive actions

**Actions Requiring Confirmation**:
- "Logout all other sessions" button
- "Logout all sessions" button

**Dialog Content**:
```
Title: "Logout All Other Sessions?"
Body: "This will log you out of all devices except this one. You'll need to sign in again on those devices."
Actions: [Cancel] [Logout Others]
```

**No Confirmation Needed**:
- Single session logout (non-current)

**Rationale**: Prevent accidental logouts, clear consequences

### 25. Session Activity Timestamps
**Assumption**: Show relative times for better UX

**Format**:
- Less than 1 minute: "Just now"
- Less than 1 hour: "5 minutes ago"
- Less than 24 hours: "2 hours ago"
- Less than 7 days: "3 days ago"
- Older: Absolute date "Jan 8, 2026"

**Implementation**: Use `date-fns` (already installed)

```typescript
import { formatDistanceToNow, format } from 'date-fns';

function formatActivityTime(timestamp: string): string {
  const date = new Date(timestamp);
  const diffMs = Date.now() - date.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays < 7) {
    return formatDistanceToNow(date, { addSuffix: true });
  }
  return format(date, 'MMM d, yyyy');
}
```

**Rationale**: Intuitive time representation, consistent with industry standards

### 26. Guest Account Sessions
**Assumption**: Guest accounts do NOT get persistent sessions

**Reason**: Guest accounts are temporary (converted to regular on first purchase)
**Implementation**: Skip session creation if `customer.isGuest === true`

**Deferred**: Guest session tracking to future phase (if needed)

**Rationale**: Avoid cluttering sessions table with ephemeral guest sessions

### 27. Admin Account Sessions
**Assumption**: Admin sessions tracked separately in same table

**Approach**: Use `role` field from JWT to differentiate
- Admins see admin sessions only
- Customers see customer sessions only

**Alternative Considered**: Separate `admin_sessions` table
**Decision**: Single table with role-based filtering (simpler)

**Rationale**: Code reuse, consistent architecture

### 28. Session Revocation Notification
**Assumption**: NO email notification for session revocation in Phase 18

**Deferred to Phase 20**:
- Email notification when session revoked by security system
- Email notification for unusual login locations
- Email notification for new device logins

**Rationale**: Keep Phase 18 focused on core session management

### 29. Password Change Handling
**Assumption**: NO automatic session revocation on password change (Phase 18)

**Deferred to Phase 19**:
- Revoke all sessions on password change (optional)
- Revoke all other sessions on password change (recommended)
- Keep current session active (UX optimization)

**Current Behavior**: Sessions remain active after password change

**Rationale**: Phase 19 (Advanced Password Security) will implement this

### 30. Security Event Logging
**Assumption**: Log all session events for audit trail

**Logged Events**:
- Session created (login)
- Session activity updated (every request)
- Session revoked (logout, manual revoke, security revoke)
- Session validation failed (revoked token used)
- Unusual activity detected (future: Phase 20)

**Log Fields**: sessionId, customerId, ipAddress, userAgent, timestamp, reason

**Rationale**: Security audit trail, troubleshooting, compliance

### 31. Performance Considerations
**Assumption**: Session validation adds minimal latency

**Expected Impact**:
- Session validation query: 5-10ms (indexed lookup)
- Activity update (async): No blocking, ~10ms background
- Total added latency: 5-10ms per request

**Optimization Strategy** (if needed):
- Add Redis cache for session validation (Phase 19+)
- Batch activity updates (every 5 minutes instead of every request)

**Rationale**: Acceptable performance impact for security benefits

### 32. TypeScript Types Organization
**Assumption**: Create shared types for sessions

**New Types File**: `packages/shared-types/src/session.ts`

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
  isCurrent: boolean;  // Computed
}

export interface SessionListResponse {
  sessions: Session[];
  currentSessionId: string;
}

export interface RevokeSessionRequest {
  sessionId: string;
}
```

**Rationale**: Type safety across frontend and backend

### 33. Mobile Optimization Requirements
**Assumption**: Follow Phase 8-10 mobile optimization patterns

**Requirements**:
- 16px input font size (no iOS zoom)
- 44x44px minimum touch targets (buttons, clickable cards)
- Responsive card layout (stacking on mobile)
- Touch-friendly logout buttons
- Swipe gestures (future enhancement)

**Rationale**: Consistent mobile UX with rest of app

### 34. Accessibility Requirements
**Assumption**: WCAG 2.1 AA compliance for session management

**Features**:
- Semantic HTML (table or list)
- ARIA labels for device types
- Keyboard navigation (tab, enter, escape)
- Screen reader announcements for logout actions
- Focus management in dialogs
- Sufficient color contrast

**Rationale**: Accessible security features for all users

### 35. Testing Strategy
**Assumption**: Manual testing in Phase 18, automated in Phase 22

**Test Scenarios to Document**:
- Login creates session
- Session appears in list
- Current session marked correctly
- Logout revokes current session
- Logout others revokes other sessions
- Logout all revokes all sessions
- Token with revoked session rejected
- Device fingerprinting accurate
- Activity tracking works
- Cleanup job runs correctly

**Deferred**: Automated test implementation to Phase 22

**Rationale**: Consistent with Phase 13-17 testing approach

---

## Assumptions Summary

**Total Assumptions**: 35

**Categories**:
- Infrastructure & Architecture: 5 assumptions
- Database & Schema: 5 assumptions
- JWT & Token Management: 4 assumptions
- Session Lifecycle: 6 assumptions
- Device Fingerprinting: 3 assumptions
- API Endpoints: 4 assumptions
- Frontend Implementation: 5 assumptions
- Security & Compliance: 3 assumptions

**High-Risk Assumptions** (require validation):
1. Token hash storage with bcrypt (assumption #4) - performance impact
2. Session validation on every request (assumption #6) - performance impact
3. No concurrent session limit (assumption #18) - potential abuse
4. No token regeneration (assumption #19) - security vs complexity tradeoff

**Dependencies**:
- Phase 13-17 must be operational ✅
- JWT authentication working ✅
- PostgreSQL database ✅
- No new infrastructure required ✅

**New Dependencies**:
- `ua-parser-js` npm package (15KB)

**Deferred to Future Phases**:
- IP geolocation → Phase 20
- Session notifications → Phase 20
- Token refresh/rotation → Phase 19
- Password change session revocation → Phase 19
- Redis session cache → Phase 19+
- Concurrent session limits → Phase 19+

**Key Decisions**:
- Single sessions table for all users
- Bcrypt hash for token storage
- Async activity tracking (non-blocking)
- No session limit initially
- Card-based UI layout
- `/account/security` route
- No email notifications yet

---

## Risk Assessment

**Low Risk**:
- Database schema design (proven pattern)
- Device fingerprinting (battle-tested library)
- API endpoint design (RESTful, straightforward)
- Frontend components (familiar patterns)

**Medium Risk**:
- Performance impact of session validation (5-10ms added latency)
- Activity tracking write load (mitigated by async)
- Token hash lookup performance (mitigated by bcrypt rounds = 10)

**High Risk**:
- JWT backward compatibility if sessionId required (mitigated by optional check)

**Mitigation Strategies**:
- Performance monitoring in production
- Optional session validation (graceful degradation if DB slow)
- Database indexes on lookup columns
- Async activity updates (non-blocking)
- Comprehensive testing before production

---

## Success Metrics

**Functional**:
- [ ] Sessions created on login
- [ ] Sessions validated on every request
- [ ] Users can view all active sessions
- [ ] Users can revoke specific sessions
- [ ] Logout revokes current session
- [ ] Activity tracking accurate

**Security**:
- [ ] Token hash never exposed
- [ ] Revoked sessions immediately blocked
- [ ] Session audit trail complete
- [ ] No session fixation vulnerabilities

**Performance**:
- [ ] Session validation < 10ms p95
- [ ] No user-facing latency impact
- [ ] Activity updates non-blocking
- [ ] Database query performance acceptable

**UX**:
- [ ] Clear session identification ("this device")
- [ ] Intuitive logout actions
- [ ] Mobile-optimized layout
- [ ] Accessible to all users
