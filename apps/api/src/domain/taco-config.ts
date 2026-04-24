/**
 * Canonical taco-domain module.
 *
 * Owns the taco-specific vocabulary (sizes, order types, ingredients) and the
 * mappers that convert the generic commande.app `Product` / `OptionGroup` shape
 * into our domain types. Living in apps/api keeps taco concepts out of the
 * generic `@tacocrew/commande-client` wrapper.
 */

import type { OptionGroup, Product } from '@tacocrew/commande-client';

/**
 * Raw stock info as produced by the commande.app-derived integration layer.
 *
 * Shape mirrors the legacy `StockInfo` from `@tacocrew/gigatacos-client` so
 * downstream services can swap import paths without reshaping data.
 */
export interface StockInfo {
  readonly name: string;
  readonly in_stock: boolean;
  readonly price?: number;
  readonly imageUrl?: string | null;
}

/**
 * Stock availability for all product categories (raw/backend format).
 *
 * Keys are stable option identifiers; values are per-option stock info.
 * This mirrors the legacy `StockAvailability` shape from
 * `@tacocrew/gigatacos-client/types.ts`. It is kept as the *source* shape for
 * stock derivation — services adapt it to the API format as needed.
 */
export interface StockAvailability {
  readonly viandes: Record<string, StockInfo>;
  readonly sauces: Record<string, StockInfo>;
  readonly garnitures: Record<string, StockInfo>;
  readonly desserts: Record<string, StockInfo>;
  readonly boissons: Record<string, StockInfo>;
  readonly extras: Record<string, StockInfo>;
}

/**
 * Semantic classification of a commande.app product by its category/name.
 *
 * Products on commande.app lack a strict taxonomy, so we infer the role from
 * the product's display name. Tacos are handled separately via
 * `classifyTacoSize`.
 */
export type ProductCategoryKind = 'drink' | 'dessert' | 'extra' | 'other';

const DRINK_NAME_PATTERN = /boisson|drink|soda|eau|bi[eè]re|coca|fanta|sprite|ice tea|thé/i;
const DESSERT_NAME_PATTERN = /dessert|gâteau|gateau|brownie|tiramisu|glace|cookie|muffin|pancake/i;
const EXTRA_NAME_PATTERN = /extra|supp|side|frite|fries|nugget|wings|onion|potatoe/i;

/**
 * Classify a product by its display name into a stock bucket.
 */
export function classifyProductCategory(name: string): ProductCategoryKind {
  if (DRINK_NAME_PATTERN.test(name)) return 'drink';
  if (DESSERT_NAME_PATTERN.test(name)) return 'dessert';
  if (EXTRA_NAME_PATTERN.test(name)) return 'extra';
  return 'other';
}

/**
 * Taco size options.
 *
 * Values are kept identical to the legacy gigatacos-client enum so that
 * downstream consumers (schemas, persisted records, API payloads) can swap
 * import paths without any data-layer migration.
 */
export enum TacoSize {
  L = 'tacos_L',
  BOWL = 'tacos_BOWL',
  L_MIXTE = 'tacos_L_mixte',
  XL = 'tacos_XL',
  XXL = 'tacos_XXL',
  GIGA = 'tacos_GIGA',
}

/**
 * Per-size taco metadata: display name, price, and selection constraints.
 */
export interface TacoSizeConfig {
  readonly name: string;
  readonly price: number;
  readonly maxMeats: number;
  readonly maxSauces: number;
  readonly allowGarnitures: boolean;
}

/**
 * Single source of truth for taco size metadata. Shared between API and web.
 */
export const TACO_SIZE_CONFIG: Record<TacoSize, TacoSizeConfig> = {
  [TacoSize.L]: {
    name: 'Tacos L',
    price: 11,
    maxMeats: 1,
    maxSauces: 3,
    allowGarnitures: true,
  },
  [TacoSize.BOWL]: {
    name: 'Tacos Bowl',
    price: 14,
    maxMeats: 2,
    maxSauces: 3,
    allowGarnitures: true,
  },
  [TacoSize.L_MIXTE]: {
    name: 'Tacos L Mixte',
    price: 12,
    maxMeats: 3,
    maxSauces: 3,
    allowGarnitures: true,
  },
  [TacoSize.XL]: {
    name: 'Tacos XL',
    price: 18.5,
    maxMeats: 3,
    maxSauces: 3,
    allowGarnitures: true,
  },
  [TacoSize.XXL]: {
    name: 'Tacos XXL',
    price: 28,
    maxMeats: 4,
    maxSauces: 3,
    allowGarnitures: true,
  },
  [TacoSize.GIGA]: {
    name: 'Tacos GIGA',
    price: 38,
    maxMeats: 5,
    maxSauces: 3,
    allowGarnitures: true,
  },
};

/**
 * Order fulfilment channel. Values match the legacy backend slugs.
 */
export enum OrderType {
  DELIVERY = 'livraison',
  TAKEAWAY = 'emporter',
}

/**
 * Meat in a taco (carries quantity because a single meat may be chosen
 * multiple times, e.g. double chicken).
 */
export interface Meat {
  readonly id: string;
  readonly name: string;
  readonly quantity: number;
}

/** Sauce in a taco. */
export interface Sauce {
  readonly id: string;
  readonly name: string;
}

/** Garniture (topping) in a taco. */
export interface Garniture {
  readonly id: string;
  readonly name: string;
}

/** Complete taco as stored in our domain. */
export interface Taco {
  readonly id: string;
  readonly size: TacoSize;
  readonly meats: readonly Meat[];
  readonly sauces: readonly Sauce[];
  readonly garnitures: readonly Garniture[];
  readonly note?: string;
  readonly price?: number;
}

/**
 * Semantic classification of a commande.app option-group.
 *
 * Option groups on commande.app are untyped — we infer their role from the
 * group's display name.
 */
export type OptionGroupKind = 'meat' | 'sauce' | 'garniture' | 'other';

/**
 * Selected option referenced by caller-provided IDs. Quantity defaults to 1
 * when the group is not a meat group.
 */
export interface SelectedOption {
  readonly groupId: string;
  readonly optionId: string;
  readonly quantity: number;
}

const MEAT_NAME_PATTERN = /viande/i;
const SAUCE_NAME_PATTERN = /sauce/i;
// `supp(lement)` / `topping` / `garniture` are all treated as garnitures.
const GARNITURE_NAME_PATTERN = /garniture|supp|topping/i;

/**
 * Classify an option group by its display name.
 */
export function classifyOptionGroup(group: OptionGroup): OptionGroupKind {
  const name = group.name;
  if (MEAT_NAME_PATTERN.test(name)) return 'meat';
  if (SAUCE_NAME_PATTERN.test(name)) return 'sauce';
  if (GARNITURE_NAME_PATTERN.test(name)) return 'garniture';
  return 'other';
}

// Order matters: more specific matches (L mixte, XXL, XL) must be tested
// before their less-specific substrings (L).
const TACO_SIZE_PATTERNS: readonly (readonly [RegExp, TacoSize])[] = [
  [/l\s*mixte/i, TacoSize.L_MIXTE],
  [/bowl/i, TacoSize.BOWL],
  [/giga/i, TacoSize.GIGA],
  [/xxl/i, TacoSize.XXL],
  [/xl/i, TacoSize.XL],
  [/\bl\b/i, TacoSize.L],
] as const;

/**
 * Infer taco size from a product or variant display name.
 *
 * Returns `undefined` when the name does not match any known taco size — the
 * caller decides whether that is an error (e.g. mapping a fries product into
 * a Taco) or a legitimate skip.
 */
export function classifyTacoSize(name: string): TacoSize | undefined {
  for (const [pattern, size] of TACO_SIZE_PATTERNS) {
    if (pattern.test(name)) return size;
  }
  return undefined;
}

function collectSelectedOptions(
  group: OptionGroup,
  selected: readonly SelectedOption[]
): { option: OptionGroup['options'][number]; quantity: number }[] {
  const forGroup = selected.filter((s) => s.groupId === group.id);
  const optionsById = new Map(group.options.map((o) => [o.id, o]));
  const result: { option: OptionGroup['options'][number]; quantity: number }[] = [];
  for (const sel of forGroup) {
    const option = optionsById.get(sel.optionId);
    if (option === undefined) continue;
    result.push({ option, quantity: sel.quantity });
  }
  return result;
}

/**
 * Project a meat option-group's selection into our `Meat[]` shape.
 */
export function mapOptionGroupToMeats(
  group: OptionGroup,
  selected: readonly SelectedOption[]
): Meat[] {
  return collectSelectedOptions(group, selected).map(({ option, quantity }) => ({
    id: option.id,
    name: option.name,
    quantity,
  }));
}

/**
 * Project a sauce option-group's selection into our `Sauce[]` shape.
 */
export function mapOptionGroupToSauces(
  group: OptionGroup,
  selected: readonly SelectedOption[]
): Sauce[] {
  return collectSelectedOptions(group, selected).map(({ option }) => ({
    id: option.id,
    name: option.name,
  }));
}

/**
 * Project a garniture option-group's selection into our `Garniture[]` shape.
 */
export function mapOptionGroupToGarnitures(
  group: OptionGroup,
  selected: readonly SelectedOption[]
): Garniture[] {
  return collectSelectedOptions(group, selected).map(({ option }) => ({
    id: option.id,
    name: option.name,
  }));
}

/**
 * Map a commande.app `Product` and a flat list of selected options into our
 * `Taco` domain object.
 *
 * Throws when the product name does not correspond to a known taco size —
 * callers should pre-filter the catalogue before invoking this mapper.
 */
export function mapProductToTaco(
  product: Product,
  selectedOptions: readonly SelectedOption[]
): Taco {
  const size = classifyTacoSize(product.name);
  if (size === undefined) {
    throw new Error(
      `mapProductToTaco: product "${product.name}" (id=${product.id}) does not map to a known TacoSize`
    );
  }

  const meats: Meat[] = [];
  const sauces: Sauce[] = [];
  const garnitures: Garniture[] = [];

  for (const group of product.optionGroups) {
    switch (classifyOptionGroup(group)) {
      case 'meat':
        meats.push(...mapOptionGroupToMeats(group, selectedOptions));
        break;
      case 'sauce':
        sauces.push(...mapOptionGroupToSauces(group, selectedOptions));
        break;
      case 'garniture':
        garnitures.push(...mapOptionGroupToGarnitures(group, selectedOptions));
        break;
      case 'other':
        break;
    }
  }

  return {
    id: product.id,
    size,
    meats,
    sauces,
    garnitures,
    price: TACO_SIZE_CONFIG[size].price,
  };
}
