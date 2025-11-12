import { apiClient } from './http';
import type {
  DeliveryProfile,
  DeliveryProfilePayload,
  PreviousOrder,
  UserGroupOrder,
  UserOrderHistoryEntry,
  UserProfile,
} from './types';

export function getProfile() {
  return apiClient.get<UserProfile>('/api/v1/users/me');
}

export function getOrderHistory() {
  return apiClient.get<UserOrderHistoryEntry[]>('/api/v1/users/me/orders');
}

export function getGroupOrders() {
  return apiClient.get<UserGroupOrder[]>('/api/v1/users/me/group-orders');
}

export function getPreviousOrders() {
  return apiClient.get<PreviousOrder[]>('/api/v1/users/me/previous-orders');
}

export function getDeliveryProfiles() {
  return apiClient.get<DeliveryProfile[]>('/api/v1/users/me/delivery-profiles');
}

export function createDeliveryProfile(body: DeliveryProfilePayload) {
  return apiClient.post<DeliveryProfile>('/api/v1/users/me/delivery-profiles', { body });
}

export function updateDeliveryProfile(id: string, body: DeliveryProfilePayload) {
  return apiClient.put<DeliveryProfile>(`/api/v1/users/me/delivery-profiles/${id}`, { body });
}

export function deleteDeliveryProfile(id: string) {
  return apiClient.delete<void>(`/api/v1/users/me/delivery-profiles/${id}`);
}
