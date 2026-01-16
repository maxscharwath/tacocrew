/**
 * Dashboard metrics calculation utilities
 * Computes metrics from order data
 */

import type { UserGroupOrder } from '@/lib/api/types';
import { toDate } from '@/lib/utils/date';

export interface DashboardMetrics {
  activeOrders: number;
  pendingOrders: number;
  historyCount: number;
}

/**
 * Filter orders that are still accepting submissions
 */
export function filterActiveOrders(orders: readonly UserGroupOrder[]): UserGroupOrder[] {
  const now = new Date();
  return orders.filter((order) => toDate(order.endDate) > now);
}

/**
 * Filter orders awaiting submission
 */
export function filterPendingOrders(orders: readonly UserGroupOrder[]): UserGroupOrder[] {
  return orders.filter((order) => order.canAcceptOrders);
}

/**
 * Calculate dashboard metrics from order data
 */
export function calculateDashboardMetrics(
  groupOrders: readonly UserGroupOrder[],
  orderHistoryCount: number
): DashboardMetrics {
  const activeOrders = filterActiveOrders(groupOrders);
  const pendingOrders = filterPendingOrders(groupOrders);

  return {
    activeOrders: activeOrders.length,
    pendingOrders: pendingOrders.length,
    historyCount: orderHistoryCount,
  };
}

/**
 * Get recent group orders (limited to top N)
 */
export function getRecentGroupOrders(
  orders: readonly UserGroupOrder[],
  limit: number = 5
): UserGroupOrder[] {
  return orders.slice(0, limit);
}
