/**
 * Check Login Attempts Table Schema
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env') });

import { neon } from '@neondatabase/serverless';

async function checkSchema() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found');
    process.exit(1);
  }

  console.log('\n🔍 Checking login_attempts table schema...\n');

  const client = neon(databaseUrl);

  try {
    // Check if table exists
    const tableCheck = await client`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'login_attempts'
      ) as exists
    `;

    if (!tableCheck[0].exists) {
      console.log('ℹ️  login_attempts table does not exist\n');
      return;
    }

    // Get columns
    const columns = await client`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'login_attempts'
      ORDER BY ordinal_position
    `;

    console.log('📋 Columns:');
    columns.forEach((col) => {
      console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
    });
    console.log('');

    // Get sample data
    const sample = await client`
      SELECT * FROM login_attempts LIMIT 5
    `;

    if (sample.length > 0) {
      console.log(`📊 Sample Data (${sample.length} records):`);
      sample.forEach((row, index) => {
        console.log(`   ${index + 1}. ${JSON.stringify(row, null, 2)}`);
      });
      console.log('');
    } else {
      console.log('📊 Table is empty\n');
    }

  } catch (error) {
    console.error('❌ Check failed:', error);
    process.exit(1);
  }
}

checkSchema();
