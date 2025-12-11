/**
 * Base component utilities
 * Provides common patterns and helpers for UI components
 */

import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cn } from './utils';

/**
 * Base props for all UI components
 */
export interface BaseProps {
  readonly className?: string;
  readonly children?: ReactNode;
}

/**
 * Base container component with consistent styling
 */
export function BaseContainer({
  className,
  children,
  ...props
}: BaseProps & ComponentPropsWithoutRef<'div'>) {
  return (
    <div className={cn('rounded-3xl border border-border bg-card shadow-[0_30px_90px_rgba(8,47,73,0.35)] backdrop-blur', className)} {...props}>
      {children}
    </div>
  );
}

/**
 * Base input wrapper with consistent styling
 */
const inputWrapperVariants = cva('w-full', {
  variants: {
    error: {
      true: 'border-error-500',
      false: 'border-border',
    },
  },
  defaultVariants: {
    error: false,
  },
});

export function BaseInputWrapper({
  className,
  error,
  children,
  ...props
}: BaseProps & ComponentPropsWithoutRef<'div'> & VariantProps<typeof inputWrapperVariants>) {
  return (
    <div className={cn(inputWrapperVariants({ error }), 'transition-colors', className)} {...props}>
      {children}
    </div>
  );
}

/**
 * Base text component with consistent typography
 */
const textVariants = cva('', {
  variants: {
    variant: {
      primary: 'text-foreground',
      secondary: 'text-slate-200',
      tertiary: 'text-slate-300',
      muted: 'text-muted-foreground',
    },
    size: {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base',
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
});

export function BaseText({
  className,
  variant,
  size,
  children,
  ...props
}: BaseProps & ComponentPropsWithoutRef<'p'> & VariantProps<typeof textVariants>) {
  return (
    <p className={cn(textVariants({ variant, size }), className)} {...props}>
      {children}
    </p>
  );
}

/**
 * Base heading component with consistent typography
 */
const headingVariants = cva('', {
  variants: {
    level: {
      1: 'font-bold text-3xl',
      2: 'font-semibold text-2xl',
      3: 'font-semibold text-xl',
      4: 'font-semibold text-lg',
      5: 'font-semibold text-base',
      6: 'font-semibold text-sm',
    },
  },
  defaultVariants: {
    level: 2,
  },
});

export function BaseHeading({
  className,
  level,
  children,
  ...props
}: BaseProps &
  ComponentPropsWithoutRef<'h1'> &
  ComponentPropsWithoutRef<'h2'> &
  ComponentPropsWithoutRef<'h3'> &
  ComponentPropsWithoutRef<'h4'> &
  ComponentPropsWithoutRef<'h5'> &
  ComponentPropsWithoutRef<'h6'> &
  VariantProps<typeof headingVariants>) {
  const HeadingTag = `h${level ?? 2}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

  return (
    <HeadingTag
      className={cn('text-foreground', headingVariants({ level }), className)}
      {...props}
    >
      {children}
    </HeadingTag>
  );
}

/**
 * Base interactive element with focus styles
 */
export function BaseInteractive({
  className,
  children,
  ...props
}: BaseProps & ComponentPropsWithoutRef<'button'>) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
