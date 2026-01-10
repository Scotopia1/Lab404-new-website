/**
 * Check Customers Table Schema
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

  console.log('\n🔍 Checking customers table schema...\n');

  const client = neon(databaseUrl);

  try {
    const columns = await client`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'customers'
      ORDER BY ordinal_position
    `;

    console.log('📋 Columns:');
    columns.forEach((col) => {
      console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
    });
    console.log('');

  } catch (error) {
    console.error('❌ Check failed:', error);
    process.exit(1);
  }
}

checkSchema();
