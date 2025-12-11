import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentPropsWithoutRef, ReactElement } from 'react';
import { cloneElement, isValidElement, useEffect, useState } from 'react';
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
        neutral: 'border-gray-700 bg-white/15 text-white',
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
      '2xl': 'h-24 w-24 text-3xl',
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

const iconSizeMap: Record<string, number> = {
  sm: 14,
  md: 20,
  lg: 24,
  xl: 28,
  '2xl': 48,
};

const imageRadius: Record<NonNullable<AvatarProps['variant']>, string> = {
  default: 'rounded-lg',
  elevated: 'rounded-xl',
};

export type AvatarProps = ComponentPropsWithoutRef<'div'> &
  VariantProps<typeof avatarVariants> & {
    readonly children?: React.ReactNode;
    readonly src?: string | null;
    readonly alt?: string;
  };

export function Avatar({
  className,
  color,
  size = 'md',
  variant = 'default',
  children,
  src,
  alt = 'Avatar',
  ...props
}: AvatarProps) {
  const [hasImageError, setHasImageError] = useState(false);
  const radiusClass = imageRadius[variant ?? 'default'] ?? imageRadius.default;

  useEffect(() => {
    setHasImageError(false);
  }, [src]);

  const showImage = Boolean(src) && !hasImageError;

  let content: React.ReactNode = children;

  if (isValidElement(children) && typeof children.type !== 'string') {
    content = cloneElement(children as ReactElement<{ size?: number; className?: string }>, {
      size: iconSizeMap[size || 'md'],
      className: cn(
        'text-current',
        (children as ReactElement<{ size?: number; className?: string }>).props?.className
      ),
    });
  } else if (typeof children === 'string') {
    content = <span className="select-none">{children}</span>;
  }

  if (!showImage && !content) {
    return null;
  }

  return (
    <div className={cn(avatarVariants({ color, size, variant }), className)} {...props}>
      {showImage ? (
        <img
          src={src ?? undefined}
          alt={alt}
          className={cn('h-full w-full object-cover', radiusClass)}
          style={{ display: 'block' }}
          loading="lazy"
          onError={() => setHasImageError(true)}
        />
      ) : (
        content
      )}
    </div>
  );
}
