/**
 * Order domain schema (Zod)
 * @module domain/schemas/order
 */

import { z } from 'zod';
import type { Id } from '@/domain/entities/branded-types';
import { zId } from '@/domain/entities/branded-types';
import type { CartId } from '@/domain/schemas/cart.schema';
import type { UserId } from '@/domain/schemas/user.schema';
import { OrderStatus } from '@/types';

/**
 * Order ID type - branded string
 */
export type OrderId = Id<'Order'>;

/**
 * Parse a string to OrderId
 */
export const OrderIdSchema = zId<OrderId>();

/**
 * Order schema using Zod
 */
export const OrderSchema = z.object({
  id: zId<OrderId>(),
  cartId: zId<CartId>(),
  customerName: z.string(),
  customerPhone: z.string(),
  orderType: z.enum(['livraison', 'emporter']),
  requestedFor: z.string(),
  status: z.enum(['pending', 'confirmed', 'ondelivery', 'delivered', 'cancelled']),
  price: z.number().optional(),
  address: z.string().optional(),
  userId: zId<UserId>().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type Order = z.infer<typeof OrderSchema>;

/**
 * Check if order is pending
 */
export function isOrderPending(order: Order): boolean {
  return order.status === OrderStatus.PENDING;
}

/**
 * Check if order belongs to user
 */
export function orderBelongsTo(order: Order, userId: UserId): boolean {
  return order.userId === userId;
}
