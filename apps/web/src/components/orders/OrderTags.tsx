import { useTranslation } from 'react-i18next';

type OrderTagsProps = {
  readonly taco?: { size?: string; quantity?: number };
  readonly meats: Array<{ name: string; quantity: number }>;
  readonly sauces: string[];
  readonly garnitures: string[];
  readonly extras: string[];
  readonly drinks: string[];
  readonly desserts: string[];
};

export function OrderTags({
  taco,
  meats,
  sauces,
  garnitures,
  extras,
  drinks,
  desserts,
}: OrderTagsProps) {
  const { t } = useTranslation();
  const tt = (key: string, options?: Record<string, unknown>) => t(`orders.detail.${key}`, options);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {taco && (
        <span className="inline-flex items-center rounded-lg border border-brand-400/35 bg-brand-500/20 px-2.5 py-1 font-semibold text-[11px] text-brand-100 shadow-sm">
          {tt('list.tagCounts.tacos', { count: taco.quantity ?? 1 })}
        </span>
      )}
      {meats.map((meat, idx) => (
        <span
          key={`meat-${meat.name}-${meat.quantity}-${idx}`}
          className="inline-flex items-center gap-1 rounded-lg border border-orange-400/25 bg-orange-500/12 px-2.5 py-1 font-semibold text-[11px] text-orange-100"
        >
          {meat.name}
          {meat.quantity > 1 && <span className="text-orange-300">×{meat.quantity}</span>}
        </span>
      ))}
      {sauces.map((sauce, idx) => (
        <span
          key={`sauce-${sauce}-${idx}`}
          className="inline-flex items-center rounded-lg border border-violet-400/25 bg-violet-500/12 px-2.5 py-1 font-medium text-[11px] text-violet-100"
        >
          {sauce}
        </span>
      ))}
      {garnitures.map((garnish, idx) => (
        <span
          key={`garnish-${garnish}-${idx}`}
          className="inline-flex items-center rounded-lg border border-emerald-400/25 bg-emerald-500/12 px-2.5 py-1 font-medium text-[11px] text-emerald-100"
        >
          {garnish}
        </span>
      ))}
      {extras.length > 0 && (
        <span className="inline-flex items-center rounded-lg border border-amber-400/25 bg-amber-500/12 px-2.5 py-1 font-semibold text-[11px] text-amber-100">
          {tt('list.tagCounts.extras', { count: extras.length })}
        </span>
      )}
      {drinks.length > 0 && (
        <span className="inline-flex items-center rounded-lg border border-sky-400/25 bg-sky-500/12 px-2.5 py-1 font-semibold text-[11px] text-sky-100">
          {tt('list.tagCounts.drinks', { count: drinks.length })}
        </span>
      )}
      {desserts.length > 0 && (
        <span className="inline-flex items-center rounded-lg border border-rose-400/25 bg-rose-500/12 px-2.5 py-1 font-semibold text-[11px] text-rose-100">
          {tt('list.tagCounts.desserts', { count: desserts.length })}
        </span>
      )}
    </div>
  );
}
