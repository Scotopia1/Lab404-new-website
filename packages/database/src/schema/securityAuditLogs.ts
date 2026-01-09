import { pgTable, uuid, timestamp, varchar, text, jsonb, index } from 'drizzle-orm/pg-core';

/**
 * Security Audit Logs Table
 *
 * Immutable append-only log of all security-critical events.
 * Used for compliance, forensics, and security monitoring.
 *
 * Retention: 90 days
 * Compliance: SOC 2, GDPR, ISO 27001
 */
export const securityAuditLogs = pgTable(
  'security_audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    timestamp: timestamp('timestamp').notNull().defaultNow(),
    eventType: varchar('event_type', { length: 100 }).notNull(),

    // Actor (who performed the action)
    actorType: varchar('actor_type', { length: 20 }).notNull(), // customer | admin | system
    actorId: uuid('actor_id'),
    actorEmail: varchar('actor_email', { length: 255 }),

    // Target (what was acted upon)
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

    // Event-specific metadata
    metadata: jsonb('metadata'),

    // Timestamp
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    // Performance indexes for common queries
    timestampIdx: index('audit_logs_timestamp_idx').on(table.timestamp),
    eventTypeIdx: index('audit_logs_event_type_idx').on(table.eventType),
    actorIdx: index('audit_logs_actor_idx').on(table.actorId),
    ipAddressIdx: index('audit_logs_ip_address_idx').on(table.ipAddress),
    sessionIdx: index('audit_logs_session_idx').on(table.sessionId),
  })
);

export type SecurityAuditLog = typeof securityAuditLogs.$inferSelect;
export type NewSecurityAuditLog = typeof securityAuditLogs.$inferInsert;
