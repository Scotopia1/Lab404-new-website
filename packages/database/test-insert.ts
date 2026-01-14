import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../../.env') });

import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import pkg from 'pg';
const { Pool } = pkg;

import { newsletterCampaigns } from './src/schema/newsletter';

async function main() {
  const pool = new Pool({
    connectionString: process.env['DATABASE_URL'],
  });

  const db = drizzle(pool);

  try {
    const [campaign] = await db
      .insert(newsletterCampaigns)
      .values({
        name: 'Test Campaign',
        subject: 'Test Subject',
        previewText: null,
        content: '<p>Test content</p>',
        dailyLimit: 100,
        sendTime: null,
        scheduledAt: null,
        totalRecipients: 0,
        status: 'draft',
        createdBy: null,
      })
      .returning();

    console.log('SUCCESS! Campaign created:', campaign);
  } catch (error) {
    console.error('ERROR:', error);
  }

  await pool.end();
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
