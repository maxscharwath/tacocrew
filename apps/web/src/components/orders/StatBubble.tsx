import type { ComponentType } from 'react';

/**
 * StatBubble - A presentational component for displaying statistics
 * @component
 */
type StatBubbleProps = {
  icon: ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string | number;
  tone: 'brand' | 'violet' | 'sunset';
};

const toneStyles: Record<StatBubbleProps['tone'], string> = {
  brand: 'bg-brand-500/15 text-brand-100 border-brand-400/40',
  violet: 'bg-purple-500/15 text-purple-100 border-purple-400/40',
  sunset: 'bg-amber-500/15 text-amber-100 border-amber-400/40',
};

const ICON_SIZE = 18;

export function StatBubble({ icon: Icon, label, value, tone }: StatBubbleProps) {
  return (
    <div
      className={`flex h-full min-w-0 flex-col justify-between rounded-2xl border p-3 text-left sm:p-5 ${toneStyles[tone]}`}
    >
      <div className="flex items-start gap-2 text-xs uppercase leading-snug tracking-[0.15em]">
        <Icon size={ICON_SIZE} className="mt-0.5 shrink-0 text-current" />
        <span className="break-words">{label}</span>
      </div>
      <p className="mt-2 font-semibold text-xl leading-tight tracking-tight sm:mt-3 sm:text-2xl">
        {value}
      </p>
    </div>
  );
}
