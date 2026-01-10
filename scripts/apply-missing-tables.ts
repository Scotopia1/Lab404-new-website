/**
 * Apply Missing Security Tables Migration
 *
 * Safely creates only the missing tables:
 * - password_history
 * - login_attempts
 * - breach_checks
 *
 * Does NOT modify any existing data or tables.
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables FIRST
config({ path: resolve(__dirname, '../.env') });

import { neon } from '@neondatabase/serverless';

async function applyMigration() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in environment variables');
    process.exit(1);
  }

  console.log('\n🔄 Applying Missing Tables Migration...\n');
  console.log('⚠️  This will ONLY CREATE new tables, no existing data will be modified.\n');

  const client = neon(databaseUrl);

  try {
    // Check which tables are missing
    console.log('📋 Checking existing tables...');
    const existingTables = await client`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('password_history', 'login_attempts', 'breach_checks')
    `;

    const existingTableNames = existingTables.map(t => t.table_name);
    console.log(`   Found: ${existingTableNames.join(', ') || 'none'}\n`);

    const tablesToCreate = ['password_history', 'login_attempts', 'breach_checks']
      .filter(name => !existingTableNames.includes(name));

    if (tablesToCreate.length === 0) {
      console.log('✅ All tables already exist. No migration needed.\n');
      return;
    }

    console.log(`📝 Will create: ${tablesToCreate.join(', ')}\n`);

    // Create password_history table
    if (tablesToCreate.includes('password_history')) {
      console.log('➕ Creating password_history table...');
      await client`
        CREATE TABLE IF NOT EXISTS "password_history" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "customer_id" uuid NOT NULL,
          "password_hash" varchar(255) NOT NULL,
          "changed_at" timestamp DEFAULT now() NOT NULL,
          "ip_address" varchar(45),
          "user_agent" varchar(500),
          "change_reason" varchar(50)
        )
      `;
      console.log('   ✓ Table created');
    }

    // Create login_attempts table
    if (tablesToCreate.includes('login_attempts')) {
      console.log('➕ Creating login_attempts table...');
      await client`
        CREATE TABLE IF NOT EXISTS "login_attempts" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "customer_id" uuid,
          "email" varchar(255) NOT NULL,
          "success" boolean NOT NULL,
          "failure_reason" varchar(100),
          "ip_address" varchar(45) NOT NULL,
          "user_agent" varchar(500),
          "device_type" varchar(50),
          "device_browser" varchar(50),
          "ip_country" varchar(100),
          "ip_city" varchar(100),
          "triggered_lockout" boolean DEFAULT false NOT NULL,
          "consecutive_failures" integer DEFAULT 0 NOT NULL,
          "attempted_at" timestamp DEFAULT now() NOT NULL
        )
      `;
      console.log('   ✓ Table created');
    }

    // Create breach_checks table
    if (tablesToCreate.includes('breach_checks')) {
      console.log('➕ Creating breach_checks table...');
      await client`
        CREATE TABLE IF NOT EXISTS "breach_checks" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "customer_id" uuid,
          "password_hash_prefix" varchar(5) NOT NULL,
          "is_breached" boolean NOT NULL,
          "breach_count" integer DEFAULT 0 NOT NULL,
          "checked_at" timestamp DEFAULT now() NOT NULL,
          "expires_at" timestamp NOT NULL,
          "check_reason" varchar(50),
          "ip_address" varchar(45)
        )
      `;
      console.log('   ✓ Table created');
    }

    // Add foreign key constraints (with safe error handling)
    console.log('\n🔗 Adding foreign key constraints...');

    if (tablesToCreate.includes('password_history')) {
      await client`
        DO $$ BEGIN
          ALTER TABLE "password_history" ADD CONSTRAINT "password_history_customer_id_customers_id_fk"
          FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `;
      console.log('   ✓ password_history → customers');
    }

    if (tablesToCreate.includes('login_attempts')) {
      await client`
        DO $$ BEGIN
          ALTER TABLE "login_attempts" ADD CONSTRAINT "login_attempts_customer_id_customers_id_fk"
          FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `;
      console.log('   ✓ login_attempts → customers');
    }

    if (tablesToCreate.includes('breach_checks')) {
      await client`
        DO $$ BEGIN
          ALTER TABLE "breach_checks" ADD CONSTRAINT "breach_checks_customer_id_customers_id_fk"
          FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `;
      console.log('   ✓ breach_checks → customers');
    }

    // Create indexes for better performance
    console.log('\n📊 Creating indexes...');

    if (tablesToCreate.includes('password_history')) {
      await client`CREATE INDEX IF NOT EXISTS "password_history_customer_idx" ON "password_history" USING btree ("customer_id")`;
      await client`CREATE INDEX IF NOT EXISTS "password_history_changed_at_idx" ON "password_history" USING btree ("changed_at")`;
      console.log('   ✓ password_history indexes');
    }

    if (tablesToCreate.includes('login_attempts')) {
      await client`CREATE INDEX IF NOT EXISTS "login_attempts_customer_idx" ON "login_attempts" USING btree ("customer_id")`;
      await client`CREATE INDEX IF NOT EXISTS "login_attempts_email_idx" ON "login_attempts" USING btree ("email")`;
      await client`CREATE INDEX IF NOT EXISTS "login_attempts_attempted_at_idx" ON "login_attempts" USING btree ("attempted_at")`;
      await client`CREATE INDEX IF NOT EXISTS "login_attempts_success_idx" ON "login_attempts" USING btree ("success")`;
      console.log('   ✓ login_attempts indexes');
    }

    if (tablesToCreate.includes('breach_checks')) {
      await client`CREATE INDEX IF NOT EXISTS "breach_checks_customer_idx" ON "breach_checks" USING btree ("customer_id")`;
      await client`CREATE INDEX IF NOT EXISTS "breach_checks_prefix_idx" ON "breach_checks" USING btree ("password_hash_prefix")`;
      await client`CREATE INDEX IF NOT EXISTS "breach_checks_expires_at_idx" ON "breach_checks" USING btree ("expires_at")`;
      console.log('   ✓ breach_checks indexes');
    }

    // Verify all tables exist now
    console.log('\n✅ Verifying tables...');
    const finalTables = await client`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('password_history', 'login_attempts', 'breach_checks')
    `;

    const finalTableNames = finalTables.map(t => t.table_name);
    console.log(`   ✓ Tables now exist: ${finalTableNames.join(', ')}\n`);

    if (finalTableNames.length === 3) {
      console.log('🎉 Migration completed successfully!\n');
      console.log('📝 Summary:');
      console.log('   ✅ Password history tracking enabled');
      console.log('   ✅ Login attempt monitoring enabled');
      console.log('   ✅ Breach check caching enabled\n');
      console.log('⚠️  No existing data was modified or deleted.\n');
    } else {
      console.log('⚠️  Some tables may not have been created. Please check the logs.\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error('\n⚠️  No data was lost. Existing tables remain unchanged.\n');
    process.exit(1);
  }
}

applyMigration();
