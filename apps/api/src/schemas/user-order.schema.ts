/**
 * User order domain schema (Zod)
 * @module schemas/user-order
 */

import { z } from 'zod';
import { UserOrderItems } from '../shared/types/types';
import type { Id } from '../shared/utils/branded-ids.utils';
import { zId } from '../shared/utils/branded-ids.utils';
import type { GroupOrderId } from './group-order.schema';
import type { UserId } from './user.schema';

/**
 * User Order ID type - branded string
 */
export type UserOrderId = Id<'UserOrder'>;

/**
 * Parse a string to UserOrderId
 */
export const UserOrderIdSchema = zId<UserOrderId>();

/**
 * User order schema using Zod
 */
export const UserOrderSchema = z.object({
  id: zId<UserOrderId>(),
  groupOrderId: zId<GroupOrderId>(),
  userId: zId<UserId>(),
  name: z.string().nullable().optional(),
  items: z.custom<UserOrderItems>(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type UserOrder = z.infer<typeof UserOrderSchema>;

/**
 * User order from database
 */
export const UserOrderFromDbSchema = z.object({
  id: z.string(), // UUID from DB as string
  groupOrderId: z.string(), // UUID from DB as string
  userId: z.string(), // UUID from DB as string
  items: z.unknown(), // Prisma Json type - automatically parsed
  tacoIdsHex: z.unknown().nullish(), // Prisma Json type - array of taco IDs in hex format
  createdAt: z.date(),
  updatedAt: z.date(),
  user: z
    .object({
      name: z.string().nullish(), // Allow null for Better Auth users
    })
    .optional(),
});

/**
 * Type guard to check if value is UserOrderItems
 */
function isUserOrderItems(value: unknown): value is UserOrderItems {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return (
    'tacos' in value &&
    'extras' in value &&
    'drinks' in value &&
    'desserts' in value &&
    Array.isArray(value.tacos) &&
    Array.isArray(value.extras) &&
    Array.isArray(value.drinks) &&
    Array.isArray(value.desserts)
  );
}

/**
 * Create UserOrder from database model
 * Note: userId may be a Better Auth ID (not a UUID), so we bypass UUID validation
 * for userId while still validating other fields.
 */
export function createUserOrderFromDb(data: z.infer<typeof UserOrderFromDbSchema>): UserOrder {
  if (!isUserOrderItems(data.items)) {
    throw new Error('Invalid user order items structure');
  }

  // Validate all fields except userId (which may be a Better Auth ID, not UUID)
  const validated = UserOrderFromDbSchema.parse(data);

  // Create the user order with userId as-is (may be Better Auth ID or UUID)
  // We cast it to UserId to satisfy the type system, but we don't validate it as UUID
  return {
    id: UserOrderIdSchema.parse(validated.id),
    groupOrderId: zId<GroupOrderId>().parse(validated.groupOrderId),
    userId: validated.userId as UserId, // Accept Better Auth IDs or UUIDs
    name: validated.user?.name,
    items: validated.items as UserOrderItems, // Type guard ensures this is UserOrderItems
    createdAt: validated.createdAt,
    updatedAt: validated.updatedAt,
  };
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
