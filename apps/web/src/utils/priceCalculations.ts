import type { StockResponse } from '@/lib/api';
import type { MeatSelection, TacoSizeItem } from '@/types/orders';

/**
 * Calculate the price of a taco order
 * Base taco price + meat prices
 */
export function calculateTacoPrice(
  tacoSize: TacoSizeItem | null,
  meats: MeatSelection[],
  stock: StockResponse
): number {
  if (!tacoSize) return 0;

  let total = tacoSize.price;

  // Add meat prices
  meats.forEach((meatSelection) => {
    const meat = stock.meats.find((m) => m.id === meatSelection.id);
    if (meat?.price) {
      total += meat.price * meatSelection.quantity;
    }
  });

  return total;
}

/**
 * Calculate the price of extras, drinks, and desserts
 */
export function calculateAdditionalItemsPrice(
  itemIds: string[],
  stockItems: StockResponse['extras'] | StockResponse['drinks'] | StockResponse['desserts']
): number {
  return itemIds.reduce((total, id) => {
    const item = stockItems.find((i) => i.id === id);
    return total + (item?.price ?? 0);
  }, 0);
}

/**
 * Calculate total order price for order creation
 */
export function calculateOrderTotalPrice(
  tacoSize: TacoSizeItem | null,
  meats: MeatSelection[],
  extras: string[],
  drinks: string[],
  desserts: string[],
  stock: StockResponse
): number {
  const tacoPrice = calculateTacoPrice(tacoSize, meats, stock);
  const extrasPrice = calculateAdditionalItemsPrice(extras, stock.extras);
  const drinksPrice = calculateAdditionalItemsPrice(drinks, stock.drinks);
  const dessertsPrice = calculateAdditionalItemsPrice(desserts, stock.desserts);

  return tacoPrice + extrasPrice + drinksPrice + dessertsPrice;
}

/**
 * Generate price breakdown for order summary
 */
import type { PriceBreakdownItem } from '@/types/orders';

export function generatePriceBreakdown(
  tacoSize: TacoSizeItem | null,
  extras: string[],
  drinks: string[],
  desserts: string[],
  stock: StockResponse
): PriceBreakdownItem[] {
  const breakdown: PriceBreakdownItem[] = [];

  if (tacoSize) {
    breakdown.push({
      label: tacoSize.name,
      price: tacoSize.price,
    });
  }

  extras.forEach((extraId) => {
    const extra = stock.extras.find((e) => e.id === extraId);
    if (extra?.price) {
      breakdown.push({ label: extra.name, price: extra.price });
    }
  });

  drinks.forEach((drinkId) => {
    const drink = stock.drinks.find((d) => d.id === drinkId);
    if (drink?.price) {
      breakdown.push({ label: drink.name, price: drink.price });
    }
  });

  desserts.forEach((dessertId) => {
    const dessert = stock.desserts.find((d) => d.id === dessertId);
    if (dessert?.price) {
      breakdown.push({ label: dessert.name, price: dessert.price });
    }
  });

  return breakdown;
}
