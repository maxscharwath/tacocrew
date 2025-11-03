/**
 * User order domain schema (Zod)
 * @module domain/schemas/user-order
 */

import { z } from 'zod';
import type { Id } from '@/domain/entities/branded-types';
import { zId } from '@/domain/entities/branded-types';
import type { GroupOrderId } from '@/domain/schemas/group-order.schema';
import type { UserId } from '@/domain/schemas/user.schema';
import { UserOrderItems, UserOrderStatus } from '@/types';

/**
 * User Order ID type - branded string
 */
export type UserOrderId = Id<'UserOrder'>;

/**
 * User order schema using Zod
 */
export const UserOrderSchema = z.object({
  id: zId<UserOrderId>(),
  groupOrderId: zId<GroupOrderId>(),
  userId: zId<UserId>(),
  username: z.string().optional(),
  items: z.custom<UserOrderItems>(),
  status: z.nativeEnum(UserOrderStatus),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type UserOrder = z.infer<typeof UserOrderSchema>;

/**
 * User order from database
 */
export const UserOrderFromDbSchema = z.object({
  id: z.string(), // UUID from DB as string
  groupOrderId: z.string(), // UUID from DB as string
  userId: z.string(), // UUID from DB as string
  status: z.string(),
  items: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  user: z
    .object({
      username: z.string().nullish(),
    })
    .optional(),
});

/**
 * Create UserOrder from database model
 */
export function createUserOrderFromDb(data: z.infer<typeof UserOrderFromDbSchema>): UserOrder {
  return UserOrderSchema.parse({
    id: data.id, // Will be validated as UUID and transformed
    groupOrderId: data.groupOrderId, // Will be validated as UUID and transformed
    userId: data.userId, // Will be validated as UUID and transformed
    username: data.user?.username ?? undefined,
    items: JSON.parse(data.items) as UserOrderItems,
    status: data.status as UserOrderStatus,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  });
}

/**
 * Check if order is submitted
 */
export function isUserOrderSubmitted(order: UserOrder): boolean {
  return order.status === UserOrderStatus.SUBMITTED;
}

/**
 * Check if order is empty
 */
export function isUserOrderEmpty(order: UserOrder): boolean {
  return (
    order.items.tacos.length === 0 &&
    order.items.extras.length === 0 &&
    order.items.drinks.length === 0 &&
    order.items.desserts.length === 0
  );
}

/**
 * Check if order belongs to user
 */
export function userOrderBelongsTo(order: UserOrder, userId: UserId): boolean {
  return order.userId === userId;
}
