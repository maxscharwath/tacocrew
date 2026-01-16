/**
 * Dashboard data loading hook
 * Consolidates data loading from API queries
 */

import { useGroupOrders, useOrderHistory } from '@/lib/api/user';
import type { UserGroupOrder, UserOrderHistoryEntry } from '@/lib/api/types';

export interface DashboardData {
  groupOrders: UserGroupOrder[];
  orderHistory: UserOrderHistoryEntry[];
  isLoading: boolean;
}

/**
 * Load and consolidate dashboard data
 */
export function useDashboardData(): DashboardData {
  const groupOrdersQuery = useGroupOrders();
  const orderHistoryQuery = useOrderHistory();

  return {
    groupOrders: groupOrdersQuery.data || [],
    orderHistory: orderHistoryQuery.data || [],
    isLoading: groupOrdersQuery.isLoading || orderHistoryQuery.isLoading,
  };
}
