import { RefreshCw } from 'lucide-react';
import type { VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from './utils';
import { buttonVariants } from './variants';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    readonly loading?: boolean;
  };

export function Button({
  className,
  variant,
  color,
  pill,
  size,
  fullWidth,
  loading,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const isTab = variant === 'tab';

  return (
    <button
      className={cn(
        buttonVariants({ variant, color, pill, size, fullWidth }),
        isDisabled ? 'cursor-not-allowed' : 'cursor-pointer',
        className
      )}
      disabled={isDisabled}
      role={isTab ? 'tab' : undefined}
      type={isTab ? 'button' : props.type}
      {...props}
    >
      {loading && <RefreshCw size={16} className="animate-spin" />}
      {children}
    </button>
  );
}
