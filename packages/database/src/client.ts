import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

/**
 * Creates a database client instance
 * @param connectionString - The NeonDB connection string
 * @returns Drizzle database instance
 */
export function createDb(connectionString: string) {
  const sql = neon(connectionString);
  return drizzle(sql, { schema });
}

/**
 * Type for the database instance
 */
export type Database = ReturnType<typeof createDb>;

/**
 * Get database instance (singleton pattern for serverless)
 */
let dbInstance: Database | null = null;

export function getDb(): Database {
  if (!dbInstance) {
    const connectionString = process.env['DATABASE_URL'];
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    dbInstance = createDb(connectionString);
  }
  return dbInstance;
}
