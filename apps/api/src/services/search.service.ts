import { MeiliSearch, Index, SearchParams, SearchResponse } from 'meilisearch';
import { getDb, products, categories, eq } from '@lab404/database';

// ===========================================
// Configuration
// ===========================================

const MEILISEARCH_HOST = process.env['MEILISEARCH_HOST'] || 'http://localhost:7700';
const MEILISEARCH_API_KEY = process.env['MEILISEARCH_API_KEY'] || '';

// Index names
export const PRODUCTS_INDEX = 'products';

// ===========================================
// Types
// ===========================================

export interface ProductDocument {
    id: string;
    sku: string;
    name: string;
    slug: string;
    description: string | null;
    shortDescription: string | null;
    brand: string | null;
    categoryId: string | null;
    categoryName: string | null;
    categorySlug: string | null;
    basePrice: number;
    compareAtPrice: number | null;
    stockQuantity: number;
    inStock: boolean;
    isFeatured: boolean;
    tags: string[];
    thumbnailUrl: string | null;
    images: Array<{ url: string; alt?: string }>;
    createdAt: number;
    updatedAt: number;
}

export interface SearchResult {
    hits: ProductDocument[];
    query: string;
    processingTimeMs: number;
    estimatedTotalHits: number;
    limit: number;
    offset: number;
    facetDistribution?: Record<string, Record<string, number>>;
}

// ===========================================
// Meilisearch Service
// ===========================================

class SearchService {
    private client: MeiliSearch | null = null;
    private initialized = false;

    /**
     * Get or create Meilisearch client
     */
    private getClient(): MeiliSearch {
        if (!this.client) {
            this.client = new MeiliSearch({
                host: MEILISEARCH_HOST,
                apiKey: MEILISEARCH_API_KEY,
            });
        }
        return this.client;
    }

    /**
     * Check if Meilisearch is available
     */
    async isAvailable(): Promise<boolean> {
        try {
            const client = this.getClient();
            await client.health();
            return true;
        } catch (error) {
            console.warn('Meilisearch is not available:', error instanceof Error ? error.message : 'Unknown error');
            return false;
        }
    }

    /**
     * Initialize the search index with proper settings
     */
    async initialize(): Promise<void> {
        if (this.initialized) return;

        try {
            const client = this.getClient();

            // Create products index if it doesn't exist
            try {
                await client.getIndex(PRODUCTS_INDEX);
            } catch {
                await client.createIndex(PRODUCTS_INDEX, { primaryKey: 'id' });
            }

            const index = client.index(PRODUCTS_INDEX);

            // Configure searchable attributes
            await index.updateSearchableAttributes([
                'name',
                'description',
                'shortDescription',
                'sku',
                'brand',
                'categoryName',
                'tags',
            ]);

            // Configure filterable attributes for faceted search
            await index.updateFilterableAttributes([
                'categoryId',
                'categorySlug',
                'inStock',
                'isFeatured',
                'basePrice',
                'brand',
                'tags',
            ]);

            // Configure sortable attributes
            await index.updateSortableAttributes([
                'name',
                'basePrice',
                'createdAt',
                'stockQuantity',
            ]);

            // Configure ranking rules
            await index.updateRankingRules([
                'words',
                'typo',
                'proximity',
                'attribute',
                'sort',
                'exactness',
            ]);

            // Configure typo tolerance
            await index.updateTypoTolerance({
                enabled: true,
                minWordSizeForTypos: {
                    oneTypo: 4,
                    twoTypos: 8,
                },
            });

            this.initialized = true;
            console.log('Meilisearch initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Meilisearch:', error);
            throw error;
        }
    }

    /**
     * Get the products index
     */
    getProductsIndex(): Index<ProductDocument> {
        return this.getClient().index(PRODUCTS_INDEX);
    }

    /**
     * Index a single product
     */
    async indexProduct(product: ProductDocument): Promise<void> {
        try {
            const index = this.getProductsIndex();
            await index.addDocuments([product]);
        } catch (error) {
            console.error('Failed to index product:', error);
        }
    }

    /**
     * Index multiple products
     */
    async indexProducts(productDocs: ProductDocument[]): Promise<void> {
        try {
            const index = this.getProductsIndex();
            await index.addDocuments(productDocs);
        } catch (error) {
            console.error('Failed to index products:', error);
        }
    }

    /**
     * Update a product in the index
     */
    async updateProduct(product: ProductDocument): Promise<void> {
        try {
            const index = this.getProductsIndex();
            await index.updateDocuments([product]);
        } catch (error) {
            console.error('Failed to update product in index:', error);
        }
    }

    /**
     * Remove a product from the index
     */
    async removeProduct(productId: string): Promise<void> {
        try {
            const index = this.getProductsIndex();
            await index.deleteDocument(productId);
        } catch (error) {
            console.error('Failed to remove product from index:', error);
        }
    }

    /**
     * Search products
     */
    async searchProducts(
        query: string,
        options: {
            limit?: number;
            offset?: number;
            filters?: string[];
            sort?: string[];
            facets?: string[];
        } = {}
    ): Promise<SearchResult> {
        const { limit = 20, offset = 0, filters = [], sort = [], facets = [] } = options;

        const searchParams: SearchParams = {
            limit,
            offset,
            attributesToRetrieve: [
                'id',
                'sku',
                'name',
                'slug',
                'shortDescription',
                'brand',
                'categoryId',
                'categoryName',
                'categorySlug',
                'basePrice',
                'compareAtPrice',
                'stockQuantity',
                'inStock',
                'isFeatured',
                'tags',
                'thumbnailUrl',
                'images',
            ],
        };

        // Add filters
        if (filters.length > 0) {
            searchParams.filter = filters;
        }

        // Add sorting
        if (sort.length > 0) {
            searchParams.sort = sort;
        }

        // Add facets for filtering UI
        if (facets.length > 0) {
            searchParams.facets = facets;
        }

        try {
            const index = this.getProductsIndex();
            const response = await index.search(query, searchParams);

            return {
                hits: response.hits as ProductDocument[],
                query: response.query,
                processingTimeMs: response.processingTimeMs,
                estimatedTotalHits: response.estimatedTotalHits || 0,
                limit,
                offset,
                facetDistribution: response.facetDistribution,
            };
        } catch (error) {
            console.error('Search failed:', error);
            throw error;
        }
    }

    /**
     * Sync all products from database to Meilisearch
     */
    async syncAllProducts(): Promise<{ indexed: number; errors: number }> {
        const db = getDb();
        let indexed = 0;
        let errors = 0;

        try {
            // Get all active products
            const productList = await db
                .select()
                .from(products)
                .where(eq(products.status, 'active'));

            // Get all categories for lookup
            const categoryList = await db.select().from(categories);
            const categoryMap = new Map(categoryList.map(c => [c.id, c]));

            // Transform products to search documents
            const documents: ProductDocument[] = productList.map(product => {
                const category = product.categoryId ? categoryMap.get(product.categoryId) : null;

                return {
                    id: product.id,
                    sku: product.sku,
                    name: product.name,
                    slug: product.slug,
                    description: product.description,
                    shortDescription: product.shortDescription,
                    brand: product.brand,
                    categoryId: product.categoryId,
                    categoryName: category?.name || null,
                    categorySlug: category?.slug || null,
                    basePrice: Number(product.basePrice),
                    compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
                    stockQuantity: product.stockQuantity,
                    inStock: product.stockQuantity > 0 || product.allowBackorder,
                    isFeatured: product.isFeatured,
                    tags: product.tags as string[] || [],
                    thumbnailUrl: product.thumbnailUrl,
                    images: product.images as Array<{ url: string; alt?: string }> || [],
                    createdAt: new Date(product.createdAt).getTime(),
                    updatedAt: new Date(product.updatedAt).getTime(),
                };
            });

            // Index all products
            if (documents.length > 0) {
                const index = this.getProductsIndex();
                // Replace all documents to ensure clean sync
                await index.deleteAllDocuments();
                await index.addDocuments(documents);
                indexed = documents.length;
            }

            console.log(`Synced ${indexed} products to Meilisearch`);
        } catch (error) {
            console.error('Failed to sync products:', error);
            errors++;
        }

        return { indexed, errors };
    }

    /**
     * Get index stats
     */
    async getIndexStats(): Promise<{
        numberOfDocuments: number;
        isIndexing: boolean;
    }> {
        try {
            const index = this.getProductsIndex();
            const stats = await index.getStats();
            return {
                numberOfDocuments: stats.numberOfDocuments,
                isIndexing: stats.isIndexing,
            };
        } catch (error) {
            console.error('Failed to get index stats:', error);
            return { numberOfDocuments: 0, isIndexing: false };
        }
    }
}

// Export singleton instance
export const searchService = new SearchService();
export { SearchService };
