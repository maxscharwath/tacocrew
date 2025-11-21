/**
 * i18n configuration for backend
 * @module lib/i18n
 */

import i18next from 'i18next';
import deTranslations from '../locales/de.json';
import enTranslations from '../locales/en.json';
import frTranslations from '../locales/fr.json';

const supportedLngs: readonly string[] = ['en', 'fr', 'de'];

// Initialize i18next with embedded translations
// This works in serverless environments where filesystem access may be limited
i18next.init({
  lng: 'en',
  fallbackLng: 'en',
  supportedLngs: [...supportedLngs],
  defaultNS: 'translation',
  resources: {
    en: enTranslations,
    fr: frTranslations,
    de: deTranslations,
  },
  interpolation: { escapeValue: false },
  initImmediate: true,
});

export function t(key: string, options?: { lng?: string; [key: string]: unknown }): string {
  const lang = options?.lng?.toLowerCase() ?? 'en';
  const validLang = supportedLngs.includes(lang) ? lang : 'en';
  return i18next.t(key, { lng: validLang, ...options });
}
