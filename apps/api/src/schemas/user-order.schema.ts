/**
 * User order domain schema (Zod)
 * @module schemas/user-order
 */

import { z } from 'zod';
import { DessertSchema } from '@/schemas/dessert.schema';
import { DrinkSchema } from '@/schemas/drink.schema';
import { ExtraSchema } from '@/schemas/extra.schema';
import { GroupOrderId } from '@/schemas/group-order.schema';
import { TacoSchema } from '@/schemas/taco.schema';
import { UserId } from '@/schemas/user.schema';
import { UserOrderItems } from '@/shared/types/types';
import type { Id } from '@/shared/utils/branded-ids.utils';
import { zId } from '@/shared/utils/branded-ids.utils';
import { sortUserOrderIngredients } from '@/shared/utils/order-validation.utils';

/**
 * Schema for parsing user order items from database
 * Uses domain schemas with price as number (internal format)
 */
export const UserOrderItemsSchema = z.object({
  tacos: z.array(TacoSchema),
  extras: z.array(ExtraSchema),
  drinks: z.array(DrinkSchema),
  desserts: z.array(DessertSchema),
});

/**
 * User Order ID type - branded string
 */
export type UserOrderId = Id<'UserOrder'>;

/**
 * Parse a string to UserOrderId
 */
export const UserOrderId = zId<UserOrderId>();

/**
 * User order schema using Zod
 */
const PaymentActorSchema = z.object({
  id: z.string(),
  name: z.string().nullish(),
});

const PaymentStatusSchema = z.object({
  settled: z.boolean(),
  settledAt: z.coerce.date().nullish(),
  settledBy: PaymentActorSchema.nullish(),
});

const ParticipantPaymentSchema = z.object({
  paid: z.boolean(),
  paidAt: z.coerce.date().nullish(),
  paidBy: PaymentActorSchema.nullish(),
});

export const UserOrderSchema = z.object({
  id: UserOrderId,
  groupOrderId: GroupOrderId,
  userId: UserId,
  name: z.string().nullable().optional(),
  items: z.custom<UserOrderItems>(),
  reimbursement: PaymentStatusSchema,
  participantPayment: ParticipantPaymentSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
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
  reimbursed: z.boolean(),
  reimbursedAt: z.coerce.date().nullish(),
  reimbursedById: z.string().nullish(),
  paidByUser: z.boolean(),
  paidByUserAt: z.coerce.date().nullish(),
  paidByUserId: z.string().nullish(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  user: z
    .object({
      name: z.string().nullish(), // Allow null for Better Auth users
    })
    .optional(),
  reimbursedBy: PaymentActorSchema.nullish(),
  paidByUserRef: PaymentActorSchema.nullish(),
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

  // Type guard ensures data.items is UserOrderItems, and validated.items has the same structure
  if (!isUserOrderItems(validated.items)) {
    throw new Error('Invalid user order items structure after validation');
  }

  // Sort ingredients alphabetically for consistent ordering
  const sortedItems = sortUserOrderIngredients(validated.items);

  return {
    id: UserOrderId.parse(validated.id),
    groupOrderId: GroupOrderId.parse(validated.groupOrderId),
    userId: validated.userId as UserId, // Accept Better Auth IDs or UUIDs
    name: validated.user?.name,
    items: sortedItems,
    reimbursement: {
      settled: validated.reimbursed,
      settledAt: validated.reimbursedAt ?? null,
      settledBy: validated.reimbursedBy
        ? {
            id: validated.reimbursedBy.id as UserId,
            name: validated.reimbursedBy.name ?? null,
          }
        : null,
    },
    participantPayment: {
      paid: validated.paidByUser,
      paidAt: validated.paidByUserAt ?? null,
      paidBy: validated.paidByUserRef
        ? {
            id: validated.paidByUserRef.id as UserId,
            name: validated.paidByUserRef.name ?? null,
          }
        : null,
    },
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
