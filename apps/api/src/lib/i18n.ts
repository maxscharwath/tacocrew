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

/**
 * Normalize and validate language code
 */
function normalizeLanguage(lng: string): string {
  const lang = lng.toLowerCase();
  return supportedLngs.includes(lang) ? lang : 'en';
}

/**
 * Translation function that can be used in two ways:
 * 1. Direct call: t(key, { lng, ...vars }) - returns translated string
 * 2. Curried call: t(key, { ...vars }) - returns function (lng: string) => string
 */
export function t(
  key: string,
  options?: { lng?: string; [key: string]: unknown }
): string | ((lng: string) => string) {
  // If language is provided, return translated string immediately
  if (options?.lng) {
    return i18next.t(key, { lng: normalizeLanguage(options.lng), ...options });
  }

  // If no language provided, return a function that accepts language
  return (lng: string) => i18next.t(key, { lng: normalizeLanguage(lng), ...options });
}
