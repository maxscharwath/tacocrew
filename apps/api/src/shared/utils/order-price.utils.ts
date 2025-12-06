/**
 * Calculate total price from user orders
 * @module shared/utils/order-price
 */

import type { UserOrder } from '@/schemas/user-order.schema';

/**
 * Calculate the total price of all items across multiple user orders
 * Sums up prices from tacos, extras, drinks, and desserts
 */
export function calculateTotalPriceFromUserOrders(userOrders: UserOrder[]): number {
  let total = 0;

  for (const userOrder of userOrders) {
    // Sum taco prices
    for (const taco of userOrder.items.tacos) {
      total += (taco.price ?? 0) * (taco.quantity ?? 1);
    }

    // Sum extra prices
    for (const extra of userOrder.items.extras) {
      total += (extra.price ?? 0) * (extra.quantity ?? 1);
    }

    // Sum drink prices
    for (const drink of userOrder.items.drinks) {
      total += (drink.price ?? 0) * (drink.quantity ?? 1);
    }

    // Sum dessert prices
    for (const dessert of userOrder.items.desserts) {
      total += (dessert.price ?? 0) * (dessert.quantity ?? 1);
    }
  }

  return total;
}
