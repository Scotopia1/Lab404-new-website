/**
 * Check Database Tables
 *
 * Lists all tables and their columns in the database
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables FIRST
config({ path: resolve(__dirname, '../.env') });

import { neon } from '@neondatabase/serverless';

async function checkTables() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in environment variables');
    process.exit(1);
  }

  console.log('\n🔍 Checking Database Tables...\n');

  const client = neon(databaseUrl);

  try {
    // Get all tables in the database
    const tables = await client`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    console.log(`📊 Found ${tables.length} tables:\n`);

    for (const table of tables) {
      console.log(`\n📋 Table: ${table.table_name}`);

      // Get columns for this table
      const columns = await client`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = ${table.table_name}
        ORDER BY ordinal_position
      `;

      columns.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? '(nullable)' : '(required)';
        const defaultVal = col.column_default ? `default: ${col.column_default}` : '';
        console.log(`   - ${col.column_name}: ${col.data_type} ${nullable} ${defaultVal}`);
      });
    }

    console.log('\n✅ Database check complete!\n');

  } catch (error) {
    console.error('\n❌ Database check failed:', error);
    process.exit(1);
  }
}

checkTables();
