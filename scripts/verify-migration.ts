import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../apps/api/.env') });

const NEW_DB_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_4R5urnjFLPUV@ep-fancy-wave-ag6fo16i-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require';

async function verify() {
  const sql = postgres(NEW_DB_URL);

  console.log('=== NEW DATABASE VERIFICATION ===\n');

  const tables = [
    'categories',
    'products',
    'customers',
    'orders',
    'order_items',
    'quotations',
    'quotation_items',
    'settings'
  ];

  for (const table of tables) {
    try {
      const result = await sql.unsafe(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`${table}: ${result[0].count} rows`);
    } catch (e: any) {
      console.log(`${table}: error - ${e.message}`);
    }
  }

  // Show sample products
  console.log('\n=== SAMPLE PRODUCTS ===');
  const products = await sql`SELECT id, name, sku, price FROM products LIMIT 5`;
  for (const p of products) {
    console.log(`  - ${p.name} (SKU: ${p.sku}) - $${p.price}`);
  }

  // Show sample categories
  console.log('\n=== SAMPLE CATEGORIES ===');
  const categories = await sql`SELECT id, name, slug FROM categories LIMIT 5`;
  for (const c of categories) {
    console.log(`  - ${c.name} (/${c.slug})`);
  }

  await sql.end();
}

verify().catch(console.error);
