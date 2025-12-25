/**
 * Dashboard metrics calculation utilities
 * Computes metrics from order data
 */

import type { GroupOrder } from '@tacocrew/gigatacos-client';
import { toDate } from '@/lib/utils/date';

export interface DashboardMetrics {
  activeOrders: number;
  pendingOrders: number;
  historyCount: number;
}

/**
 * Filter orders that are still accepting submissions
 */
export function filterActiveOrders(orders: readonly GroupOrder[]): GroupOrder[] {
  const now = new Date();
  return orders.filter((order) => toDate(order.endDate) > now);
}

/**
 * Filter orders awaiting submission
 */
export function filterPendingOrders(orders: readonly GroupOrder[]): GroupOrder[] {
  return orders.filter((order) => order.canAcceptOrders);
}

/**
 * Calculate dashboard metrics from order data
 */
export function calculateDashboardMetrics(
  groupOrders: readonly GroupOrder[],
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
  orders: readonly GroupOrder[],
  limit: number = 5
): GroupOrder[] {
  return orders.slice(0, limit);
}
