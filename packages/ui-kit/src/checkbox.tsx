import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from './utils';

const checkboxVariants = cva('', {
  variants: {
    color: {
      brand: 'peer-checked:border-brand-400 peer-checked:bg-brand-500 hover:border-brand-400/50 peer-focus-visible:ring-brand-400',
      rose: 'peer-checked:border-rose-400 peer-checked:bg-rose-500 hover:border-rose-400/50 peer-focus-visible:ring-rose-400',
      amber: 'peer-checked:border-amber-400 peer-checked:bg-amber-500 hover:border-amber-400/50 peer-focus-visible:ring-amber-400',
      emerald: 'peer-checked:border-emerald-400 peer-checked:bg-emerald-500 hover:border-emerald-400/50 peer-focus-visible:ring-emerald-400',
      violet: 'peer-checked:border-violet-400 peer-checked:bg-violet-500 hover:border-violet-400/50 peer-focus-visible:ring-violet-400',
      sky: 'peer-checked:border-sky-400 peer-checked:bg-sky-500 hover:border-sky-400/50 peer-focus-visible:ring-sky-400',
      cyan: 'peer-checked:border-cyan-400 peer-checked:bg-cyan-500 hover:border-cyan-400/50 peer-focus-visible:ring-cyan-400',
    },
  },
  defaultVariants: {
    color: 'brand',
  },
});

type CheckboxProps = InputHTMLAttributes<HTMLInputElement> &
  VariantProps<typeof checkboxVariants> & {
    label?: string;
  };

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, color, ...props }, ref) => {
    const checkboxId = id || `checkbox-${Math.random().toString(36).slice(2, 11)}`;

    return (
      <>
        <style>{`
          #${checkboxId}:checked ~ label [data-check-icon] {
            display: block;
          }
        `}</style>
        <div className="flex items-center gap-2">
          <div className="relative">
            <input type="checkbox" id={checkboxId} className="peer sr-only" ref={ref} {...props} />
            <label
              htmlFor={checkboxId}
              className={cn(
                checkboxVariants({ color }),
                'peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2',
                'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
                'relative flex h-5 w-5 cursor-pointer items-center justify-center rounded-md border-2 transition',
                'border-gray-700 bg-slate-800/50',
                className
              )}
            >
              <div data-check-icon className="absolute hidden h-2 w-2 rounded-full bg-white" />
            </label>
          </div>
          {label && (
            <label
              htmlFor={checkboxId}
              className="cursor-pointer text-slate-200 text-sm peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
            >
              {label}
            </label>
          )}
        </div>
      </>
    );
  }
);

Checkbox.displayName = 'Checkbox';
