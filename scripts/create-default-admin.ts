/**
 * Create Default Admin User
 *
 * Creates an admin user with default test credentials
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables FIRST
config({ path: resolve(__dirname, '../.env') });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { pgTable, uuid, varchar, text, boolean, integer, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

// Define customers table schema
const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  authUserId: varchar('auth_user_id', { length: 255 }).unique(),
  email: varchar('email', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  phone: varchar('phone', { length: 50 }),
  passwordHash: varchar('password_hash', { length: 255 }),
  role: varchar('role', { length: 20 }).default('customer').notNull(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  emailVerifiedAt: timestamp('email_verified_at'),
  defaultShippingAddress: jsonb('default_shipping_address'),
  defaultBillingAddress: jsonb('default_billing_address'),
  isGuest: boolean('is_guest').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  acceptsMarketing: boolean('accepts_marketing').default(false).notNull(),
  notes: text('notes'),
  tags: varchar('tags', { length: 255 }).array(),
  orderCount: integer('order_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

async function createDefaultAdmin() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in environment variables');
    process.exit(1);
  }

  console.log('\n🔐 Creating default admin user...\n');

  const sql = neon(databaseUrl);
  const db = drizzle(sql, { schema: { customers } });

  // Default admin credentials (matching test fixtures)
  const email = 'admin@lab404electronics.com';
  const password = 'Lab404Admin2024!';
  const firstName = 'Admin';
  const lastName = 'User';

  try {
    // Check if email already exists
    const [existing] = await db
      .select()
      .from(customers)
      .where(eq(customers.email, email.toLowerCase()));

    if (existing) {
      if (existing.role === 'admin') {
        console.log('⚠️  Admin user already exists!\n');
        console.log(`   Email: ${existing.email}`);
        console.log(`   ID: ${existing.id}`);
        console.log(`   Role: ${existing.role}`);
        console.log('\n✅ You can use these credentials to login.\n');
        return;
      } else {
        // Promote existing user to admin
        console.log(`📝 User ${email} exists as customer. Promoting to admin...\n`);
        const [updated] = await db
          .update(customers)
          .set({
            role: 'admin',
            firstName: existing.firstName || firstName,
            lastName: existing.lastName || lastName,
            emailVerified: true,
            emailVerifiedAt: existing.emailVerifiedAt || new Date(),
            updatedAt: new Date(),
          })
          .where(eq(customers.id, existing.id))
          .returning();

        if (updated) {
          console.log('✅ User promoted to admin!\n');
          console.log(`   Email: ${updated.email}`);
          console.log(`   ID: ${updated.id}`);
          console.log(`   Role: ${updated.role}`);
          console.log('\n🎉 You can now login with your existing password.\n');
        }
        return;
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create admin user
    const [admin] = await db
      .insert(customers)
      .values({
        email: email.toLowerCase(),
        firstName,
        lastName,
        passwordHash,
        role: 'admin',
        isGuest: false,
        isActive: true,
        emailVerified: true,
        emailVerifiedAt: new Date(),
        authUserId: `admin_${Date.now()}`,
      })
      .returning();

    if (admin) {
      console.log('✅ Admin user created successfully!\n');
      console.log('📧 Login Credentials:');
      console.log(`   Email: ${admin.email}`);
      console.log(`   Password: ${password}`);
      console.log(`   \n📋 User Details:`);
      console.log(`   ID: ${admin.id}`);
      console.log(`   Role: ${admin.role}`);
      console.log(`   Status: Active`);
      console.log(`   Email Verified: Yes`);
      console.log('\n🎉 You can now login to the admin dashboard!\n');
    } else {
      console.error('\n❌ Failed to create admin user.');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Error creating admin user:', error);
    process.exit(1);
  }
}

createDefaultAdmin();
