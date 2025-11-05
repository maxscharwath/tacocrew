import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/utils';

type BadgeTone = 'brand' | 'success' | 'warning' | 'neutral';

type BadgeProps = ComponentPropsWithoutRef<'span'> & {
  tone?: BadgeTone;
  pill?: boolean;
};

const toneStyles: Record<BadgeTone, string> = {
  brand:
    'border-brand-400/50 bg-brand-500/15 text-brand-50 shadow-[0_10px_30px_rgba(99,102,241,0.35)]',
  success:
    'border-emerald-400/50 bg-emerald-500/15 text-emerald-50 shadow-[0_10px_30px_rgba(16,185,129,0.25)]',
  warning:
    'border-amber-400/50 bg-amber-500/15 text-amber-50 shadow-[0_10px_30px_rgba(251,191,36,0.25)]',
  neutral: 'border-white/15 bg-slate-800/80 text-slate-200',
};

export function Badge({ tone = 'neutral', pill, className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 border px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em]',
        pill ? 'rounded-full' : 'rounded-xl',
        toneStyles[tone],
        className
      )}
      {...props}
    />
  );
}
