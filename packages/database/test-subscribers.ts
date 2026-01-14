import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../../.env') });

import { drizzle } from 'drizzle-orm/node-postgres';
import { sql, eq } from 'drizzle-orm';
import pkg from 'pg';
const { Pool } = pkg;

import { newsletterSubscribers } from './src/schema/newsletter';

async function main() {
  const pool = new Pool({
    connectionString: process.env['DATABASE_URL'],
  });

  const db = drizzle(pool);

  try {
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.status, 'active'));

    console.log('Count result:', countResult);
    const subscriberCount = Number(countResult[0]?.count ?? 0);
    console.log('Subscriber count:', subscriberCount);
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
