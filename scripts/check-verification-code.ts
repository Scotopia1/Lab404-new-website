/**
 * Check Verification Code Status
 *
 * Shows the current status of verification codes for a given email
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables FIRST
config({ path: resolve(__dirname, '../.env') });

import { neon } from '@neondatabase/serverless';

async function checkCode() {
  const email = process.argv[2];

  if (!email) {
    console.error('❌ Please provide an email address');
    console.log('   Usage: pnpm tsx scripts/check-verification-code.ts <email>');
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in environment variables');
    process.exit(1);
  }

  console.log(`\n🔍 Checking verification codes for: ${email}\n`);

  const client = neon(databaseUrl);

  try {
    // Get all verification codes for this email
    const codes = await client`
      SELECT
        id,
        code,
        type,
        attempts,
        max_attempts,
        is_used,
        expires_at,
        created_at,
        used_at
      FROM verification_codes
      WHERE email = ${email.toLowerCase()}
      ORDER BY created_at DESC
      LIMIT 10
    `;

    if (codes.length === 0) {
      console.log('📭 No verification codes found for this email.\n');
      return;
    }

    console.log(`📊 Found ${codes.length} verification code(s):\n`);

    codes.forEach((code, index) => {
      const now = new Date();
      const expiresAt = new Date(code.expires_at);
      const isExpired = now > expiresAt;
      const timeLeft = Math.floor((expiresAt.getTime() - now.getTime()) / 1000 / 60);

      console.log(`${index + 1}. Code: ${code.code} (${code.type})`);
      console.log(`   Status: ${code.is_used ? '❌ USED' : isExpired ? '⏰ EXPIRED' : '✅ ACTIVE'}`);
      console.log(`   Attempts: ${code.attempts}/${code.max_attempts}`);
      console.log(`   Created: ${new Date(code.created_at).toLocaleString()}`);
      console.log(`   Expires: ${expiresAt.toLocaleString()}${!code.is_used && !isExpired ? ` (${timeLeft} min left)` : ''}`);
      if (code.used_at) {
        console.log(`   Used at: ${new Date(code.used_at).toLocaleString()}`);
      }
      console.log('');
    });

    // Show active code if exists
    const activeCode = codes.find(c => {
      const now = new Date();
      const expiresAt = new Date(c.expires_at);
      return !c.is_used && now <= expiresAt;
    });

    if (activeCode) {
      console.log('🎯 Active Code Details:');
      console.log(`   Code: ${activeCode.code}`);
      console.log(`   Type: ${activeCode.type}`);
      console.log(`   Attempts remaining: ${activeCode.max_attempts - activeCode.attempts}`);

      if (activeCode.attempts >= activeCode.max_attempts) {
        console.log(`   ⚠️  MAX ATTEMPTS REACHED! Request a new code.`);
      }
      console.log('');
    } else {
      console.log('⚠️  No active codes. Request a new code.\n');
    }

  } catch (error) {
    console.error('\n❌ Check failed:', error);
    process.exit(1);
  }
}

checkCode();
