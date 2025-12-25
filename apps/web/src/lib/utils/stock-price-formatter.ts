/**
 * Stock price formatting utility
 * Formats prices with currency localization
 */

export interface Price {
  value: number;
  currency: string;
}

/**
 * Format price with proper currency localization
 */
export function formatPrice(amount: Price): string {
  return amount.value.toLocaleString(undefined, {
    style: 'currency',
    currency: amount.currency,
  });
}
