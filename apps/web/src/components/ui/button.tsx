import { RefreshCcw01 } from '@untitledui/icons';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'md' | 'sm';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-brand-400 via-brand-500 to-sky-500 text-slate-950 shadow-[0_20px_60px_rgba(99,102,241,0.35)] hover:brightness-110 disabled:opacity-60',
  secondary:
    'bg-slate-900/80 text-white border border-white/10 hover:border-brand-400/40 hover:text-brand-50 disabled:opacity-60',
  outline:
    'border border-white/20 text-slate-100 hover:border-brand-400/60 hover:text-brand-50 disabled:opacity-60',
  ghost: 'text-slate-200 hover:text-brand-50 hover:bg-slate-800/60',
  danger:
    'border border-rose-400/40 bg-rose-500/15 text-rose-50 hover:border-rose-300 hover:bg-rose-500/25 disabled:opacity-60',
};

const sizeClasses: Record<ButtonSize, string> = {
  md: 'h-11 px-5 text-sm',
  sm: 'h-9 px-4 text-xs',
};

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  fullWidth,
  loading,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        isDisabled ? 'cursor-not-allowed' : 'cursor-pointer',
        className
      )}
      disabled={isDisabled}
      {...props}
    >
      {loading && <RefreshCcw01 size={16} className="animate-spin" />}
      {children}
    </button>
  );
}
