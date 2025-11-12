/**
 * OrderItemChip - A presentational component for displaying order item information
 * @component
 */
type OrderItemChipProps = {
  label: string;
  value: string;
};

export function OrderItemChip({ label, value }: OrderItemChipProps) {
  if (!value || value === '—') {
    return null;
  }

  return (
    <div className="group flex items-center gap-2 rounded-xl border border-white/10 bg-slate-800/50 px-3 py-2 transition hover:border-brand-400/30 hover:bg-slate-800/70">
      <span className="font-semibold text-slate-400 text-xs uppercase tracking-[0.2em]">
        {label}
      </span>
      <span className="font-medium text-sm text-white">{value}</span>
    </div>
  );
}
