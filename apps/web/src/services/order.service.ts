/**
 * Order service - handles order operations
 * @module services/order
 */

import type { UpsertUserOrderBody } from '@/lib/api/orders';
import {
  updateUserOrder as updateUserOrderApi,
  upsertUserOrder as upsertUserOrderApi,
} from '@/lib/api/orders';

/**
 * Create a new user order, or replace items on an existing one.
 *
 * When `editOrderId` is provided we PUT to the in-place update endpoint so the
 * backend preserves the original `userId` — important when a group leader
 * edits another participant's order, otherwise the row would be re-owned.
 * Without `editOrderId` we POST as a fresh create.
 */
export async function upsertUserOrder(
  groupOrderId: string,
  body: UpsertUserOrderBody,
  editOrderId?: string
): Promise<void> {
  if (editOrderId) {
    await updateUserOrderApi(groupOrderId, editOrderId, body);
    return;
  }
  await upsertUserOrderApi(groupOrderId, body);
}
