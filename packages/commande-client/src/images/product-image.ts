import { ValidationError } from '../errors';

export type ResolveProductImageOptions = {
  readonly width?: number;
  readonly quality?: number;
};

const DEFAULT_QUALITY = 75;

export function resolveProductImage(url: string, opts?: ResolveProductImageOptions): string {
  if (typeof url !== 'string' || url.length === 0) {
    throw new ValidationError('resolveProductImage requires a non-empty url');
  }

  if (!opts || (opts.width === undefined && opts.quality === undefined)) {
    return url;
  }

  let origin: string;
  try {
    origin = new URL(url).origin;
  } catch (cause) {
    throw new ValidationError(`resolveProductImage received invalid URL: ${url}`, { cause });
  }

  const params = new URLSearchParams();
  params.set('url', url);
  if (opts.width !== undefined) {
    params.set('w', String(opts.width));
  }
  params.set('q', String(opts.quality ?? DEFAULT_QUALITY));
  return `${origin}/_next/image/?${params.toString()}`;
}
