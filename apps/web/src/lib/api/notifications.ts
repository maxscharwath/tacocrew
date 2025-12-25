import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/http';
export interface Page<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface CursorPaginationParams {
  limit?: number;
  cursor?: string;
}
export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  url: string | null;
  data: Record<string, unknown> | null;
  read: boolean;
  readAt: string | null;
  archived: boolean;
  archivedAt: string | null;
  createdAt: string;
}

export interface UnreadCountResponse {
  count: number;
}
export function getNotifications(
  options?: CursorPaginationParams & { archived?: boolean }
): Promise<Page<Notification>> {
  const params = new URLSearchParams();
  if (options?.limit) params.set('limit', options.limit.toString());
  if (options?.cursor) params.set('cursor', options.cursor);
  if (options?.archived !== undefined) params.set('archived', options.archived.toString());
  const query = params.toString();
  const url = query ? `/api/v1/notifications?${query}` : '/api/v1/notifications';
  return apiClient.get<Page<Notification>>(url);
}

export function getUnreadCount() {
  return apiClient.get<UnreadCountResponse>('/api/v1/notifications/unread-count');
}

export function markAsRead(notificationId: string) {
  return apiClient.patch<Notification>(`/api/v1/notifications/${notificationId}/read`);
}

export function markAllAsRead() {
  return apiClient.post<{ success: boolean; count: number }>('/api/v1/notifications/mark-all-read');
}

export function archiveNotification(notificationId: string) {
  return apiClient.patch<Notification>(`/api/v1/notifications/${notificationId}/archive`);
}

export function archiveAllNotifications() {
  return apiClient.post<{ success: boolean; count: number }>('/api/v1/notifications/archive-all');
}

export function sendPaymentReminder(groupOrderId: string, userOrderId: string) {
  return apiClient.post<{ success: boolean }>(
    `/api/v1/orders/${groupOrderId}/items/${userOrderId}/reimbursement/reminder`
  );
}

export function useNotifications(
  options?: CursorPaginationParams & { archived?: boolean },
  enabled = true
) {
  return useQuery<Page<Notification>>({
    queryKey: ['notifications', options],
    queryFn: () => getNotifications(options),
    enabled,
  });
}

export function useUnreadCount(enabled = true) {
  return useQuery<UnreadCountResponse>({
    queryKey: ['unreadCount'],
    queryFn: () => getUnreadCount(),
    enabled,
    refetchInterval: 30000,
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) => markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['unreadNotifications'], exact: false });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['unreadNotifications'], exact: false });
    },
  });
}

export function useArchiveNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) => archiveNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'], exact: false });
    },
  });
}

export function useArchiveAllNotifications() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => archiveAllNotifications(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'], exact: false });
    },
  });
}

export function useSendPaymentReminder() {
  return useMutation({
    mutationFn: ({ groupOrderId, userOrderId }: { groupOrderId: string; userOrderId: string }) =>
      sendPaymentReminder(groupOrderId, userOrderId),
  });
}
