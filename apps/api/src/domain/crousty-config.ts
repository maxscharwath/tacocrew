/**
 * Tasty Crousty domain module.
 *
 * "Tasty Crousty" is a commande.app product family distinct from tacos: a
 * loaded-fries style dish sold in three variants (Sweet, Spicy, Custom). Sweet
 * and Spicy carry only a size group; Custom adds meat / sauce / topping groups.
 * Unlike tacos (which project into a fixed meat/sauce/garniture vocabulary), a
 * Crousty's option groups are free-form, so we surface them verbatim and let
 * the builder render whatever groups the catalogue exposes.
 */

import type { Product } from '@tacocrew/commande-client';
import { classifyProductCategory } from '@/domain/taco-config';

/** Recognised Crousty variants, inferred from the product name. */
export type CroustyVariant = 'sweet' | 'spicy' | 'custom' | 'other';

/** A single selectable option within a Crousty option group. */
export interface CroustyOption {
  readonly id: string;
  readonly name: string;
  readonly price: number;
  readonly available: boolean;
}

/** An option group (e.g. "Taille", "Viande", "Sauce") of a Crousty product. */
export interface CroustyOptionGroup {
  readonly id: string;
  readonly name: string;
  readonly minSelection: number;
  readonly maxSelection: number;
  readonly options: readonly CroustyOption[];
}

/** A Crousty product with its full option structure, surfaced to the builder. */
export interface CroustyProduct {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly price: number;
  readonly imageUrl: string | null;
  readonly available: boolean;
  readonly variant: CroustyVariant;
  readonly optionGroups: readonly CroustyOptionGroup[];
}

/** Whether a commande.app product belongs to the Tasty Crousty family. */
export function isCroustyProduct(
  product: string | { readonly name: string; readonly categoryName?: string | null }
): boolean {
  return classifyProductCategory(product) === 'crousty';
}

/** Infer the Crousty variant from the product display name. */
export function classifyCroustyVariant(name: string): CroustyVariant {
  const normalized = name.toLowerCase();
  if (normalized.includes('sweet')) return 'sweet';
  if (normalized.includes('spicy')) return 'spicy';
  if (normalized.includes('custom')) return 'custom';
  return 'other';
}

/** Stable slug for a Crousty product/option name (matches the taco slugifier). */
export function slugifyCrousty(name: string): string {
  return name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/** Project a commande.app `Product` into a `CroustyProduct`. */
export function mapProductToCrousty(product: Product): CroustyProduct {
  return {
    id: product.id,
    code: slugifyCrousty(product.name),
    name: product.name,
    price: product.price,
    imageUrl: product.imageUrl ?? null,
    available: product.available !== false,
    variant: classifyCroustyVariant(product.name),
    optionGroups: product.optionGroups.map((group) => ({
      id: group.id,
      name: group.name,
      minSelection: group.minSelection,
      maxSelection: group.maxSelection,
      options: group.options.map((option) => ({
        id: option.id,
        name: option.name,
        price: option.extraPrice,
        available: option.available !== false,
      })),
    })),
  };
}
