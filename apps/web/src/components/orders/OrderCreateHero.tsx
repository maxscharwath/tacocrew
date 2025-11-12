import { useTranslation } from 'react-i18next';

export function OrderCreateHero() {
  const { t } = useTranslation();

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-brand-500/15 via-slate-900/80 to-slate-950/90 p-8 shadow-[0_40px_120px_rgba(8,47,73,0.35)]">
      <div className="-top-24 pointer-events-none absolute right-0 h-72 w-72 rounded-full bg-brand-400/30 blur-3xl" />
      <div className="-bottom-16 pointer-events-none absolute left-12 h-60 w-60 rounded-full bg-purple-500/25 blur-3xl" />
      <div className="relative space-y-6">
        <div className="flex items-center gap-3">
          <div className="grid h-14 w-14 place-items-center rounded-xl bg-linear-to-br from-brand-400 via-brand-500 to-sky-500 shadow-[0_10px_30px_rgba(99,102,241,0.35)]">
            <span className="text-3xl">🌮</span>
          </div>
          <div className="flex-1">
            <h1 className="font-semibold text-3xl text-white tracking-tight lg:text-4xl">
              {t('orders.create.hero.title')}
            </h1>
            <p className="mt-1 text-slate-300 text-sm">{t('orders.create.hero.subtitle')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
