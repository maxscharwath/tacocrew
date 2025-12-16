import type { TFunction } from 'i18next';
import type { DateInput } from './date';
import { combineDateAndTime, toDate } from './date';

type DateFormatter = {
  formatDayName: (value: DateInput) => string;
  formatDateOnly: (value: DateInput, pattern?: string) => string;
  formatTime12Hour: (value: DateInput) => string;
};

type GetRandomOrderNameOptions = {
  startDateValue: string;
  t: TFunction;
  formatters: DateFormatter;
  fallbackDate?: string;
  fallbackTime?: string;
};

type ContextTemplates = Partial<
  Record<'morning' | 'afternoon' | 'evening' | 'weekend' | 'weekday', string[]>
>;

const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === 'string');

const pickRandom = (arr: string[]): string =>
  arr.length ? (arr[Math.trunc(Math.random() * arr.length)] ?? '') : '';

const resolveStartDate = ({
  startDateValue,
  fallbackDate,
  fallbackTime,
}: Pick<GetRandomOrderNameOptions, 'startDateValue' | 'fallbackDate' | 'fallbackTime'>): Date => {
  if (startDateValue) return toDate(startDateValue);

  const hasFallbackDateTime = Boolean(fallbackDate && fallbackTime);
  if (hasFallbackDateTime) return toDate(combineDateAndTime(fallbackDate!, fallbackTime!));

  return new Date();
};

const getTimeOfDay = (hour: number) => {
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
};

const getTemplates = (
  t: TFunction,
  timeOfDay: 'morning' | 'afternoon' | 'evening',
  isWeekend: boolean
): string[] => {
  const context = t('orders.common.randomNames.context', { returnObjects: true }) as unknown;

  if (context && typeof context === 'object' && !Array.isArray(context)) {
    const ctx = context as ContextTemplates;

    const preferred = ctx[timeOfDay] ?? (isWeekend ? ctx.weekend : ctx.weekday) ?? undefined;

    if (isStringArray(preferred)) return preferred;
  }

  const legacy = t('orders.common.randomNames', { returnObjects: true }) as unknown;
  return isStringArray(legacy) ? legacy : [];
};

export function getRandomOrderName({
  startDateValue,
  t,
  formatters,
  fallbackDate,
  fallbackTime,
}: GetRandomOrderNameOptions): string {
  const startDate = resolveStartDate({ startDateValue, fallbackDate, fallbackTime });

  const timeOfDay = getTimeOfDay(startDate.getHours());
  const isWeekend = startDate.getDay() === 0 || startDate.getDay() === 6;

  const templates = getTemplates(t, timeOfDay, isWeekend);
  const template = pickRandom(templates);
  if (!template) return '';

  return t(template, {
    day: formatters.formatDayName(startDate),
    date: formatters.formatDateOnly(startDate, 'MMM d'),
    time: formatters.formatTime12Hour(startDate),
    timeOfDay: t(`orders.common.timeOfDay.${timeOfDay}`, { defaultValue: timeOfDay }),
  });
}
