import { ENV } from '@/lib/env';
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

export function updateUserLanguage(language: 'en' | 'fr' | 'de') {
  return apiClient.patch<UserProfile>('/api/v1/users/me/language', {
    body: { language },
  });
}

export function uploadAvatar(imageFile: File, backgroundColor?: string | null) {
  const formData = new FormData();
  formData.append('image', imageFile);
  if (backgroundColor && backgroundColor !== 'transparent') {
    formData.append('backgroundColor', backgroundColor);
  }
  return apiClient.post<UserProfile>('/api/v1/users/me/avatar', {
    body: formData,
  });
}

export function deleteAvatar() {
  return apiClient.delete<UserProfile>('/api/v1/users/me/avatar');
}

/**
 * Get avatar image URL for a user
 * This endpoint serves images with proper cache headers
 */
export function getAvatarUrl(userId: string): string {
  const path = `/api/v1/users/${userId}/avatar`;
  if (ENV.apiBaseUrl) {
    return new URL(path, ENV.apiBaseUrl).toString();
  }
  // Fallback to relative URL if no API base URL is configured
  return path;
}
