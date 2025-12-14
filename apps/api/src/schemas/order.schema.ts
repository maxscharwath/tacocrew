/**
 * Order domain schema (Zod)
 * @module schemas/order
 */

import { OrderStatus, OrderType } from '@tacocrew/gigatacos-client';
import { z } from 'zod';
import { CartId } from '@/schemas/cart.schema';
import { UserId } from '@/schemas/user.schema';
import type { Id } from '@/shared/utils/branded-ids.utils';
import { zId } from '@/shared/utils/branded-ids.utils';

/**
 * Order ID type - branded string
 */
export type OrderId = Id<'Order'>;

/**
 * Parse a string to OrderId
 */
export const OrderId = zId<OrderId>();

/**
 * Order schema using Zod
 */
export const OrderSchema = z.object({
  id: OrderId,
  cartId: CartId,
  customerName: z.string(),
  customerPhone: z.string(),
  orderType: z.enum(OrderType),
  requestedFor: z.string(),
  status: z.enum(OrderStatus),
  price: z.number().optional(),
  address: z.string().optional(),
  userId: UserId.optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
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
