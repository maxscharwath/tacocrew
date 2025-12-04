import { apiClient } from '@/lib/api/http';
import type {
  CreateGroupOrderBody,
  GroupOrder,
  GroupOrderSubmissionBody,
  GroupOrderSubmissionResponse,
  GroupOrderWithUserOrders,
  UpsertUserOrderBody,
  UserOrderDetail,
  UserOrderResponse,
} from '@/lib/api/types';

export type {
  CreateGroupOrderBody,
  GroupOrder,
  GroupOrderSubmissionBody,
  GroupOrderSubmissionResponse,
  GroupOrderWithUserOrders,
  UpsertUserOrderBody,
  UserOrderDetail,
  UserOrderResponse,
} from '@/lib/api/types';

export function createGroupOrder(body: CreateGroupOrderBody) {
  return apiClient.post<GroupOrder>('/api/v1/orders', { body });
}

export function getGroupOrder(id: string) {
  return apiClient.get<GroupOrder>(`/api/v1/orders/${id}`);
}

export function getGroupOrderWithOrders(id: string) {
  return apiClient.get<GroupOrderWithUserOrders>(`/api/v1/orders/${id}/items`);
}

export function upsertUserOrder(groupOrderId: string, body: UpsertUserOrderBody) {
  return apiClient.post<UserOrderResponse>(`/api/v1/orders/${groupOrderId}/items`, { body });
}

export function getUserOrder(groupOrderId: string, itemId: string) {
  return apiClient.get<UserOrderDetail>(`/api/v1/orders/${groupOrderId}/items/${itemId}`);
}

export function deleteUserOrder(groupOrderId: string, itemId: string) {
  return apiClient.delete<void>(`/api/v1/orders/${groupOrderId}/items/${itemId}`);
}

export function updateUserOrderReimbursementStatus(
  groupOrderId: string,
  itemId: string,
  reimbursed: boolean
) {
  return apiClient.patch<UserOrderResponse>(
    `/api/v1/orders/${groupOrderId}/items/${itemId}/reimbursement`,
    {
      body: { reimbursed },
    }
  );
}

export function updateUserOrderParticipantPayment(
  groupOrderId: string,
  itemId: string,
  paid: boolean
) {
  return apiClient.patch<UserOrderResponse>(
    `/api/v1/orders/${groupOrderId}/items/${itemId}/payment`,
    {
      body: { paid },
    }
  );
}

export function deleteGroupOrder(groupOrderId: string) {
  return apiClient.delete<void>(`/api/v1/orders/${groupOrderId}`);
}

export function submitGroupOrder(groupOrderId: string, body: GroupOrderSubmissionBody) {
  return apiClient.post<GroupOrderSubmissionResponse>(`/api/v1/orders/${groupOrderId}/submit`, {
    body,
  });
}

export function updateGroupOrderStatus(
  groupOrderId: string,
  status: 'open' | 'closed' | 'submitted'
) {
  return apiClient.post<GroupOrder>(`/api/v1/orders/${groupOrderId}/status`, {
    body: { status },
  });
}

export interface UpdateGroupOrderBody {
  name?: string | null;
  startDate?: string;
  endDate?: string;
}

export function updateGroupOrder(groupOrderId: string, body: UpdateGroupOrderBody) {
  return apiClient.patch<GroupOrder>(`/api/v1/orders/${groupOrderId}`, {
    body,
  });
}

export interface OrderCookiesResponse {
  cookies: Record<string, string>;
  csrfToken: string;
  orderId?: string;
  transactionId?: string;
  sessionId?: string;
  cookieString: string;
  instructions: string;
}

export function getOrderCookies(groupOrderId: string) {
  return apiClient.get<OrderCookiesResponse>(`/api/v1/orders/${groupOrderId}/cookies`);
}
