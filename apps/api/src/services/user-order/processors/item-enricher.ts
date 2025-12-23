/**
 * Item enricher - enriches simplified items with full stock details
 * @module services/user-order/processors
 */

import type { CreateUserOrderRequestDto } from '@/api/schemas/user-order.schemas';
import { TacoKind } from '@/schemas/taco.schema';
import type { StockAvailability, UserOrderItems } from '@/shared/types/types';
import { TacoBuilderFactory } from '../builders/taco-builder-factory';
import { ItemProcessor } from './item-processor';

export class ItemEnricher {
  static enrich(
    simpleItems: CreateUserOrderRequestDto['items'],
    stock: StockAvailability
  ): UserOrderItems & { originallyMysteryTacoIds: Set<string> } {
    // Expand tacos: if quantity > 1, create multiple taco objects
    const tacos: UserOrderItems['tacos'] = [];
    const originallyMysteryTacoIds = new Set<string>();
    
    for (const simpleTaco of simpleItems.tacos) {
      const kind = simpleTaco.kind ?? TacoKind.REGULAR;
      const builder = TacoBuilderFactory.getBuilder(kind);
      const quantity = simpleTaco.quantity ?? 1;
      const wasOriginallyMystery = kind === TacoKind.MYSTERY;
      
      // Create one taco object for each quantity
      for (let i = 0; i < quantity; i++) {
        const builtTaco = builder.build(simpleTaco, stock);
        tacos.push(builtTaco);
        
        // Track if this taco was originally a mystery order (even though it's now a regular taco with ingredients)
        if (wasOriginallyMystery) {
          originallyMysteryTacoIds.add(builtTaco.id);
        }
      }
    }

    return {
      tacos,
      extras: simpleItems.extras.map((simpleExtra) => ItemProcessor.processExtra(simpleExtra, stock)),
      drinks: simpleItems.drinks.map((simpleDrink) => ItemProcessor.processDrink(simpleDrink, stock)),
      desserts: simpleItems.desserts.map((simpleDessert) => ItemProcessor.processDessert(simpleDessert, stock)),
      originallyMysteryTacoIds,
    };
  }
}

