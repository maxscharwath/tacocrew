import { apiClient } from '@/lib/api/http';

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
}

export function subscribeToPushNotifications(subscription: PushSubscription) {
  return apiClient.post<{ success: boolean }>('/api/v1/push/subscribe', {
    body: subscription,
  });
}

export function unsubscribeFromPushNotifications(endpoint: string) {
  return apiClient.delete<{ success: boolean }>('/api/v1/push/unsubscribe', {
    body: { endpoint },
  });
}

export function getPushPublicKey() {
  return apiClient.get<{ publicKey: string }>('/api/v1/push/public-key');
}

export function sendTestNotification() {
  return apiClient.post<{ success: boolean; message: string }>('/api/v1/push/test');
}

export interface PushSubscriptionInfo {
  id: string;
  endpoint: string;
  userAgent: string | null;
  createdAt: string;
  updatedAt: string;
}

export function getPushSubscriptions() {
  return apiClient.get<PushSubscriptionInfo[]>('/api/v1/push/subscriptions');
}

export function deletePushSubscription(subscriptionId: string) {
  return apiClient.delete<{ success: boolean }>(`/api/v1/push/subscriptions/${subscriptionId}`);
}
