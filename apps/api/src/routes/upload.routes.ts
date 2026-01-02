import { Router } from 'express';
import { z } from 'zod';
import ImageKit from 'imagekit';
import { validateBody } from '../middleware/validator';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { sendSuccess } from '../utils/response';
import { BadRequestError } from '../utils/errors';
import { config } from '../config';

export const uploadRoutes = Router();

// Initialize ImageKit
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

const uploadSchema = z.object({
  file: z.string().min(1), // Base64 encoded file
  fileName: z.string().min(1).max(255),
  folder: z.string().optional().default('/uploads'),
});

const uploadUrlSchema = z.object({
  url: z.string().url(),
  fileName: z.string().min(1).max(255),
  folder: z.string().optional().default('/uploads'),
});

const deleteSchema = z.object({
  fileId: z.string().min(1),
});

// ===========================================
// Auth Required for All Routes
// ===========================================

uploadRoutes.use(requireAuth, requireAdmin);

// ===========================================
// Routes
// ===========================================

/**
 * GET /api/upload/auth
 * Get ImageKit authentication parameters for client-side uploads
 */
uploadRoutes.get('/auth', async (req, res, next) => {
  try {
    const ik = getImageKit();
    const authParams = ik.getAuthenticationParameters();

    sendSuccess(res, authParams);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/upload
 * Upload a file (base64)
 */
uploadRoutes.post(
  '/',
  validateBody(uploadSchema),
  async (req, res, next) => {
    try {
      const ik = getImageKit();
      const { file, fileName, folder } = req.body;

      const result = await ik.upload({
        file,
        fileName,
        folder,
        useUniqueFileName: true,
      });

      sendSuccess(res, {
        fileId: result.fileId,
        name: result.name,
        url: result.url,
        thumbnailUrl: result.thumbnailUrl,
        filePath: result.filePath,
        fileType: result.fileType,
        size: result.size,
        width: result.width,
        height: result.height,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/upload/from-url
 * Upload a file from URL
 */
uploadRoutes.post(
  '/from-url',
  validateBody(uploadUrlSchema),
  async (req, res, next) => {
    try {
      const ik = getImageKit();
      const { url, fileName, folder } = req.body;

      const result = await ik.upload({
        file: url,
        fileName,
        folder,
        useUniqueFileName: true,
      });

      sendSuccess(res, {
        fileId: result.fileId,
        name: result.name,
        url: result.url,
        thumbnailUrl: result.thumbnailUrl,
        filePath: result.filePath,
        fileType: result.fileType,
        size: result.size,
        width: result.width,
        height: result.height,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/upload/:fileId
 * Delete a file
 */
uploadRoutes.delete('/:fileId', async (req, res, next) => {
  try {
    const ik = getImageKit();
    const { fileId } = req.params;

    await ik.deleteFile(fileId);

    sendSuccess(res, { message: 'File deleted successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/upload/list
 * List files in a folder
 */
uploadRoutes.get('/list', async (req, res, next) => {
  try {
    const ik = getImageKit();
    const { folder, limit, skip } = req.query;

    const files = await ik.listFiles({
      path: (folder as string) || '/uploads',
      limit: limit ? parseInt(limit as string) : 20,
      skip: skip ? parseInt(skip as string) : 0,
    });

    sendSuccess(res, files);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/upload/:fileId
 * Get file details
 */
uploadRoutes.get('/:fileId', async (req, res, next) => {
  try {
    const ik = getImageKit();
    const { fileId } = req.params;

    const file = await ik.getFileDetails(fileId);

    sendSuccess(res, file);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/upload/bulk-delete
 * Delete multiple files
 */
uploadRoutes.post(
  '/bulk-delete',
  validateBody(z.object({ fileIds: z.array(z.string()).min(1).max(100) })),
  async (req, res, next) => {
    try {
      const ik = getImageKit();
      const { fileIds } = req.body;

      await ik.bulkDeleteFiles(fileIds);

      sendSuccess(res, {
        message: `${fileIds.length} files deleted successfully`,
        deletedCount: fileIds.length,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/upload/transform
 * Get transformed image URL
 */
uploadRoutes.get('/transform/:filePath(*)', async (req, res, next) => {
  try {
    const ik = getImageKit();
    const { filePath } = req.params;
    const { width, height, quality, format, crop } = req.query;

    const transformations: Array<{ width?: number; height?: number; quality?: number; format?: string; cropMode?: string }> = [];

    if (width || height || quality || format || crop) {
      const transform: typeof transformations[0] = {};
      if (width) transform.width = parseInt(width as string);
      if (height) transform.height = parseInt(height as string);
      if (quality) transform.quality = parseInt(quality as string);
      if (format) transform.format = format as string;
      if (crop) transform.cropMode = crop as string;
      transformations.push(transform);
    }

    const url = ik.url({
      path: `/${filePath}`,
      transformation: transformations.length > 0 ? transformations : undefined,
    });

    sendSuccess(res, { url });
  } catch (error) {
    next(error);
  }
});
