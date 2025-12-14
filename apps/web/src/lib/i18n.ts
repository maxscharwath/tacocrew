import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import resourcesToBackend from 'i18next-resources-to-backend';
import { initReactI18next } from 'react-i18next';
import { z } from 'zod';

import { languages } from './locale.config';

export const defaultNS = 'translation';
export const supportedLngs = languages.map((lang) => lang.code);

i18n
  .use(LanguageDetector)
  .use(resourcesToBackend((language: string) => import(`../locales/${language}.json`)))
  .use(initReactI18next)
  .init({
    defaultNS,
    fallbackLng: 'en',
    supportedLngs,
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
  });

// Configure Zod to use i18n for error messages
z.config({
  customError: (issue) => {
    const message = issue.message;
    return i18n.t(message ?? 'validation.invalid');
  },
});
