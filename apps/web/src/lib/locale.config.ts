import { de, enUS, fr, type Locale } from 'date-fns/locale';

/**
 * Time format options
 */
export type TimeFormat = '12h' | '24h';

/**
 * Language configuration type
 */
export type LanguageConfig = {
  code: string;
  name: string;
  short: string;
  locale: Locale;
  icon: string;
  intlLocale: string;
  timeFormat: TimeFormat;
};

/**
 * Language configuration with code, name, short code, locale, icon, and time format settings
 */
export const languages = [
  {
    code: 'en',
    name: 'English',
    short: 'EN',
    locale: enUS,
    icon: '🇬🇧',
    intlLocale: 'en-US',
    timeFormat: '12h',
  },
  {
    code: 'fr',
    name: 'Français',
    short: 'FR',
    locale: fr,
    icon: '🇫🇷',
    intlLocale: 'fr-FR',
    timeFormat: '24h',
  },
  {
    code: 'de',
    name: 'Deutsch',
    short: 'DE',
    locale: de,
    icon: '🇩🇪',
    intlLocale: 'de-DE',
    timeFormat: '24h',
  },
] as const satisfies LanguageConfig[];

/**
 * Gets the date-fns locale from i18n language code
 */
export function getDateFnsLocale(language: string): Locale {
  const lang = languages.find((l) => l.code === language);
  return lang?.locale || enUS;
}
