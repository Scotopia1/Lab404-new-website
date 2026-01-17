import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { google } from 'googleapis';
import ImageKit from 'imagekit';
import { config } from '../config';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { validateQuery, validateBody } from '../middleware/validator';
import { sendSuccess } from '../utils/response';
import { BadRequestError } from '../utils/errors';

export const googleImagesRoutes = Router();

// ===========================================
// ImageKit Instance
// ===========================================

let imagekit: ImageKit | null = null;

function getImageKit(): ImageKit {
  if (!imagekit) {
    if (
      !config.imagekit.publicKey ||
      !config.imagekit.privateKey ||
      !config.imagekit.urlEndpoint
    ) {
      throw new BadRequestError('ImageKit is not configured');
    }

    imagekit = new ImageKit({
      publicKey: config.imagekit.publicKey,
      privateKey: config.imagekit.privateKey,
      urlEndpoint: config.imagekit.urlEndpoint,
    });
  }
  return imagekit;
}

// ===========================================
// Validation Schemas
// ===========================================

const searchQuerySchema = z.object({
  query: z.string().min(1, 'Search query is required').max(200, 'Query too long'),
  limit: z.string().optional().transform(val => Math.min(Math.max(parseInt(val || '10', 10), 1), 10)),
  start: z.string().optional().transform(val => Math.min(Math.max(parseInt(val || '1', 10), 1), 91)),
  safeSearch: z.enum(['off', 'medium', 'high']).optional().default('medium'),
  imageSize: z.enum(['huge', 'icon', 'large', 'medium', 'small', 'xlarge', 'xxlarge']).optional(),
  imageType: z.enum(['clipart', 'face', 'lineart', 'stock', 'photo', 'animated']).optional(),
  fileType: z.enum(['jpg', 'png', 'gif', 'bmp', 'svg', 'webp', 'ico']).optional(),
});

const downloadSchema = z.object({
  imageUrl: z.string().url('Invalid image URL').optional(),
  imageUrls: z.array(z.string().url('Invalid image URL')).max(10, 'Maximum 10 images per batch').optional(),
  folder: z.string().optional().default('/products'),
});

// Cache for search results
interface CacheEntry {
  data: any;
  timestamp: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const searchCache = new Map<string, CacheEntry>();

// Initialize Google Custom Search client
let customSearch: any = null;

function getCustomSearchClient() {
  if (!customSearch) {
    customSearch = google.customsearch('v1');
  }
  return customSearch;
}

// Generate cache key
function generateCacheKey(options: any): string {
  return JSON.stringify({
    q: options.query,
    start: options.start || 1,
    num: options.limit || 10,
    safe: options.safeSearch || 'medium',
    imgSize: options.imageSize,
    imgType: options.imageType,
    fileType: options.fileType,
  });
}

// ===========================================
// Routes
// ===========================================

/**
 * GET /api/google-images/search
 * Search Google Images with filters and pagination
 */
googleImagesRoutes.get(
  '/search',
  requireAuth,
  requireAdmin,
  validateQuery(searchQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { query, limit, start, safeSearch, imageSize, imageType, fileType } = req.query as any;

      // Check if Google API is configured
      if (!config.google.apiKey || !config.google.searchEngineId) {
        throw new BadRequestError('Google API is not configured. Please set GOOGLE_API_KEY and GOOGLE_SEARCH_ENGINE_ID environment variables.');
      }

      // Generate cache key
      const cacheKey = generateCacheKey({ query, limit, start, safeSearch, imageSize, imageType, fileType });

      // Check cache
      const cached = searchCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return sendSuccess(res, cached.data);
      }

      // Initialize client
      const client = getCustomSearchClient();

      // Build search params
      const searchParams: any = {
        auth: config.google.apiKey,
        cx: config.google.searchEngineId,
        q: query,
        searchType: 'image',
        num: limit || 10,
        start: start || 1,
        safe: safeSearch || 'medium',
      };

      if (imageSize) {searchParams.imgSize = imageSize;}
      if (imageType) {searchParams.imgType = imageType;}
      if (fileType) {searchParams.fileType = fileType;}

      // Execute search
      const response = await client.cse.list(searchParams);

      if (!response || !response.data) {
        throw new BadRequestError('Invalid response from Google API');
      }

      const result = {
        query,
        results: (response.data.items || []).map((item: any) => ({
          title: item.title,
          link: item.link,
          thumbnail: item.image?.thumbnailLink,
          displayLink: item.displayLink,
          snippet: item.snippet,
          mime: item.mime,
          image: {
            contextLink: item.image?.contextLink,
            height: item.image?.height,
            width: item.image?.width,
            byteSize: item.image?.byteSize,
            thumbnailLink: item.image?.thumbnailLink,
            thumbnailHeight: item.image?.thumbnailHeight,
            thumbnailWidth: item.image?.thumbnailWidth,
          },
        })),
        totalResults: response.data.searchInformation?.totalResults || '0',
        searchTime: response.data.searchInformation?.searchTime || 0,
        pagination: {
          start: start || 1,
          limit: limit || 10,
          hasNextPage: !!response.data.queries?.nextPage,
          nextStart: response.data.queries?.nextPage?.[0]?.startIndex,
        },
      };

      // Cache the result
      searchCache.set(cacheKey, { data: result, timestamp: Date.now() });

      // Clean old cache entries
      if (searchCache.size > 100) {
        const entries = Array.from(searchCache.entries())
          .sort((a, b) => a[1].timestamp - b[1].timestamp);
        const oldestEntry = entries[0];
        if (oldestEntry) {
          searchCache.delete(oldestEntry[0]);
        }
      }

      sendSuccess(res, result);
    } catch (error: any) {
      // Handle specific Google API errors
      if (error.code === 429) {
        return next(new BadRequestError('Daily API quota exceeded. Please try again tomorrow.'));
      }
      if (error.code === 403) {
        return next(new BadRequestError('Invalid API credentials. Please check your Google API configuration.'));
      }
      if (error.code === 400 || error.message?.includes('invalid argument')) {
        return next(new BadRequestError('Invalid search parameters. Google limits results to 100 total (pages 1-10).'));
      }
      next(error);
    }
  }
);

/**
 * POST /api/google-images/upload-to-imagekit
 * Download images from URLs and upload to ImageKit
 * Returns ImageKit URLs to be saved in the database
 */
googleImagesRoutes.post(
  '/upload-to-imagekit',
  requireAuth,
  requireAdmin,
  validateBody(downloadSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { imageUrl, imageUrls, folder } = req.body;

      // Determine if single or batch upload
      const urls: string[] = imageUrls || (imageUrl ? [imageUrl] : []);

      if (urls.length === 0) {
        throw new BadRequestError('At least one image URL is required');
      }

      const ik = getImageKit();

      const results = await Promise.all(
        urls.map(async (url: string, index: number) => {
          try {
            // Generate unique filename
            const timestamp = Date.now();
            const random = Math.random().toString(36).substring(2, 8);
            const urlPath = new URL(url).pathname;
            const extension = urlPath.split('.').pop()?.toLowerCase() || 'jpg';
            const fileName = `google-image-${timestamp}-${index}-${random}.${extension}`;

            // Upload to ImageKit using URL
            const uploadResult = await ik.upload({
              file: url, // ImageKit accepts URL directly
              fileName,
              folder: folder || '/products',
              useUniqueFileName: true,
              tags: ['google-images', 'product-image'],
            });

            return {
              success: true,
              originalUrl: url,
              imagekitUrl: uploadResult.url,
              imagekitFileId: uploadResult.fileId,
              thumbnailUrl: uploadResult.thumbnailUrl,
              metadata: {
                width: uploadResult.width,
                height: uploadResult.height,
                size: uploadResult.size,
                fileType: uploadResult.fileType,
                filePath: uploadResult.filePath,
              },
            };
          } catch (error: any) {
            console.error(`Failed to upload image: ${url}`, error.message);
            return {
              success: false,
              originalUrl: url,
              error: error.message || 'Upload failed',
            };
          }
        })
      );

      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.length - successCount;

      // Extract just the successful ImageKit URLs for easy access
      const imagekitUrls = results
        .filter((r) => r.success)
        .map((r) => r.imagekitUrl);

      sendSuccess(res, {
        results,
        imagekitUrls, // Array of successful ImageKit URLs ready to use
        summary: {
          total: results.length,
          success: successCount,
          failed: failureCount,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/google-images/cache-stats
 * Get cache statistics (Admin only)
 */
googleImagesRoutes.get(
  '/cache-stats',
  requireAuth,
  requireAdmin,
  async (_req: Request, res: Response) => {
    const now = Date.now();
    const entries = Array.from(searchCache.entries()).map(([key, entry]) => {
      const parsed = JSON.parse(key);
      return {
        query: parsed.q,
        age: Math.floor((now - entry.timestamp) / 1000),
      };
    });

    sendSuccess(res, {
      size: searchCache.size,
      ttl: Math.floor(CACHE_TTL / 1000),
      entries,
    });
  }
);

/**
 * DELETE /api/google-images/cache
 * Clear the search cache (Admin only)
 */
googleImagesRoutes.delete(
  '/cache',
  requireAuth,
  requireAdmin,
  async (_req: Request, res: Response) => {
    const size = searchCache.size;
    searchCache.clear();
    sendSuccess(res, { cleared: size });
  }
);
