/**
 * Order service - handles order operations
 * @module services/order
 */

import { OrdersApi } from '@/lib/api';
import type { UpsertUserOrderBody } from '@/lib/api/orders';

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
      await OrdersApi.deleteUserOrder(groupOrderId, editOrderId);
    } catch {
      // If delete fails, continue to create
    }
  }

  await OrdersApi.upsertUserOrder(groupOrderId, body);
}

