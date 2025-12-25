import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/http';
import { resolveImageUrl } from '@/lib/api/image-utils';
import type {
  DeliveryProfile,
  DeliveryProfilePayload,
  PreviousOrder,
  UserGroupOrder,
  UserOrderHistoryEntry,
  UserProfile,
} from '@/lib/api/types';
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

export function getAvatarUrl(
  userId: string,
  options?: { size?: number; w?: number; h?: number; dpr?: number }
): string {
  const path = `/api/v1/users/${userId}/avatar`;
  return resolveImageUrl(path, options) ?? path;
}

/** Query hooks for user data */

export function useProfile(enabled = true) {
  return useQuery<UserProfile>({
    queryKey: ['userProfile'],
    queryFn: () => getProfile(),
    enabled,
  });
}

export function useOrderHistory(enabled = true) {
  return useQuery<UserOrderHistoryEntry[]>({
    queryKey: ['orderHistory'],
    queryFn: () => getOrderHistory(),
    enabled,
  });
}

export function useGroupOrders(enabled = true) {
  return useQuery<UserGroupOrder[]>({
    queryKey: ['userGroupOrders'],
    queryFn: () => getGroupOrders(),
    enabled,
  });
}

export function usePreviousOrders(enabled = true) {
  return useQuery<PreviousOrder[]>({
    queryKey: ['previousOrders'],
    queryFn: () => getPreviousOrders(),
    enabled,
  });
}

export function useDeliveryProfiles(enabled = true) {
  return useQuery<DeliveryProfile[]>({
    queryKey: ['deliveryProfiles'],
    queryFn: () => getDeliveryProfiles(),
    enabled,
  });
}

export function useCreateDeliveryProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: DeliveryProfilePayload) => createDeliveryProfile(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['deliveryProfiles'] });
    },
  });
}

export function useUpdateDeliveryProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: DeliveryProfilePayload }) =>
      updateDeliveryProfile(id, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['deliveryProfiles'] });
    },
  });
}

export function useDeleteDeliveryProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDeliveryProfile(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['deliveryProfiles'] });
    },
  });
}

export function useUpdateUserLanguage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (language: 'en' | 'fr' | 'de') => updateUserLanguage(language),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
  });
}

export function useUpdateUserPhone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (phone: string | null) => updateUserPhone(phone),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      imageFile,
      backgroundColor,
    }: {
      imageFile: File;
      backgroundColor?: string | null;
    }) => uploadAvatar(imageFile, backgroundColor),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
  });
}

export function useDeleteAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => deleteAvatar(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
  });
}
