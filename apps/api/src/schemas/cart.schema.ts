/**
 * Cart domain schema (Zod)
 * @module schemas/cart
 */

import { z } from 'zod';
import { CartMetadata } from '@/shared/types/types';
import type { Id } from '@/shared/utils/branded-ids.utils';
import { zId } from '@/shared/utils/branded-ids.utils';

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
