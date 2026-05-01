/**
 * Generic promotion model.
 *
 * Today commande.app only exposes "buy a tacos of size X, get N free items
 * from category Y" combos, but we model promos generically so future kinds
 * (percentage / fixed-amount discounts, BOGO, …) can extend the union without
 * breaking consumers. Each promo has a single trigger and one or more
 * rewards; the FE matches triggers against cart items and applies rewards.
 */

import type { TacoSize } from '@/domain/taco-config';

export type Promo = FreeItemPromo;

/** Common metadata shared by all promo kinds. */
interface PromoBase {
  readonly id: string;
  readonly name: string;
  /** commande.app service types where this promo is officially supported. */
  readonly serviceTypes: ReadonlyArray<string>;
  readonly trigger: PromoTrigger;
}

/** Buy a qualifying main item, get N free items from a category. */
export interface FreeItemPromo extends PromoBase {
  readonly kind: 'free-item';
  readonly reward: FreeItemReward;
}

export interface PromoTrigger {
  /** Required taco sizes — at least one of these must be in the cart. */
  readonly tacoSizes?: ReadonlyArray<TacoSize>;
  /** How many of the trigger items are required (default 1). */
  readonly quantity: number;
}

export interface FreeItemReward {
  /** How many items are granted free. */
  readonly quantity: number;
  /** Category from which the user picks the free item(s). */
  readonly category: 'drinks' | 'desserts' | 'extras';
  /** Item codes (slugs) excluded from the offer. */
  readonly excludedCodes: ReadonlyArray<string>;
}
