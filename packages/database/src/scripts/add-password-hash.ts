import * as dotenv from 'dotenv';
import { getDb } from '../index';
import { sql } from 'drizzle-orm';

// Load environment variables from root .env file
dotenv.config({ path: '../../.env' });

async function addPasswordHashColumn() {
  const db = getDb();

  try {
    console.log('Adding password_hash column to customers table...');

    // Check if column already exists
    const checkColumn = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name='customers'
      AND column_name='password_hash'
    `);

    if (checkColumn.rows.length > 0) {
      console.log('✓ password_hash column already exists');
      return;
    }

    // Add the column
    await db.execute(sql`
      ALTER TABLE customers ADD COLUMN password_hash VARCHAR(255)
    `);

    console.log('✓ Successfully added password_hash column');
    console.log('✓ All existing customer data preserved');
  } catch (error) {
    console.error('Error adding column:', error);
    throw error;
  }
}

addPasswordHashColumn()
  .then(() => {
    console.log('Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
