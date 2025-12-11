import type { VariantProps } from 'class-variance-authority';
import { RefreshCw } from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from './utils';
import { buttonVariants } from './variants';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    readonly loading?: boolean;
  };

/**
 * Button component with shadcn-style variants
 *
 * Variants:
 * - default: Primary action button with gradient background
 * - destructive: Destructive/delete actions
 * - outline: Outlined button with transparent background
 * - secondary: Secondary action with subtle background
 * - ghost: Minimal button with no border (until hover)
 * - link: Text link styled as a button
 * - tab: Tab-style button with uppercase text
 *
 * Features:
 * - Solid borders (no transparency)
 * - Borders don't change color on hover/focus (only background/text)
 * - Supports multiple colors: brand, rose, amber, emerald, violet, sky, cyan
 * - Loading state with spinner
 * - Pill shape option
 * - Full width option
 */
export function Button({
  className,
  variant = 'default',
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
        loading && 'opacity-100!',
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
