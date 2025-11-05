import { apiClient } from './http';
import type {
  CreateGroupOrderBody,
  GroupOrder,
  GroupOrderSubmissionBody,
  GroupOrderSubmissionResponse,
  GroupOrderWithUserOrders,
  UpsertUserOrderBody,
  UserOrderDetail,
  UserOrderResponse,
} from './types';

export type {
  CreateGroupOrderBody,
  GroupOrder,
  GroupOrderSubmissionBody,
  GroupOrderSubmissionResponse,
  GroupOrderWithUserOrders,
  UpsertUserOrderBody,
  UserOrderDetail,
  UserOrderResponse,
} from './types';

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

export function submitGroupOrder(groupOrderId: string, body: GroupOrderSubmissionBody) {
  return apiClient.post<GroupOrderSubmissionResponse>(`/api/v1/orders/${groupOrderId}/submit`, {
    body,
  });
}
