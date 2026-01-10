/**
 * Manually Reset Password
 * Resets a customer's password without requiring a code
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env') });

import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

async function resetPassword() {
  const email = process.argv[2];
  const newPassword = process.argv[3];

  if (!email || !newPassword) {
    console.error('❌ Please provide email and new password');
    console.log('   Usage: pnpm tsx scripts/reset-password-manually.ts <email> <password>');
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found');
    process.exit(1);
  }

  console.log(`\n🔐 Resetting password for: ${email}\n`);

  const client = neon(databaseUrl);

  try {
    // Get customer
    const customers = await client`
      SELECT id, email, is_active, is_guest, email_verified
      FROM customers
      WHERE email = ${email.toLowerCase()}
      LIMIT 1
    `;

    if (customers.length === 0) {
      console.log('❌ Customer not found.\n');
      return;
    }

    const customer = customers[0];

    // Validate account
    if (!customer.is_active) {
      console.log('❌ Account is inactive.\n');
      return;
    }

    if (customer.is_guest) {
      console.log('❌ Cannot reset password for guest account.\n');
      return;
    }

    if (!customer.email_verified) {
      console.log('❌ Email not verified.\n');
      return;
    }

    // Validate password
    if (newPassword.length < 8) {
      console.log('❌ Password must be at least 8 characters.\n');
      return;
    }

    if (!/[A-Z]/.test(newPassword)) {
      console.log('❌ Password must contain at least one uppercase letter.\n');
      return;
    }

    if (!/[a-z]/.test(newPassword)) {
      console.log('❌ Password must contain at least one lowercase letter.\n');
      return;
    }

    if (!/[0-9]/.test(newPassword)) {
      console.log('❌ Password must contain at least one number.\n');
      return;
    }

    // Hash password
    console.log('🔒 Hashing password...');
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update password
    console.log('💾 Updating password in database...');
    const result = await client`
      UPDATE customers
      SET
        password_hash = ${passwordHash},
        updated_at = NOW()
      WHERE id = ${customer.id}
      RETURNING id, email, updated_at
    `;

    if (result.length === 0) {
      console.log('❌ Password update failed.\n');
      return;
    }

    console.log('✅ Password reset successfully!');
    console.log(`   Customer ID: ${result[0].id}`);
    console.log(`   Email: ${result[0].email}`);
    console.log(`   Updated At: ${new Date(result[0].updated_at).toLocaleString()}`);
    console.log('');

  } catch (error) {
    console.error('❌ Password reset failed:', error);
    process.exit(1);
  }
}

resetPassword();
