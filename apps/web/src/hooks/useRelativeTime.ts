import { useTranslation } from 'react-i18next';

/**
 * Hook for formatting relative time using the native Intl.RelativeTimeFormat API
 * Automatically uses the current i18n language for localization
 *
 * @example
 * ```tsx
 * const { formatRelativeTime } = useRelativeTime();
 * const timeAgo = formatRelativeTime('2024-01-15T10:30:00Z'); // "2 hours ago" / "il y a 2 heures"
 * ```
 */
export function useRelativeTime() {
  const { i18n } = useTranslation();

  const formatter = new Intl.RelativeTimeFormat(i18n.language, {
    numeric: 'auto',
    style: 'long',
  });

  const shortFormatter = new Intl.RelativeTimeFormat(i18n.language, {
    numeric: 'always',
    style: 'short',
  });

  function getTimeDiff(dateInput: string | Date) {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    const now = new Date();
    const diffMs = date.getTime() - now.getTime();

    return {
      seconds: Math.round(diffMs / 1000),
      minutes: Math.round(diffMs / 60000),
      hours: Math.round(diffMs / 3600000),
      days: Math.round(diffMs / 86400000),
      weeks: Math.round(diffMs / 604800000),
      months: Math.round(diffMs / 2592000000),
      years: Math.round(diffMs / 31536000000),
    };
  }

  /**
   * Format a date as relative time (e.g., "il y a 2 minutes", "yesterday")
   */
  function formatRelativeTime(dateInput: string | Date): string {
    const diff = getTimeDiff(dateInput);
    if (!diff) return '—';

    const { seconds, minutes, hours, days, weeks, months, years } = diff;

    if (Math.abs(seconds) < 60) return formatter.format(seconds, 'second');
    if (Math.abs(minutes) < 60) return formatter.format(minutes, 'minute');
    if (Math.abs(hours) < 24) return formatter.format(hours, 'hour');
    if (Math.abs(days) < 7) return formatter.format(days, 'day');
    if (Math.abs(weeks) < 4) return formatter.format(weeks, 'week');
    if (Math.abs(months) < 12) return formatter.format(months, 'month');
    return formatter.format(years, 'year');
  }

  /**
   * Format a date as relative time with short style (e.g., "il y a 2 min")
   */
  function formatRelativeTimeShort(dateInput: string | Date): string {
    const diff = getTimeDiff(dateInput);
    if (!diff) return '—';

    const { seconds, minutes, hours, days, weeks, months, years } = diff;

    if (Math.abs(seconds) < 60) return shortFormatter.format(seconds, 'second');
    if (Math.abs(minutes) < 60) return shortFormatter.format(minutes, 'minute');
    if (Math.abs(hours) < 24) return shortFormatter.format(hours, 'hour');
    if (Math.abs(days) < 7) return shortFormatter.format(days, 'day');
    if (Math.abs(weeks) < 4) return shortFormatter.format(weeks, 'week');
    if (Math.abs(months) < 12) return shortFormatter.format(months, 'month');
    return shortFormatter.format(years, 'year');
  }

  return {
    formatRelativeTime,
    formatRelativeTimeShort,
  } as const;
}
