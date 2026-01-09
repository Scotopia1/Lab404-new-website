import { pgTable, uuid, varchar, integer, timestamp, text, boolean, index } from 'drizzle-orm/pg-core';

/**
 * IP Reputation Tracking Table
 *
 * Tracks IP addresses with reputation scores for abuse prevention.
 * Used to identify and block malicious IPs automatically.
 */
export const ipReputation = pgTable(
  'ip_reputation',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ipAddress: varchar('ip_address', { length: 45 }).notNull().unique(),

    // Reputation scoring
    reputationScore: integer('reputation_score').notNull().default(100), // 0-100, lower = worse

    // Counters
    failedLoginAttempts: integer('failed_login_attempts').notNull().default(0),
    successfulLogins: integer('successful_logins').notNull().default(0),
    rateLimitViolations: integer('rate_limit_violations').notNull().default(0),
    abuseReports: integer('abuse_reports').notNull().default(0),

    // Status
    isBlocked: boolean('is_blocked').default(false).notNull(),
    blockReason: varchar('block_reason', { length: 255 }),
    blockedAt: timestamp('blocked_at'),
    blockedUntil: timestamp('blocked_until'), // Null = permanent block

    // Metadata
    lastSeenAt: timestamp('last_seen_at').notNull().defaultNow(),
    firstSeenAt: timestamp('first_seen_at').notNull().defaultNow(),
    userAgent: text('user_agent'),
    country: varchar('country', { length: 100 }),
    notes: text('notes'),

    // Timestamps
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    ipAddressIdx: index('ip_reputation_ip_address_idx').on(table.ipAddress),
    isBlockedIdx: index('ip_reputation_is_blocked_idx').on(table.isBlocked),
    reputationScoreIdx: index('ip_reputation_score_idx').on(table.reputationScore),
  })
);

export type IpReputation = typeof ipReputation.$inferSelect;
export type NewIpReputation = typeof ipReputation.$inferInsert;
