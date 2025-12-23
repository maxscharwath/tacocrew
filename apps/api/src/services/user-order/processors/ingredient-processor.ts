/**
 * Ingredient processor - handles meats, sauces, garnitures
 * @module services/user-order/processors
 */

import type { CreateUserOrderRequestDto } from '@/api/schemas/user-order.schemas';
import { GarnitureId, MeatId, SauceId } from '@/schemas/taco.schema';
import { StockCategory, type StockAvailability } from '@/shared/types/types';
import { ValidationError } from '@/shared/utils/errors.utils';

export class IngredientProcessor {
  static processMeats(
    simpleMeats: CreateUserOrderRequestDto['items']['tacos'][number]['meats'],
    stock: StockAvailability
  ): Array<{ id: MeatId; code: string; name: string; quantity: number }> {
    return simpleMeats.map((simpleMeat) => {
      const meat = stock[StockCategory.Meats].find((m) => m.id === simpleMeat.id);
      if (!meat) {
        throw new ValidationError({ message: `Meat not found: ${simpleMeat.id}` });
      }
      return {
        id: MeatId.parse(meat.id),
        code: meat.code,
        name: meat.name,
        quantity: simpleMeat.quantity,
      };
    });
  }

  static processSauces(
    simpleSauces: CreateUserOrderRequestDto['items']['tacos'][number]['sauces'],
    stock: StockAvailability
  ) {
    return simpleSauces.map((simpleSauce) => {
      const sauce = stock[StockCategory.Sauces].find((s) => s.id === simpleSauce.id);
      if (!sauce) {
        throw new ValidationError({ message: `Sauce not found: ${simpleSauce.id}` });
      }
      return {
        id: SauceId.parse(sauce.id),
        code: sauce.code,
        name: sauce.name,
      };
    });
  }

  static processGarnitures(
    simpleGarnitures: CreateUserOrderRequestDto['items']['tacos'][number]['garnitures'],
    stock: StockAvailability
  ) {
    return simpleGarnitures.map((simpleGarniture) => {
      const garniture = stock[StockCategory.Garnishes].find((g) => g.id === simpleGarniture.id);
      if (!garniture) {
        throw new ValidationError({ message: `Garniture not found: ${simpleGarniture.id}` });
      }
      return {
        id: GarnitureId.parse(garniture.id),
        code: garniture.code,
        name: garniture.name,
      };
    });
  }
}

