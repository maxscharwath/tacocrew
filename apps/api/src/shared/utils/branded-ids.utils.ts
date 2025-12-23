/**
 * Type-safe ID utilities - Branded types for IDs
 * @module shared/utils/ids
 */

import { z } from 'zod';
import { randomUUID } from './uuid.utils';

/**
 * Brand type helper for creating branded types
 */
export type Brand<T, B> = T & { __brand: B };

/**
 * Generic ID type - branded string
 */
export type Id<T extends string = string> = Brand<string, T>;

/**
 * Extended Zod schema with create method for branded IDs
 * The transform ensures parse() returns the branded type T
 */
type IdSchema<T extends Id> = z.ZodType<T> & {
  create: () => T;
};

/**
 * Create a Zod schema for a branded ID type with a create() method
 */
export function zId<T extends Id>(): IdSchema<T> {
  const baseSchema = z.uuid().transform((val) => val as T);
  const schema = baseSchema as unknown as IdSchema<T>;
  
  schema.create = () => baseSchema.parse(randomUUID()) as T;
  
  return schema;
}
