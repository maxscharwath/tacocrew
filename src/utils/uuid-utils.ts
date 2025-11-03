/**
 * UUID utilities
 * @module utils/uuid-utils
 */

import { validate as isUUID, NIL, v4 as v4, v5 as v5 } from 'uuid';

/**
 * Default namespace for deterministic UUID generation (tacobot domain)
 */
const DEFAULT_NAMESPACE = NIL;

/**
 * Generate a random UUID (v4)
 * @returns A random UUID string
 */
export const randomUUID = () => v4();

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
  v5(seed, namespace ? (isUUID(namespace) ? namespace : v5(namespace, NIL)) : DEFAULT_NAMESPACE);

/**
 * Validate if a string is a valid UUID
 * @param uuid - The string to validate
 * @returns true if the string is a valid UUID, false otherwise
 */
export { isUUID };
