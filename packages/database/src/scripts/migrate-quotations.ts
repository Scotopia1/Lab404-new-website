/**
 * Migration script to copy quotation data from old database to new database
 *
 * Usage:
 * 1. Set OLD_DATABASE_URL in .env file
 * 2. Run: pnpm tsx src/scripts/migrate-quotations.ts
 */

import pg from 'pg';
import * as dotenv from 'dotenv';

const { Pool } = pg;

// Load environment variables
dotenv.config({ path: '../../.env' });

const OLD_DATABASE_URL = process.env['OLD_DATABASE_URL'];
const NEW_DATABASE_URL = process.env['DATABASE_URL'];

if (!OLD_DATABASE_URL) {
  console.error('❌ OLD_DATABASE_URL not set in .env file');
  process.exit(1);
}

if (!NEW_DATABASE_URL) {
  console.error('❌ DATABASE_URL not set in .env file');
  process.exit(1);
}

console.log('🔄 Starting quotation data migration...\n');

// Helper to convert address string to JSON or null
function parseAddress(address: unknown): string | null {
  if (!address) return null;

  // If it's already an object, stringify it
  if (typeof address === 'object') {
    return JSON.stringify(address);
  }

  // If it's a string that looks like JSON, return as-is
  const str = String(address);
  if (str.startsWith('{') || str.startsWith('[')) {
    try {
      JSON.parse(str);
      return str;
    } catch {
      // Not valid JSON, convert to address object
    }
  }

  // Convert plain text address to JSON object
  return JSON.stringify({ addressLine1: str });
}

// Map old status values to new status values
function mapStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'approved': 'accepted',
    'pending': 'draft',
  };
  return statusMap[status] || status;
}

async function migrate() {
  // Create connections
  const oldPool = new Pool({ connectionString: OLD_DATABASE_URL, ssl: { rejectUnauthorized: false } });
  const newPool = new Pool({ connectionString: NEW_DATABASE_URL, ssl: { rejectUnauthorized: false } });

  try {
    // Step 1: Fetch quotations from old database
    console.log('📥 Fetching quotations from old database...');
    const { rows: oldQuotations } = await oldPool.query(
      'SELECT * FROM quotations ORDER BY created_at ASC'
    );
    console.log(`   Found ${oldQuotations.length} quotations\n`);

    if (oldQuotations.length === 0) {
      console.log('⚠️  No quotations found in old database');
      return;
    }

    // Step 2: Fetch quotation items from old database
    console.log('📥 Fetching quotation items from old database...');
    const { rows: oldItems } = await oldPool.query(
      'SELECT * FROM quotation_items ORDER BY quotation_id, created_at ASC'
    );
    console.log(`   Found ${oldItems.length} quotation items\n`);

    // Step 3: Fetch products from old database to get names
    console.log('📥 Fetching products from old database...');
    const { rows: oldProducts } = await oldPool.query(
      'SELECT id, name, sku FROM products'
    );
    const productMap = new Map(oldProducts.map(p => [p.id, { name: p.name, sku: p.sku }]));
    console.log(`   Found ${oldProducts.length} products\n`);

    // Step 4: Check for existing quotations in new database
    console.log('🔍 Checking for existing quotations in new database...');
    const { rows: existingQuotations } = await newPool.query(
      'SELECT quotation_number FROM quotations'
    );
    const existingNumbers = new Set(existingQuotations.map(q => q.quotation_number));
    console.log(`   Found ${existingNumbers.size} existing quotations\n`);

    // Step 5: Filter out already migrated quotations
    const quotationsToMigrate = oldQuotations.filter(
      q => !existingNumbers.has(q.quotation_number)
    );
    console.log(`📝 ${quotationsToMigrate.length} new quotations to migrate\n`);

    if (quotationsToMigrate.length === 0) {
      console.log('✅ All quotations already migrated!');
      return;
    }

    // Step 6: Migrate quotations
    let migratedCount = 0;
    let errorCount = 0;

    for (const quotation of quotationsToMigrate) {
      try {
        // Calculate total if missing (subtotal - discount + tax)
        const subtotal = parseFloat(quotation.subtotal) || 0;
        const discountAmount = parseFloat(quotation.discount_amount) || 0;
        const taxAmount = parseFloat(quotation.tax_amount) || 0;
        const total = quotation.total != null ? quotation.total : (subtotal - discountAmount + taxAmount);

        // Parse customer address
        const customerAddress = parseAddress(quotation.customer_address);

        // Map status
        const status = mapStatus(quotation.status);

        // Insert quotation
        await newPool.query(
          `INSERT INTO quotations (
            id,
            quotation_number,
            customer_id,
            customer_name,
            customer_email,
            customer_phone,
            customer_company,
            customer_address,
            status,
            valid_until,
            currency,
            subtotal,
            tax_rate,
            tax_amount,
            discount_type,
            discount_value,
            discount_amount,
            total,
            notes,
            terms_and_conditions,
            pdf_url,
            converted_to_order_id,
            created_at,
            updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10,
            $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
            $21, $22, $23, $24
          )
          ON CONFLICT (quotation_number) DO NOTHING`,
          [
            quotation.id,
            quotation.quotation_number,
            quotation.customer_id,
            quotation.customer_name,
            quotation.customer_email,
            quotation.customer_phone,
            quotation.customer_company,
            customerAddress,
            status,
            quotation.valid_until,
            quotation.currency || 'USD',
            subtotal,
            quotation.tax_rate,
            taxAmount,
            quotation.discount_type,
            quotation.discount_value,
            discountAmount,
            total,
            quotation.notes,
            quotation.terms_and_conditions,
            quotation.pdf_url,
            quotation.converted_to_order_id,
            quotation.created_at,
            quotation.updated_at
          ]
        );

        // Get items for this quotation
        const quotationItems = oldItems.filter(item => item.quotation_id === quotation.id);

        // Insert items
        for (const item of quotationItems) {
          // Get product name if item doesn't have a name
          let itemName = item.name;
          let itemSku = item.sku;

          if (!itemName && item.product_id) {
            const product = productMap.get(item.product_id);
            if (product) {
              itemName = product.name;
              itemSku = itemSku || product.sku;
            }
          }

          // Fallback if still no name
          if (!itemName) {
            itemName = 'Unknown Product';
          }

          await newPool.query(
            `INSERT INTO quotation_items (
              id,
              quotation_id,
              product_id,
              variant_id,
              name,
              description,
              sku,
              quantity,
              unit_price,
              created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (id) DO NOTHING`,
            [
              item.id,
              item.quotation_id,
              item.product_id,
              item.variant_id,
              itemName,
              item.description,
              itemSku,
              item.quantity,
              item.unit_price,
              item.created_at
            ]
          );
        }

        migratedCount++;
        console.log(`   ✅ Migrated: ${quotation.quotation_number} (${quotationItems.length} items)`);
      } catch (error) {
        errorCount++;
        console.error(`   ❌ Failed: ${quotation.quotation_number}`, error);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Migration Summary:');
    console.log(`   Total quotations in old DB: ${oldQuotations.length}`);
    console.log(`   Already existed in new DB: ${existingNumbers.size}`);
    console.log(`   Successfully migrated: ${migratedCount}`);
    console.log(`   Failed: ${errorCount}`);
    console.log('='.repeat(50));

    if (errorCount === 0) {
      console.log('\n✅ Migration completed successfully!');
    } else {
      console.log('\n⚠️  Migration completed with errors. Check the logs above.');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await oldPool.end();
    await newPool.end();
  }
}

migrate();
