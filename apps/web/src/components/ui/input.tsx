import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, type = 'text', ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'w-full rounded-2xl border bg-slate-950/60 px-4 py-3 text-sm text-white',
          'placeholder:text-slate-500',
          'transition-colors',
          'focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40',
          'disabled:cursor-not-allowed disabled:opacity-50',
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

Input.displayName = 'Input';
