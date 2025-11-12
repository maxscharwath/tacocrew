/**
 * CSRF token extraction from HTML
 * @module gigatacos-client/parsers/csrf
 */

import { load } from 'cheerio';
import type { Logger } from '../types';
import { noopLogger } from '../utils/logger';

/**
 * Extract CSRF token from HTML page
 * Looks for input element with name="csrf_token" and id="csrf_token"
 */
export function extractCsrfTokenFromHtml(html: string, logger: Logger = noopLogger): string | null {
  try {
    const $ = load(html);

    // Try to find by id first (more specific)
    const $tokenInput = $('#csrf_token');
    if ($tokenInput.length) {
      const token = $tokenInput.attr('value');
      if (token) {
        logger.debug('CSRF token extracted from HTML by id', {
          tokenLength: token.length,
        });
        return token;
      }
    }

    // Fallback: try to find by name attribute
    const $tokenByName = $('input[name="csrf_token"]');
    if ($tokenByName.length) {
      const token = $tokenByName.attr('value');
      if (token) {
        logger.debug('CSRF token extracted from HTML by name', {
          tokenLength: token.length,
        });
        return token;
      }
    }

    logger.warn('CSRF token not found in HTML');
    return null;
  } catch (error) {
    logger.error('Failed to extract CSRF token from HTML', {
      errorMessage: error instanceof Error ? error.message : String(error),
      errorName: error instanceof Error ? error.name : typeof error,
    });
    return null;
  }
}

