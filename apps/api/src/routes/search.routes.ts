import { Router } from 'express';
import { z } from 'zod';
import { validateQuery } from '../middleware/validator';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { sendSuccess } from '../utils/response';
import { searchService } from '../services';

export const searchRoutes = Router();

// ===========================================
// Validation Schemas
// ===========================================

const searchQuerySchema = z.object({
    q: z.string().min(1).max(200),
    limit: z.coerce.number().min(1).max(100).optional(),
    offset: z.coerce.number().min(0).optional(),
    category: z.string().optional(),
    minPrice: z.coerce.number().optional(),
    maxPrice: z.coerce.number().optional(),
    inStock: z.string().optional(),
    brand: z.string().optional(),
    sort: z.enum(['name:asc', 'name:desc', 'basePrice:asc', 'basePrice:desc', 'createdAt:desc']).optional(),
    facets: z.string().optional(), // comma-separated list of facet fields
});

const autocompleteSchema = z.object({
    q: z.string().min(1).max(100),
    limit: z.coerce.number().min(1).max(10).optional(),
});

// ===========================================
// Public Routes
// ===========================================

/**
 * GET /api/search
 * Full-text product search with filters and facets
 */
searchRoutes.get('/', validateQuery(searchQuerySchema), async (req, res, next) => {
    try {
        const { q, limit = 20, offset = 0, category, minPrice, maxPrice, inStock, brand, sort, facets } = req.query;

        // Check if Meilisearch is available
        const isAvailable = await searchService.isAvailable();
        if (!isAvailable) {
            return sendSuccess(res, {
                hits: [],
                query: q as string,
                processingTimeMs: 0,
                estimatedTotalHits: 0,
                limit: Number(limit),
                offset: Number(offset),
                error: 'Search service temporarily unavailable',
            });
        }

        // Build filters
        const filters: string[] = [];

        if (category) {
            filters.push(`categorySlug = "${category}"`);
        }

        if (minPrice !== undefined) {
            filters.push(`basePrice >= ${minPrice}`);
        }

        if (maxPrice !== undefined) {
            filters.push(`basePrice <= ${maxPrice}`);
        }

        if (inStock === 'true') {
            filters.push('inStock = true');
        }

        if (brand) {
            filters.push(`brand = "${brand}"`);
        }

        // Build sort array
        const sortArray: string[] = [];
        if (sort) {
            sortArray.push(sort as string);
        }

        // Build facets array
        const facetFields = facets ? (facets as string).split(',') : ['categorySlug', 'brand', 'inStock'];

        // Perform search
        const result = await searchService.searchProducts(q as string, {
            limit: Number(limit),
            offset: Number(offset),
            filters,
            sort: sortArray,
            facets: facetFields,
        });

        sendSuccess(res, result);
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/search/autocomplete
 * Quick autocomplete suggestions
 */
searchRoutes.get('/autocomplete', validateQuery(autocompleteSchema), async (req, res, next) => {
    try {
        const { q, limit = 5 } = req.query;

        // Check if Meilisearch is available
        const isAvailable = await searchService.isAvailable();
        if (!isAvailable) {
            return sendSuccess(res, { suggestions: [] });
        }

        const result = await searchService.searchProducts(q as string, {
            limit: Number(limit),
            offset: 0,
        });

        // Return simplified suggestions
        const suggestions = result.hits.map(hit => ({
            id: hit.id,
            name: hit.name,
            slug: hit.slug,
            thumbnailUrl: hit.thumbnailUrl,
            basePrice: hit.basePrice,
            categoryName: hit.categoryName,
        }));

        sendSuccess(res, { suggestions, query: q });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/search/health
 * Check search service health
 */
searchRoutes.get('/health', async (req, res, next) => {
    try {
        const isAvailable = await searchService.isAvailable();
        const stats = isAvailable ? await searchService.getIndexStats() : null;

        sendSuccess(res, {
            available: isAvailable,
            stats,
        });
    } catch (error) {
        next(error);
    }
});

// ===========================================
// Admin Routes
// ===========================================

/**
 * POST /api/search/sync
 * Sync all products to search index (Admin only)
 */
searchRoutes.post('/sync', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        // Initialize the index if needed
        await searchService.initialize();

        // Sync all products
        const result = await searchService.syncAllProducts();

        sendSuccess(res, {
            message: 'Products synced successfully',
            ...result,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/search/initialize
 * Initialize search index with settings (Admin only)
 */
searchRoutes.post('/initialize', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        await searchService.initialize();

        sendSuccess(res, {
            message: 'Search index initialized successfully',
        });
    } catch (error) {
        next(error);
    }
});
