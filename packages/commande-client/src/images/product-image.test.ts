import { describe, expect, test as it } from 'bun:test';
import { ValidationError } from '../errors';
import { resolveProductImage } from './product-image';

const SAMPLE_URL = 'https://commande.app/uploads/products/1776718615649-fd29d26d37b70e45.jpg';

describe('resolveProductImage', () => {
  it('returns the URL unchanged when no opts are given', () => {
    expect(resolveProductImage(SAMPLE_URL)).toBe(SAMPLE_URL);
  });

  it('returns the URL unchanged when opts is empty', () => {
    expect(resolveProductImage(SAMPLE_URL, {})).toBe(SAMPLE_URL);
  });

  it('builds a Next.js image optimizer URL with width + quality', () => {
    const result = resolveProductImage(SAMPLE_URL, { width: 400, quality: 75 });
    const parsed = new URL(result);
    expect(parsed.origin).toBe('https://commande.app');
    expect(parsed.pathname).toBe('/_next/image/');
    expect(parsed.searchParams.get('url')).toBe(SAMPLE_URL);
    expect(parsed.searchParams.get('w')).toBe('400');
    expect(parsed.searchParams.get('q')).toBe('75');
  });

  it('defaults quality to 75 when only width is given', () => {
    const result = resolveProductImage(SAMPLE_URL, { width: 256 });
    expect(new URL(result).searchParams.get('q')).toBe('75');
  });

  it('throws ValidationError on empty string', () => {
    expect(() => resolveProductImage('')).toThrow(ValidationError);
  });
});
