import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentPropsWithoutRef } from 'react';
import { cn } from './utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 border px-2 py-0.5 font-semibold text-xs uppercase',
  {
    variants: {
      tone: {
        brand:
          'border-brand-400/50 bg-brand-500/15 text-brand-50 shadow-[0_10px_30px_rgba(99,102,241,0.35)]',
        success:
          'border-emerald-400/50 bg-emerald-500/15 text-emerald-50 shadow-[0_10px_30px_rgba(16,185,129,0.25)]',
        warning:
          'border-amber-400/50 bg-amber-500/15 text-amber-50 shadow-[0_10px_30px_rgba(251,191,36,0.25)]',
        neutral: 'border-gray-700 bg-slate-800/80 text-slate-200',
      },
      pill: {
        true: 'rounded-full',
        false: 'rounded-xl',
      },
    },
    defaultVariants: {
      tone: 'neutral',
      pill: false,
    },
  }
);

type BadgeProps = ComponentPropsWithoutRef<'span'> & VariantProps<typeof badgeVariants>;

export function Badge({ tone, pill, className, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone, pill }), className)} {...props} />;
}
