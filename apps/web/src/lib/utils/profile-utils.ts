/**
 * Profile utilities
 * Calculations and transformations for profile data
 */

/**
 * Calculate total order count from previous orders
 */
export function calculateTotalOrderCount(previousOrders: Array<{ orderCount: number }>): number {
  return previousOrders.reduce((sum: number, order) => sum + order.orderCount, 0);
}

/**
 * Filter previous orders by criteria
 */
export function filterPreviousOrders(
  orders: Array<{ tacoID: string; orderCount: number }>,
  minOrderCount: number = 0
): Array<{ tacoID: string; orderCount: number }> {
  return orders.filter((order) => order.orderCount > minOrderCount);
}

/**
 * Sort previous orders by count (descending)
 */
export function sortOrdersByCount<T extends { orderCount: number }>(orders: readonly T[]): T[] {
  return [...orders].sort((a, b) => b.orderCount - a.orderCount);
}
