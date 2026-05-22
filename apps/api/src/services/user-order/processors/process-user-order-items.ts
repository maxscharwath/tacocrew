/**
 * Shared pipeline that turns a CreateUserOrderRequestDto items payload into
 * the validated, enriched, sorted UserOrderItems we persist. Used by both
 * the create and update use cases so they can't drift.
 * @module services/user-order/processors
 */

import type { CreateUserOrderRequestDto } from '@/api/schemas/user-order.schemas';
import type { StockAvailability, UserOrderItems } from '@/shared/types/types';
import {
  sortUserOrderIngredients,
  validateItemAvailability,
} from '@/shared/utils/order-validation.utils';
import { IdAssigner } from './id-assigner';
import { ItemEnricher } from './item-enricher';
import { TacoIdHexGenerator } from './taco-id-hex-generator';

export type ProcessedUserOrderItems = UserOrderItems & {
  readonly originallyMysteryTacoIds: Set<string>;
};

export function processUserOrderItems(
  simpleItems: CreateUserOrderRequestDto['items'],
  stock: StockAvailability
): ProcessedUserOrderItems {
  const enriched = ItemEnricher.enrich(simpleItems, stock);
  const { originallyMysteryTacoIds, ...items } = enriched;
  const withIds = IdAssigner.assign(items);
  const sorted = sortUserOrderIngredients(withIds);
  validateItemAvailability(sorted, stock);
  const finalItems = TacoIdHexGenerator.generate(sorted);
  return { ...finalItems, originallyMysteryTacoIds };
}
