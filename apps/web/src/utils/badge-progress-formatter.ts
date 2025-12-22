/**
 * Badge Progress Formatter
 * 
 * Formats badge progress values based on the metric type.
 * This centralizes formatting logic and makes it easy to add new metric types.
 */

/**
 * Metric types that require special formatting
 */
const METRIC_FORMATTERS: Record<string, (value: number) => string> = {
  totalSpentCentimes: (value: number) => {
    // Convert centimes to CHF
    const chfValue = value / 100;
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(chfValue);
  },
};

/**
 * Badge ID to metric type mapping
 * This should match the backend badge configuration
 */
const BADGE_METRIC_MAP: Record<string, string> = {
  'big-spender': 'totalSpentCentimes',
  // Add more mappings as needed
  // 'another-badge': 'anotherMetric',
};

/**
 * Format a progress value for a badge
 * 
 * @param badgeId - The badge ID
 * @param value - The raw progress value
 * @returns Formatted string representation of the value
 */
export function formatBadgeProgressValue(badgeId: string, value: number): string {
  const metricType = BADGE_METRIC_MAP[badgeId];
  
  if (metricType && METRIC_FORMATTERS[metricType]) {
    return METRIC_FORMATTERS[metricType](value);
  }
  
  // Default: format as number with locale-specific separators
  return value.toLocaleString();
}

