/**
 * Match cart items against commande.app combinations and return per-item
 * combo metadata. Used by the injection preview to bundle e.g. a Tacos L Mixte
 * with its "Boisson offerte" drink so commande.app charges the bundle price
 * instead of taco + drink at full price.
 */

import { randomUUID } from 'node:crypto';
import type { Combination } from '@tacocrew/commande-client';

export type CartLineForCombo = {
  readonly productId: string;
  readonly quantity: number;
};

export type ApplyCombinationsOptions = {
  /** Service types appended to each emitted combo's serviceTypes (e.g. force `delivery`). */
  readonly extraServiceTypes?: readonly string[];
};

export type AppliedCombo = {
  readonly combinationId: string;
  readonly combinationName: string;
  readonly combinationPrice: number;
  readonly combinationInstanceId: string;
  readonly combinationServiceTypes: readonly string[];
  readonly isMainInCombination: boolean;
};

export type WithCombo<T> = T & { readonly combo?: AppliedCombo };

/**
 * Produces a parallel array of combo annotations: `combos[i]` is the combo
 * applied to `items[i]`, or `undefined`. Greedy: combos with more side slots
 * are tried first so a "2 boissons offertes" wins over "Boisson offerte" when
 * both could apply.
 */
export function applyCombinations<T extends CartLineForCombo>(
  items: readonly T[],
  combinations: readonly Combination[],
  productCategoryById: ReadonlyMap<string, string | null>,
  opts: ApplyCombinationsOptions = {}
): ReadonlyArray<AppliedCombo | undefined> {
  const result: Array<AppliedCombo | undefined> = items.map(() => undefined);

  const sorted = [...combinations]
    .filter((c) => c.isActive)
    .sort((a, b) => sideSlotCount(b) - sideSlotCount(a));

  for (const combo of sorted) {
    const mainSlots = combo.items.filter((i) => i.isMainProduct);
    const sideSlots = combo.items.filter((i) => !i.isMainProduct);
    if (mainSlots.length === 0) continue;

    // Apply repeatedly while there are unallocated matches.
    while (true) {
      const allocated = new Set(result.map((c, i) => (c ? i : -1)).filter((i) => i >= 0));
      const mainIdx = items.findIndex(
        (line, i) =>
          !allocated.has(i) &&
          mainSlots.some(
            (slot) => slot.productId === line.productId && line.quantity >= slot.quantity
          )
      );
      if (mainIdx < 0) break;

      const sideIndices: number[] = [];
      const reserved = new Set([mainIdx, ...allocated]);
      let ok = true;
      for (const slot of sideSlots) {
        for (let n = 0; n < slot.quantity; n++) {
          const sideIdx = items.findIndex(
            (line, i) =>
              !reserved.has(i) &&
              slot.categoryId !== null &&
              productCategoryById.get(line.productId) === slot.categoryId &&
              !slot.excludedProductIds.includes(line.productId) &&
              line.quantity >= 1
          );
          if (sideIdx < 0) {
            ok = false;
            break;
          }
          sideIndices.push(sideIdx);
          reserved.add(sideIdx);
        }
        if (!ok) break;
      }
      if (!ok) break;

      const instanceId = randomUUID();
      const serviceTypes = uniqueServiceTypes(combo.serviceTypes, opts.extraServiceTypes);
      result[mainIdx] = {
        combinationId: combo.id,
        combinationName: combo.name,
        combinationPrice: combo.price,
        combinationInstanceId: instanceId,
        combinationServiceTypes: serviceTypes,
        isMainInCombination: true,
      };
      for (const sideIdx of sideIndices) {
        result[sideIdx] = {
          combinationId: combo.id,
          combinationName: combo.name,
          combinationPrice: combo.price,
          combinationInstanceId: instanceId,
          combinationServiceTypes: serviceTypes,
          isMainInCombination: false,
        };
      }
    }
  }

  return result;
}

function sideSlotCount(c: Combination): number {
  return c.items.filter((i) => !i.isMainProduct).reduce((s, i) => s + i.quantity, 0);
}

function uniqueServiceTypes(
  base: readonly string[],
  extras?: readonly string[]
): readonly string[] {
  const set = new Set<string>(base);
  for (const x of extras ?? []) set.add(x);
  return [...set];
}
