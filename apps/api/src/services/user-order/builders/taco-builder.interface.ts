/**
 * Taco builder interface - strategy pattern to avoid if/else
 * @module services/user-order/builders
 */

import type { CreateUserOrderRequestDto } from '@/api/schemas/user-order.schemas';
import type { MysteryTaco, RegularTaco } from '@/schemas/taco.schema';
import type { StockAvailability } from '@/shared/types/types';

export interface TacoBuilder {
  build(
    simpleTaco: CreateUserOrderRequestDto['items']['tacos'][number],
    stock: StockAvailability
  ): RegularTaco | MysteryTaco;
}

