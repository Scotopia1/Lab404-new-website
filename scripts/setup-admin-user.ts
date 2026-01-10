/**
 * Setup Admin User Script
 *
 * This script helps you create or check for admin users in the database.
 *
 * Usage:
 *   pnpm tsx scripts/setup-admin-user.ts check              - Check existing admin users
 *   pnpm tsx scripts/setup-admin-user.ts create             - Create a new admin user
 *   pnpm tsx scripts/setup-admin-user.ts promote <email>    - Promote existing user to admin
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables FIRST before any other imports
config({ path: resolve(__dirname, '../.env') });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { pgTable, uuid, varchar, text, boolean, integer, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import * as readline from 'readline';

// Define customers table schema (minimal version for this script)
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

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve));
}

function getDbClient() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL not found in environment variables');
  }
  const sql = neon(databaseUrl);
  return drizzle(sql, { schema: { customers } });
}

async function checkAdminUsers() {
  console.log('\n🔍 Checking for admin users...\n');

  const db = getDbClient();
  const admins = await db
    .select({
      id: customers.id,
      email: customers.email,
      firstName: customers.firstName,
      lastName: customers.lastName,
      role: customers.role,
      isActive: customers.isActive,
      emailVerified: customers.emailVerified,
      createdAt: customers.createdAt,
    })
    .from(customers)
    .where(eq(customers.role, 'admin'));

  if (admins.length === 0) {
    console.log('❌ No admin users found in the database.\n');
    return;
  }

  console.log(`✅ Found ${admins.length} admin user(s):\n`);

  admins.forEach((admin, index) => {
    console.log(`${index + 1}. ${admin.email}`);
    console.log(`   Name: ${admin.firstName || 'N/A'} ${admin.lastName || 'N/A'}`);
    console.log(`   Status: ${admin.isActive ? '✅ Active' : '❌ Inactive'}`);
    console.log(`   Email Verified: ${admin.emailVerified ? '✅ Yes' : '❌ No'}`);
    console.log(`   Created: ${admin.createdAt.toISOString()}`);
    console.log('');
  });
}

async function createAdminUser() {
  console.log('\n🔐 Create New Admin User\n');

  const email = await question('Email address: ');
  const password = await question('Password (min 8 chars, must include uppercase, lowercase, and number): ');
  const firstName = await question('First name (optional): ');
  const lastName = await question('Last name (optional): ');

  // Validate password
  if (password.length < 8) {
    console.error('\n❌ Password must be at least 8 characters long.');
    return;
  }

  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
    console.error('\n❌ Password must contain at least one uppercase letter, one lowercase letter, and one number.');
    return;
  }

  const db = getDbClient();

  // Check if email already exists
  const [existing] = await db
    .select()
    .from(customers)
    .where(eq(customers.email, email.toLowerCase()));

  if (existing) {
    console.error('\n❌ Email already exists. Use the "promote" command to make an existing user an admin.');
    return;
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  // Create admin user
  const [admin] = await db
    .insert(customers)
    .values({
      email: email.toLowerCase(),
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      passwordHash,
      role: 'admin',
      isGuest: false,
      isActive: true,
      emailVerified: true, // Auto-verify admin users
      emailVerifiedAt: new Date(),
      authUserId: `admin_${Date.now()}`,
    })
    .returning();

  if (admin) {
    console.log('\n✅ Admin user created successfully!\n');
    console.log(`   Email: ${admin.email}`);
    console.log(`   ID: ${admin.id}`);
    console.log(`   Role: ${admin.role}`);
    console.log('\n🎉 You can now log in with these credentials.\n');
  } else {
    console.error('\n❌ Failed to create admin user.');
  }
}

async function promoteUser(email: string) {
  console.log(`\n⬆️  Promoting user ${email} to admin...\n`);

  const db = getDbClient();

  // Find user
  const [user] = await db
    .select()
    .from(customers)
    .where(eq(customers.email, email.toLowerCase()));

  if (!user) {
    console.error(`\n❌ User with email "${email}" not found.`);
    return;
  }

  if (user.role === 'admin') {
    console.log(`\n⚠️  User "${email}" is already an admin.`);
    return;
  }

  // Update user role
  const [updated] = await db
    .update(customers)
    .set({
      role: 'admin',
      updatedAt: new Date(),
    })
    .where(eq(customers.id, user.id))
    .returning();

  if (updated) {
    console.log(`\n✅ User "${email}" has been promoted to admin!\n`);
    console.log(`   Email: ${updated.email}`);
    console.log(`   ID: ${updated.id}`);
    console.log(`   Role: ${updated.role}`);
    console.log('\n🎉 They can now access admin features.\n');
  } else {
    console.error('\n❌ Failed to promote user.');
  }
}

async function main() {
  const command = process.argv[2];
  const arg = process.argv[3];

  try {
    switch (command) {
      case 'check':
        await checkAdminUsers();
        break;

      case 'create':
        await createAdminUser();
        break;

      case 'promote':
        if (!arg) {
          console.error('\n❌ Please provide an email address to promote.');
          console.log('   Usage: pnpm tsx scripts/setup-admin-user.ts promote <email>\n');
          break;
        }
        await promoteUser(arg);
        break;

      default:
        console.log('\n📖 Admin User Setup Script\n');
        console.log('Usage:');
        console.log('  pnpm tsx scripts/setup-admin-user.ts check              - Check existing admin users');
        console.log('  pnpm tsx scripts/setup-admin-user.ts create             - Create a new admin user');
        console.log('  pnpm tsx scripts/setup-admin-user.ts promote <email>    - Promote existing user to admin');
        console.log('');
    }
  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    rl.close();
    process.exit(0);
  }
}

main();
