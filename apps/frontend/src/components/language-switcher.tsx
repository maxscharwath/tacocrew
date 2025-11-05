import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'en', label: 'English', shortLabel: 'EN', flag: '🇬🇧', name: 'English' },
  { code: 'fr', label: 'Français', shortLabel: 'FR', flag: '🇫🇷', name: 'French' },
] as const;

type LanguageSwitcherProps = {
  variant?: 'default' | 'compact';
};

export function LanguageSwitcher({ variant = 'default' }: LanguageSwitcherProps = {}) {
  const { i18n } = useTranslation();

  const currentLanguage = i18n.language.split('-')[0]; // Handle cases like 'en-US'

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
  };

  // Compact variant for tight spaces
  if (variant === 'compact') {
    return (
      <div className="group relative inline-flex items-center gap-0.5 rounded-full border border-white/10 bg-slate-900/80 p-0.5 shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-brand-400/30 hover:shadow-[0_0_20px_rgba(99,102,241,0.2)]">
        {languages.map((language) => {
          const isActive = currentLanguage === language.code;
          return (
            <button
              key={language.code}
              type="button"
              onClick={() => handleLanguageChange(language.code)}
              className={[
                'relative flex items-center justify-center rounded-full p-2 text-lg transition-all duration-300 ease-out',
                isActive
                  ? 'bg-brand-500/20 text-brand-50 shadow-[0_0_15px_rgba(99,102,241,0.4)] scale-110'
                  : 'text-slate-400 hover:scale-110 hover:bg-slate-800/50 hover:text-slate-200',
              ].join(' ')}
              aria-label={`Switch to ${language.name}`}
              aria-current={isActive ? 'true' : 'false'}
              title={language.label}
            >
              <span
                role="img"
                aria-label={language.name}
                className="transition-transform duration-300"
              >
                {language.flag}
              </span>

              {/* Active ring indicator */}
              {isActive && (
                <span className="absolute inset-0 rounded-full border-2 border-brand-400/50 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Default variant with full labels
  return (
    <div className="group relative flex items-center gap-1 rounded-full border border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-slate-900/70 p-1 shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:shadow-xl">
      {/* Animated background glow */}
      <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-r from-brand-500/10 via-purple-500/10 to-sky-500/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      {languages.map((language) => {
        const isActive = currentLanguage === language.code;
        return (
          <button
            key={language.code}
            type="button"
            onClick={() => handleLanguageChange(language.code)}
            className={[
              'relative flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold transition-all duration-300 ease-out',
              isActive
                ? 'bg-gradient-to-br from-brand-500/30 via-brand-500/20 to-brand-500/10 text-brand-50 shadow-[0_0_20px_rgba(99,102,241,0.3)] scale-105'
                : 'text-slate-400 hover:scale-105 hover:bg-slate-800/50 hover:text-slate-200',
            ].join(' ')}
            aria-label={`Switch to ${language.name}`}
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
              {language.flag}
            </span>

            {/* Text label */}
            <span className="relative">
              {language.shortLabel}

              {/* Active indicator dot */}
              {isActive && (
                <span className="absolute -top-0.5 -right-1 h-1.5 w-1.5 animate-pulse rounded-full bg-brand-400 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
