import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/http';
import type { Notification, Page, UnreadCountResponse } from './notifications';

// Internal query key factory
const notificationsKeys = {
  all: () => ['notifications'] as const,
  list: (archived?: boolean) => [...notificationsKeys.all(), 'list', { archived }] as const,
  unread: () => [...notificationsKeys.all(), 'unread'] as const,
  infinite: (archived?: boolean) => [...notificationsKeys.all(), 'infinite', { archived }] as const,
} as const;

export function useUnreadNotificationsCount() {
  return useQuery({
    queryKey: notificationsKeys.unread(),
    queryFn: async () => {
      const data = await apiClient.get<UnreadCountResponse>('/api/v1/notifications/unread-count');
      return data.count;
    },
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 30 * 1000, // refetch every 30 seconds
    refetchIntervalInBackground: false, // pause when tab is not visible
  });
}

export function useInfiniteNotifications(archived: boolean, enabled: boolean = true) {
  return useInfiniteQuery({
    queryKey: notificationsKeys.infinite(archived),
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams();
      params.set('limit', '15');
      if (pageParam) params.set('cursor', pageParam);
      params.set('archived', archived.toString());
      const query = params.toString();
      const url = `/api/v1/notifications?${query}`;
      return apiClient.get<Page<Notification>>(url);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled,
  });
}
