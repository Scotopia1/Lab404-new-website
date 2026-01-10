/**
 * Apply Role Column Migration
 *
 * Safely adds the role column to customers table without losing data
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables FIRST before any other imports
config({ path: resolve(__dirname, '../.env') });

import { neon } from '@neondatabase/serverless';

async function applyMigration() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in environment variables');
    process.exit(1);
  }

  console.log('\n🔄 Applying role column migration...\n');

  const client = neon(databaseUrl);

  try {
    // Check if role column already exists
    console.log('📋 Checking if role column exists...');
    const columnCheck = await client`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'customers'
      AND column_name = 'role'
    `;

    if (columnCheck.length > 0) {
      console.log('✅ Role column already exists. Skipping migration.\n');
      return;
    }

    console.log('➕ Adding role column...');

    // Add role column with default value 'customer'
    await client`
      ALTER TABLE customers
      ADD COLUMN role VARCHAR(20) DEFAULT 'customer' NOT NULL
    `;
    console.log('   ✓ Role column added');

    // Add check constraint to ensure only valid roles
    console.log('🔒 Adding role constraint...');
    await client`
      ALTER TABLE customers
      ADD CONSTRAINT customers_role_check CHECK (role IN ('customer', 'admin'))
    `;
    console.log('   ✓ Role constraint added');

    // Create index for faster role-based queries
    console.log('📊 Creating role index...');
    await client`
      CREATE INDEX idx_customers_role ON customers(role)
    `;
    console.log('   ✓ Index created');

    // Count existing customers to verify no data loss
    console.log('\n📈 Verifying data integrity...');
    const customerCount = await client`
      SELECT COUNT(*) as count FROM customers
    `;
    console.log(`   ✓ Total customers: ${customerCount[0].count}`);

    const roleDistribution = await client`
      SELECT role, COUNT(*) as count
      FROM customers
      GROUP BY role
    `;
    console.log('   ✓ Role distribution:');
    roleDistribution.forEach(row => {
      console.log(`     - ${row.role}: ${row.count}`);
    });

    console.log('\n✅ Migration completed successfully!\n');
    console.log('📝 All existing customers have been assigned role="customer"');
    console.log('🔐 You can now create admin users\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

applyMigration();
