/**
 * Group order domain schema (Zod)
 * @module domain/schemas/group-order
 */
import { z } from 'zod';
import type { Id } from '@/domain/entities/branded-types';
import { zId } from '@/domain/entities/branded-types';
import type { UserId } from '@/domain/schemas/user.schema';
import { GroupOrderStatus } from '@/types';

/**
 * Group Order ID type - branded string
 */
export type GroupOrderId = Id<'GroupOrder'>;

/**
 * Parse a string to GroupOrderId
 */
export const GroupOrderIdSchema = zId<GroupOrderId>();

/**
 * Group order schema using Zod
 */
export const GroupOrderSchema = z.object({
  id: zId<GroupOrderId>(),
  leaderId: zId<UserId>(),
  startDate: z.date(),
  endDate: z.date(),
  status: z.nativeEnum(GroupOrderStatus),
  name: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type GroupOrder = z.infer<typeof GroupOrderSchema>;

/**
 * Group order from database (with nullable name and string status)
 */
export const GroupOrderFromDbSchema = z.object({
  id: z.string(), // UUID from DB as string
  leaderId: z.string(), // UUID from DB as string
  startDate: z.date(),
  endDate: z.date(),
  status: z.string(),
  name: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Build a group order from properties.
 */
export function createGroupOrder(props: {
  id: string;
  leaderId: string;
  startDate: Date;
  endDate: Date;
  status: GroupOrderStatus;
  name?: string;
  createdAt?: Date;
  updatedAt?: Date;
}): GroupOrder {
  return GroupOrderSchema.parse(props);
}

/**
 * Build a domain entity from database data with minimal transformation.
 */
export function createGroupOrderFromDb(data: z.infer<typeof GroupOrderFromDbSchema>): GroupOrder {
  const { name, status, ...rest } = data;

  return GroupOrderSchema.parse({
    ...rest,
    status: status as GroupOrderStatus,
    name: name ?? undefined,
  });
}

/**
 * Determine if a group order is open for orders at a given moment (defaults to now).
 */
export function isGroupOrderOpenForOrders(order: GroupOrder, referenceDate = new Date()): boolean {
  if (order.status !== GroupOrderStatus.OPEN) {
    return false;
  }

  return referenceDate >= order.startDate && referenceDate <= order.endDate;
}

/**
 * Determine if a group order can be modified at a given moment (defaults to now).
 */
export function canGroupOrderBeModified(order: GroupOrder, referenceDate = new Date()): boolean {
  return order.status === GroupOrderStatus.OPEN && isGroupOrderOpenForOrders(order, referenceDate);
}

/**
 * Determine if a user is the leader of the provided group order.
 */
export function isGroupOrderLeader(order: GroupOrder, userId: UserId): boolean {
  return order['leaderId'] === userId;
}
