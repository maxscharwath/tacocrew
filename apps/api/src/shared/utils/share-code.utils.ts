/**
 * Share code utilities
 * @module shared/utils/share-code
 */

import { randomBytes } from 'node:crypto';

/**
 * Generate a short, memorable share code
 * Format: Uppercase prefix + 4-6 random alphanumeric characters
 * Example: "FRIDAY123", "TACO456", "ORDER789"
 */
export function generateShareCode(prefix = 'ORDER'): string {
  // Generate 4 random alphanumeric characters
  const randomPart = randomBytes(3)
    .toString('base64')
    .replaceAll(/[^A-Z0-9]/g, '')
    .substring(0, 4)
    .toUpperCase();

  // Combine prefix with random part
  return `${prefix.toUpperCase()}${randomPart}`;
}

/**
 * Validate share code format
 */
export function isValidShareCode(code: string): boolean {
  // Share code should be uppercase alphanumeric, 6-12 characters
  return /^[A-Z0-9]{6,12}$/.test(code);
}
