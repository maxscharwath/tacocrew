import type {
  Promo,
  PromoCategory,
  StockItem,
  StockResponse,
  UserOrderSummary,
} from '@/lib/api/types';
import type { TacoSize } from '@/lib/taco-config';

export interface CartLine {
  /** Stock item id (used as the line identity in the FE form). */
  readonly id: string;
  /** Stock item code (slug — matches Promo `excludedCodes`). */
  readonly code: string;
  readonly category: PromoCategory;
  readonly price: number;
  /** Number of units on this line (defaults to 1 in the create form, can be >1 on persisted user-orders). */
  readonly quantity: number;
}

export interface AppliedPromo {
  readonly promo: Promo;
  /** Cart-line ids that triggered the promo (e.g. the qualifying tacos). */
  readonly triggerLineIds: ReadonlyArray<string>;
  /** Free units allocated by this promo, keyed by line id. */
  readonly freeUnitsByLineId: ReadonlyMap<string, number>;
  /** Sum of free-line prices — the discount this promo grants. */
  readonly savings: number;
  /** Total reward slots still unfilled (user has more freebies to claim). */
  readonly remainingSlots: number;
}

/**
 * Build a flat list of cart lines from the order form's id arrays. Drinks /
 * desserts / extras participate in promo matching; meats / sauces / garnishes
 * don't (they're option-group selections, not category items).
 */
export function buildCartLines(
  selectedDrinkIds: ReadonlyArray<string>,
  selectedDessertIds: ReadonlyArray<string>,
  selectedExtraIds: ReadonlyArray<string>,
  stock: Pick<StockResponse, 'drinks' | 'desserts' | 'extras'>
): CartLine[] {
  const lines: CartLine[] = [];
  for (const id of selectedDrinkIds) {
    const item = stock.drinks.find((d) => d.id === id);
    if (item) lines.push(toLine(item, 'drinks', 1));
  }
  for (const id of selectedDessertIds) {
    const item = stock.desserts.find((d) => d.id === id);
    if (item) lines.push(toLine(item, 'desserts', 1));
  }
  for (const id of selectedExtraIds) {
    const item = stock.extras.find((d) => d.id === id);
    if (item) lines.push(toLine(item, 'extras', 1));
  }
  return lines;
}

function toLine(item: StockItem, category: PromoCategory, quantity: number): CartLine {
  return {
    id: item.id,
    code: item.code,
    category,
    price: item.price?.value ?? 0,
    quantity,
  };
}

/**
 * Match cart against the promo catalogue. Greedy: the most generous reward
 * (highest `quantity`) is tried first so a "2 boissons offertes" wins over
 * "Boisson offerte" on the same taco.
 *
 * Cheapest-first selection on free items is intentional — we don't want to
 * silently bundle the user's most expensive drink as the "free" one without
 * their consent. The picker UI in the injection modal lets them swap.
 */
export function findApplicablePromos(
  selectedTacoSize: TacoSize | string | null | undefined,
  cartLines: ReadonlyArray<CartLine>,
  promos: ReadonlyArray<Promo>
): AppliedPromo[] {
  if (!selectedTacoSize) return [];
  return findApplicablePromosForCart([selectedTacoSize], cartLines, promos);
}

/** Aggregate free-unit counts across all applied promos, keyed by line id. */
export function collectFreeUnitsByLineId(
  applied: ReadonlyArray<AppliedPromo>
): Map<string, number> {
  const out = new Map<string, number>();
  for (const a of applied) {
    for (const [lineId, units] of a.freeUnitsByLineId) {
      out.set(lineId, (out.get(lineId) ?? 0) + units);
    }
  }
  return out;
}

/** Convenience: any line id that has at least one free unit. */
export function collectFreeLineIds(applied: ReadonlyArray<AppliedPromo>): Set<string> {
  const ids = new Set<string>();
  for (const a of applied) for (const lineId of a.freeUnitsByLineId.keys()) ids.add(lineId);
  return ids;
}

/** Convenience: total savings across all applied promos. */
export function sumPromoSavings(applied: ReadonlyArray<AppliedPromo>): number {
  return applied.reduce((s, a) => s + a.savings, 0);
}

/**
 * Build cart lines from a persisted `UserOrderSummary`. Each line's `id`
 * is namespaced with `keyPrefix` so two user-orders with the same drink
 * code (deterministic stock id) appear as distinct lines to the matcher.
 */
export function buildCartLinesFromUserOrder(
  userOrder: UserOrderSummary,
  keyPrefix = ''
): CartLine[] {
  const lines: CartLine[] = [];
  const prefix = keyPrefix === '' ? '' : `${keyPrefix}:`;
  for (const drink of userOrder.items.drinks) {
    lines.push({
      id: `${prefix}${drink.id}`,
      code: drink.code,
      category: 'drinks',
      price: drink.price.value,
      quantity: drink.quantity ?? 1,
    });
  }
  for (const dessert of userOrder.items.desserts) {
    lines.push({
      id: `${prefix}${dessert.id}`,
      code: dessert.code,
      category: 'desserts',
      price: dessert.price.value,
      quantity: dessert.quantity ?? 1,
    });
  }
  for (const extra of userOrder.items.extras) {
    lines.push({
      id: `${prefix}${extra.id}`,
      code: extra.code,
      category: 'extras',
      price: extra.price.value,
      quantity: extra.quantity ?? 1,
    });
  }
  return lines;
}

/**
 * Multi-taco matcher: a user can have several tacos in a single order, each
 * eligible for its own promo. We allocate each taco to its best matching
 * promo, consuming **per-unit** category lines from a shared pool so a single
 * drink unit can't count for two combos. When a line has `quantity > 1`,
 * combos can free a subset of its units (e.g. line with qty=2 can have 1 free
 * + 1 paid).
 */
export function findApplicablePromosForCart(
  tacoSizes: ReadonlyArray<TacoSize | string>,
  cartLines: ReadonlyArray<CartLine>,
  promos: ReadonlyArray<Promo>
): AppliedPromo[] {
  const triggers = tacoSizes
    .map((size) => {
      const matching = promos
        .filter((p) => p.kind === 'free-item')
        .filter((p) => p.trigger.tacoSizes?.includes(size as TacoSize))
        .sort((a, b) => b.reward.quantity - a.reward.quantity);
      return { size, promo: matching[0] ?? null };
    })
    .filter((x): x is { size: TacoSize | string; promo: Promo } => x.promo !== null)
    .sort((a, b) => b.promo.reward.quantity - a.promo.reward.quantity);

  const applied: AppliedPromo[] = [];
  // unitsConsumedByLineId tracks how many units of each line have been bundled
  // into ANY combo so far — shared pool across all promos.
  const unitsConsumedByLineId = new Map<string, number>();

  for (const { promo } of triggers) {
    const eligible = cartLines
      .filter((l) => l.category === promo.reward.category)
      .filter((l) => !promo.reward.excludedCodes.includes(l.code))
      // Cheapest first — same as before.
      .sort((a, b) => a.price - b.price);

    let needed = promo.reward.quantity;
    const takenByLineId = new Map<string, number>();
    let savings = 0;
    for (const line of eligible) {
      if (needed <= 0) break;
      const alreadyConsumed = unitsConsumedByLineId.get(line.id) ?? 0;
      const available = line.quantity - alreadyConsumed;
      if (available <= 0) continue;
      const take = Math.min(available, needed);
      takenByLineId.set(line.id, (takenByLineId.get(line.id) ?? 0) + take);
      unitsConsumedByLineId.set(line.id, alreadyConsumed + take);
      savings += line.price * take;
      needed -= take;
    }

    applied.push({
      promo,
      triggerLineIds: [],
      freeUnitsByLineId: takenByLineId,
      savings,
      remainingSlots: needed,
    });
  }

  return applied;
}
