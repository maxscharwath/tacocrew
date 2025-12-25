/**
 * Order service - handles order operations
 * @module services/order
 */

import type { UpsertUserOrderBody } from '@/lib/api/orders';
import { deleteUserOrder, upsertUserOrder as upsertUserOrderApi } from '@/lib/api/orders';

/**
 * Create or update a user order
 */
export async function upsertUserOrder(
  groupOrderId: string,
  body: UpsertUserOrderBody,
  editOrderId?: string
): Promise<void> {
  // Delete existing order if editing
  if (editOrderId) {
    try {
      await deleteUserOrder(groupOrderId, editOrderId);
    } catch {
      // If delete fails, continue to create
    }
  }

  await upsertUserOrderApi(groupOrderId, body);
}
