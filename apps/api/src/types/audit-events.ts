/**
 * Security Audit Event Types
 *
 * Comprehensive enum of all security-relevant events for audit logging.
 * Used by AuditLogService to categorize and track security events.
 */

export enum SecurityEventType {
  // Authentication Events
  AUTH_LOGIN_SUCCESS = 'auth.login.success',
  AUTH_LOGIN_FAILURE = 'auth.login.failure',
  AUTH_LOGIN_LOCKED = 'auth.login.locked',
  AUTH_LOGOUT = 'auth.logout',
  AUTH_SESSION_CREATED = 'auth.session.created',
  AUTH_SESSION_REVOKED = 'auth.session.revoked',

  // Password Events
  PASSWORD_CHANGED = 'password.changed',
  PASSWORD_RESET_REQUESTED = 'password.reset.requested',
  PASSWORD_RESET_COMPLETED = 'password.reset.completed',
  PASSWORD_BREACH_DETECTED = 'password.breach.detected',
  PASSWORD_REUSE_BLOCKED = 'password.reuse.blocked',

  // Account Management Events
  ACCOUNT_CREATED = 'account.created',
  ACCOUNT_VERIFIED = 'account.verified',
  ACCOUNT_LOCKED = 'account.locked',
  ACCOUNT_UNLOCKED = 'account.unlocked',
  ACCOUNT_DISABLED = 'account.disabled',
  EMAIL_CHANGED = 'email.changed',
  EMAIL_VERIFICATION_SENT = 'email.verification.sent',

  // Authorization Events
  PERMISSION_DENIED = 'permission.denied',
  ADMIN_ACCESS_GRANTED = 'admin.access.granted',
  ADMIN_ACTION = 'admin.action.performed',

  // Security Events
  RATE_LIMIT_EXCEEDED = 'rate_limit.exceeded',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity.detected',
}

export enum ActorType {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
  SYSTEM = 'system',
}

export enum EventStatus {
  SUCCESS = 'success',
  FAILURE = 'failure',
  DENIED = 'denied',
}

export interface AuditLogEvent {
  eventType: SecurityEventType;
  actorType: ActorType;
  actorId?: string;
  actorEmail?: string;
  targetType?: string;
  targetId?: string;
  action: string;
  status: EventStatus;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  requestId?: string;
  metadata?: Record<string, any>;
}
