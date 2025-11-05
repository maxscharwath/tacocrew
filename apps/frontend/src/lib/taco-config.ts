/**
 * Taco size configuration
 * Based on backend: apps/backend/src/shared/types/types.ts
 */

export type TacoSize =
  | 'tacos_L'
  | 'tacos_BOWL'
  | 'tacos_L_mixte'
  | 'tacos_XL'
  | 'tacos_XXL'
  | 'tacos_GIGA';

export interface TacoSizeConfig {
  maxMeats: number;
  maxSauces: number;
  allowGarnitures: boolean;
  emoji: string;
}

export const TACO_SIZE_CONFIG: Record<TacoSize, TacoSizeConfig> = {
  tacos_L: { maxMeats: 1, maxSauces: 3, allowGarnitures: true, emoji: '🌮' },
  tacos_BOWL: { maxMeats: 2, maxSauces: 3, allowGarnitures: true, emoji: '🥗' },
  tacos_L_mixte: { maxMeats: 3, maxSauces: 3, allowGarnitures: true, emoji: '🌯' },
  tacos_XL: { maxMeats: 3, maxSauces: 3, allowGarnitures: true, emoji: '🌯' },
  tacos_XXL: { maxMeats: 4, maxSauces: 3, allowGarnitures: true, emoji: '🌯' },
  tacos_GIGA: { maxMeats: 5, maxSauces: 3, allowGarnitures: true, emoji: '🔥' },
};

export function getTacoSizeConfig(size: TacoSize | string): TacoSizeConfig | null {
  return TACO_SIZE_CONFIG[size as TacoSize] ?? null;
}
