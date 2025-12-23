import { cva, type VariantProps } from 'class-variance-authority';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { forwardRef } from 'react';
import { cn } from './utils';

/**
 * Switch component variants using CVA
 */
const switchVariants = cva('', {
  variants: {
    color: {
      brand: 'data-[state=checked]:bg-brand-500 hover:data-[state=checked]:bg-brand-600 focus-visible:ring-brand-400',
      rose: 'data-[state=checked]:bg-rose-500 hover:data-[state=checked]:bg-rose-600 focus-visible:ring-rose-400',
      amber: 'data-[state=checked]:bg-amber-500 hover:data-[state=checked]:bg-amber-600 focus-visible:ring-amber-400',
      emerald: 'data-[state=checked]:bg-emerald-500 hover:data-[state=checked]:bg-emerald-600 focus-visible:ring-emerald-400',
      violet: 'data-[state=checked]:bg-violet-500 hover:data-[state=checked]:bg-violet-600 focus-visible:ring-violet-400',
      sky: 'data-[state=checked]:bg-sky-500 hover:data-[state=checked]:bg-sky-600 focus-visible:ring-sky-400',
      cyan: 'data-[state=checked]:bg-cyan-500 hover:data-[state=checked]:bg-cyan-600 focus-visible:ring-cyan-400',
    },
    size: {
      sm: 'h-5 w-9',
      md: 'h-6 w-11',
      lg: 'h-7 w-14',
    },
  },
  defaultVariants: {
    color: 'brand',
    size: 'md',
  },
});

const switchThumbVariants = cva('', {
  variants: {
    size: {
      sm: 'h-4 w-4 data-[state=checked]:translate-x-4',
      md: 'h-5 w-5 data-[state=checked]:translate-x-5',
      lg: 'h-6 w-6 data-[state=checked]:translate-x-7',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

type SwitchProps = React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root> &
  VariantProps<typeof switchVariants> & {
    readonly label?: string;
  };

/**
 * Switch component built on Radix UI Switch primitive
 *
 * Features:
 * - Accessible by default (keyboard navigation, ARIA attributes)
 * - Multiple color variants: brand, rose, amber, emerald, violet, sky, cyan
 * - Size variants: sm, md, lg
 * - Optional label support
 * - Focus-visible ring for keyboard navigation
 * - Disabled state support
 *
 * @example
 * ```tsx
 * <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
 * <Switch checked={isEnabled} onCheckedChange={setIsEnabled} label="Enable notifications" />
 * <Switch checked={isEnabled} onCheckedChange={setIsEnabled} color="violet" size="lg" />
 * ```
 */
export const Switch = forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  SwitchProps
>(({ className, label, id, color, size, ...props }, ref) => {
  const switchId = id || `switch-${Math.random().toString(36).slice(2, 11)}`;

  return (
    <div className="flex items-center gap-2">
      <SwitchPrimitive.Root
        id={switchId}
        ref={ref}
        className={cn(
          switchVariants({ color, size }),
          'peer',
          'focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'relative inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors',
          'bg-slate-700',
          'data-[state=unchecked]:bg-slate-700',
          className
        )}
        {...props}
      >
        <SwitchPrimitive.Thumb
          className={cn(
            switchThumbVariants({ size }),
            'pointer-events-none block rounded-full bg-white shadow-sm transition-transform',
            'will-change-transform',
            'data-[state=unchecked]:translate-x-0'
          )}
        />
      </SwitchPrimitive.Root>
      {label && (
        <label
          htmlFor={switchId}
          className="cursor-pointer text-slate-200 text-sm peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
        >
          {label}
        </label>
      )}
    </div>
  );
});

Switch.displayName = SwitchPrimitive.Root.displayName;

