/**
 * Group order domain schema (Zod)
 * @module schemas/group-order
 */
import { isWithinInterval } from 'date-fns';
import { z } from 'zod';
import { GroupOrderStatus } from '../shared/types/types';
import type { Id } from '../shared/utils/branded-ids.utils';
import { zId } from '../shared/utils/branded-ids.utils';
import type { UserId } from './user.schema';

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
  status: z.enum(GroupOrderStatus),
  name: z.string().nullish(),
  shareCode: z.string().nullish(),
  sessionId: z.string().nullish(), // Session ID for order verification
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
  shareCode: z.string().nullish(),
  sessionId: z.string().nullish(), // Session ID for order verification
  createdAt: z.date(),
  updatedAt: z.date(),
  leader: z
    .object({
      id: z.string(),
      username: z.string().nullish(),
    })
    .nullish(), // Optional leader relation
});

/**
 * Build a group order from properties.
 * Note: leaderId may be a Better Auth ID (not a UUID), so we bypass UUID validation
 * for leaderId while still validating other fields.
 */
export function createGroupOrder(props: {
  id: string;
  leaderId: string;
  startDate: Date;
  endDate: Date;
  status: GroupOrderStatus;
  name?: string;
  shareCode?: string;
  createdAt?: Date;
  updatedAt?: Date;
}): GroupOrder {
  // Validate all fields except leaderId (which may be a Better Auth ID, not UUID)
  return {
    id: GroupOrderIdSchema.parse(props.id),
    leaderId: props.leaderId as UserId, // Accept Better Auth IDs or UUIDs
    startDate: props.startDate,
    endDate: props.endDate,
    status: props.status,
    name: props.name ?? undefined,
    shareCode: props.shareCode ?? undefined,
    createdAt: props.createdAt,
    updatedAt: props.updatedAt,
  };
}

/**
 * Build a domain entity from database data with minimal transformation.
 * Note: leaderId may be a Better Auth ID (not a UUID), so we bypass UUID validation
 * for leaderId while still validating other fields.
 */
export function createGroupOrderFromDb(data: z.infer<typeof GroupOrderFromDbSchema>): GroupOrder {
  // Validate all fields except leaderId (which may be a Better Auth ID, not UUID)
  const validated = GroupOrderFromDbSchema.parse(data);

  // Create the group order with leaderId as-is (may be Better Auth ID or UUID)
  // We cast it to UserId to satisfy the type system, but we don't validate it as UUID
  return {
    id: GroupOrderIdSchema.parse(validated.id),
    leaderId: validated.leaderId as UserId, // Accept Better Auth IDs or UUIDs
    startDate: validated.startDate,
    endDate: validated.endDate,
    status: validated.status as GroupOrderStatus,
    name: validated.name ?? undefined,
    shareCode: validated.shareCode ?? undefined,
    sessionId: validated.sessionId ?? undefined,
    createdAt: validated.createdAt,
    updatedAt: validated.updatedAt,
  };
}

/**
 * Determine if a group order is open for orders at a given moment (defaults to now).
 */
export function isGroupOrderOpenForOrders(order: GroupOrder, referenceDate = new Date()): boolean {
  if (order.status !== GroupOrderStatus.OPEN) {
    return false;
  }

  return isWithinInterval(referenceDate, {
    start: order.startDate,
    end: order.endDate,
  });
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

/**
 * Determine if a group order can accept new user orders.
 *
 * Rules:
 * - Status must be OPEN (not closed, submitted, or completed)
 * - Current date must be within the validity period (startDate to endDate)
 *
 * @param order - The group order to evaluate
 * @param referenceDate - The date to use for comparison (defaults to now)
 * @returns true if the order can accept new orders, false otherwise
 */
export function canAcceptOrders(order: GroupOrder, referenceDate = new Date()): boolean {
  if (order.status !== GroupOrderStatus.OPEN) {
    return false;
  }

  return isWithinInterval(referenceDate, {
    start: order.startDate,
    end: order.endDate,
  });
}
