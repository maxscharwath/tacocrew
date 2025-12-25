/**
 * Regular taco builder
 * @module services/user-order/builders
 */

import type { CreateUserOrderRequestDto } from '@/api/schemas/user-order.schemas';
import { type RegularTaco, TacoId, TacoKind } from '@/schemas/taco.schema';
import type { StockAvailability } from '@/shared/types/types';
import { generateTacoID } from '@/shared/utils/order-taco-id.utils';
import { IngredientProcessor } from '../processors/ingredient-processor';
import { PriceCalculator } from '../processors/price-calculator';
import type { TacoBuilder } from './taco-builder.interface';

export class RegularTacoBuilder implements TacoBuilder {
  build(
    simpleTaco: CreateUserOrderRequestDto['items']['tacos'][number],
    stock: StockAvailability
  ): RegularTaco {
    const id = TacoId.create();

    const meats = IngredientProcessor.processMeats(simpleTaco.meats, stock);
    const sauces = IngredientProcessor.processSauces(simpleTaco.sauces, stock);
    const garnitures = IngredientProcessor.processGarnitures(simpleTaco.garnitures, stock);

    const price = PriceCalculator.calculateRegularTacoPrice(simpleTaco.size, meats, stock);

    const baseTaco = {
      id,
      size: simpleTaco.size,
      meats,
      sauces,
      garnitures,
      note: simpleTaco.note,
      price,
    };

    return {
      ...baseTaco,
      kind: TacoKind.REGULAR,
      tacoID: generateTacoID({ ...baseTaco, kind: TacoKind.REGULAR }),
    };
  }
}
