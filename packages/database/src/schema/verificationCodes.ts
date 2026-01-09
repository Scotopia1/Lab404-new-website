import { pgTable, uuid, varchar, timestamp, integer, boolean, pgEnum, index } from 'drizzle-orm/pg-core';

export const verificationCodeTypeEnum = pgEnum('verification_code_type', [
  'password_reset',
  'email_verification',
  'account_unlock'
]);

export const verificationCodes = pgTable('verification_codes', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Code details
  email: varchar('email', { length: 255 }).notNull(),
  code: varchar('code', { length: 6 }).notNull(),
  type: verificationCodeTypeEnum('type').notNull(),

  // Security & tracking
  attempts: integer('attempts').default(0).notNull(),
  maxAttempts: integer('max_attempts').default(3).notNull(),

  // Expiration
  expiresAt: timestamp('expires_at').notNull(),

  // Status tracking
  isUsed: boolean('is_used').default(false).notNull(),
  usedAt: timestamp('used_at'),

  // IP tracking
  ipAddress: varchar('ip_address', { length: 45 }),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  emailIdx: index('verification_codes_email_idx').on(table.email),
  expiresAtIdx: index('verification_codes_expires_at_idx').on(table.expiresAt),
}));

// Types
export type VerificationCode = typeof verificationCodes.$inferSelect;
export type NewVerificationCode = typeof verificationCodes.$inferInsert;
export type VerificationCodeType = 'password_reset' | 'email_verification' | 'account_unlock';
