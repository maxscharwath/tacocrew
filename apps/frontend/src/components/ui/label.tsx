import type { LabelHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type LabelProps = LabelHTMLAttributes<HTMLLabelElement> & {
  required?: boolean;
};

export function Label({ className, required, children, ...props }: LabelProps) {
  return (
    <label
      className={cn('text-xs font-semibold uppercase tracking-[0.25em] text-slate-400', className)}
      {...props}
    >
      {children}
      {required && <span className="ml-1 text-rose-400">*</span>}
    </label>
  );
}
