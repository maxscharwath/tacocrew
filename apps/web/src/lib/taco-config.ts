/**
 * Taco size configuration for frontend
 * Extends base config from gigatacos-client with UI-specific fields (emojis)
 */
import {
  TACO_SIZE_CONFIG as BASE_TACO_SIZE_CONFIG,
  type TacoSizeConfig as BaseTacoSizeConfig,
  TacoSize,
} from '@tacobot/gigatacos-client';

/**
 * Frontend-specific taco size config with emoji
 */
export interface TacoSizeConfig extends BaseTacoSizeConfig {
  emoji: string;
}

/**
 * Frontend taco size configuration with emojis
 * Extends the base configuration from gigatacos-client
 */
export const TACO_SIZE_CONFIG: Record<TacoSize, TacoSizeConfig> = {
  [TacoSize.L]: { ...BASE_TACO_SIZE_CONFIG[TacoSize.L], emoji: '' },
  [TacoSize.BOWL]: { ...BASE_TACO_SIZE_CONFIG[TacoSize.BOWL], emoji: '🥗' },
  [TacoSize.L_MIXTE]: { ...BASE_TACO_SIZE_CONFIG[TacoSize.L_MIXTE], emoji: '🌯' },
  [TacoSize.XL]: { ...BASE_TACO_SIZE_CONFIG[TacoSize.XL], emoji: '🌯' },
  [TacoSize.XXL]: { ...BASE_TACO_SIZE_CONFIG[TacoSize.XXL], emoji: '🌯' },
  [TacoSize.GIGA]: { ...BASE_TACO_SIZE_CONFIG[TacoSize.GIGA], emoji: '🔥' },
};

export function formatTacoSizeName(size: string | TacoSize): string {
  return TACO_SIZE_CONFIG[size as TacoSize].name;
}
