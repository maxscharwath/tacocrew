import type { UserOrderSummary } from '@/lib/api/types';
import { TacoKind } from '@/lib/api/types';

/**
 * Extract item lists from an order for display purposes
 */
export function extractOrderItems(order: UserOrderSummary) {
  const taco = order.items.tacos?.[0];
  const isMystery = taco?.kind === TacoKind.MYSTERY;

  return {
    meats:
      taco && !isMystery && taco.meats
        ? taco.meats.map((item: { name: string; quantity?: number }) => ({
            name: item.name,
            quantity: item.quantity ?? 1,
          }))
        : [],
    sauces:
      taco && !isMystery && taco.sauces
        ? taco.sauces.map((item: { name: string }) => item.name)
        : [],
    garnitures:
      taco && !isMystery && taco.garnitures
        ? taco.garnitures.map((item: { name: string }) => item.name)
        : [],
    extras: order.items.extras.map((extra: { name: string }) => extra.name),
    drinks: order.items.drinks.map((drink: { name: string }) => drink.name),
    desserts: order.items.desserts.map((dessert: { name: string }) => dessert.name),
  };
}
