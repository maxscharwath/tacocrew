/**
 * Cart domain schema (Zod)
 * @module domain/schemas/cart
 */

import { z } from 'zod';
import type { Id } from '@/domain/entities/branded-types';
import { zId } from '@/domain/entities/branded-types';
import { CartMetadata } from '@/types';

/**
 * Cart ID type - branded string
 */
export type CartId = Id<'Cart'>;

/**
 * Parse a string to CartId
 */
export const CartIdSchema = zId<CartId>();

/**
 * Cart schema using Zod
 */
export const CartSchema = z.object({
  id: zId<CartId>(),
  metadata: z.custom<CartMetadata>(),
});

export type Cart = z.infer<typeof CartSchema>;
