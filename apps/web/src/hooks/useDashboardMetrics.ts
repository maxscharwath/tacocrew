/**
 * Dashboard metrics hook
 * Calculates and memoizes dashboard metrics from order data
 */

import { useMemo } from 'react';
import type { UserGroupOrder } from '@/lib/api/types';
import { calculateDashboardMetrics, type DashboardMetrics } from '@/lib/utils/dashboard-metrics';

/**
 * Calculate dashboard metrics with memoization
 */
export function useDashboardMetrics(
  groupOrders: readonly UserGroupOrder[] | undefined,
  orderHistoryCount: number
): DashboardMetrics {
  return useMemo(() => {
    return calculateDashboardMetrics(groupOrders || [], orderHistoryCount);
  }, [groupOrders, orderHistoryCount]);
}
