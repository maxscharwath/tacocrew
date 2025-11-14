import type { StockResponse } from '@/lib/api';
import type { UserOrderSummary } from '@/lib/api/types';

/**
 * Calculate the total price for a single order
 */
export function calculateOrderPrice(order: UserOrderSummary, stock: StockResponse): number {
  const taco = order.items.tacos?.[0];

  // Calculate taco price (base + meats)
  const tacoSizeBasePrice = taco
    ? (() => {
        const tacoSize = stock.tacos.find((t) => t.code === taco.size);
        return tacoSize ? tacoSize.price * (taco.quantity ?? 1) : 0;
      })()
    : 0;
  const meatPrices = taco ? taco.price * (taco.quantity ?? 1) : 0;
  const tacoTotalPrice = tacoSizeBasePrice + meatPrices;

  // Calculate additional items
  const extras = Array.isArray(order.items.extras) ? order.items.extras : [];
  const drinks = Array.isArray(order.items.drinks) ? order.items.drinks : [];
  const desserts = Array.isArray(order.items.desserts) ? order.items.desserts : [];

  return (
    tacoTotalPrice +
    extras.reduce((sum, item) => sum + item.price * (item.quantity ?? 1), 0) +
    drinks.reduce((sum, item) => sum + item.price * (item.quantity ?? 1), 0) +
    desserts.reduce((sum, item) => sum + item.price * (item.quantity ?? 1), 0)
  );
}

/**
 * Calculate total price across multiple orders
 */
export function calculateTotalPrice(orders: UserOrderSummary[], stock: StockResponse): number {
  return orders.reduce((sum, order) => sum + calculateOrderPrice(order, stock), 0);
}

/**
 * Hook to calculate order price
 */
export function useOrderPrice(order: UserOrderSummary, stock: StockResponse) {
  return calculateOrderPrice(order, stock);
}

/**
 * Hook to calculate total price for multiple orders
 */
export function useTotalPrice(orders: UserOrderSummary[], stock: StockResponse) {
  return calculateTotalPrice(orders, stock);
}
