/**
 * UUID utilities
 * @module utils/uuid-utils
 */

import { NIL, v4, v5, validate } from 'uuid';

/**
 * Default namespace for deterministic UUID generation (tacocrew domain)
 */
const DEFAULT_NAMESPACE = NIL;

/**
 * Generate a random UUID (v4)
 * @returns A random UUID string
 */
export const randomUUID = () => v4();

/**
 * Resolve namespace for UUID generation
 */
function resolveNamespace(namespace?: string): string {
  if (!namespace) {
    return DEFAULT_NAMESPACE;
  }
  if (validate(namespace)) {
    return namespace;
  }
  return v5(namespace, NIL);
}

/**
 * Generate a deterministic UUID (v5) from a seed
 * Uses UUID v5 (namespace-based) to ensure the same seed always produces the same UUID
 *
 * @param seed - The seed string to generate UUID from
 * @param namespace - Optional namespace UUID or string. If not provided, uses NIL namespace.
 *                   If a string is provided and not a valid UUID, it will be converted to a UUID first.
 * @returns A deterministic UUID string
 */
export const deterministicUUID = (seed: string, namespace?: string) =>
  v5(seed, resolveNamespace(namespace));

/**
 * Validate if a string is a valid UUID
 * @param uuidString - The string to validate
 * @returns true if the string is a valid UUID, false otherwise
 */
export const isUUID = (uuidString: string): boolean => validate(uuidString);
