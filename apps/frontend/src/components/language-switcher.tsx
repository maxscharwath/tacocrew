import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'en', label: 'EN', flag: '🇬🇧' },
  { code: 'fr', label: 'FR', flag: '🇫🇷' },
] as const;

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const currentLanguage = i18n.language.split('-')[0]; // Handle cases like 'en-US'

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
  };

  return (
    <div className="flex items-center gap-1 rounded-full border border-white/10 bg-slate-900/80 p-1">
      {languages.map((language) => {
        const isActive = currentLanguage === language.code;
        return (
          <button
            key={language.code}
            type="button"
            onClick={() => handleLanguageChange(language.code)}
            className={[
              'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all',
              isActive
                ? 'bg-brand-500/20 text-brand-100 shadow-glow-brand'
                : 'text-slate-400 hover:text-slate-200',
            ].join(' ')}
            aria-label={`Switch to ${language.label}`}
            aria-current={isActive ? 'true' : 'false'}
          >
            <span role="img" aria-label={language.label}>
              {language.flag}
            </span>
            <span>{language.label}</span>
          </button>
        );
      })}
    </div>
  );
}
