import { config } from 'dotenv';
import path from 'path';

// Load .env from root directory
config({ path: path.resolve(__dirname, '../../../../.env') });
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { settings } from '../schema/settings';

async function dumpSettings() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql);

  console.log('Fetching all settings from database...\n');

  const allSettings = await db.select().from(settings);

  console.log(`Found ${allSettings.length} settings:\n`);
  console.log('='.repeat(80));

  for (const setting of allSettings) {
    console.log(`Key: ${setting.key}`);
    console.log(`Value: ${JSON.stringify(setting.value)}`);
    console.log(`Description: ${setting.description || 'N/A'}`);
    console.log(`Updated At: ${setting.updatedAt}`);
    console.log('-'.repeat(80));
  }

  // Also output as JSON for easy reference
  console.log('\n\nJSON Output:');
  console.log(JSON.stringify(allSettings, null, 2));
}

dumpSettings().catch(console.error);
