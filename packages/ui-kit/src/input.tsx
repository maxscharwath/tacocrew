import type { ComponentProps } from 'react';
import { cn } from './utils';

function Input({ className, type, ...props }: ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'h-11 w-full min-w-0 rounded-2xl border border-gray-700 bg-slate-950/60 px-4 text-sm text-white shadow-xs transition-[color,box-shadow] outline-none',
        'placeholder:text-slate-500',
        'selection:bg-brand-400 selection:text-white',
        'focus-visible:relative focus-visible:z-10 focus-visible:border-brand-400 focus-visible:ring-[3px] focus-visible:ring-brand-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950',
        'aria-invalid:border-rose-400/50 aria-invalid:bg-rose-500/10 aria-invalid:ring-rose-400/40 aria-invalid:ring-[3px] aria-invalid:ring-offset-2 aria-invalid:ring-offset-slate-950',
        'file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-white',
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
}

export { Input };
