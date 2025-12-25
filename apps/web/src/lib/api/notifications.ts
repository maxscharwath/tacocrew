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

// Internal query key factory
const notificationsKeys = {
  all: () => ['notifications'] as const,
  list: (archived?: boolean) => [...notificationsKeys.all(), 'list', { archived }] as const,
  unread: () => [...notificationsKeys.all(), 'unread'] as const,
  infinite: (archived?: boolean) => [...notificationsKeys.all(), 'infinite', { archived }] as const,
} as const;

export function useNotifications(
  options?: CursorPaginationParams & { archived?: boolean },
  enabled = true
) {
  return useQuery<Page<Notification>>({
    queryKey: notificationsKeys.list(options?.archived),
    queryFn: () => {
      const params = new URLSearchParams();
      if (options?.limit) params.set('limit', options.limit.toString());
      if (options?.cursor) params.set('cursor', options.cursor);
      if (options?.archived !== undefined) params.set('archived', options.archived.toString());
      const query = params.toString();
      const url = query ? `/api/v1/notifications?${query}` : '/api/v1/notifications';
      return apiClient.get<Page<Notification>>(url);
    },
    enabled,
  });
}

export function useUnreadCount(enabled = true) {
  return useQuery<UnreadCountResponse>({
    queryKey: notificationsKeys.unread(),
    queryFn: () => apiClient.get<UnreadCountResponse>('/api/v1/notifications/unread-count'),
    enabled,
    refetchInterval: 30000,
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) =>
      apiClient.patch<Notification>(`/api/v1/notifications/${notificationId}/read`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationsKeys.list() });
      void queryClient.invalidateQueries({ queryKey: notificationsKeys.unread() });
      void queryClient.invalidateQueries({ queryKey: notificationsKeys.infinite() });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiClient.post<{ success: boolean; count: number }>('/api/v1/notifications/mark-all-read'),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationsKeys.list() });
      void queryClient.invalidateQueries({ queryKey: notificationsKeys.unread() });
      void queryClient.invalidateQueries({ queryKey: notificationsKeys.infinite() });
    },
  });
}

export function useArchiveNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) =>
      apiClient.patch<Notification>(`/api/v1/notifications/${notificationId}/archive`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationsKeys.list(false) });
      void queryClient.invalidateQueries({ queryKey: notificationsKeys.list(true) });
      void queryClient.invalidateQueries({ queryKey: notificationsKeys.infinite() });
    },
  });
}

export function useArchiveAllNotifications() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiClient.post<{ success: boolean; count: number }>('/api/v1/notifications/archive-all'),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationsKeys.list(false) });
      void queryClient.invalidateQueries({ queryKey: notificationsKeys.list(true) });
      void queryClient.invalidateQueries({ queryKey: notificationsKeys.infinite() });
    },
  });
}

export function useSendPaymentReminder() {
  return useMutation({
    mutationFn: ({ groupOrderId, userOrderId }: { groupOrderId: string; userOrderId: string }) =>
      apiClient.post<{ success: boolean }>(
        `/api/v1/orders/${groupOrderId}/items/${userOrderId}/reimbursement/reminder`
      ),
  });
}
