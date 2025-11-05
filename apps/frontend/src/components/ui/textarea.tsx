import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  error?: boolean;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'w-full min-h-[8rem] resize-none rounded-2xl border bg-slate-950/60 px-4 py-3 text-sm text-white',
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

Textarea.displayName = 'Textarea';
