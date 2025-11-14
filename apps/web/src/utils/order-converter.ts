import type { UpsertUserOrderBody } from '@/lib/api/orders';
import type { UserOrderSummary } from '@/lib/api/types';

/**
 * Convert a UserOrderSummary to UpsertUserOrderBody format for API submission
 */
export function convertOrderToUpsertBody(order: UserOrderSummary): UpsertUserOrderBody {
  return {
    items: {
      tacos: order.items.tacos.map((taco) => ({
        size: taco.size,
        meats: taco.meats.map((meat) => ({ id: meat.id, quantity: meat.quantity })),
        sauces: taco.sauces.map((sauce) => ({ id: sauce.id })),
        garnitures: taco.garnitures.map((garniture) => ({ id: garniture.id })),
        note: taco.note,
        quantity: taco.quantity,
      })),
      extras: order.items.extras.map((extra) => ({ id: extra.id, quantity: extra.quantity })),
      drinks: order.items.drinks.map((drink) => ({ id: drink.id, quantity: drink.quantity })),
      desserts: order.items.desserts.map((dessert) => ({
        id: dessert.id,
        quantity: dessert.quantity,
      })),
    },
  };
}
