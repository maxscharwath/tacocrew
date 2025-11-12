import { useTranslation } from 'react-i18next';
import { languages } from '@/lib/locale.config';

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();

  const currentLanguage = i18n.language.split('-')[0]; // Handle cases like 'en-US'
  const languageList = languages.map((language) => ({
    code: language.code,
    icon: language.icon,
    label: language.name,
    shortLabel: language.short,
    name: language.name,
  }));

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
  };

  return (
    <div className="group relative flex h-11 items-center gap-2.5 rounded-xl border border-white/10 bg-linear-to-br from-slate-900/90 via-slate-900/80 to-slate-900/70 px-3 py-1.5 shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:shadow-xl">
      {/* Animated background glow */}
      <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-r from-brand-500/10 via-purple-500/10 to-sky-500/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      {languageList.map((language) => {
        const isActive = currentLanguage === language.code;
        return (
          <button
            key={language.code}
            type="button"
            onClick={() => handleLanguageChange(language.code)}
            className={[
              'relative flex items-center gap-2 rounded-lg px-3.5 py-1.5 font-semibold text-xs transition-all duration-300 ease-out',
              isActive
                ? 'scale-105 bg-linear-to-br from-brand-500/30 via-brand-500/20 to-brand-500/10 text-brand-50 shadow-[0_0_20px_rgba(99,102,241,0.3)]'
                : 'text-slate-400 hover:scale-105 hover:bg-slate-800/50 hover:text-slate-200',
            ].join(' ')}
            aria-label={t('languageSwitcher.ariaLabel', { language: language.name })}
            aria-current={isActive ? 'true' : 'false'}
            title={language.label}
          >
            {/* Icon with animation */}
            <span
              role="img"
              aria-label={language.name}
              className={[
                'text-base transition-transform duration-300',
                isActive ? 'scale-110' : 'scale-100',
              ].join(' ')}
            >
              {language.icon}
            </span>

            {/* Text label */}
            <span>{language.shortLabel}</span>
          </button>
        );
      })}
    </div>
  );
}
