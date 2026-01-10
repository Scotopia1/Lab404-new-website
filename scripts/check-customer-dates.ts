/**
 * Check Customer Date Fields
 * Verifies all date fields for a customer
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env') });

import { neon } from '@neondatabase/serverless';

async function checkCustomerDates() {
  const email = 'johnnyjneid@gmail.com';
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found');
    process.exit(1);
  }

  console.log(`\n🔍 Checking date fields for: ${email}\n`);

  const client = neon(databaseUrl);

  try {
    const [customer] = await client`
      SELECT
        id,
        email,
        created_at,
        updated_at,
        email_verified_at
      FROM customers
      WHERE email = ${email.toLowerCase()}
      LIMIT 1
    `;

    if (!customer) {
      console.log('❌ Customer not found.\n');
      return;
    }

    console.log('📋 Customer Date Fields:\n');
    console.log(`   ID: ${customer.id}`);
    console.log(`   Email: ${customer.email}`);
    console.log('');

    console.log('   Date Fields:');
    console.log(`   - created_at: ${customer.created_at ? new Date(customer.created_at).toLocaleString() : '❌ NULL'}`);
    console.log(`   - updated_at: ${customer.updated_at ? new Date(customer.updated_at).toLocaleString() : '❌ NULL'}`);
    console.log(`   - email_verified_at: ${customer.email_verified_at ? new Date(customer.email_verified_at).toLocaleString() : '❌ NULL'}`);
    console.log('');

    // Check for null dates
    const nullDates = [];
    if (!customer.created_at) nullDates.push('created_at');
    if (!customer.updated_at) nullDates.push('updated_at');

    if (nullDates.length > 0) {
      console.log(`⚠️  Missing required dates: ${nullDates.join(', ')}\n`);
      console.log('   These should be fixed by setting them to NOW()\n');
    } else {
      console.log('✅ All required date fields are present\n');
    }

  } catch (error) {
    console.error('❌ Check failed:', error);
    process.exit(1);
  }
}

checkCustomerDates();
