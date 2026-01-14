/**
 * Script to sync products from database to Meilisearch
 * Run with: pnpm sync:search
 */

import { searchService } from '../src/services/search.service';

async function main() {
    console.log('Starting Meilisearch sync...');
    console.log('Meilisearch host:', process.env['MEILISEARCH_HOST']);
    console.log('Database URL:', process.env['DATABASE_URL']?.substring(0, 30) + '...');

    // Check if Meilisearch is available
    const available = await searchService.isAvailable();
    if (!available) {
        console.error('❌ Meilisearch is not available. Check your connection settings.');
        process.exit(1);
    }
    console.log('✅ Meilisearch is available');

    // Initialize index with proper settings
    console.log('Initializing index settings...');
    await searchService.initialize();
    console.log('✅ Index settings configured');

    // Sync all products
    console.log('Syncing products...');
    const result = await searchService.syncAllProducts();

    console.log('');
    console.log('='.repeat(50));
    console.log('Sync Complete!');
    console.log('='.repeat(50));
    console.log(`✅ Products indexed: ${result.indexed}`);
    console.log(`❌ Errors: ${result.errors}`);

    // Get final stats
    const stats = await searchService.getIndexStats();
    console.log(`📊 Total documents in index: ${stats.numberOfDocuments}`);
    console.log(`🔄 Is indexing: ${stats.isIndexing}`);

    process.exit(0);
}

main().catch((error) => {
    console.error('Sync failed:', error);
    process.exit(1);
});
