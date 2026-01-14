import { pgTable, uuid, varchar, text, boolean, integer, timestamp, jsonb, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { customers } from './customers';

// ===========================================
// Newsletter Subscribers
// ===========================================

export const newsletterSubscribers = pgTable('newsletter_subscribers', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull(),
  name: varchar('name', { length: 100 }),

  // Link to customer if they have an account
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),

  // Status
  status: varchar('status', { length: 20 }).default('active').notNull(), // 'active' | 'unsubscribed' | 'bounced'

  // Source of subscription
  source: varchar('source', { length: 50 }).default('footer').notNull(), // 'footer' | 'checkout' | 'popup' | 'import' | 'admin'

  // Unsubscribe token for secure unsubscribe links
  unsubscribeToken: varchar('unsubscribe_token', { length: 64 }).notNull(),

  // Timestamps
  subscribedAt: timestamp('subscribed_at').defaultNow().notNull(),
  unsubscribedAt: timestamp('unsubscribed_at'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('newsletter_subscribers_email_idx').on(table.email),
]);

// ===========================================
// Newsletter Campaigns
// ===========================================

export const newsletterCampaigns = pgTable('newsletter_campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Campaign details
  name: varchar('name', { length: 255 }).notNull(),
  subject: varchar('subject', { length: 255 }).notNull(),
  previewText: varchar('preview_text', { length: 255 }), // Email preview text
  content: text('content').notNull(), // HTML content

  // Status: draft | scheduled | sending | paused | completed | cancelled
  status: varchar('status', { length: 20 }).default('draft').notNull(),

  // Sending configuration
  dailyLimit: integer('daily_limit').default(100).notNull(), // Max emails per day
  sendTime: varchar('send_time', { length: 5 }), // Preferred send time HH:MM (24h format)

  // Statistics
  totalRecipients: integer('total_recipients').default(0).notNull(),
  sentCount: integer('sent_count').default(0).notNull(),
  failedCount: integer('failed_count').default(0).notNull(),
  openCount: integer('open_count').default(0).notNull(),
  clickCount: integer('click_count').default(0).notNull(),

  // Timestamps
  scheduledAt: timestamp('scheduled_at'), // When to start sending
  startedAt: timestamp('started_at'), // When sending actually started
  completedAt: timestamp('completed_at'), // When all emails were sent
  lastSentAt: timestamp('last_sent_at'), // Last email sent timestamp

  // Created by admin
  createdBy: uuid('created_by').references(() => customers.id, { onDelete: 'set null' }),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ===========================================
// Newsletter Sends (Individual email tracking)
// ===========================================

export const newsletterSends = pgTable('newsletter_sends', {
  id: uuid('id').primaryKey().defaultRandom(),

  campaignId: uuid('campaign_id').references(() => newsletterCampaigns.id, { onDelete: 'cascade' }).notNull(),
  subscriberId: uuid('subscriber_id').references(() => newsletterSubscribers.id, { onDelete: 'cascade' }).notNull(),

  // Email address at time of send (in case subscriber changes email)
  email: varchar('email', { length: 255 }).notNull(),

  // Status: pending | sent | failed | bounced
  status: varchar('status', { length: 20 }).default('pending').notNull(),

  // Error tracking
  errorMessage: text('error_message'),
  retryCount: integer('retry_count').default(0).notNull(),

  // Engagement tracking
  openedAt: timestamp('opened_at'),
  clickedAt: timestamp('clicked_at'),

  // Timestamps
  scheduledFor: timestamp('scheduled_for'), // When this email should be sent
  sentAt: timestamp('sent_at'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ===========================================
// Relations
// ===========================================

export const newsletterSubscribersRelations = relations(newsletterSubscribers, ({ one, many }) => ({
  customer: one(customers, {
    fields: [newsletterSubscribers.customerId],
    references: [customers.id],
  }),
  sends: many(newsletterSends),
}));

export const newsletterCampaignsRelations = relations(newsletterCampaigns, ({ one, many }) => ({
  createdByCustomer: one(customers, {
    fields: [newsletterCampaigns.createdBy],
    references: [customers.id],
  }),
  sends: many(newsletterSends),
}));

export const newsletterSendsRelations = relations(newsletterSends, ({ one }) => ({
  campaign: one(newsletterCampaigns, {
    fields: [newsletterSends.campaignId],
    references: [newsletterCampaigns.id],
  }),
  subscriber: one(newsletterSubscribers, {
    fields: [newsletterSends.subscriberId],
    references: [newsletterSubscribers.id],
  }),
}));

// ===========================================
// Types
// ===========================================

export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;
export type NewNewsletterSubscriber = typeof newsletterSubscribers.$inferInsert;

export type NewsletterCampaign = typeof newsletterCampaigns.$inferSelect;
export type NewNewsletterCampaign = typeof newsletterCampaigns.$inferInsert;

export type NewsletterSend = typeof newsletterSends.$inferSelect;
export type NewNewsletterSend = typeof newsletterSends.$inferInsert;
