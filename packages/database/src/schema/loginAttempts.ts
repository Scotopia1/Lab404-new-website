import { pgTable, uuid, varchar, timestamp, boolean, integer, index } from 'drizzle-orm/pg-core';
import { customers } from './customers';

export const loginAttempts = pgTable(
  'login_attempts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'cascade' }),

    // Attempt details
    email: varchar('email', { length: 255 }).notNull(),
    success: boolean('success').notNull(),
    failureReason: varchar('failure_reason', { length: 100 }), // invalid_credentials | account_locked | email_unverified | account_disabled

    // Device and network information
    ipAddress: varchar('ip_address', { length: 45 }).notNull(),
    userAgent: varchar('user_agent', { length: 500 }),
    deviceType: varchar('device_type', { length: 50 }), // desktop | mobile | tablet
    deviceBrowser: varchar('device_browser', { length: 50 }),

    // Geographic information (optional)
    ipCountry: varchar('ip_country', { length: 100 }),
    ipCity: varchar('ip_city', { length: 100 }),

    // Lockout tracking
    triggeredLockout: boolean('triggered_lockout').default(false).notNull(),
    consecutiveFailures: integer('consecutive_failures').default(0).notNull(),

    // Timestamp
    attemptedAt: timestamp('attempted_at').notNull().defaultNow(),
  },
  (table) => ({
    customerIdx: index('login_attempts_customer_idx').on(table.customerId),
    emailIdx: index('login_attempts_email_idx').on(table.email),
    attemptedAtIdx: index('login_attempts_attempted_at_idx').on(table.attemptedAt),
    successIdx: index('login_attempts_success_idx').on(table.success),
  })
);

export type LoginAttempt = typeof loginAttempts.$inferSelect;
export type NewLoginAttempt = typeof loginAttempts.$inferInsert;
