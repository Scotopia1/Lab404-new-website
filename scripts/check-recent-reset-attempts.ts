/**
 * Check Recent Password Reset Attempts
 * Shows audit logs for password reset attempts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env') });

import { neon } from '@neondatabase/serverless';

async function checkResetAttempts() {
  const email = 'johnnyjneid@gmail.com';
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found');
    process.exit(1);
  }

  console.log(`\n🔍 Recent password reset attempts for: ${email}\n`);

  const client = neon(databaseUrl);

  try {
    // Check audit logs for password reset events
    const logs = await client`
      SELECT
        event_type,
        action,
        status,
        timestamp,
        metadata
      FROM security_audit_logs
      WHERE actor_email = ${email.toLowerCase()}
      AND event_type IN ('PASSWORD_RESET_REQUESTED', 'PASSWORD_RESET_COMPLETED')
      ORDER BY timestamp DESC
      LIMIT 10
    `;

    if (logs.length === 0) {
      console.log('📭 No password reset attempts found.\n');
      return;
    }

    console.log(`📊 Found ${logs.length} password reset event(s):\n`);

    logs.forEach((log, index) => {
      console.log(`${index + 1}. ${log.event_type}`);
      console.log(`   Status: ${log.status === 'success' ? '✅' : '❌'} ${log.status}`);
      console.log(`   Time: ${new Date(log.timestamp).toLocaleString()}`);
      if (log.metadata) {
        console.log(`   Details: ${JSON.stringify(log.metadata, null, 2)}`);
      }
      console.log('');
    });

  } catch (error) {
    console.error('❌ Check failed:', error);
    process.exit(1);
  }
}

checkResetAttempts();
