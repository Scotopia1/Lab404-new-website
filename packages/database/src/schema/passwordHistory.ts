import { pgTable, uuid, varchar, timestamp, index } from 'drizzle-orm/pg-core';
import { customers } from './customers';

export const passwordHistory = pgTable(
  'password_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'cascade' }),

    // Password hash (stored to prevent reuse)
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),

    // Metadata
    changedAt: timestamp('changed_at').notNull().defaultNow(),
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: varchar('user_agent', { length: 500 }),

    // Source of change
    changeReason: varchar('change_reason', { length: 50 }), // user_action | admin_reset | password_reset | forced_change
  },
  (table) => ({
    customerIdx: index('password_history_customer_idx').on(table.customerId),
    changedAtIdx: index('password_history_changed_at_idx').on(table.changedAt),
  })
);

export type PasswordHistory = typeof passwordHistory.$inferSelect;
export type NewPasswordHistory = typeof passwordHistory.$inferInsert;
