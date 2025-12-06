/**
 * Order validation utilities
 * @module shared/utils/order-validation
 */

import type { StockAvailability, UserOrderItems } from '@/shared/types/types';
import { StockCategory } from '@/shared/types/types';
import { ValidationError } from '@/shared/utils/errors.utils';

/**
 * Check a single item against stock
 */
function checkItem(
  item: { id: string; code: string; name: string },
  stockItems: Array<{ id: string; code: string; in_stock: boolean }>,
  category: string,
  notFound: string[],
  outOfStock: string[]
): void {
  const stockItem = stockItems.find((s) => s.id === item.id);
  if (!stockItem) {
    notFound.push(`${category}: ${item.code} (${item.name})`);
  } else if (!stockItem.in_stock) {
    outOfStock.push(`${category}: ${item.code} (${item.name})`);
  }
}

/**
 * Validate taco ingredients
 */
function validateTacos(
  tacos: UserOrderItems['tacos'],
  stock: StockAvailability,
  notFound: string[],
  outOfStock: string[]
): void {
  for (const taco of tacos) {
    for (const meat of taco.meats) {
      checkItem(meat, stock[StockCategory.Meats], 'Meat', notFound, outOfStock);
    }
    for (const sauce of taco.sauces) {
      checkItem(sauce, stock[StockCategory.Sauces], 'Sauce', notFound, outOfStock);
    }
    for (const garniture of taco.garnitures) {
      checkItem(garniture, stock[StockCategory.Garnishes], 'Garniture', notFound, outOfStock);
    }
  }
}

/**
 * Validate other order items (extras, drinks, desserts)
 */
function validateOtherItems(
  items: UserOrderItems,
  stock: StockAvailability,
  notFound: string[],
  outOfStock: string[]
): void {
  for (const extra of items.extras) {
    checkItem(extra, stock[StockCategory.Extras], 'Extra', notFound, outOfStock);
  }
  for (const drink of items.drinks) {
    checkItem(drink, stock[StockCategory.Drinks], 'Drink', notFound, outOfStock);
  }
  for (const dessert of items.desserts) {
    checkItem(dessert, stock[StockCategory.Desserts], 'Dessert', notFound, outOfStock);
  }
}

/**
 * Build error message from validation results
 */
function buildErrorMessage(notFound: string[], outOfStock: string[]): string {
  if (notFound.length > 0) {
    const notFoundMsg = `Some items are no longer available: ${notFound.join(', ')}`;
    if (outOfStock.length > 0) {
      return `${notFoundMsg}; Some items are out of stock: ${outOfStock.join(', ')}`;
    }
    return notFoundMsg;
  }
  return `Some items are out of stock: ${outOfStock.join(', ')}`;
}

/**
 * Validate item availability against stock
 * @param items - User order items to validate
 * @param stock - Current stock availability
 * @throws ValidationError if any items are not found or out of stock
 */
export function validateItemAvailability(items: UserOrderItems, stock: StockAvailability): void {
  const outOfStock: string[] = [];
  const notFound: string[] = [];

  validateTacos(items.tacos, stock, notFound, outOfStock);
  validateOtherItems(items, stock, notFound, outOfStock);

  if (notFound.length > 0 || outOfStock.length > 0) {
    const message = buildErrorMessage(notFound, outOfStock);
    throw new ValidationError({
      message,
      notFoundItems: notFound,
      outOfStockItems: outOfStock,
    });
  }
}
