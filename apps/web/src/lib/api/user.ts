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

/** Internal query key factory */
export const userKeys = {
  all: () => ['userProfile'] as const,
  deliveryProfiles: () => [...userKeys.all(), 'deliveryProfiles'] as const,
  orderHistory: () => [...userKeys.all(), 'orderHistory'] as const,
  groupOrders: () => [...userKeys.all(), 'groupOrders'] as const,
  previousOrders: () => [...userKeys.all(), 'previousOrders'] as const,
};

/**
 * Get user profile
 * NOTE: This raw API function is exported ONLY for use in loaders.
 * Components should use the useProfile hook instead.
 */
export function getProfile() {
  return apiClient.get<UserProfile>('/api/v1/users/me');
}

/** Utility function for avatar URLs */
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
    queryKey: userKeys.all(),
    queryFn: () => apiClient.get<UserProfile>('/api/v1/users/me'),
    enabled,
  });
}

export function useOrderHistory(enabled = true) {
  return useQuery<UserOrderHistoryEntry[]>({
    queryKey: userKeys.orderHistory(),
    queryFn: () => apiClient.get<UserOrderHistoryEntry[]>('/api/v1/users/me/orders'),
    enabled,
  });
}

export function useGroupOrders(enabled = true) {
  return useQuery<UserGroupOrder[]>({
    queryKey: userKeys.groupOrders(),
    queryFn: () => apiClient.get<UserGroupOrder[]>('/api/v1/users/me/group-orders'),
    enabled,
  });
}

export function usePreviousOrders(enabled = true) {
  return useQuery<PreviousOrder[]>({
    queryKey: userKeys.previousOrders(),
    queryFn: () => apiClient.get<PreviousOrder[]>('/api/v1/users/me/previous-orders'),
    enabled,
  });
}

export function useDeliveryProfiles(enabled = true) {
  return useQuery<DeliveryProfile[]>({
    queryKey: userKeys.deliveryProfiles(),
    queryFn: () => apiClient.get<DeliveryProfile[]>('/api/v1/users/me/delivery-profiles'),
    enabled,
  });
}

export function useCreateDeliveryProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: DeliveryProfilePayload) =>
      apiClient.post<DeliveryProfile>('/api/v1/users/me/delivery-profiles', { body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userKeys.deliveryProfiles() });
    },
  });
}

export function useUpdateDeliveryProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: DeliveryProfilePayload }) =>
      apiClient.put<DeliveryProfile>(`/api/v1/users/me/delivery-profiles/${id}`, { body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userKeys.deliveryProfiles() });
    },
  });
}

export function useDeleteDeliveryProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete<void>(`/api/v1/users/me/delivery-profiles/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userKeys.deliveryProfiles() });
    },
  });
}

export function useUpdateUserLanguage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (language: 'en' | 'fr' | 'de') =>
      apiClient.patch<UserProfile>('/api/v1/users/me/language', {
        body: { language },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userKeys.all() });
    },
  });
}

export function useUpdateUserPhone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (phone: string | null) =>
      apiClient.patch<UserProfile>('/api/v1/users/me/phone', {
        body: { phone },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userKeys.all() });
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
    }) => {
      const formData = new FormData();
      formData.append('image', imageFile);
      if (backgroundColor && backgroundColor !== 'transparent') {
        formData.append('backgroundColor', backgroundColor);
      }
      return apiClient.post<UserProfile>('/api/v1/users/me/avatar', {
        body: formData,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userKeys.all() });
    },
  });
}

export function useDeleteAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.delete<UserProfile>('/api/v1/users/me/avatar'),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userKeys.all() });
    },
  });
}
