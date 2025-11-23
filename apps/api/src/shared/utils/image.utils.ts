/**
 * Image processing utilities
 * @module shared/utils/image
 */

import { createHash } from 'node:crypto';
import { getTime, isValid } from 'date-fns';
import sharp from 'sharp';
import { logger } from './logger.utils';

const MAX_IMAGE_SIZE = 512;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const QUALITY = 85;
const DEFAULT_BG_COLOR = '#0f172a'; // slate-950
const VALID_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']);

type UploadableFile = Pick<Blob, 'arrayBuffer' | 'size' | 'type'>;

function ensureValidFile(file: UploadableFile): void {
  if (!file.size || file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds ${(MAX_FILE_SIZE / (1024 * 1024)).toFixed(1)}MB limit`);
  }
  if (!file.type || !VALID_TYPES.has(file.type)) {
    throw new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.');
  }
}

/**
 * Process and compress an image file.
 * Resizes to max 512x512, converts to WebP, and returns a Buffer.
 */
export async function processProfileImage(
  file: UploadableFile,
  backgroundColor?: string
): Promise<Buffer> {
  ensureValidFile(file);

  const buffer = Buffer.from(await file.arrayBuffer());
  const bgColor = backgroundColor || DEFAULT_BG_COLOR;

  const processedBuffer = await sharp(buffer)
    .rotate()
    .flatten({ background: bgColor })
    .resize(MAX_IMAGE_SIZE, MAX_IMAGE_SIZE, {
      fit: 'cover',
      withoutEnlargement: true,
    })
    .webp({ quality: QUALITY })
    .toBuffer();

  logger.debug('Image processed', {
    originalSize: file.size,
    processedSize: processedBuffer.length,
    compressionRatio: `${((1 - processedBuffer.length / file.size) * 100).toFixed(2)}%`,
    hasBackground: Boolean(backgroundColor),
  });

  return processedBuffer;
}

/**
 * Apply DPR multiplier to dimensions (like Cloudinary/Imgix)
 */
function applyDprToDimensions(
  width?: number,
  height?: number,
  size?: number,
  dpr?: number
): { width?: number; height?: number; size?: number } {
  if (!dpr || dpr <= 1) {
    return { width, height, size };
  }

  if (size) {
    return { size: Math.round(size * dpr) };
  }

  return {
    width: width ? Math.round(width * dpr) : undefined,
    height: height ? Math.round(height * dpr) : undefined,
  };
}

/**
 * Build ETag key for avatar caching (includes dimensions and dpr)
 */
function buildAvatarEtagKey(width?: number, height?: number, size?: number, dpr?: number): string {
  const parts: string[] = [];

  if (size) {
    parts.push(`size-${size}`);
  } else if (width || height) {
    parts.push(`w${width ?? 0}-h${height ?? 0}`);
  } else {
    parts.push('original');
  }

  if (dpr && dpr > 1) {
    parts.push(`dpr${dpr}`);
  }

  return parts.join('-');
}

/**
 * Resize an image buffer to specified dimensions
 * Never upscales beyond original size to prevent bandwidth attacks
 */
export async function resizeImage(
  imageBuffer: Buffer,
  width?: number,
  height?: number,
  size?: number
): Promise<Buffer> {
  const targetWidth = size ?? width;
  const targetHeight = size ?? height;

  if (!targetWidth && !targetHeight) {
    return imageBuffer;
  }

  // Get original image dimensions to prevent upscaling
  const metadata = await sharp(imageBuffer).metadata();
  const originalWidth = metadata.width ?? 0;
  const originalHeight = metadata.height ?? 0;

  // Cap dimensions to original size (prevent bandwidth attacks)
  const cappedWidth = targetWidth ? Math.min(targetWidth, originalWidth) : undefined;
  const cappedHeight = targetHeight ? Math.min(targetHeight, originalHeight) : undefined;

  if (!cappedWidth && !cappedHeight) {
    return imageBuffer;
  }

  return await sharp(imageBuffer)
    .resize(cappedWidth, cappedHeight, {
      fit: 'cover',
      withoutEnlargement: true,
    })
    .webp({ quality: QUALITY })
    .toBuffer();
}

/**
 * Process avatar image with resizing and DPR support
 * Returns the processed image buffer and ETag for caching
 */
export async function processAvatarImage(
  imageBuffer: Buffer,
  options?: { width?: number; height?: number; size?: number; dpr?: number }
): Promise<{ buffer: Buffer; etag: string }> {
  const { width, height, size, dpr } = options ?? {};
  const {
    width: targetWidth,
    height: targetHeight,
    size: targetSize,
  } = applyDprToDimensions(width, height, size, dpr);

  const processedBuffer = await resizeImage(imageBuffer, targetWidth, targetHeight, targetSize);

  // Build ETag using original dimensions + dpr (not DPR-adjusted dimensions)
  // This ensures same ETag for same request params regardless of processing
  const etagKey = buildAvatarEtagKey(width, height, size, dpr);
  const etag = `"${createHash('sha1').update(imageBuffer).update(etagKey).digest('hex')}"`;

  return { buffer: processedBuffer, etag };
}

export function buildAvatarUrl(user: {
  id: string;
  hasImage?: boolean;
  updatedAt?: Date | string | null;
}): string | null {
  if (!user.hasImage) return null;

  const date = user.updatedAt;
  const version = date && isValid(date) ? getTime(date).toString() : null;
  const basePath = `/api/v1/users/${user.id}/avatar`;

  return version ? `${basePath}?v=${version}` : basePath;
}
