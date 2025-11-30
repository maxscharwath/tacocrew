import { format, formatDistanceToNow, isValid } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { getDateFnsLocale, languages } from '@/lib/locale.config';
import { type DateInput, toDate as toDateUtil } from '@/lib/utils/date';

/**
 * Hook for date formatting that uses the selected i18n language
 * Uses date-fns for consistent, locale-aware formatting
 *
 * @example
 * ```tsx
 * const { formatDateTime, formatDate } = useDateFormat();
 * const formatted = formatDateTime('2024-01-15T10:30:00Z');
 * ```
 */
export function useDateFormat() {
  const { i18n } = useTranslation();

  // Get current language config and locale
  const currentLanguage = languages.find((lang) => lang.code === i18n.language);
  const locale = currentLanguage?.locale || getDateFnsLocale(i18n.language);

  /**
   * Format a date with time
   */
  const formatDateTime = (value: DateInput): string => {
    const date = toDateUtil(value);
    if (!isValid(date)) {
      return '—';
    }
    return format(date, 'MMM d, HH:mm', { locale });
  };

  /**
   * Format a date with time and year
   */
  const formatDateTimeWithYear = (value: DateInput): string => {
    const date = toDateUtil(value);
    if (!isValid(date)) {
      return '—';
    }
    return format(date, 'MMM d, yyyy HH:mm', { locale });
  };

  /**
   * Format a date range (start → end)
   */
  const formatDateTimeRange = (start: DateInput, end: DateInput, separator: string = ' → '): string => {
    return `${formatDateTime(start)}${separator}${formatDateTime(end)}`;
  };

  /**
   * Format time only
   */
  const formatTime = (value: DateInput): string => {
    const date = toDateUtil(value);
    if (!isValid(date)) {
      return '—';
    }
    return format(date, 'HH:mm', { locale });
  };

  /**
   * Format time with 12-hour format and AM/PM using Intl.DateTimeFormat
   * Uses 12-hour format only for English (USA), 24-hour format for other languages
   * Uses the selected language from i18n, not the browser's locale
   */
  const formatTime12Hour = (value: DateInput): string => {
    const date = toDateUtil(value);
    if (!isValid(date)) {
      return '—';
    }
    // Use time format config from locale.config
    const lang = currentLanguage || languages.find((l) => l.code === i18n.language);
    const intlLocale = lang?.intlLocale || 'en-US';
    const use12Hour = lang?.timeFormat === '12h';
    const formatter = new Intl.DateTimeFormat(intlLocale, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: use12Hour,
    });
    return formatter.format(date);
  };

  /**
   * Format date with weekday and time
   */
  const formatDate = (value: DateInput): string => {
    const date = toDateUtil(value);
    if (!isValid(date)) {
      return '—';
    }
    return format(date, 'EEE, HH:mm', { locale });
  };

  /**
   * Format date only (no time)
   */
  const formatDateOnly = (value: DateInput, pattern: string = 'MMM d'): string => {
    const date = toDateUtil(value);
    if (!isValid(date)) {
      return '—';
    }
    return format(date, pattern, { locale });
  };

  /**
   * Format relative time (e.g., "2 hours ago", "in 3 days")
   */
  const formatRelativeTime = (value: DateInput): string => {
    const date = toDateUtil(value);
    if (!isValid(date)) {
      return '—';
    }
    return formatDistanceToNow(date, { addSuffix: true, locale });
  };

  /**
   * Format day name (e.g., "Monday", "lundi")
   */
  const formatDayName = (value: DateInput = new Date()): string => {
    const date = toDateUtil(value);
    if (!isValid(date)) {
      return '—';
    }
    return format(date, 'EEEE', { locale });
  };

  return {
    formatDateTime,
    formatDateTimeWithYear,
    formatDateTimeRange,
    formatTime,
    formatTime12Hour,
    formatDate,
    formatDateOnly,
    formatRelativeTime,
    formatDayName,
    locale,
  } as const;
}
