import { Check } from '@untitledui/icons/Check';
import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type CheckboxProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => {
    const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="flex items-center gap-2">
        <div className="relative">
          <input type="checkbox" id={checkboxId} className="peer sr-only" ref={ref} {...props} />
          <label
            htmlFor={checkboxId}
            className={cn(
              'flex h-5 w-5 cursor-pointer items-center justify-center rounded-md border-2 transition',
              'peer-checked:border-brand-400 peer-checked:bg-brand-500',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-brand-400 peer-focus-visible:ring-offset-2',
              'border-white/20 bg-slate-800/50 hover:border-brand-400/50',
              'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
              className
            )}
          >
            <Check size={12} className="hidden text-white peer-checked:block" />
          </label>
        </div>
        {label && (
          <label
            htmlFor={checkboxId}
            className="cursor-pointer text-sm text-slate-200 peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
          >
            {label}
          </label>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
