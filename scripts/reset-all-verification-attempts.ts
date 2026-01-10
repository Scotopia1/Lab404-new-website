/**
 * Reset All Verification Code Attempts
 * Resets the attempts counter to 0 for all verification codes
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

  console.log('\n🔄 Resetting All Verification Code Attempts\n');
  console.log('⚠️  This will reset the attempts counter to 0 for ALL verification codes.\n');

  const client = neon(databaseUrl);

  try {
    // Get current stats before reset
    const statsBefore = await client`
      SELECT
        COUNT(*) as total_codes,
        COUNT(*) FILTER (WHERE attempts > 0) as codes_with_attempts,
        MAX(attempts) as max_attempts,
        AVG(attempts) as avg_attempts
      FROM verification_codes
      WHERE is_used = false
      AND expires_at > NOW()
    `;

    console.log('📊 Current Statistics (Active Codes Only):');
    console.log(`   Total Active Codes: ${statsBefore[0].total_codes}`);
    console.log(`   Codes with Attempts: ${statsBefore[0].codes_with_attempts}`);
    console.log(`   Max Attempts: ${statsBefore[0].max_attempts || 0}`);
    console.log(`   Average Attempts: ${parseFloat(statsBefore[0].avg_attempts || 0).toFixed(2)}`);
    console.log('');

    if (parseInt(statsBefore[0].total_codes) === 0) {
      console.log('ℹ️  No active verification codes found. Nothing to reset.\n');
      return;
    }

    // Reset all attempts to 0
    console.log('🔄 Resetting attempts to 0...');
    const result = await client`
      UPDATE verification_codes
      SET attempts = 0
      WHERE is_used = false
      AND expires_at > NOW()
      AND attempts > 0
      RETURNING id, email, type, attempts
    `;

    console.log(`✅ Reset complete! Updated ${result.length} verification code(s).\n`);

    if (result.length > 0) {
      console.log('📋 Reset Details:');

      // Group by email and type
      const grouped = result.reduce((acc: any, row: any) => {
        const key = `${row.email} (${row.type})`;
        if (!acc[key]) {
          acc[key] = 0;
        }
        acc[key]++;
        return acc;
      }, {});

      Object.entries(grouped).forEach(([key, count]) => {
        console.log(`   ${key}: ${count} code(s) reset`);
      });
      console.log('');
    }

    // Get stats after reset
    const statsAfter = await client`
      SELECT
        COUNT(*) FILTER (WHERE attempts > 0) as codes_with_attempts
      FROM verification_codes
      WHERE is_used = false
      AND expires_at > NOW()
    `;

    console.log('✅ All active verification codes now have 0 attempts.');
    console.log(`   Remaining codes with attempts: ${statsAfter[0].codes_with_attempts}\n`);

  } catch (error) {
    console.error('❌ Reset failed:', error);
    process.exit(1);
  }
}

resetAllAttempts();
