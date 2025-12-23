/**
 * ID assigner - assigns deterministic IDs to items
 * @module services/user-order/processors
 */

import { DessertId } from '@/schemas/dessert.schema';
import { DrinkId } from '@/schemas/drink.schema';
import { ExtraId } from '@/schemas/extra.schema';
import { GarnitureId, MeatId, SauceId, TacoKind } from '@/schemas/taco.schema';
import { StockCategory, type UserOrderItems } from '@/shared/types/types';
import { deterministicUUID } from '@/shared/utils/uuid.utils';

export class IdAssigner {
  static assign(items: UserOrderItems): UserOrderItems {
    return {
      tacos: items.tacos.map((taco) => {
        // Mystery tacos don't have ingredients, so no ID assignment needed
        if (taco.kind === TacoKind.MYSTERY) {
          return taco;
        }
        return {
          ...taco,
          meats: taco.meats.map((meat) => ({
            ...meat,
            id: MeatId.parse(deterministicUUID(meat.code, StockCategory.Meats)),
          })),
          sauces: taco.sauces.map((sauce) => ({
            ...sauce,
            id: SauceId.parse(deterministicUUID(sauce.code, StockCategory.Sauces)),
          })),
          garnitures: taco.garnitures.map((garniture) => ({
            ...garniture,
            id: GarnitureId.parse(deterministicUUID(garniture.code, StockCategory.Garnishes)),
          })),
        };
      }),
      extras: items.extras.map((extra) => ({
        ...extra,
        id: ExtraId.parse(deterministicUUID(extra.code, StockCategory.Extras)),
      })),
      drinks: items.drinks.map((drink) => ({
        ...drink,
        id: DrinkId.parse(deterministicUUID(drink.code, StockCategory.Drinks)),
      })),
      desserts: items.desserts.map((dessert) => ({
        ...dessert,
        id: DessertId.parse(deterministicUUID(dessert.code, StockCategory.Desserts)),
      })),
    };
  }
}

