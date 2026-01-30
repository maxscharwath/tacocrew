/**
 * Order detail action handlers
 * Extracted handlers for clean route organization
 */

import type { UpsertUserOrderBody } from '@/lib/api';
import {
  deleteUserOrder,
  ordersKeys,
  submitGroupOrder,
  updateGroupOrderStatus,
  upsertUserOrder,
} from '@/lib/api';
import { userKeys } from '@/lib/api/user';
import { queryClient } from '@/lib/query-client';
import type {
  DeleteUserOrderFormData,
  ManageOrderStatusFormData,
  SubmitGroupOrderFormData,
  UserOrderFormData,
} from '@/lib/types/form-data';
import { parseFormData } from '@/lib/utils/form-data';

/**
 * Convert single value or array to array
 */
function toArray(val: string | string[]): string[] {
  if (Array.isArray(val)) {
    return val;
  }
  if (val) {
    return [val];
  }
  return [];
}

/**
 * Handle group order submission
 */
export async function handleSubmitGroupOrder(
  groupOrderId: string,
  request: Request
): Promise<void> {
  const data = await parseFormData<SubmitGroupOrderFormData>(request);
  await submitGroupOrder(groupOrderId, {
    customer: {
      name: data.customerName,
      phone: data.customerPhone,
    },
    delivery: {
      type: data.deliveryType,
      address: {
        road: data.road,
        house_number: data.houseNumber,
        postcode: data.postcode,
        city: data.city,
        state: data.state,
        country: data.country,
      },
      requestedFor: data.requestedFor,
    },
    paymentMethod: data.paymentMethod,
  });
  // Invalidate and reset caches that depend on order data
  await queryClient.refetchQueries({ queryKey: ordersKeys.detail(groupOrderId) });
  await queryClient.invalidateQueries({ queryKey: userKeys.groupOrders() });
  await queryClient.invalidateQueries({ queryKey: userKeys.orderHistory() });
}

/**
 * Handle user order creation/update
 */
export async function handleUpsertUserOrder(groupOrderId: string, request: Request): Promise<void> {
  const rawData = await parseFormData<UserOrderFormData>(request);
  type TacoSize = UpsertUserOrderBody['items']['tacos'][number]['size'];

  const tacoQuantity = Number(rawData.tacoQuantity) || 1;
  const meats = toArray(rawData.meats);
  const sauces = toArray(rawData.sauces);
  const garnitures = toArray(rawData.garnitures);

  await upsertUserOrder(groupOrderId, {
    items: {
      tacos: [
        {
          size: rawData.tacoSize as TacoSize,
          meats: meats.map((id) => ({ id, quantity: 1 })),
          sauces: sauces.map((id) => ({ id })),
          garnitures: garnitures.map((id) => ({ id })),
          note: rawData.note,
          quantity: tacoQuantity,
        },
      ],
      extras: toArray(rawData.extras).map((id) => ({ id, quantity: 1 })),
      drinks: toArray(rawData.drinks).map((id) => ({ id, quantity: 1 })),
      desserts: toArray(rawData.desserts).map((id) => ({ id, quantity: 1 })),
    },
  });
  // Invalidate and reset caches that depend on order data
  await queryClient.refetchQueries({ queryKey: ordersKeys.detail(groupOrderId) });
  await queryClient.invalidateQueries({ queryKey: userKeys.groupOrders() });
  await queryClient.invalidateQueries({ queryKey: userKeys.orderHistory() });
}

/**
 * Handle user order deletion
 */
export async function handleDeleteUserOrder(groupOrderId: string, request: Request): Promise<void> {
  const data = await parseFormData<DeleteUserOrderFormData>(request);
  await deleteUserOrder(groupOrderId, data.itemId);
  // Invalidate and reset caches that depend on order data
  await queryClient.refetchQueries({ queryKey: ordersKeys.detail(groupOrderId) });
  await queryClient.invalidateQueries({ queryKey: userKeys.groupOrders() });
  await queryClient.invalidateQueries({ queryKey: userKeys.orderHistory() });
}

/**
 * Handle order status update
 */
export async function handleUpdateOrderStatus(
  groupOrderId: string,
  request: Request
): Promise<void> {
  const data = await parseFormData<ManageOrderStatusFormData>(request);
  await updateGroupOrderStatus(groupOrderId, data.status);
  // Invalidate and reset caches that depend on order status
  await queryClient.refetchQueries({ queryKey: ordersKeys.detail(groupOrderId) });
  await queryClient.invalidateQueries({ queryKey: userKeys.groupOrders() });
}

/**
 * Determine which handler to call based on form data
 */
export function getFormHandlerName(formData: FormData): string {
  if (formData.has('customerName')) return 'submit';
  if (formData.has('tacoSize')) return 'user-order';
  if (formData.has('itemId')) return 'delete';
  if (formData.has('status')) return 'status';
  return 'unknown';
}
