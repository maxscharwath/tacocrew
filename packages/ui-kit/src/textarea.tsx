import type { ComponentProps } from 'react';
import { cn } from './utils';

function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'flex field-sizing-content min-h-16 w-full resize-none rounded-2xl border bg-slate-950/60 px-4 py-3 text-sm text-white shadow-xs transition-[color,box-shadow] outline-none',
        'placeholder:text-slate-500',
        'border-gray-700',
        'focus-visible:relative focus-visible:z-10 focus-visible:border-brand-400 focus-visible:ring-[3px] focus-visible:ring-brand-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950',
        'aria-invalid:border-rose-400/50 aria-invalid:bg-rose-500/10 aria-invalid:ring-rose-400/40 aria-invalid:ring-[3px] aria-invalid:ring-offset-2 aria-invalid:ring-offset-slate-950',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
