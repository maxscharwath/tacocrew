import type { UserOrderSummary } from '@/lib/api/types';

/**
 * Extract item lists from an order for display purposes
 */
export function extractOrderItems(order: UserOrderSummary) {
  const taco = order.items.tacos?.[0];

  return {
    meats: taco
      ? taco.meats.map((item: { name: string; quantity?: number }) => ({
          name: item.name,
          quantity: item.quantity ?? 1,
        }))
      : [],
    sauces: taco ? taco.sauces.map((item: { name: string }) => item.name) : [],
    garnitures: taco ? taco.garnitures.map((item: { name: string }) => item.name) : [],
    extras: order.items.extras.map((extra: { name: string }) => extra.name),
    drinks: order.items.drinks.map((drink: { name: string }) => drink.name),
    desserts: order.items.desserts.map((dessert: { name: string }) => dessert.name),
  };
}
