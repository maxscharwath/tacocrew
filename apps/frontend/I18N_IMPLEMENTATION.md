# i18n Implementation Guide

## Overview

This React application now supports internationalization (i18n) with English and French languages using `react-i18next`, a modern and powerful i18n solution for React applications.

## Features

- ✅ Modern i18n with `react-i18next`
- ✅ Support for English (🇬🇧) and French (🇫🇷)
- ✅ Automatic language detection from browser settings
- ✅ Language persistence in localStorage
- ✅ Clean language switcher component with flag emojis
- ✅ Typed translations with TypeScript support

## Architecture

### Files Structure

```
apps/frontend/src/
├── lib/
│   └── i18n.ts              # i18n configuration
├── locales/
│   ├── en.json              # English translations
│   └── fr.json              # French translations
├── components/
│   └── language-switcher.tsx # Language switcher UI component
```

### Configuration

The i18n configuration is set up in `src/lib/i18n.ts` with:
- Browser language detection
- localStorage persistence
- English as fallback language
- React-safe HTML escaping

### Translation Files

Translation keys are organized by feature:
- `common.*` - Common UI elements (buttons, labels)
- `navigation.*` - Navigation menu items
- `login.*` - Login page translations
- `dashboard.*` - Dashboard page translations
- `root.*` - Root layout translations

## Usage

### In Components

```tsx
import { useTranslation } from 'react-i18next';

export function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('common.title')}</h1>
      <p>{t('common.subtitle')}</p>
    </div>
  );
}
```

### With Interpolation

```tsx
// Translation file
{
  "greeting": "Hello, {{name}}!"
}

// Component
<p>{t('greeting', { name: 'User' })}</p>
// Output: "Hello, User!"
```

### Language Switcher

The `LanguageSwitcher` component is already integrated in:
- Login page (top-right corner)
- Main app header (next to user profile)

Users can toggle between languages with a single click, and their preference is automatically saved.

## Adding New Translations

1. Add the key to both `en.json` and `fr.json`:
```json
// en.json
{
  "myFeature": {
    "title": "My Feature Title"
  }
}

// fr.json
{
  "myFeature": {
    "title": "Titre de ma fonctionnalité"
  }
}
```

2. Use it in your component:
```tsx
<h1>{t('myFeature.title')}</h1>
```

## Adding New Languages

To add support for additional languages:

1. Create a new translation file (e.g., `src/locales/es.json`)
2. Import it in `src/lib/i18n.ts`:
```ts
import es from '../locales/es.json';

export const resources = {
  en: { translation: en },
  fr: { translation: fr },
  es: { translation: es }, // Add new language
} as const;
```

3. Update the `LanguageSwitcher` component to include the new language option

## Currently Translated Pages

- ✅ Login Page
- ✅ Dashboard Page (full translation including metrics, cards, alerts)
- ✅ Root Layout (header, navigation, error boundaries)

## Notes

- Language preference is stored in localStorage under the key `i18nextLng`
- The app automatically detects the user's browser language on first visit
- If the browser language is not supported, English is used as the default
- All translations use proper French grammar and idiomatic expressions
