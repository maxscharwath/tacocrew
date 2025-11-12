import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import resourcesToBackend from 'i18next-resources-to-backend';
import { initReactI18next } from 'react-i18next';

import { languages } from './locale.config';

export const defaultNS = 'translation';

// Extract supported language codes from languages config
export const supportedLngs = languages.map((lang) => lang.code);

i18n
  .use(LanguageDetector)
  .use(resourcesToBackend((language) => import(`../locales/${language}.json`)))
  .use(initReactI18next)
  .init({
    defaultNS,
    fallbackLng: 'en',
    supportedLngs,
    interpolation: {
      escapeValue: false, // React already handles escaping
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
  });

export default i18n;
