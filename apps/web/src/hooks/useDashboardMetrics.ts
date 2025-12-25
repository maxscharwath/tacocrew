/**
 * Dashboard metrics hook
 * Calculates and memoizes dashboard metrics from order data
 */

import type { GroupOrder } from '@tacocrew/gigatacos-client';
import { useMemo } from 'react';
import { calculateDashboardMetrics, type DashboardMetrics } from '@/lib/utils/dashboard-metrics';

/**
 * Calculate dashboard metrics with memoization
 */
export function useDashboardMetrics(
  groupOrders: readonly GroupOrder[] | undefined,
  orderHistoryCount: number
): DashboardMetrics {
  return useMemo(() => {
    return calculateDashboardMetrics(groupOrders || [], orderHistoryCount);
  }, [groupOrders, orderHistoryCount]);
}
