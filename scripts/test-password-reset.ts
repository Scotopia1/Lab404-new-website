/**
 * Test Password Reset Flow
 * Simulates the password reset to identify what's failing
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env') });

import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

async function testPasswordReset() {
  const email = 'johnnyjneid@gmail.com';
  const testPassword = 'TestPassword123!';  // Strong test password

  console.log(`\n🧪 Testing Password Reset Flow\n`);
  console.log(`Email: ${email}`);
  console.log(`Test Password: ${testPassword}\n`);

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found');
    process.exit(1);
  }

  const client = neon(databaseUrl);

  try {
    // Step 1: Get customer
    console.log('📋 Step 1: Looking up customer...');
    const customers = await client`
      SELECT * FROM customers WHERE email = ${email.toLowerCase()} LIMIT 1
    `;

    if (customers.length === 0) {
      console.log('❌ Customer not found');
      return;
    }

    const customer = customers[0];
    console.log(`✅ Customer found: ${customer.id}`);
    console.log(`   Active: ${customer.is_active}`);
    console.log(`   Guest: ${customer.is_guest}`);
    console.log(`   Email Verified: ${customer.email_verified}\n`);

    // Step 2: Check if account is valid
    console.log('📋 Step 2: Checking account status...');
    if (!customer.is_active) {
      console.log('❌ Account is inactive');
      return;
    }
    if (customer.is_guest) {
      console.log('❌ Account is guest');
      return;
    }
    console.log('✅ Account is valid\n');

    // Step 3: Test password validation (basic)
    console.log('📋 Step 3: Testing password validation...');
    if (testPassword.length < 8) {
      console.log('❌ Password too short');
      return;
    }
    if (!/[A-Z]/.test(testPassword)) {
      console.log('❌ Password missing uppercase');
      return;
    }
    if (!/[a-z]/.test(testPassword)) {
      console.log('❌ Password missing lowercase');
      return;
    }
    if (!/[0-9]/.test(testPassword)) {
      console.log('❌ Password missing number');
      return;
    }
    console.log('✅ Password meets basic requirements\n');

    // Step 4: Hash password
    console.log('📋 Step 4: Hashing password...');
    const passwordHash = await bcrypt.hash(testPassword, 12);
    console.log(`✅ Password hashed: ${passwordHash.substring(0, 20)}...\n`);

    // Step 5: Simulate password update
    console.log('📋 Step 5: Simulating password update...');
    console.log('   (Not actually updating - this is a test)\n');

    console.log('🎉 All steps passed! Password reset should work.\n');
    console.log('📝 Summary:');
    console.log('   ✅ Customer exists and is valid');
    console.log('   ✅ Password meets requirements');
    console.log('   ✅ Password can be hashed');
    console.log('   ✅ No obvious blockers found\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('\nThis is likely the error causing your password reset to fail!\n');
    process.exit(1);
  }
}

testPasswordReset();
