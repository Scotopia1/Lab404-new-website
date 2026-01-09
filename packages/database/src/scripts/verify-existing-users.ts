import * as dotenv from 'dotenv';
import { getDb } from '../index';
import { sql } from 'drizzle-orm';

// Load environment variables from root .env file
dotenv.config({ path: '../../../.env' });

async function verifyExistingUsers() {
  const db = getDb();

  try {
    console.log('Verifying existing users...');

    // Update all existing non-guest customers without emailVerified set
    const result = await db.execute(sql`
      UPDATE customers
      SET
        email_verified = TRUE,
        email_verified_at = NOW()
      WHERE
        is_guest = FALSE
        AND (email_verified IS NULL OR email_verified = FALSE)
    `);

    console.log(`Updated ${result.rowCount || 0} existing users as verified`);
  } catch (error) {
    console.error('Error verifying existing users:', error);
    throw error;
  }
}

verifyExistingUsers()
  .then(() => {
    console.log('Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
