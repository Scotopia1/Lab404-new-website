/**
 * Check Audit Table Schema
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

  console.log('\n🔍 Checking security_audit_logs schema...\n');

  const client = neon(databaseUrl);

  try {
    const columns = await client`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'security_audit_logs'
      ORDER BY ordinal_position
    `;

    console.log('📋 Columns:');
    columns.forEach((col) => {
      console.log(`   - ${col.column_name}: ${col.data_type}`);
    });
    console.log('');

  } catch (error) {
    console.error('❌ Check failed:', error);
    process.exit(1);
  }
}

checkSchema();
