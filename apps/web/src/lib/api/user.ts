import { apiClient } from './http';
import { resolveImageUrl } from './image-utils';
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

export function updateUserPhone(phone: string | null) {
  return apiClient.patch<UserProfile>('/api/v1/users/me/phone', {
    body: { phone },
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
 * Get avatar image URL for a user with optional size parameters
 * This endpoint serves images with proper cache headers and on-the-fly resizing
 * Automatically handles high-DPI displays using dpr parameter (Cloudinary/Imgix pattern)
 */
export function getAvatarUrl(
  userId: string,
  options?: { size?: number; w?: number; h?: number; dpr?: number }
): string {
  const path = `/api/v1/users/${userId}/avatar`;
  return resolveImageUrl(path, options) ?? path;
}
