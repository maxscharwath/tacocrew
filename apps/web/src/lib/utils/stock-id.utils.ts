/**
 * Utilities for generating deterministic stock item IDs
 * These match the backend's deterministicUUID function
 */

import { NIL, v5 } from 'uuid';

/**
 * Resolve namespace for UUID generation (matches backend logic)
 */
function resolveNamespace(namespace?: string): string {
  if (!namespace) {
    return NIL;
  }
  // If namespace is already a valid UUID, return it
  // Otherwise, convert it to a UUID first (backend does this)
  try {
    // Try to parse as UUID
    if (namespace.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return namespace;
    }
    // Convert string namespace to UUID
    return v5(namespace, NIL);
  } catch {
    return NIL;
  }
}

/**
 * Generate a deterministic UUID (v5) from a seed and namespace
 * Matches the backend's deterministicUUID function
 */
function deterministicUUID(seed: string, namespace?: string): string {
  return v5(seed, resolveNamespace(namespace));
}

/**
 * Generate stock item ID from code and category
 * This matches the backend's ID generation logic
 */
export function getStockItemId(
  code: string,
  category: 'meats' | 'sauces' | 'garnishes' | 'extras' | 'drinks' | 'desserts'
): string {
  // Use the category string directly as namespace (backend uses StockCategory enum values)
  return deterministicUUID(code, category);
}
