/**
 * Check All Audit Logs
 * Shows all audit log entries for an email
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env') });

import { neon } from '@neondatabase/serverless';

async function checkAuditLogs() {
  const email = 'johnnyjneid@gmail.com';
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found');
    process.exit(1);
  }

  console.log(`\n🔍 All audit logs for: ${email}\n`);

  const client = neon(databaseUrl);

  try {
    // Check all audit logs
    const logs = await client`
      SELECT
        event_type,
        action,
        status,
        timestamp,
        metadata
      FROM security_audit_logs
      WHERE actor_email = ${email.toLowerCase()}
      ORDER BY timestamp DESC
      LIMIT 20
    `;

    if (logs.length === 0) {
      console.log('📭 No audit logs found.\n');
      return;
    }

    console.log(`📊 Found ${logs.length} audit log(s):\n`);

    logs.forEach((log, index) => {
      console.log(`${index + 1}. ${log.event_type}`);
      console.log(`   Action: ${log.action}`);
      console.log(`   Status: ${log.status === 'success' ? '✅' : '❌'} ${log.status}`);
      console.log(`   Time: ${new Date(log.timestamp).toLocaleString()}`);
      if (log.metadata) {
        console.log(`   Metadata: ${JSON.stringify(log.metadata, null, 2)}`);
      }
      console.log('');
    });

  } catch (error) {
    console.error('❌ Check failed:', error);
    process.exit(1);
  }
}

checkAuditLogs();
