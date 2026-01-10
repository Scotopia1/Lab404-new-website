/**
 * Manually Verify Email
 * Verifies a customer's email without requiring a code
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env') });

import { neon } from '@neondatabase/serverless';

async function verifyEmail() {
  const email = process.argv[2];

  if (!email) {
    console.error('❌ Please provide an email address');
    console.log('   Usage: pnpm tsx scripts/verify-email-manually.ts <email>');
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found');
    process.exit(1);
  }

  console.log(`\n📧 Verifying email: ${email}\n`);

  const client = neon(databaseUrl);

  try {
    // Update customer to verify email
    const result = await client`
      UPDATE customers
      SET
        email_verified = true,
        email_verified_at = NOW(),
        updated_at = NOW()
      WHERE email = ${email.toLowerCase()}
      RETURNING id, email, email_verified, email_verified_at
    `;

    if (result.length === 0) {
      console.log('❌ Customer not found.\n');
      return;
    }

    const customer = result[0];
    console.log('✅ Email verified successfully!');
    console.log(`   Customer ID: ${customer.id}`);
    console.log(`   Email: ${customer.email}`);
    console.log(`   Verified At: ${new Date(customer.email_verified_at).toLocaleString()}`);
    console.log('');

  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
}

verifyEmail();
