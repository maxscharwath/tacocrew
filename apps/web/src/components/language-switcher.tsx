import { useTranslation } from 'react-i18next';
import { CountryFlag, SegmentedControl, type SegmentedControlOption } from '@/components/ui';
import { updateUserLanguage } from '@/lib/api/user';
import { type LanguageConfig, languages } from '@/lib/locale.config';

type LanguageCode = (typeof languages)[number]['code'];

const options: SegmentedControlOption<LanguageCode>[] = languages.map((language) => {
  const lang = language as LanguageConfig & { countryCode: string };
  return {
    value: lang.code,
    label: (
      <>
        <CountryFlag countryCode={lang.countryCode} size="sm" />
        <span>{lang.code.toUpperCase()}</span>
      </>
    ),
  };
});

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const currentLanguageCode = i18n.language;
  const fallbackCode = languages[0].code;
  const normalizedLanguage = languages.some((language) => language.code === currentLanguageCode)
    ? (currentLanguageCode as LanguageCode)
    : (fallbackCode as LanguageCode);

  return (
    <SegmentedControl
      variant="secondary"
      value={normalizedLanguage}
      onValueChange={(languageCode) => {
        // Update frontend language immediately
        i18n.changeLanguage(languageCode);

        // Sync to backend (fire and forget - don't block UI)
        updateUserLanguage(languageCode as 'en' | 'fr' | 'de').catch((error) => {
          console.error('Failed to update user language preference', error);
        });
      }}
      options={options}
    />
  );
}
