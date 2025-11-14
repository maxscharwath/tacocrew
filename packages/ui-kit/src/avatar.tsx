import type { ComponentPropsWithoutRef, ReactElement } from 'react';
import { cloneElement, isValidElement } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './utils';

const avatarVariants = cva('flex items-center justify-center font-semibold', {
  variants: {
      color: {
        blue: 'border-blue-400/30 bg-linear-to-br from-blue-400/20 to-cyan-500/20 text-blue-300',
        emerald: 'border-emerald-400/30 bg-linear-to-br from-emerald-400/20 to-teal-500/20 text-emerald-300',
        orange: 'border-orange-400/30 bg-linear-to-br from-orange-400/20 to-red-500/20 text-orange-300',
        indigo: 'border-indigo-400/30 bg-linear-to-br from-indigo-400/20 to-blue-500/20 text-indigo-300',
        brand: 'border-brand-400/30 bg-linear-to-br from-brand-400/20 to-sky-500/20 text-brand-300',
        brandHero: 'bg-linear-to-br from-brand-400 via-brand-500 to-sky-500 text-white',
        neutral: 'border-white/10 bg-white/15 text-white',
        rose: 'border-rose-400/30 bg-linear-to-br from-rose-400/20 to-pink-500/20 text-rose-300',
        amber: 'border-amber-400/30 bg-linear-to-br from-amber-400/20 to-yellow-500/20 text-amber-300',
        violet: 'border-violet-400/30 bg-linear-to-br from-violet-400/20 to-purple-500/20 text-violet-300',
        sky: 'border-sky-400/30 bg-linear-to-br from-sky-400/20 to-cyan-500/20 text-sky-300',
        cyan: 'border-cyan-400/30 bg-linear-to-br from-cyan-400/20 to-teal-500/20 text-cyan-300',
      },
    size: {
      sm: 'h-8 w-8 text-xs',
      md: 'h-10 w-10 text-sm',
      lg: 'h-12 w-12 text-base',
      xl: 'h-14 w-14 text-lg',
    },
    variant: {
      default: 'rounded-lg border',
      elevated: 'rounded-xl shadow-[0_10px_30px_rgba(99,102,241,0.35)]',
    },
  },
  compoundVariants: [
    {
      color: 'brandHero',
      variant: 'default',
      class: 'border-0',
    },
    {
      color: 'brandHero',
      variant: 'elevated',
      class: 'border-0',
    },
  ],
  defaultVariants: {
    color: 'blue',
    size: 'md',
    variant: 'default',
  },
});

const iconSizeMap = {
  sm: 14,
  md: 20,
  lg: 24,
  xl: 28,
} as const;

export type AvatarProps = ComponentPropsWithoutRef<'div'> &
  VariantProps<typeof avatarVariants> & {
    readonly children?: React.ReactNode;
  };

export function Avatar({
  className,
  color,
  size = 'md',
  variant = 'default',
  children,
  ...props
}: AvatarProps) {
  if (!children) {
    return null;
  }

  // If children is a React element (like an icon), clone it with proper size
  const content =
    isValidElement(children) && typeof children.type !== 'string'
      ? cloneElement(children as ReactElement<{ size?: number; className?: string }>, {
          size: iconSizeMap[size || 'md'],
          className: cn('text-current', (children as ReactElement).props?.className),
        })
      : typeof children === 'string' ? (
          <span className="select-none">{children}</span>
        ) : (
          children
        );

  return (
    <div className={cn(avatarVariants({ color, size, variant }), className)} {...props}>
      {content}
    </div>
  );
}
