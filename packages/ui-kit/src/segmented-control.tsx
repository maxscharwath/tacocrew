import { cva } from 'class-variance-authority';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { createContext, useContext, useMemo } from 'react';
import { cn } from './utils';

type SegmentedControlContextValue<T = unknown> = {
  readonly value: T;
  readonly onValueChange: (value: T) => void;
  readonly variant: 'primary' | 'secondary';
  readonly disabled?: boolean;
};

const SegmentedControlContext = createContext<SegmentedControlContextValue | null>(null);

function useSegmentedControlContext<T = unknown>(): SegmentedControlContextValue<T> {
  const context = useContext(SegmentedControlContext);
  if (!context) {
    throw new Error(
      'SegmentedControl compound components must be used within a SegmentedControl component'
    );
  }
  // Safe cast: context stores unknown, we cast to the specific type T
  return context as unknown as SegmentedControlContextValue<T>;
}

const containerVariants = cva('flex gap-2 rounded-xl border p-1', {
  variants: {
    variant: {
      primary: 'border-gray-700 bg-slate-800/40',
      secondary:
        'group relative items-center gap-2.5 border-gray-700 bg-linear-to-br from-slate-900/90 via-slate-900/80 to-slate-900/70 px-3 py-1.5 shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-gray-600 hover:shadow-xl',
    },
  },
  defaultVariants: {
    variant: 'primary',
  },
});

const itemVariants = cva(
  'relative z-10 flex items-center justify-center rounded-lg font-semibold transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'flex-1 gap-2 px-4 py-2 text-sm transition-colors',
        secondary: 'gap-2 px-3.5 py-1.5 text-xs transition-all duration-300 ease-out',
      },
      active: {
        true: '',
        false: '',
      },
    },
    compoundVariants: [
      {
        variant: 'primary',
        active: true,
        class: 'bg-brand-500 text-white shadow-[0_4px_12px_rgba(99,102,241,0.3)]',
      },
      {
        variant: 'primary',
        active: false,
        class: 'text-slate-400 hover:text-slate-200',
      },
      {
        variant: 'secondary',
        active: true,
        class:
          'scale-105 bg-linear-to-br from-brand-500/30 via-brand-500/20 to-brand-500/10 text-brand-50 shadow-[0_0_20px_rgba(99,102,241,0.3)]',
      },
      {
        variant: 'secondary',
        active: false,
        class: 'text-slate-400 hover:scale-105 hover:bg-slate-800/50 hover:text-slate-200',
      },
    ],
    defaultVariants: {
      variant: 'primary',
      active: false,
    },
  }
);

type SegmentedControlProps<T> = {
  readonly value: T;
  readonly onValueChange: (value: T) => void;
  readonly variant?: 'primary' | 'secondary';
  readonly disabled?: boolean;
  readonly className?: string;
  readonly children: ReactNode;
};

/**
 * SegmentedControl root component for creating tab-like selection controls.
 * Uses compound component pattern for flexible composition.
 *
 * @param value - Currently selected value
 * @param onValueChange - Callback when selection changes
 * @param variant - Visual style ('primary' | 'secondary')
 * @param disabled - Disable all items
 * @param className - Additional CSS classes
 * @param children - SegmentedControlItem components
 *
 * @example
 * ```tsx
 * <SegmentedControl value={tab} onValueChange={setTab}>
 *   <SegmentedControlItem value="signin">
 *     Sign in
 *   </SegmentedControlItem>
 *   <SegmentedControlItem value="signup">
 *     Sign up
 *   </SegmentedControlItem>
 * </SegmentedControl>
 * ```
 *
 * @see {@link SegmentedControlItem}
 */
export function SegmentedControl<T = unknown>({
  value,
  onValueChange,
  variant = 'primary',
  disabled,
  className,
  children,
}: SegmentedControlProps<T>) {
  const contextValue = useMemo(
    () => ({ value, onValueChange, variant, disabled }),
    [value, onValueChange, variant, disabled]
  );

  return (
    <SegmentedControlContext.Provider
      value={contextValue as unknown as SegmentedControlContextValue}
    >
      <div className={cn(containerVariants({ variant }), className)}>
        {variant === 'secondary' && (
          <div className="pointer-events-none absolute inset-0 rounded-xl bg-linear-to-r from-brand-500/10 via-purple-500/10 to-sky-500/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        )}
        {children}
      </div>
    </SegmentedControlContext.Provider>
  );
}

type SegmentedControlItemProps<T = unknown> = ButtonHTMLAttributes<HTMLButtonElement> & {
  readonly value: T;
  readonly children: ReactNode;
};

/**
 * Individual item within a SegmentedControl.
 * Must be used as a child of SegmentedControl.
 *
 * @param value - Unique value for this item
 * @param children - Content to display in the item
 *
 * @example
 * ```tsx
 * <SegmentedControlItem value="tab1">
 *   Tab 1
 * </SegmentedControlItem>
 *
 * // With icon
 * <SegmentedControlItem value="profile">
 *   <UserIcon size={16} />
 *   Profile
 * </SegmentedControlItem>
 *
 * // With numbers
 * <SegmentedControlItem value={1}>
 *   Option 1
 * </SegmentedControlItem>
 * ```
 */
export function SegmentedControlItem<T = unknown>({
  value: itemValue,
  children,
  className,
  disabled: itemDisabled,
  ...props
}: SegmentedControlItemProps<T>) {
  const { value, onValueChange, variant, disabled: controlDisabled } =
    useSegmentedControlContext<T>();
  const isActive = Object.is(itemValue, value);
  const isDisabled = controlDisabled || itemDisabled;

  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={() => onValueChange(itemValue)}
      data-active={isActive}
      className={cn(itemVariants({ variant, active: isActive }), className)}
      {...props}
    >
      {children}
    </button>
  );
}
