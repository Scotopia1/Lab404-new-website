/**
 * Check Customer Password Status
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env') });

import { neon } from '@neondatabase/serverless';

async function checkPasswordStatus() {
  const email = 'johnnyjneid@gmail.com';
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found');
    process.exit(1);
  }

  console.log(`\n🔍 Checking password status for: ${email}\n`);

  const client = neon(databaseUrl);

  try {
    // Get customer info
    const [customer] = await client`
      SELECT
        id,
        email,
        password_hash,
        updated_at,
        is_active,
        email_verified
      FROM customers
      WHERE email = ${email.toLowerCase()}
      LIMIT 1
    `;

    if (!customer) {
      console.log('❌ Customer not found.\n');
      return;
    }

    console.log('👤 Customer Info:');
    console.log(`   ID: ${customer.id}`);
    console.log(`   Email: ${customer.email}`);
    console.log(`   Password Hash: ${customer.password_hash ? customer.password_hash.substring(0, 20) + '...' : 'NOT SET'}`);
    console.log(`   Last Updated: ${new Date(customer.updated_at).toLocaleString()}`);
    console.log(`   Active: ${customer.is_active ? '✅ Yes' : '❌ No'}`);
    console.log(`   Email Verified: ${customer.email_verified ? '✅ Yes' : '❌ No'}`);
    console.log('');

    // Check password history
    const history = await client`
      SELECT
        changed_at,
        change_reason,
        ip_address
      FROM password_history
      WHERE customer_id = ${customer.id}
      ORDER BY changed_at DESC
      LIMIT 5
    `;

    if (history.length > 0) {
      console.log('📜 Password Change History:');
      history.forEach((entry, index) => {
        console.log(`   ${index + 1}. ${new Date(entry.changed_at).toLocaleString()}`);
        console.log(`      Reason: ${entry.change_reason || 'N/A'}`);
        console.log(`      IP: ${entry.ip_address || 'N/A'}`);
      });
      console.log('');
    } else {
      console.log('📜 No password change history found.\n');
    }

  } catch (error) {
    console.error('❌ Check failed:', error);
    process.exit(1);
  }
}

checkPasswordStatus();
