import type { TFunction } from 'i18next';

// Country code/identifier (used in forms and API)
export const SWITZERLAND_COUNTRY = 'Switzerland';

/**
 * Get translated country name for Switzerland
 * @param t - Translation function from useTranslation hook
 * @returns Translated country name
 */
export function getSwitzerlandName(t: TFunction): string {
  return t('common.country.switzerland');
}

/**
 * Swiss canton codes enum
 */
export enum SwissCanton {
  AG = 'AG',
  AI = 'AI',
  AR = 'AR',
  BE = 'BE',
  BL = 'BL',
  BS = 'BS',
  FR = 'FR',
  GE = 'GE',
  GL = 'GL',
  GR = 'GR',
  JU = 'JU',
  LU = 'LU',
  NE = 'NE',
  NW = 'NW',
  OW = 'OW',
  SG = 'SG',
  SH = 'SH',
  SO = 'SO',
  SZ = 'SZ',
  TG = 'TG',
  TI = 'TI',
  UR = 'UR',
  VD = 'VD',
  VS = 'VS',
  ZG = 'ZG',
  ZH = 'ZH',
}

// Default canton code
export const DEFAULT_CANTON_CODE = SwissCanton.VD;

/**
 * Get all Swiss canton codes in order
 */
export const SWISS_CANTON_CODES: SwissCanton[] = Object.values(SwissCanton) as SwissCanton[];

/**
 * Get Swiss cantons with translated labels using i18n
 * @param t - Translation function from useTranslation hook
 * @returns Array of canton objects with code and translated label
 */
export function getSwissCantons(t: TFunction): Array<{ code: string; label: string }> {
  return SWISS_CANTON_CODES.map((code) => ({
    code,
    label: t(`common.cantons.${code}`),
  }));
}
