/**
 * Generic item processor for extras, drinks, desserts
 * @module services/user-order/processors
 */

import type { CreateUserOrderRequestDto } from '@/api/schemas/user-order.schemas';
import { type Crousty, CroustyId } from '@/schemas/crousty.schema';
import { DessertId } from '@/schemas/dessert.schema';
import { DrinkId } from '@/schemas/drink.schema';
import { ExtraId } from '@/schemas/extra.schema';
import { type StockAvailability, StockCategory } from '@/shared/types/types';
import { ValidationError } from '@/shared/utils/errors.utils';
import { deterministicUUID } from '@/shared/utils/uuid.utils';

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

  static processCrousty(
    simpleCrousty: CreateUserOrderRequestDto['items']['crousties'][number],
    stock: StockAvailability
  ): Crousty {
    const product = stock.crousties.find((c) => c.code === simpleCrousty.code);
    if (!product) {
      throw new ValidationError({ message: `Crousty not found: ${simpleCrousty.code}` });
    }
    // Validate every selected option exists on the product; keep the option's
    // exact catalogue name so submission can re-resolve it to an itemId.
    const options = simpleCrousty.options.map((selection) => {
      const group = product.optionGroups.find((g) => g.name === selection.groupName);
      const option = group?.options.find((o) => o.name === selection.optionName);
      if (!group || !option) {
        throw new ValidationError({
          message: `Crousty option not found: ${selection.groupName} / ${selection.optionName}`,
        });
      }
      return { groupName: group.name, optionName: option.name };
    });
    const variant = product.variant === 'other' ? 'custom' : product.variant;
    return {
      id: CroustyId.parse(
        deterministicUUID(`${product.code}:${JSON.stringify(options)}`, 'crousty')
      ),
      code: product.code,
      name: product.name,
      variant,
      price: product.price.value,
      quantity: simpleCrousty.quantity ?? 1,
      options,
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
