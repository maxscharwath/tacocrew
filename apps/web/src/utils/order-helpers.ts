import { isAfter, isBefore } from 'date-fns';
import { useTranslation } from 'react-i18next';
import type { GroupOrder, UserOrderSummary } from '@/lib/api/types';
import { toDate } from '@/lib/utils/date';

/**
 * Hook to get empty state description based on order status and timing
 */
export function useEmptyStateDescription(canAddOrders: boolean, groupOrder: GroupOrder): string {
  const { t } = useTranslation();

  if (canAddOrders) {
    return t('orders.detail.list.emptyState.description.default');
  }

  if (groupOrder.status === 'open') {
    const now = new Date();
    const startDate = toDate(groupOrder.startDate);
    const endDate = toDate(groupOrder.endDate);
    const isNotStartedYet = isBefore(now, startDate);
    const isExpired = isAfter(now, endDate);

    if (isNotStartedYet) {
      return t('orders.detail.list.emptyState.description.notStarted');
    }
    if (isExpired) {
      return t('orders.detail.list.emptyState.description.expired');
    }
    return t('orders.detail.list.emptyState.description.expired');
  }

  if (groupOrder.status === 'closed') {
    return t('orders.detail.list.emptyState.description.closed');
  }

  return t('orders.detail.list.emptyState.description.finalized');
}

/**
 * Calculate order permissions for a user
 */
export function getOrderPermissions(
  order: UserOrderSummary,
  currentUserId: string | undefined,
  isLeader: boolean,
  groupOrderStatus?: string
) {
  const isMyOrder = currentUserId ? order.userId === currentUserId : false;
  // Disable edit/delete when group order is submitted or completed
  const isSubmitted = groupOrderStatus === 'submitted' || groupOrderStatus === 'completed';
  return {
    canEdit: (isLeader || isMyOrder) && !isSubmitted,
    canDelete: (isLeader || isMyOrder) && !isSubmitted,
    isMyOrder,
  };
}

/**
 * Generate summary breakdown string for order creation
 */
export function getSummaryBreakdown(
  size: string | null,
  extras: string[],
  drinks: string[],
  desserts: string[],
  t: (key: string, options?: Record<string, unknown>) => string
): string {
  return [
    size
      ? t('orders.create.summary.breakdown.tacos', { count: 1 })
      : t('orders.create.summary.breakdown.noTaco'),
    t('orders.create.summary.breakdown.extras', { count: extras.length }),
    t('orders.create.summary.breakdown.drinks', { count: drinks.length }),
    t('orders.create.summary.breakdown.desserts', { count: desserts.length }),
  ].join(' · ');
}
