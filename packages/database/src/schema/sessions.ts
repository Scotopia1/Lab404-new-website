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
