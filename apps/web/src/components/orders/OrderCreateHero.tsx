import { useTranslation } from 'react-i18next';
import { Avatar } from '@/components/ui';

export function OrderCreateHero() {
  const { t } = useTranslation();

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br from-brand-500/15 via-slate-900/80 to-slate-950/90 p-4 shadow-[0_40px_120px_rgba(8,47,73,0.35)] sm:rounded-3xl sm:p-8">
      <div className="-top-24 pointer-events-none absolute right-0 h-72 w-72 rounded-full bg-brand-400/30 blur-3xl" />
      <div className="-bottom-16 pointer-events-none absolute left-12 h-60 w-60 rounded-full bg-purple-500/25 blur-3xl" />
      <div className="relative space-y-4 sm:space-y-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <Avatar color="brandHero" size="lg" variant="elevated" className="sm:size-xl">
            <span className="text-2xl sm:text-3xl">🌮</span>
          </Avatar>
          <div className="flex-1">
            <h1 className="font-semibold text-2xl text-white tracking-tight sm:text-3xl lg:text-4xl">
              {t('orders.create.hero.title')}
            </h1>
            <p className="mt-1 text-slate-300 text-xs sm:text-sm">
              {t('orders.create.hero.subtitle')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
