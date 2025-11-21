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
  defaultNS: 'notifications',
  ns: ['notifications'],
  resources: {
    en: {
      notifications: enTranslations.notifications,
    },
    fr: {
      notifications: frTranslations.notifications,
    },
    de: {
      notifications: deTranslations.notifications,
    },
  },
  interpolation: { escapeValue: false },
  initImmediate: true,
});

export function t(key: string, options?: { lng?: string; [key: string]: unknown }): string {
  const lang = options?.lng?.toLowerCase() ?? 'en';
  const validLang = supportedLngs.includes(lang) ? lang : 'en';
  // Remove 'notifications.' prefix if present since getFixedT already sets the namespace
  const cleanKey = key.startsWith('notifications.') ? key.slice('notifications.'.length) : key;
  return i18next.getFixedT(validLang, 'notifications')(cleanKey, options);
}
