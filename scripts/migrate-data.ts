import postgres from 'postgres';

// Database URLs
const OLD_DB_URL = 'postgresql://postgres.ndzypstmjawxouxazkkv:Sc@topia81898056@aws-1-eu-north-1.pooler.supabase.com:6543/postgres';
const NEW_DB_URL = 'postgresql://neondb_owner:npg_4R5urnjFLPUV@ep-fancy-wave-ag6fo16i-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require';

// Helper to generate slug
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Helper to generate SKU
function generateSku(): string {
  return `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
}

async function migrate() {
  console.log('🚀 Starting data migration...\n');

  const oldDb = postgres(OLD_DB_URL);
  const newDb = postgres(NEW_DB_URL);

  try {
    // ==========================================
    // 1. MIGRATE CATEGORIES
    // ==========================================
    console.log('📁 Migrating categories...');
    const oldCategories = await oldDb`SELECT * FROM categories ORDER BY created_at`;
    console.log(`   Found ${oldCategories.length} categories`);

    // Create a map to track old ID -> new ID for parent relationships
    const categoryIdMap = new Map<string, string>();

    // First pass: insert categories without parent relationships
    for (const cat of oldCategories) {
      const slug = slugify(cat.name);

      // Check if category with same slug exists
      const existing = await newDb`SELECT id FROM categories WHERE slug = ${slug}`;

      if (existing.length > 0) {
        categoryIdMap.set(cat.id, existing[0].id);
        console.log(`   ⏭️  Category "${cat.name}" already exists`);
        continue;
      }

      const [inserted] = await newDb`
        INSERT INTO categories (id, name, slug, description, image_url, is_active, sort_order, created_at, updated_at)
        VALUES (
          ${cat.id},
          ${cat.name},
          ${slug},
          ${cat.description},
          ${cat.image_url},
          ${cat.is_active ?? true},
          ${cat.sort_order ?? 0},
          ${cat.created_at || new Date()},
          ${cat.updated_at || new Date()}
        )
        ON CONFLICT (id) DO UPDATE SET name = ${cat.name}
        RETURNING id
      `;
      categoryIdMap.set(cat.id, inserted.id);
    }

    // Second pass: update parent relationships
    for (const cat of oldCategories) {
      if (cat.parent_id && categoryIdMap.has(cat.parent_id)) {
        await newDb`
          UPDATE categories
          SET parent_id = ${categoryIdMap.get(cat.parent_id)}
          WHERE id = ${categoryIdMap.get(cat.id)}
        `;
      }
    }
    console.log(`   ✅ Migrated ${oldCategories.length} categories\n`);

    // ==========================================
    // 2. MIGRATE PRODUCTS
    // ==========================================
    console.log('📦 Migrating products...');
    const oldProducts = await oldDb`SELECT * FROM products ORDER BY created_at`;
    console.log(`   Found ${oldProducts.length} products`);

    let productsInserted = 0;
    let productsSkipped = 0;

    for (const prod of oldProducts) {
      // Check if product with same id exists
      const existing = await newDb`SELECT id FROM products WHERE id = ${prod.id}`;

      if (existing.length > 0) {
        productsSkipped++;
        continue;
      }

      const sku = prod.sku || generateSku();
      const slug = prod.slug || slugify(prod.name);

      // Check for SKU conflict
      const skuConflict = await newDb`SELECT id FROM products WHERE sku = ${sku}`;
      const finalSku = skuConflict.length > 0 ? generateSku() : sku;

      // Check for slug conflict
      const slugConflict = await newDb`SELECT id FROM products WHERE slug = ${slug}`;
      const finalSlug = slugConflict.length > 0 ? `${slug}-${Date.now()}` : slug;

      // Map category
      const categoryId = prod.category_id && categoryIdMap.has(prod.category_id)
        ? categoryIdMap.get(prod.category_id)
        : null;

      // Map status
      const status = prod.is_active ? 'active' : 'draft';

      // Get first image as thumbnail
      const images = Array.isArray(prod.images) ? prod.images : [];
      const thumbnailUrl = images.length > 0 ? (typeof images[0] === 'string' ? images[0] : images[0]?.url) : null;

      // Transform images to correct format
      const formattedImages = images.map((img: string | { url: string }) => {
        if (typeof img === 'string') {
          return { url: img };
        }
        return img;
      });

      // Transform videos
      const videos = Array.isArray(prod.videos) ? prod.videos.map((v: string | { url: string }) => {
        if (typeof v === 'string') return { url: v };
        return v;
      }) : [];

      await newDb`
        INSERT INTO products (
          id, sku, barcode, name, slug, description, short_description, category_id, brand,
          base_price, cost_price, compare_at_price, weight, dimensions,
          stock_quantity, low_stock_threshold, track_inventory, allow_backorder,
          images, videos, thumbnail_url, tags, specifications, features,
          meta_title, meta_description, status, is_featured, is_digital, requires_shipping,
          supplier_id, supplier_sku, imported_from, external_url,
          created_at, updated_at
        )
        VALUES (
          ${prod.id},
          ${finalSku},
          ${prod.barcode},
          ${prod.name},
          ${finalSlug},
          ${prod.description},
          ${null},
          ${categoryId},
          ${prod.brand},
          ${String(prod.price || 0)},
          ${prod.cost_price ? String(prod.cost_price) : null},
          ${prod.compare_at_price ? String(prod.compare_at_price) : null},
          ${prod.weight ? String(prod.weight) : null},
          ${prod.dimensions ? JSON.stringify(prod.dimensions) : null},
          ${prod.stock_quantity ?? 0},
          ${prod.low_stock_threshold ?? 5},
          ${prod.track_inventory ?? true},
          ${false},
          ${JSON.stringify(formattedImages)},
          ${JSON.stringify(videos)},
          ${thumbnailUrl},
          ${JSON.stringify(prod.tags || [])},
          ${JSON.stringify(prod.specifications || {})},
          ${JSON.stringify(prod.features || [])},
          ${prod.meta_title},
          ${prod.meta_description},
          ${status},
          ${prod.featured ?? false},
          ${prod.is_digital ?? false},
          ${prod.requires_shipping ?? true},
          ${prod.supplier_id},
          ${prod.supplier_sku},
          ${prod.alibaba_url ? 'alibaba' : null},
          ${prod.alibaba_url},
          ${prod.created_at || new Date()},
          ${prod.updated_at || new Date()}
        )
      `;
      productsInserted++;
    }
    console.log(`   ✅ Migrated ${productsInserted} products (${productsSkipped} skipped)\n`);

    // ==========================================
    // 3. MIGRATE CUSTOMERS
    // ==========================================
    console.log('👥 Migrating customers...');
    const oldCustomers = await oldDb`SELECT * FROM customers ORDER BY created_at`;
    const oldNames = await oldDb`SELECT * FROM customer_names`;
    const oldAddresses = await oldDb`SELECT * FROM customer_addresses`;
    const oldPhones = await oldDb`SELECT * FROM customer_phones`;
    console.log(`   Found ${oldCustomers.length} customers`);

    const customerIdMap = new Map<string, string>();

    for (const cust of oldCustomers) {
      // Check if customer exists
      const existing = await newDb`SELECT id FROM customers WHERE email = ${cust.email}`;

      if (existing.length > 0) {
        customerIdMap.set(cust.id, existing[0].id);
        continue;
      }

      // Get primary name
      const primaryName = oldNames.find((n: { customer_id: string; is_primary: boolean }) =>
        n.customer_id === cust.id && n.is_primary
      ) || oldNames.find((n: { customer_id: string }) => n.customer_id === cust.id);

      // Get primary phone
      const primaryPhone = oldPhones.find((p: { customer_id: string; is_primary: boolean }) =>
        p.customer_id === cust.id && p.is_primary
      ) || oldPhones.find((p: { customer_id: string }) => p.customer_id === cust.id);

      // Get primary address
      const primaryAddress = oldAddresses.find((a: { customer_id: string; is_primary: boolean }) =>
        a.customer_id === cust.id && a.is_primary
      ) || oldAddresses.find((a: { customer_id: string }) => a.customer_id === cust.id);

      const [inserted] = await newDb`
        INSERT INTO customers (
          id, email, first_name, last_name, phone,
          default_shipping_address, default_billing_address,
          is_guest, is_active, accepts_marketing, notes,
          order_count, created_at, updated_at
        )
        VALUES (
          ${cust.id},
          ${cust.email},
          ${primaryName?.first_name || null},
          ${primaryName?.last_name || null},
          ${primaryPhone?.phone || null},
          ${primaryAddress ? JSON.stringify({
            firstName: primaryName?.first_name || '',
            lastName: primaryName?.last_name || '',
            addressLine1: primaryAddress.address_line_1,
            addressLine2: primaryAddress.address_line_2,
            city: primaryAddress.city,
            state: primaryAddress.region,
            postalCode: primaryAddress.postal_code,
            country: primaryAddress.country || 'Lebanon',
            phone: primaryPhone?.phone
          }) : null},
          ${null},
          ${false},
          ${cust.is_active ?? true},
          ${false},
          ${cust.notes},
          ${cust.total_orders ?? 0},
          ${cust.created_at || new Date()},
          ${cust.updated_at || new Date()}
        )
        RETURNING id
      `;
      customerIdMap.set(cust.id, inserted.id);

      // Migrate all addresses
      const custAddresses = oldAddresses.filter((a: { customer_id: string }) => a.customer_id === cust.id);
      for (const addr of custAddresses) {
        await newDb`
          INSERT INTO addresses (
            customer_id, type, first_name, last_name, address_line1, address_line2,
            city, state, postal_code, country, phone, is_default, created_at, updated_at
          )
          VALUES (
            ${inserted.id},
            ${'shipping'},
            ${primaryName?.first_name || ''},
            ${primaryName?.last_name || ''},
            ${addr.address_line_1},
            ${addr.address_line_2},
            ${addr.city},
            ${addr.region},
            ${addr.postal_code},
            ${addr.country || 'Lebanon'},
            ${primaryPhone?.phone},
            ${addr.is_primary ?? false},
            ${addr.created_at || new Date()},
            ${new Date()}
          )
          ON CONFLICT DO NOTHING
        `;
      }
    }
    console.log(`   ✅ Migrated ${oldCustomers.length} customers\n`);

    // ==========================================
    // 4. MIGRATE ORDERS
    // ==========================================
    console.log('🛒 Migrating orders...');
    const oldOrders = await oldDb`SELECT * FROM orders ORDER BY created_at`;
    console.log(`   Found ${oldOrders.length} orders`);

    const orderIdMap = new Map<string, string>();

    for (const ord of oldOrders) {
      // Check if order exists
      const existing = await newDb`SELECT id FROM orders WHERE id = ${ord.id}`;

      if (existing.length > 0) {
        orderIdMap.set(ord.id, existing[0].id);
        continue;
      }

      // Map customer
      const customerId = ord.customer_id && customerIdMap.has(ord.customer_id)
        ? customerIdMap.get(ord.customer_id)
        : null;

      // Map status
      const statusMap: Record<string, string> = {
        'pending': 'pending',
        'processing': 'processing',
        'shipped': 'shipped',
        'delivered': 'delivered',
        'cancelled': 'cancelled',
        'confirmed': 'confirmed'
      };
      const status = statusMap[ord.status] || 'pending';

      // Map payment status
      const paymentStatusMap: Record<string, string> = {
        'pending': 'pending',
        'paid': 'paid',
        'refunded': 'refunded',
        'failed': 'failed'
      };
      const paymentStatus = paymentStatusMap[ord.payment_status] || 'pending';

      // Map payment method
      const paymentMethodMap: Record<string, string> = {
        'cod': 'cod',
        'cash_on_delivery': 'cod',
        'stripe': 'stripe',
        'paypal': 'paypal'
      };
      const paymentMethod = paymentMethodMap[ord.payment_method] || 'cod';

      // Prepare shipping address
      const shippingAddress = ord.shipping_address || {
        firstName: ord.guest_name || '',
        lastName: '',
        addressLine1: '',
        city: '',
        country: 'Lebanon',
        phone: ord.guest_phone
      };

      // Prepare billing address (same as shipping if not provided)
      const billingAddress = ord.billing_address || shippingAddress;

      const orderNumber = ord.order_number || `ORD-${Date.now()}`;

      const [inserted] = await newDb`
        INSERT INTO orders (
          id, order_number, customer_id, status, payment_status,
          shipping_address, billing_address,
          currency, subtotal_snapshot, tax_rate_snapshot, tax_amount_snapshot,
          shipping_amount_snapshot, discount_amount_snapshot, total_snapshot,
          promo_code_snapshot, payment_method, customer_notes, admin_notes,
          created_at, updated_at
        )
        VALUES (
          ${ord.id},
          ${orderNumber},
          ${customerId},
          ${status},
          ${paymentStatus},
          ${JSON.stringify(shippingAddress)},
          ${JSON.stringify(billingAddress)},
          ${ord.currency || 'USD'},
          ${String(ord.subtotal || 0)},
          ${'0.0000'},
          ${String(ord.tax_amount || 0)},
          ${String(ord.shipping_amount || 0)},
          ${String(ord.discount_amount || 0)},
          ${String(ord.total_amount || 0)},
          ${ord.promo_code_used},
          ${paymentMethod},
          ${ord.notes},
          ${null},
          ${ord.created_at || new Date()},
          ${ord.updated_at || new Date()}
        )
        RETURNING id
      `;
      orderIdMap.set(ord.id, inserted.id);
    }
    console.log(`   ✅ Migrated ${oldOrders.length} orders\n`);

    // ==========================================
    // 5. MIGRATE ORDER ITEMS
    // ==========================================
    console.log('📋 Migrating order items...');
    const oldOrderItems = await oldDb`SELECT * FROM order_items ORDER BY created_at`;
    console.log(`   Found ${oldOrderItems.length} order items`);

    let orderItemsInserted = 0;

    for (const item of oldOrderItems) {
      // Check if order was migrated
      const orderId = orderIdMap.get(item.order_id);
      if (!orderId) continue;

      // Check if item exists
      const existing = await newDb`SELECT id FROM order_items WHERE id = ${item.id}`;
      if (existing.length > 0) continue;

      // Get product snapshot info
      const snapshot = item.product_snapshot || {};
      const productName = snapshot.name || 'Unknown Product';
      const sku = snapshot.sku || 'N/A';

      await newDb`
        INSERT INTO order_items (
          id, order_id, product_id,
          product_name_snapshot, sku_snapshot,
          quantity, unit_price_snapshot,
          created_at
        )
        VALUES (
          ${item.id},
          ${orderId},
          ${item.product_id},
          ${productName},
          ${sku},
          ${item.quantity},
          ${String(item.unit_price || 0)},
          ${item.created_at || new Date()}
        )
      `;
      orderItemsInserted++;
    }
    console.log(`   ✅ Migrated ${orderItemsInserted} order items\n`);

    // ==========================================
    // 6. MIGRATE QUOTATIONS
    // ==========================================
    console.log('📄 Migrating quotations...');
    const oldQuotations = await oldDb`SELECT * FROM quotations ORDER BY created_at`;
    console.log(`   Found ${oldQuotations.length} quotations`);

    const quotationIdMap = new Map<string, string>();

    for (const quot of oldQuotations) {
      // Check if quotation exists
      const existing = await newDb`SELECT id FROM quotations WHERE id = ${quot.id}`;

      if (existing.length > 0) {
        quotationIdMap.set(quot.id, existing[0].id);
        continue;
      }

      // Map customer
      const customerId = quot.customer_id && customerIdMap.has(quot.customer_id)
        ? customerIdMap.get(quot.customer_id)
        : null;

      // Map status
      const statusMap: Record<string, string> = {
        'draft': 'draft',
        'sent': 'sent',
        'accepted': 'accepted',
        'rejected': 'rejected',
        'expired': 'expired'
      };
      const status = statusMap[quot.status] || 'draft';

      const [inserted] = await newDb`
        INSERT INTO quotations (
          id, quotation_number, customer_id,
          customer_name, customer_email, customer_phone, customer_company, customer_address,
          status, valid_until,
          currency, subtotal, tax_rate, tax_amount, discount_amount, total,
          notes, terms_and_conditions,
          created_at, updated_at
        )
        VALUES (
          ${quot.id},
          ${quot.quotation_number},
          ${customerId},
          ${quot.customer_name},
          ${quot.customer_email},
          ${quot.customer_phone},
          ${quot.customer_company},
          ${quot.customer_address ? JSON.stringify({
            firstName: quot.customer_name?.split(' ')[0] || '',
            lastName: quot.customer_name?.split(' ').slice(1).join(' ') || '',
            addressLine1: quot.customer_address,
            city: '',
            country: 'Lebanon'
          }) : null},
          ${status},
          ${quot.valid_until},
          ${quot.currency || 'USD'},
          ${String(quot.subtotal || 0)},
          ${quot.tax_percentage ? String(quot.tax_percentage / 100) : null},
          ${quot.tax_amount ? String(quot.tax_amount) : null},
          ${String(quot.discount_amount || 0)},
          ${String(quot.total_amount || 0)},
          ${quot.notes},
          ${quot.terms_and_conditions},
          ${quot.created_at || new Date()},
          ${quot.updated_at || new Date()}
        )
        RETURNING id
      `;
      quotationIdMap.set(quot.id, inserted.id);
    }
    console.log(`   ✅ Migrated ${oldQuotations.length} quotations\n`);

    // ==========================================
    // 7. MIGRATE QUOTATION ITEMS
    // ==========================================
    console.log('📋 Migrating quotation items...');
    const oldQuotationItems = await oldDb`SELECT * FROM quotation_items ORDER BY created_at`;
    console.log(`   Found ${oldQuotationItems.length} quotation items`);

    let quotationItemsInserted = 0;

    for (const item of oldQuotationItems) {
      // Check if quotation was migrated
      const quotationId = quotationIdMap.get(item.quotation_id);
      if (!quotationId) continue;

      // Check if item exists
      const existing = await newDb`SELECT id FROM quotation_items WHERE id = ${item.id}`;
      if (existing.length > 0) continue;

      await newDb`
        INSERT INTO quotation_items (
          id, quotation_id, product_id,
          name, description, sku, quantity, unit_price,
          created_at
        )
        VALUES (
          ${item.id},
          ${quotationId},
          ${item.product_id},
          ${item.product_name},
          ${item.product_description},
          ${item.product_sku},
          ${item.quantity},
          ${String(item.unit_price || 0)},
          ${item.created_at || new Date()}
        )
      `;
      quotationItemsInserted++;
    }
    console.log(`   ✅ Migrated ${quotationItemsInserted} quotation items\n`);

    // ==========================================
    // 8. MIGRATE SETTINGS
    // ==========================================
    console.log('⚙️  Migrating settings...');
    const oldSettings = await oldDb`SELECT * FROM settings`;
    console.log(`   Found ${oldSettings.length} settings`);

    for (const setting of oldSettings) {
      await newDb`
        INSERT INTO settings (key, value, description, updated_at)
        VALUES (${setting.key}, ${JSON.stringify(setting.value)}, ${setting.description}, ${setting.updated_at || new Date()})
        ON CONFLICT (key) DO UPDATE SET value = ${JSON.stringify(setting.value)}, updated_at = ${new Date()}
      `;
    }
    console.log(`   ✅ Migrated ${oldSettings.length} settings\n`);

    // ==========================================
    // SUMMARY
    // ==========================================
    console.log('═══════════════════════════════════════');
    console.log('✅ MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════');
    console.log(`   📁 Categories: ${oldCategories.length}`);
    console.log(`   📦 Products: ${productsInserted} (${productsSkipped} skipped)`);
    console.log(`   👥 Customers: ${oldCustomers.length}`);
    console.log(`   🛒 Orders: ${oldOrders.length}`);
    console.log(`   📋 Order Items: ${orderItemsInserted}`);
    console.log(`   📄 Quotations: ${oldQuotations.length}`);
    console.log(`   📋 Quotation Items: ${quotationItemsInserted}`);
    console.log(`   ⚙️  Settings: ${oldSettings.length}`);
    console.log('═══════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await oldDb.end();
    await newDb.end();
  }
}

migrate().catch(console.error);
