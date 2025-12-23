/**
 * Price calculator
 * @module services/user-order/processors
 */

import { type MeatId } from '@/schemas/taco.schema';
import { StockCategory, type StockAvailability, type UserOrderItems } from '@/shared/types/types';

export class PriceCalculator {
  static calculateRegularTacoPrice(
    size: string,
    meats: Array<{ id: MeatId; code: string; name: string; quantity: number }>,
    stock: StockAvailability
  ): number {
    const tacoSizeItem = stock.tacos.find((t) => t.code === size);
    const baseSizePrice = tacoSizeItem?.price.value ?? 0;
    const meatPrice = meats.reduce((sum, meat) => {
      const meatItem = stock[StockCategory.Meats].find((m) => m.id === meat.id);
      return sum + (meatItem?.price?.value ?? 0) * meat.quantity;
    }, 0);
    return baseSizePrice + meatPrice;
  }

  static calculateMysteryTacoPrice(size: string, stock: StockAvailability): number {
    const tacoSizeItem = stock.tacos.find((t) => t.code === size);
    return tacoSizeItem?.price.value ?? 0;
  }
}

export class OrderPriceCalculator {
  static calculateTotalCentimes(items: UserOrderItems): number {
    // Each taco in the array represents one taco
    const tacoTotal = items.tacos.reduce((sum, t) => sum + t.price, 0);
    const extraTotal = items.extras.reduce((sum, e) => sum + e.price * e.quantity, 0);
    const drinkTotal = items.drinks.reduce((sum, d) => sum + d.price * d.quantity, 0);
    const dessertTotal = items.desserts.reduce((sum, d) => sum + d.price * d.quantity, 0);
    return tacoTotal + extraTotal + drinkTotal + dessertTotal;
  }
}

