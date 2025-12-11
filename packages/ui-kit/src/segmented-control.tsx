import type { ReactNode } from 'react';
import { cn } from './utils';

export type SegmentedControlOption<T extends string = string> = {
  value: T;
  label: ReactNode;
};

type SegmentedControlProps<T extends string = string> = {
  value: T;
  onValueChange: (value: T) => void;
  options: SegmentedControlOption<T>[];
  className?: string;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
  renderOption?: (option: SegmentedControlOption<T>, isActive: boolean) => ReactNode;
};

const containerVariants: Record<'primary' | 'secondary', string> = {
  primary: 'flex gap-2 rounded-xl border border-gray-700 bg-slate-800/40 p-1',
  secondary:
    'group relative flex items-center gap-2.5 rounded-xl border border-gray-700 bg-linear-to-br from-slate-900/90 via-slate-900/80 to-slate-900/70 px-3 py-1.5 shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-gray-600 hover:shadow-xl',
};

const baseButtonClasses: Record<'primary' | 'secondary', string> = {
  primary:
    'relative z-10 flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50',
  secondary:
    'relative z-10 flex items-center gap-2 rounded-lg px-3.5 py-1.5 font-semibold text-xs transition-all duration-300 ease-out cursor-pointer disabled:cursor-not-allowed disabled:opacity-50',
};

const activeButtonClasses: Record<'primary' | 'secondary', string> = {
  primary: 'bg-brand-500 text-white shadow-[0_4px_12px_rgba(99,102,241,0.3)]',
  secondary:
    'scale-105 bg-linear-to-br from-brand-500/30 via-brand-500/20 to-brand-500/10 text-brand-50 shadow-[0_0_20px_rgba(99,102,241,0.3)]',
};

const inactiveButtonClasses: Record<'primary' | 'secondary', string> = {
  primary: 'text-slate-400 hover:text-slate-200',
  secondary: 'text-slate-400 hover:scale-105 hover:bg-slate-800/50 hover:text-slate-200',
};

export function SegmentedControl<T extends string = string>({
  value,
  onValueChange,
  options,
  className,
  disabled,
  variant = 'primary',
  renderOption,
}: Readonly<SegmentedControlProps<T>>) {
  return (
    <div className={cn(containerVariants[variant], className)}>
      {variant === 'secondary' && (
        <div className="pointer-events-none absolute inset-0 rounded-xl bg-linear-to-r from-brand-500/10 via-purple-500/10 to-sky-500/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      )}
      {options.map((option) => {
        const isActive = option.value === value;
        const content = renderOption ? renderOption(option, isActive) : option.label;

        return (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            onClick={() => onValueChange(option.value)}
            data-active={isActive}
            className={cn(
              baseButtonClasses[variant],
              isActive ? activeButtonClasses[variant] : inactiveButtonClasses[variant]
            )}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}
