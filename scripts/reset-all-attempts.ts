/**
 * Reset All Attempts
 * Resets verification code attempts AND login attempts for all users
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env') });

import { neon } from '@neondatabase/serverless';

async function resetAllAttempts() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found');
    process.exit(1);
  }

  console.log('\n🔄 Resetting All Attempts\n');
  console.log('⚠️  This will reset:');
  console.log('   1. Verification code attempts to 0');
  console.log('   2. Delete all login attempt records\n');

  const client = neon(databaseUrl);

  try {
    // ============================
    // 1. Reset Verification Code Attempts
    // ============================
    console.log('📧 VERIFICATION CODE ATTEMPTS\n');

    // Get current stats
    const verificationStats = await client`
      SELECT
        COUNT(*) as total_codes,
        COUNT(*) FILTER (WHERE attempts > 0) as codes_with_attempts,
        MAX(attempts) as max_attempts,
        AVG(attempts) as avg_attempts
      FROM verification_codes
      WHERE is_used = false
      AND expires_at > NOW()
    `;

    console.log('📊 Current Statistics (Active Codes):');
    console.log(`   Total Active Codes: ${verificationStats[0].total_codes}`);
    console.log(`   Codes with Attempts: ${verificationStats[0].codes_with_attempts}`);
    console.log(`   Max Attempts: ${verificationStats[0].max_attempts || 0}`);
    console.log(`   Average Attempts: ${parseFloat(verificationStats[0].avg_attempts || 0).toFixed(2)}`);
    console.log('');

    if (parseInt(verificationStats[0].codes_with_attempts) > 0) {
      console.log('🔄 Resetting verification code attempts...');
      const verificationResult = await client`
        UPDATE verification_codes
        SET attempts = 0
        WHERE is_used = false
        AND expires_at > NOW()
        AND attempts > 0
        RETURNING id
      `;

      console.log(`✅ Reset ${verificationResult.length} verification code(s)\n`);
    } else {
      console.log('ℹ️  No verification codes with attempts to reset\n');
    }

    // ============================
    // 2. Reset Login Attempts
    // ============================
    console.log('🔐 LOGIN ATTEMPTS\n');

    try {
      // Check if login_attempts table exists
      const tableCheck = await client`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'login_attempts'
        ) as exists
      `;

      if (!tableCheck[0].exists) {
        console.log('ℹ️  login_attempts table does not exist (not created yet)\n');
      } else {
        // Get current stats
        const loginStats = await client`
          SELECT
            COUNT(DISTINCT customer_id) as unique_customers,
            COUNT(*) as total_attempts,
            MAX(attempted_at) as most_recent
          FROM login_attempts
        `;

        console.log('📊 Current Statistics:');
        console.log(`   Unique Customers: ${loginStats[0].unique_customers}`);
        console.log(`   Total Attempt Records: ${loginStats[0].total_attempts}`);
        if (loginStats[0].most_recent) {
          console.log(`   Most Recent: ${new Date(loginStats[0].most_recent).toLocaleString()}`);
        }
        console.log('');

        if (parseInt(loginStats[0].total_attempts) > 0) {
          console.log('🗑️  Deleting all login attempt records...');
          const loginResult = await client`
            DELETE FROM login_attempts
            RETURNING id
          `;

          console.log(`✅ Deleted ${loginResult.length} login attempt record(s)\n`);
        } else {
          console.log('ℹ️  No login attempts to reset\n');
        }
      }
    } catch (error) {
      console.warn('⚠️  Could not reset login attempts:', error);
      console.log('   This is non-critical - continuing...\n');
    }

    // ============================
    // Summary
    // ============================
    console.log('✅ Reset Complete!\n');
    console.log('📋 Summary:');
    console.log('   ✅ All active verification codes now have 0 attempts');
    console.log('   ✅ All login attempt records cleared');
    console.log('   ✅ Users can now retry verification and login\n');

  } catch (error) {
    console.error('❌ Reset failed:', error);
    process.exit(1);
  }
}

resetAllAttempts();
