import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env from project root
dotenv.config({ path: resolve(__dirname, '../../.env') });

import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import pkg from 'pg';
const { Pool } = pkg;

async function main() {
  console.log('DATABASE_URL:', process.env['DATABASE_URL'] ? 'SET' : 'NOT SET');

  const pool = new Pool({
    connectionString: process.env['DATABASE_URL'],
  });

  const db = drizzle(pool);

  const result = await db.execute(sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'newsletter_campaigns' ORDER BY ordinal_position`);
  console.log(JSON.stringify(result.rows, null, 2));

  await pool.end();
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
