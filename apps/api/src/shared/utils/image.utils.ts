/**
 * Image processing utilities
 * @module shared/utils/image
 */

import sharp from 'sharp';
import { isValid, getTime } from 'date-fns';
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
