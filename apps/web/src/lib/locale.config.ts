import { de, enUS, fr, type Locale } from 'date-fns/locale';

/**
 * Time format options
 */
export type TimeFormat = '12h' | '24h';

/**
 * Language configuration with code, name, short code, locale, country code, intl locale, and time format settings
 */
export const languages = [
  {
    code: 'en',
    locale: enUS,
    countryCode: 'GB',
    intlLocale: 'en-US',
    timeFormat: '12h',
  },
  {
    code: 'fr',
    locale: fr,
    countryCode: 'FR',
    intlLocale: 'fr-FR',
    timeFormat: '24h',
  },
  {
    code: 'de',
    locale: de,
    countryCode: 'DE',
    intlLocale: 'de-DE',
    timeFormat: '24h',
  },
] as const;

/**
 * Language configuration type (derived from languages array)
 */
export type LanguageConfig = (typeof languages)[number];

/**
 * Gets the date-fns locale from i18n language code
 */
export function getDateFnsLocale(language: string): Locale {
  const lang = languages.find((l) => l.code === language);
  return lang?.locale || enUS;
}
