/**
 * Generic item processor for extras, drinks, desserts
 * @module services/user-order/processors
 */

import type { CreateUserOrderRequestDto } from '@/api/schemas/user-order.schemas';
import { DessertId } from '@/schemas/dessert.schema';
import { DrinkId } from '@/schemas/drink.schema';
import { ExtraId } from '@/schemas/extra.schema';
import { type StockAvailability, StockCategory } from '@/shared/types/types';
import { ValidationError } from '@/shared/utils/errors.utils';

export class ItemProcessor {
  static processExtra(
    simpleExtra: CreateUserOrderRequestDto['items']['extras'][number],
    stock: StockAvailability
  ) {
    const extra = stock[StockCategory.Extras].find((e) => e.id === simpleExtra.id);
    if (!extra) {
      throw new ValidationError({ message: `Extra not found: ${simpleExtra.id}` });
    }
    return {
      id: ExtraId.parse(extra.id),
      code: extra.code,
      name: extra.name,
      price: extra.price?.value ?? 0,
      quantity: simpleExtra.quantity ?? 1,
    };
  }

  static processDrink(
    simpleDrink: CreateUserOrderRequestDto['items']['drinks'][number],
    stock: StockAvailability
  ) {
    const drink = stock[StockCategory.Drinks].find((d) => d.id === simpleDrink.id);
    if (!drink) {
      throw new ValidationError({ message: `Drink not found: ${simpleDrink.id}` });
    }
    return {
      id: DrinkId.parse(drink.id),
      code: drink.code,
      name: drink.name,
      price: drink.price?.value ?? 0,
      quantity: simpleDrink.quantity ?? 1,
    };
  }

  static processDessert(
    simpleDessert: CreateUserOrderRequestDto['items']['desserts'][number],
    stock: StockAvailability
  ) {
    const dessert = stock[StockCategory.Desserts].find((d) => d.id === simpleDessert.id);
    if (!dessert) {
      throw new ValidationError({ message: `Dessert not found: ${simpleDessert.id}` });
    }
    return {
      id: DessertId.parse(dessert.id),
      code: dessert.code,
      name: dessert.name,
      price: dessert.price?.value ?? 0,
      quantity: simpleDessert.quantity ?? 1,
    };
  }
}
