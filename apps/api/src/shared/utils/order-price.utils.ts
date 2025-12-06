/**
 * Calculate total price from user orders
 * @module shared/utils/order-price
 */

import type { UserOrder } from '@/schemas/user-order.schema';
import type { UserOrderItems } from '@/shared/types/types';

/**
 * Calculate the total price of items in a user order
 * Sums up prices from tacos, extras, drinks, and desserts
 */
export function calculateUserOrderPrice(items: UserOrderItems): number {
  let total = 0;

  // Sum taco prices (price includes base size + meats)
  for (const taco of items.tacos) {
    total += (taco.price ?? 0) * (taco.quantity ?? 1);
  }

  // Sum extra prices
  for (const extra of items.extras) {
    total += (extra.price ?? 0) * (extra.quantity ?? 1);
  }

  // Sum drink prices
  for (const drink of items.drinks) {
    total += (drink.price ?? 0) * (drink.quantity ?? 1);
  }

  // Sum dessert prices
  for (const dessert of items.desserts) {
    total += (dessert.price ?? 0) * (dessert.quantity ?? 1);
  }

  return total;
}

/**
 * Calculate the total price of all items across multiple user orders
 * Sums up prices from tacos, extras, drinks, and desserts
 */
export function calculateTotalPriceFromUserOrders(userOrders: UserOrder[]): number {
  return userOrders.reduce(
    (total, userOrder) => total + calculateUserOrderPrice(userOrder.items),
    0
  );
}
