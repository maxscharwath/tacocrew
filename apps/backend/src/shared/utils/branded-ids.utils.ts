/**
 * Type-safe ID utilities - Branded types for IDs
 * @module shared/utils/ids
 */

import { z } from 'zod';

/**
 * Brand type helper for creating branded types
 */
export type Brand<T, B> = T & { __brand: B };

/**
 * Generic ID type - branded string
 */
export type Id<T extends string = string> = Brand<string, T>;

/**
 * Create a Zod schema for a branded ID type
 */
export function zId<T extends Id<string>>() {
  return z.uuid().transform((val) => val as T);
}
