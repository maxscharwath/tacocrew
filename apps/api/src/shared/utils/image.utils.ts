/**
 * Image processing utilities
 * @module shared/utils/image
 */

import sharp from 'sharp';
import { logger } from './logger.utils';

const MAX_IMAGE_SIZE = 512; // Maximum width/height in pixels
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB max file size
const QUALITY = 85; // WebP quality (0-100)
const OUTPUT_MIME_TYPE = 'image/webp';
const VALID_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']);

type UploadableFile = Pick<Blob, 'arrayBuffer' | 'size' | 'type'> & { readonly name?: string };

function getMimeType(file: UploadableFile): string {
  if (file.type) {
    return file.type;
  }
  if (!file.name) {
    return '';
  }
  const extension = file.name.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    default:
      return '';
  }
}

function ensureValidFile(file: UploadableFile) {
  if (!file.size || Number.isNaN(file.size)) {
    throw new Error('Image file is empty.');
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds ${(MAX_FILE_SIZE / (1024 * 1024)).toFixed(1)}MB limit`);
  }
  const mimeType = getMimeType(file);
  if (!VALID_TYPES.has(mimeType)) {
    throw new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.');
  }
  return mimeType;
}

/**
 * Convert hex color to RGB array for Sharp
 */
function hexToRgb(hex: string): [number, number, number] | null {
  // Remove # if present
  const cleanHex = hex.replace('#', '');
  
  // Handle 3-digit hex
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    return [r, g, b];
  }
  
  // Handle 6-digit hex
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return [r, g, b];
  }
  
  return null;
}

/**
 * Process and compress an image file.
 * Resizes to max 512x512, converts to WebP, and returns a Buffer.
 * Optionally composites the image over a background color for transparent images.
 */
export async function processProfileImage(
  file: UploadableFile,
  backgroundColor?: string
): Promise<Buffer> {
  try {
    const mimeType = ensureValidFile(file);

    // Convert File/Blob to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create sharp instance and resize first
    let image = sharp(buffer)
      .rotate() // Honor EXIF orientation
      .resize(MAX_IMAGE_SIZE, MAX_IMAGE_SIZE, {
        fit: 'cover',
        position: 'center',
        withoutEnlargement: true,
      });

    // If background color is provided, composite the image over a colored background
    if (backgroundColor) {
      const rgb = hexToRgb(backgroundColor);
      if (rgb) {
        // Get resized image metadata to determine final dimensions
        const metadata = await image.metadata();
        const width = metadata.width || MAX_IMAGE_SIZE;
        const height = metadata.height || MAX_IMAGE_SIZE;

        // Create a background image with the specified color
        const background = sharp({
          create: {
            width,
            height,
            channels: 3,
            background: { r: rgb[0], g: rgb[1], b: rgb[2] },
          },
        });

        // Composite the resized image over the background
        image = background.composite([
          {
            input: await image.toBuffer(),
            blend: 'over',
          },
        ]);
      }
    }

    // Convert to WebP
    const processedBuffer = await image.webp({ quality: QUALITY }).toBuffer();

    logger.debug('Image processed successfully', {
      originalSize: file.size,
      processedSize: processedBuffer.length,
      compressionRatio: file.size
        ? ((1 - processedBuffer.length / file.size) * 100).toFixed(2) + '%'
        : undefined,
      originalMime: mimeType,
      outputMime: OUTPUT_MIME_TYPE,
      hasBackground: Boolean(backgroundColor),
    });

    return processedBuffer;
  } catch (error) {
    logger.error('Failed to process image', { error });
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to process image');
  }
}

function toTimestamp(value?: Date | string | null): string | null {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return value.getTime().toString();
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime().toString();
}

export function buildAvatarUrl(user: {
  id: string;
  hasImage?: boolean;
  updatedAt?: Date | string | null;
}): string | null {
  if (!user.hasImage) {
    return null;
  }
  const version = toTimestamp(user.updatedAt);
  const basePath = `/api/v1/users/${user.id}/avatar`;
  return version ? `${basePath}?v=${version}` : basePath;
}
