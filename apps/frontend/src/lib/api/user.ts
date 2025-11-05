import { apiClient } from './http';
import type { UserGroupOrder, UserOrderHistoryEntry, UserProfile } from './types';

export function getProfile() {
  return apiClient.get<UserProfile>('/api/v1/users/me');
}

export function getOrderHistory() {
  return apiClient.get<UserOrderHistoryEntry[]>('/api/v1/users/me/orders');
}

export function getGroupOrders() {
  return apiClient.get<UserGroupOrder[]>('/api/v1/users/me/group-orders');
}
