import { useQuery } from '@tanstack/react-query';
import { getPushSubscriptions } from './push-notifications';

const pushSubscriptionsKeys = {
  all: ['pushSubscriptions'] as const,
  list: () => [...pushSubscriptionsKeys.all, 'list'] as const,
} as const;

export function usePushSubscriptions(enabled: boolean = true) {
  return useQuery({
    queryKey: pushSubscriptionsKeys.list(),
    queryFn: getPushSubscriptions,
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
