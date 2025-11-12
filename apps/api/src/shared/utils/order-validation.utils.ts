/**
 * Order validation utilities
 * @module shared/utils/order-validation
 */

import type { StockAvailability, UserOrderItems } from '../types/types';
import { StockCategory } from '../types/types';
import { ValidationError } from './errors.utils';

/**
 * Validate item availability against stock
 * @param items - User order items to validate
 * @param stock - Current stock availability
 * @throws ValidationError if any items are not found or out of stock
 */
export function validateItemAvailability(items: UserOrderItems, stock: StockAvailability): void {
  const outOfStock: string[] = [];
  const notFound: string[] = [];

  const checkItem = (
    item: { id: string; code: string; name: string },
    stockItems: Array<{ id: string; code: string; in_stock: boolean }>,
    category: string
  ): void => {
    const stockItem = stockItems.find((s) => s.id === item.id);
    if (!stockItem) {
      notFound.push(`${category}: ${item.code} (${item.name})`);
    } else if (!stockItem.in_stock) {
      outOfStock.push(`${category}: ${item.code} (${item.name})`);
    }
  };

  // Validate tacos
  for (const taco of items.tacos) {
    for (const meat of taco.meats) {
      checkItem(meat, stock[StockCategory.Meats], 'Meat');
    }
    for (const sauce of taco.sauces) {
      checkItem(sauce, stock[StockCategory.Sauces], 'Sauce');
    }
    for (const garniture of taco.garnitures) {
      checkItem(garniture, stock[StockCategory.Garnishes], 'Garniture');
    }
  }

  // Validate other items
  for (const extra of items.extras) {
    checkItem(extra, stock[StockCategory.Extras], 'Extra');
  }
  for (const drink of items.drinks) {
    checkItem(drink, stock[StockCategory.Drinks], 'Drink');
  }
  for (const dessert of items.desserts) {
    checkItem(dessert, stock[StockCategory.Desserts], 'Dessert');
  }

  if (notFound.length > 0 || outOfStock.length > 0) {
    const message =
      notFound.length > 0
        ? `Some items are no longer available: ${notFound.join(', ')}${
            outOfStock.length > 0 ? `; Some items are out of stock: ${outOfStock.join(', ')}` : ''
          }`
        : `Some items are out of stock: ${outOfStock.join(', ')}`;

    throw new ValidationError({
      message,
      notFoundItems: notFound,
      outOfStockItems: outOfStock,
    });
  }
}
