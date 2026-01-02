/**
 * Database Health Check Utility
 * Verifies NeonDB connection and schema integrity
 */

import { getDb, sql } from '@lab404/database';

export interface DbHealthStatus {
  connected: boolean;
  latency: number;
  version: string;
  tables: string[];
  error?: string;
}

/**
 * Check database connection and health
 */
export async function checkDbHealth(): Promise<DbHealthStatus> {
  const startTime = Date.now();

  try {
    const db = getDb();

    // Test connection with simple query
    const versionResult = await db.execute(sql`SELECT version()`);
    const rows = versionResult.rows as Array<{ version: string }>;
    const version = rows[0]?.version || 'unknown';

    const latency = Date.now() - startTime;

    // Get list of tables
    const tablesResult = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    const tableRows = tablesResult.rows as Array<{ table_name: string }>;
    const tables = tableRows.map(t => t.table_name);

    return {
      connected: true,
      latency,
      version,
      tables,
    };
  } catch (error) {
    return {
      connected: false,
      latency: Date.now() - startTime,
      version: 'unknown',
      tables: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Verify all required tables exist
 */
export async function verifySchema(): Promise<{
  valid: boolean;
  missingTables: string[];
  extraTables: string[];
}> {
  const requiredTables = [
    'addresses',
    'admin_activity_logs',
    'blogs',
    'cart_items',
    'cart_promo_codes',
    'carts',
    'categories',
    'customers',
    'order_items',
    'orders',
    'product_import_jobs',
    'product_variants',
    'products',
    'promo_codes',
    'quotation_items',
    'quotations',
    'settings',
  ];

  try {
    const health = await checkDbHealth();

    if (!health.connected) {
      return {
        valid: false,
        missingTables: requiredTables,
        extraTables: [],
      };
    }

    const existingTables = new Set(health.tables);
    const missingTables = requiredTables.filter(t => !existingTables.has(t));
    const extraTables = health.tables.filter(t => !requiredTables.includes(t));

    return {
      valid: missingTables.length === 0,
      missingTables,
      extraTables,
    };
  } catch (error) {
    return {
      valid: false,
      missingTables: requiredTables,
      extraTables: [],
    };
  }
}

/**
 * Run database connection test
 */
export async function testConnection(): Promise<boolean> {
  try {
    const db = getDb();
    await db.execute(sql`SELECT 1`);
    return true;
  } catch {
    return false;
  }
}
