/**
 * Stock sections management hook
 * Manages section data with i18n labels and filtering
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { StockResponse } from '@/lib/api';

export const STOCK_SECTIONS = [
  { key: 'meats', tone: 'rose' as const },
  { key: 'sauces', tone: 'amber' as const },
  { key: 'garnishes', tone: 'emerald' as const },
  { key: 'extras', tone: 'violet' as const },
  { key: 'drinks', tone: 'sky' as const },
  { key: 'desserts', tone: 'cyan' as const },
] as const satisfies ReadonlyArray<{
  key: keyof StockResponse;
  tone: 'sky' | 'violet' | 'emerald' | 'amber' | 'rose' | 'cyan' | 'brand';
}>;

export type StockSectionKey = (typeof STOCK_SECTIONS)[number]['key'];

interface StockSection {
  key: StockSectionKey;
  label: string;
  blurb: string;
  tone: 'sky' | 'violet' | 'emerald' | 'amber' | 'rose' | 'cyan' | 'brand';
}

/**
 * Get stock sections with i18n labels and filter by availability
 */
export function useStockSections(stock: StockResponse): StockSection[] {
  const { t } = useTranslation();

  return useMemo(() => {
    return STOCK_SECTIONS.map((section) => ({
      ...section,
      label: t(`stock.sections.${section.key}.label`),
      blurb: t(`stock.sections.${section.key}.blurb`),
    })).filter((section) => stock[section.key]?.length);
  }, [stock, t]);
}

/**
 * Get the initial section key
 */
export function getInitialSectionKey(sections: StockSection[]): StockSectionKey {
  return sections[0]?.key ?? STOCK_SECTIONS[0].key;
}
