/**
 * Taco size configuration for frontend
 *
 * Declares the taco-size domain vocabulary locally (mirroring
 * `apps/api/src/domain/taco-config.ts`) and decorates the base config with
 * UI-specific fields (emojis). This module is the canonical source of
 * `TacoSize`, `TacoSizeConfig`, and `TACO_SIZE_CONFIG` for apps/web; other
 * modules should import these symbols from `@/lib/taco-config`.
 */

/**
 * Taco size options.
 *
 * Values MUST stay identical to `apps/api/src/domain/taco-config.ts` so that
 * persisted records and API payloads line up across the boundary.
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
 * Base per-size taco metadata shared with the API domain module.
 */
interface BaseTacoSizeConfig {
  readonly name: string;
  readonly price: number;
  readonly maxMeats: number;
  readonly maxSauces: number;
  readonly allowGarnitures: boolean;
}

/**
 * Base taco size configuration, mirroring the API's `TACO_SIZE_CONFIG`.
 */
const BASE_TACO_SIZE_CONFIG: Record<TacoSize, BaseTacoSizeConfig> = {
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
 * Frontend-specific taco size config with emoji.
 */
export interface TacoSizeConfig extends BaseTacoSizeConfig {
  readonly emoji: string;
}

/**
 * Frontend taco size configuration with emojis.
 * Extends the base configuration declared above.
 */
export const TACO_SIZE_CONFIG: Record<TacoSize, TacoSizeConfig> = {
  [TacoSize.L]: { ...BASE_TACO_SIZE_CONFIG[TacoSize.L], emoji: '🌮' },
  [TacoSize.BOWL]: { ...BASE_TACO_SIZE_CONFIG[TacoSize.BOWL], emoji: '🥗' },
  [TacoSize.L_MIXTE]: { ...BASE_TACO_SIZE_CONFIG[TacoSize.L_MIXTE], emoji: '🌯' },
  [TacoSize.XL]: { ...BASE_TACO_SIZE_CONFIG[TacoSize.XL], emoji: '🌶️' },
  [TacoSize.XXL]: { ...BASE_TACO_SIZE_CONFIG[TacoSize.XXL], emoji: '⭐' },
  [TacoSize.GIGA]: { ...BASE_TACO_SIZE_CONFIG[TacoSize.GIGA], emoji: '🔥' },
};

export function formatTacoSizeName(size: string | TacoSize): string {
  return TACO_SIZE_CONFIG[size as TacoSize].name;
}
