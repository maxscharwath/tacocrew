import type { UpsertUserOrderBody } from '@/lib/api/orders';
import type { UserOrderSummary } from '@/lib/api/types';
import { TacoKind } from '@/lib/api/types';

/**
 * Convert a UserOrderSummary to UpsertUserOrderBody format for API submission
 */
export function convertOrderToUpsertBody(order: UserOrderSummary): UpsertUserOrderBody {
  return {
    items: {
      tacos: order.items.tacos.map((taco) => {
        const isMystery = taco.kind === TacoKind.MYSTERY;
        return {
          size: taco.size,
          meats: isMystery
            ? []
            : (taco.meats?.map((meat) => ({ id: meat.id, quantity: meat.quantity })) ?? []),
          sauces: isMystery ? [] : (taco.sauces?.map((sauce) => ({ id: sauce.id })) ?? []),
          garnitures: isMystery
            ? []
            : (taco.garnitures?.map((garniture) => ({ id: garniture.id })) ?? []),
          note: taco.note,
          quantity: 1,
          kind: taco.kind,
        };
      }),
      extras: order.items.extras.map((extra) => ({ id: extra.id, quantity: extra.quantity })),
      drinks: order.items.drinks.map((drink) => ({ id: drink.id, quantity: drink.quantity })),
      desserts: order.items.desserts.map((dessert) => ({
        id: dessert.id,
        quantity: dessert.quantity,
      })),
    },
  };
}
