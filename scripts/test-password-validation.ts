/**
 * Test Password Validation
 * Tests a password through the full security validation
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env') });

import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import zxcvbn from 'zxcvbn';
import fetch from 'node-fetch';
import crypto from 'crypto';

const MIN_STRENGTH_SCORE = 2;

async function checkHIBP(password: string): Promise<{ isBreached: boolean; breachCount: number }> {
  const sha1 = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
  const prefix = sha1.substring(0, 5);
  const suffix = sha1.substring(5);

  try {
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { 'User-Agent': 'Lab404-Electronics' }
    });

    if (!response.ok) {
      console.warn('   ⚠️ HIBP API unavailable, skipping breach check');
      return { isBreached: false, breachCount: 0 };
    }

    const text = await response.text();
    const hashes = text.split('\n');

    for (const line of hashes) {
      const [hashSuffix, count] = line.split(':');
      if (hashSuffix === suffix) {
        return { isBreached: true, breachCount: parseInt(count, 10) };
      }
    }

    return { isBreached: false, breachCount: 0 };
  } catch (error) {
    console.warn('   ⚠️ HIBP check failed, skipping breach check');
    return { isBreached: false, breachCount: 0 };
  }
}

async function checkPasswordHistory(client: any, customerId: string, password: string): Promise<boolean> {
  try {
    const history = await client`
      SELECT password_hash
      FROM password_history
      WHERE customer_id = ${customerId}
      ORDER BY changed_at DESC
      LIMIT 10
    `;

    for (const entry of history) {
      const matches = await bcrypt.compare(password, entry.password_hash);
      if (matches) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.warn('   ⚠️ Password history check failed (table may not exist), skipping');
    return false;
  }
}

async function testPasswordValidation() {
  const email = 'johnnyjneid@gmail.com';
  const testPassword = 'Admin123!@#';

  console.log(`\n🔐 Testing Password Validation\n`);
  console.log(`Email: ${email}`);
  console.log(`Password: ${testPassword}\n`);

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found');
    process.exit(1);
  }

  const client = neon(databaseUrl);

  try {
    // Get customer
    const [customer] = await client`
      SELECT id, email, first_name, last_name
      FROM customers
      WHERE email = ${email.toLowerCase()}
      LIMIT 1
    `;

    if (!customer) {
      console.log('❌ Customer not found\n');
      return;
    }

    console.log(`✅ Customer found: ${customer.id}\n`);

    // Build user inputs for validation
    const userInputs = [
      customer.email,
      customer.first_name,
      customer.last_name
    ].filter(Boolean) as string[];

    console.log('🔍 Running security validation...\n');

    // Validate password
    const errors: string[] = [];

    // 1. Basic length check
    console.log('1️⃣ Checking length...');
    if (testPassword.length < 8) {
      errors.push('Password must be at least 8 characters long');
      console.log('   ❌ Too short');
    } else if (testPassword.length > 100) {
      errors.push('Password must not exceed 100 characters');
      console.log('   ❌ Too long');
    } else {
      console.log('   ✅ Length OK');
    }

    // 2. Calculate strength
    console.log('2️⃣ Calculating strength...');
    const strength = zxcvbn(testPassword, userInputs);
    console.log(`   Score: ${strength.score}/4`);
    console.log(`   Crack Time: ${strength.crack_times_display.offline_slow_hashing_1e4_per_second}`);

    if (strength.score < MIN_STRENGTH_SCORE) {
      errors.push(
        `Password is too weak (score: ${strength.score}/4). ${strength.feedback.warning || 'Try a stronger password.'}`
      );
      if (strength.feedback.suggestions.length > 0) {
        errors.push(...strength.feedback.suggestions);
      }
      console.log(`   ❌ Weak (minimum: ${MIN_STRENGTH_SCORE})`);
    } else {
      console.log('   ✅ Strong enough');
    }

    // 3. Check breach status
    console.log('3️⃣ Checking breach database...');
    const breachResult = await checkHIBP(testPassword);
    if (breachResult.isBreached) {
      errors.push(
        `This password has been found in ${breachResult.breachCount} data breach${breachResult.breachCount > 1 ? 'es' : ''}. Please choose a different password.`
      );
      console.log(`   ❌ Breached (${breachResult.breachCount} times)`);
    } else {
      console.log('   ✅ Not breached');
    }

    // 4. Check password history
    console.log('4️⃣ Checking password history...');
    const isReused = await checkPasswordHistory(client, customer.id, testPassword);
    if (isReused) {
      errors.push('This password has been used before. Please choose a new password.');
      console.log('   ❌ Previously used');
    } else {
      console.log('   ✅ Not reused');
    }

    const validation = {
      isValid: errors.length === 0,
      errors,
      strengthResult: {
        score: strength.score,
        isBreached: breachResult.isBreached,
        breachCount: breachResult.breachCount,
        isReused,
        feedback: strength.feedback
      }
    };

    console.log('\n📊 VALIDATION RESULT:\n');

    if (validation.isValid) {
      console.log('✅ Password passed all security checks!\n');
      console.log('Summary:');
      console.log(`   Length: ✅`);
      console.log(`   Strength: ✅ ${validation.strengthResult.score}/4`);
      console.log(`   Breached: ✅ No`);
      console.log(`   Reused: ✅ No`);
      console.log('\nPassword would be accepted by the API.\n');
    } else {
      console.log('❌ Password validation FAILED\n');
      console.log('🚫 Errors that would be returned to user:');
      validation.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
      console.log('\n⚠️  This is why the password reset is failing!\n');
      console.log('The API returns these errors as BadRequestError (400 status).\n');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testPasswordValidation();
