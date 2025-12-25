/**
 * Badge Progress Formatter
 *
 * Formats badge progress values using the formatter defined in the badge config.
 */

import { getBadgeById } from '@/config/badges.config';

/**
 * Format a progress value for a badge
 *
 * @param badgeId - The badge ID
 * @param value - The raw progress value
 * @returns Formatted string representation of the value
 */
export function formatBadgeProgressValue(badgeId: string, value: number): string {
  const badge = getBadgeById(badgeId);

  // Use the formatter from badge config if available
  if (badge?.valueFormatter) {
    return badge.valueFormatter(value);
  }

  // Default: format as number with locale-specific separators
  return value.toLocaleString();
}
