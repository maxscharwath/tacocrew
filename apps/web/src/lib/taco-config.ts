/**
 * Taco size configuration
 * Based on backend: apps/api/src/shared/types/types.ts
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

/**
 * Format taco size code to display name
 * Examples:
 * - "tacos_L" -> "Tacos L"
 * - "tacos_L_mixte" -> "Tacos L Mixte"
 * - "tacos_XL" -> "Tacos XL"
 */
export function formatTacoSizeName(size: string): string {
  const withoutPrefix = size.replace(/^tacos_/, '');
  const parts = withoutPrefix.split('_');
  const formatted = parts
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
  return `Tacos ${formatted}`;
}

/**
 * Convert hex tacoId to base58 tacoID
 * This is used to display user-friendly tacoIDs
 */
export function hexToTacoID(hexTacoId: string): string {
  try {
    // Import bs58 dynamically to avoid SSR issues
    const bs58 = require('bs58');
    const hash = Buffer.from(hexTacoId, 'hex');
    return bs58.encode(hash);
  } catch {
    throw new Error('Invalid tacoId format');
  }
}
