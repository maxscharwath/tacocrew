import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { getNotifications, getUnreadCount } from './notifications';

const unreadNotificationsKeys = {
  all: ['unreadNotifications'] as const,
  count: () => [...unreadNotificationsKeys.all, 'count'] as const,
} as const;

const notificationsKeys = {
  all: ['notifications'] as const,
  list: () => [...notificationsKeys.all, 'list'] as const,
  infinite: (archived: boolean) => [...notificationsKeys.list(), 'infinite', archived] as const,
} as const;

export function useUnreadNotificationsCount() {
  return useQuery({
    queryKey: unreadNotificationsKeys.count(),
    queryFn: async () => {
      const data = await getUnreadCount();
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
      return getNotifications({
        limit: 15,
        cursor: pageParam,
        archived,
      });
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled,
  });
}
