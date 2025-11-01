/**
 * Deterministic UUID generation utility
 * Generates UUIDs deterministically based on a seed
 * @module utils/deterministic-uuid
 */

import { v5 as uuidv5, v4 as uuidv4 } from 'uuid';

/**
 * UUID namespace for deterministic generation
 * This is a fixed namespace UUID for generating deterministic UUIDs
 */
const DETERMINISTIC_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

/**
 * Generate a deterministic UUID from an item ID
 * Uses UUID v5 (namespace-based) to ensure the same item ID always produces the same UUID
 *
 * @param itemId - The item ID to use as seed
 * @returns A deterministic UUID string
 */
export function generateDeterministicUUID(itemId: string): string {
  return uuidv5(itemId, DETERMINISTIC_NAMESPACE);
}

/**
 * Generate a deterministic UUID for a taco item
 * Combines multiple attributes to create a unique identifier
 *
 * @param size - Taco size
 * @param meats - Array of meat IDs with quantities
 * @param sauces - Array of sauce IDs
 * @param garnitures - Array of garniture IDs
 * @param note - Optional note
 * @returns A deterministic UUID string
 */
export function generateTacoDeterministicUUID(params: {
  size: string;
  meats: Array<{ id: string; quantity: number }>;
  sauces: string[];
  garnitures: string[];
  note?: string;
}): string {
  // Create a deterministic seed from taco attributes
  const seed = [
    params.size,
    ...params.meats.sort((a, b) => a.id.localeCompare(b.id)).map((m) => `${m.id}:${m.quantity}`),
    ...params.sauces.sort().join(','),
    ...params.garnitures.sort().join(','),
    params.note || '',
  ].join('|');

  return generateDeterministicUUID(seed);
}

/**
 * Generate a deterministic UUID for a simple item (extra, drink, dessert)
 *
 * @param itemId - The item ID
 * @param quantity - The quantity
 * @returns A deterministic UUID string
 */
export function generateItemDeterministicUUID(itemId: string, quantity: number): string {
  const seed = `${itemId}:${quantity}`;
  return generateDeterministicUUID(seed);
}

/**
 * Check if a UUID is a deterministic one (starts with namespace pattern)
 * This is just a helper and not used for validation, but can be useful for debugging
 */
export function isDeterministicUUID(uuid: string): boolean {
  // All our deterministic UUIDs are v5 UUIDs from the same namespace
  // This function checks if a UUID follows the pattern, but note that
  // UUID v5 from our namespace will always produce predictable results
  return uuid.length === 36 && uuid.match(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i) !== null;
}
