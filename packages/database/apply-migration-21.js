// Simple script to apply Phase 21 migration (ip_reputation table)
import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

async function applyMigration() {
  const sql = neon(DATABASE_URL);

  try {
    console.log('🚀 Applying Phase 21 migration: ip_reputation table...\n');

    // Read the migration file
    const migrationPath = path.resolve(__dirname, 'src/migrations/0007_silly_nova.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split by statement-breakpoint and execute each statement
    const statements = migrationSQL
      .split('--> statement-breakpoint')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`📝 Executing ${statements.length} SQL statements...\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`   [${i + 1}/${statements.length}] Executing statement...`);

      try {
        await sql(statement);
        console.log(`   ✅ Statement ${i + 1} executed successfully`);
      } catch (error) {
        // Check if error is about existing object
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          console.log(`   ⏭️  Statement ${i + 1} skipped (already exists)`);
        } else {
          throw error;
        }
      }
    }

    console.log('\n✅ Migration applied successfully!\n');
    console.log('Created:');
    console.log('  - ip_reputation table');
    console.log('  - 3 indexes for query optimization');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

applyMigration();
