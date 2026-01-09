import { pgTable, uuid, varchar, timestamp, integer, boolean, index } from 'drizzle-orm/pg-core';
import { customers } from './customers';

export const breachChecks = pgTable(
  'breach_checks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'cascade' }),

    // Password hash prefix (k-anonymity - first 5 chars of SHA-1)
    passwordHashPrefix: varchar('password_hash_prefix', { length: 5 }).notNull(),

    // Breach status
    isBreached: boolean('is_breached').notNull(),
    breachCount: integer('breach_count').default(0).notNull(), // Number of times seen in breaches

    // Check metadata
    checkedAt: timestamp('checked_at').notNull().defaultNow(),
    expiresAt: timestamp('expires_at').notNull(), // Cache for 30 days

    // Context
    checkReason: varchar('check_reason', { length: 50 }), // registration | password_change | password_reset | periodic_check
    ipAddress: varchar('ip_address', { length: 45 }),
  },
  (table) => ({
    customerIdx: index('breach_checks_customer_idx').on(table.customerId),
    prefixIdx: index('breach_checks_prefix_idx').on(table.passwordHashPrefix),
    expiresAtIdx: index('breach_checks_expires_at_idx').on(table.expiresAt),
  })
);

export type BreachCheck = typeof breachChecks.$inferSelect;
export type NewBreachCheck = typeof breachChecks.$inferInsert;
