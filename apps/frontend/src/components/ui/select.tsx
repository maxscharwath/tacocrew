import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  error?: boolean;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <select
        className={cn(
          'w-full rounded-2xl border bg-slate-950/60 px-4 py-3 text-sm text-white',
          'transition-colors',
          'focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40',
          'disabled:cursor-not-allowed disabled:opacity-50',
          '[&>option]:bg-slate-900 [&>option]:text-white',
          error
            ? 'border-rose-400/50 bg-rose-500/10 focus:border-rose-400 focus:ring-rose-400/40'
            : 'border-white/10',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Select.displayName = 'Select';

type MultiSelectProps = SelectProps & {
  multiple: true;
};

export const MultiSelect = forwardRef<HTMLSelectElement, MultiSelectProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <select
        multiple
        className={cn(
          'w-full min-h-[7.5rem] rounded-2xl border bg-slate-950/60 px-4 py-3 text-sm text-white',
          'transition-colors',
          'focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40',
          'disabled:cursor-not-allowed disabled:opacity-50',
          '[&>option]:bg-slate-900 [&>option]:text-white [&>option]:py-2 [&>option]:px-3',
          '[&>option:checked]:bg-brand-500/20 [&>option:checked]:text-brand-100',
          error
            ? 'border-rose-400/50 bg-rose-500/10 focus:border-rose-400 focus:ring-rose-400/40'
            : 'border-white/10',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

MultiSelect.displayName = 'MultiSelect';
