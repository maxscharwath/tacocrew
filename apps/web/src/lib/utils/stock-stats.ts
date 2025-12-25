/**
 * Stock statistics calculations
 * Computes aggregated stats from stock data
 */

import type { StockResponse } from '@/lib/api';

export interface StockStats {
  inStockCount: number;
  totalCategories: number;
  totalItems: number;
  lowStockCount: number;
}

/**
 * Calculate all stock statistics from stock response
 */
export function calculateStockStats(
  stock: StockResponse,
  activeCategory: keyof StockResponse
): StockStats {
  const items = stock[activeCategory] ?? [];

  const inStockCount = items.filter((item) => item.in_stock).length;
  const totalCategories = Object.values(stock).filter((category) => category.length > 0).length;
  const totalItems = Object.values(stock).reduce((acc, category) => acc + category.length, 0);
  const lowStockCount = Object.values(stock).reduce(
    (acc, category) =>
      acc + category.filter((item: { in_stock: boolean }) => !item.in_stock).length,
    0
  );

  return {
    inStockCount,
    totalCategories,
    totalItems,
    lowStockCount,
  };
}

/**
 * Get in-stock count for specific category
 */
export function getInStockCount(items: Array<{ in_stock: boolean }>): number {
  return items.filter((item) => item.in_stock).length;
}
