/**
 * Mystery taco builder - creates mystery tacos without ingredients (chef picks everything)
 * Mystery tacos are stored as-is in the database and only converted to regular tacos when submitting to external client
 * @module services/user-order/builders
 */

import type { CreateUserOrderRequestDto } from '@/api/schemas/user-order.schemas';
import { type MysteryTaco, TacoId, TacoKind } from '@/schemas/taco.schema';
import type { StockAvailability } from '@/shared/types/types';
import { PriceCalculator } from '../processors/price-calculator';
import type { TacoBuilder } from './taco-builder.interface';

export class MysteryTacoBuilder implements TacoBuilder {
  build(
    simpleTaco: CreateUserOrderRequestDto['items']['tacos'][number],
    stock: StockAvailability
  ): MysteryTaco {
    const id = TacoId.create();

    // Calculate price for mystery taco (base taco size price only, no ingredients)
    const price = PriceCalculator.calculateMysteryTacoPrice(simpleTaco.size, stock);

    return {
      id,
      size: simpleTaco.size,
      note: simpleTaco.note,
      price,
      kind: TacoKind.MYSTERY,
    };
  }
}
