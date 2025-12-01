import { ENV } from '@/lib/env';

/**
 * Get device pixel ratio, capped at 2
 */
function getDevicePixelRatio(): number {
  return Math.min(window.devicePixelRatio ?? 1, 2);
}

/**
 * Resolve image URL with optional size parameters (Cloudinary/Imgix pattern)
 */
export function resolveImageUrl(
  imageUrl: string | null | undefined,
  options?: { size?: number; w?: number; h?: number; dpr?: number }
): string | undefined {
  if (!imageUrl) return undefined;

  // Non-avatar URLs or no options: just resolve base URL
  if (!options || !imageUrl.includes('/avatar')) {
    return ENV.apiBaseUrl ? new URL(imageUrl, ENV.apiBaseUrl).toString() : imageUrl;
  }

  // Handle both absolute and relative URLs
  const baseUrl = imageUrl.startsWith('http')
    ? undefined
    : (ENV.apiBaseUrl ?? globalThis.location.origin);
  const url = baseUrl ? new URL(imageUrl, baseUrl) : new URL(imageUrl);

  // Clear size/dpr params
  url.searchParams.delete('size');
  url.searchParams.delete('w');
  url.searchParams.delete('h');
  url.searchParams.delete('dpr');

  // Set size params
  if (options.size) {
    url.searchParams.set('size', options.size.toString());
  } else {
    if (options.w) url.searchParams.set('w', options.w.toString());
    if (options.h) url.searchParams.set('h', options.h.toString());
  }

  // Add dpr (auto-detect if not specified)
  const dpr = options.dpr ?? getDevicePixelRatio();
  if (dpr > 1) {
    url.searchParams.set('dpr', dpr.toString());
  }

  // Always return full URL to ensure proper image loading
  return url.toString();
}

/**
 * Get avatar size in pixels based on Avatar component size prop
 */
export function getAvatarSizePixels(size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'): number {
  const sizeMap: Record<string, number> = {
    xs: 24,
    sm: 32,
    md: 48,
    lg: 64,
    xl: 96,
    '2xl': 96,
  };
  return sizeMap[size] || 48;
}
