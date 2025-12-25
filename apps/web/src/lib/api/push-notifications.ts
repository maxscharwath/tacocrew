import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/http';

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
}

export interface PushSubscriptionInfo {
  id: string;
  endpoint: string;
  userAgent: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Internal query key factory for push notifications */
const pushNotificationsKeys = {
  all: () => ['pushNotifications'] as const,
  publicKey: () => [...pushNotificationsKeys.all(), 'publicKey'] as const,
  subscriptions: () => [...pushNotificationsKeys.all(), 'subscriptions'] as const,
} as const;

export function useSubscribeToPushNotifications() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (subscription: PushSubscription) =>
      apiClient.post<{ success: boolean }>('/api/v1/push/subscribe', {
        body: subscription,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: pushNotificationsKeys.subscriptions() });
    },
  });
}

export function useUnsubscribeFromPushNotifications() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (endpoint: string) =>
      apiClient.delete<{ success: boolean }>('/api/v1/push/unsubscribe', {
        body: { endpoint },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: pushNotificationsKeys.subscriptions() });
    },
  });
}

export function usePushPublicKey() {
  return useQuery({
    queryKey: pushNotificationsKeys.publicKey(),
    queryFn: () => apiClient.get<{ publicKey: string }>('/api/v1/push/public-key'),
    staleTime: Number.POSITIVE_INFINITY, // Public key rarely changes
  });
}

export function useSendTestNotification() {
  return useMutation({
    mutationFn: () => apiClient.post<{ success: boolean; message: string }>('/api/v1/push/test'),
  });
}

export function usePushSubscriptions(enabled = true) {
  return useQuery({
    queryKey: pushNotificationsKeys.subscriptions(),
    queryFn: () => apiClient.get<PushSubscriptionInfo[]>('/api/v1/push/subscriptions'),
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useDeletePushSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (subscriptionId: string) =>
      apiClient.delete<{ success: boolean }>(`/api/v1/push/subscriptions/${subscriptionId}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: pushNotificationsKeys.subscriptions() });
    },
  });
}
