/**
 * Fix quotation items - re-migrate items for existing quotations
 */

import pg from 'pg';
import * as dotenv from 'dotenv';

const { Pool } = pg;

dotenv.config({ path: '../../.env' });

const OLD_DATABASE_URL = process.env.OLD_DATABASE_URL;
const NEW_DATABASE_URL = process.env.DATABASE_URL;

async function fix() {
  const oldPool = new Pool({ connectionString: OLD_DATABASE_URL, ssl: { rejectUnauthorized: false } });
  const newPool = new Pool({ connectionString: NEW_DATABASE_URL, ssl: { rejectUnauthorized: false } });

  try {
    // Get all quotation IDs from new database
    console.log('📥 Fetching quotations from new database...');
    const { rows: quotations } = await newPool.query('SELECT id FROM quotations');
    console.log(`   Found ${quotations.length} quotations\n`);

    // Delete existing items (they may be incomplete)
    console.log('🗑️  Deleting existing items...');
    await newPool.query('DELETE FROM quotation_items');
    console.log('   Done\n');

    // Fetch items from old database
    console.log('📥 Fetching items from old database...');
    const { rows: oldItems } = await oldPool.query('SELECT * FROM quotation_items');
    console.log(`   Found ${oldItems.length} items\n`);

    // Fetch products for names
    console.log('📥 Fetching products from old database...');
    const { rows: products } = await oldPool.query('SELECT id, name, sku FROM products');
    const productMap = new Map(products.map(p => [p.id, { name: p.name, sku: p.sku }]));
    console.log(`   Found ${products.length} products\n`);

    // Filter items that belong to migrated quotations
    const quotationIds = new Set(quotations.map(q => q.id));
    const itemsToMigrate = oldItems.filter(item => quotationIds.has(item.quotation_id));
    console.log(`📝 ${itemsToMigrate.length} items to migrate\n`);

    // Migrate items
    let count = 0;
    for (const item of itemsToMigrate) {
      let itemName = item.name;
      let itemSku = item.sku;

      if (!itemName && item.product_id) {
        const product = productMap.get(item.product_id);
        if (product) {
          itemName = product.name;
          itemSku = itemSku || product.sku;
        }
      }

      if (!itemName) {
        itemName = 'Unknown Product';
      }

      await newPool.query(
        `INSERT INTO quotation_items (id, quotation_id, product_id, variant_id, name, description, sku, quantity, unit_price, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO UPDATE SET name = $5, sku = $7`,
        [item.id, item.quotation_id, item.product_id, item.variant_id, itemName, item.description, itemSku, item.quantity, item.unit_price, item.created_at]
      );
      count++;
    }

    console.log(`✅ Migrated ${count} items successfully!`);

  } finally {
    await oldPool.end();
    await newPool.end();
  }
}

fix();
