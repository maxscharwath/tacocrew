import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentPropsWithoutRef } from 'react';
import { cn } from './utils';

const avatarVariants = cva(
  'relative flex shrink-0 items-center justify-center overflow-hidden font-semibold',
  {
    variants: {
      color: {
        blue: 'border-blue-400/30 bg-linear-to-br from-blue-400/20 to-cyan-500/20 text-blue-300',
        emerald:
          'border-emerald-400/30 bg-linear-to-br from-emerald-400/20 to-teal-500/20 text-emerald-300',
        orange:
          'border-orange-400/30 bg-linear-to-br from-orange-400/20 to-red-500/20 text-orange-300',
        indigo:
          'border-indigo-400/30 bg-linear-to-br from-indigo-400/20 to-blue-500/20 text-indigo-300',
        brand: 'border-brand-400/30 bg-linear-to-br from-brand-400/20 to-sky-500/20 text-brand-300',
        brandHero: 'border-0 bg-linear-to-br from-brand-400 via-brand-500 to-sky-500 text-white',
        neutral: 'border-gray-700 bg-white/15 text-white',
        rose: 'border-rose-400/30 bg-linear-to-br from-rose-400/20 to-pink-500/20 text-rose-300',
        amber:
          'border-amber-400/30 bg-linear-to-br from-amber-400/20 to-yellow-500/20 text-amber-300',
        violet:
          'border-violet-400/30 bg-linear-to-br from-violet-400/20 to-purple-500/20 text-violet-300',
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
        elevated: 'rounded-xl border-0 shadow-[0_10px_30px_rgba(99,102,241,0.35)]',
      },
    },
    defaultVariants: {
      color: 'blue',
      size: 'md',
      variant: 'default',
    },
  }
);

/**
 * Avatar root component. Use with AvatarImage and AvatarFallback.
 *
 * @example
 * ```tsx
 * <Avatar color="brand" size="lg">
 *   <AvatarImage src="/user.jpg" alt="John Doe" />
 *   <AvatarFallback>JD</AvatarFallback>
 * </Avatar>
 * ```
 */
export type AvatarProps = ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> &
  VariantProps<typeof avatarVariants>;

export function Avatar({ className, color, size, variant, ...props }: AvatarProps) {
  return (
    <AvatarPrimitive.Root
      className={cn(avatarVariants({ color, size, variant }), className)}
      {...props}
    />
  );
}

/**
 * Avatar image component. Displays the user's image.
 */
export type AvatarImageProps = ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>;

export function AvatarImage({ className, ...props }: Readonly<AvatarImageProps>) {
  return (
    <AvatarPrimitive.Image className={cn('h-full w-full object-cover', className)} {...props} />
  );
}

/**
 * Avatar fallback component. Shown when image fails to load or is not provided.
 */
export type AvatarFallbackProps = ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>;

export function AvatarFallback({ className, ...props }: Readonly<AvatarFallbackProps>) {
  return (
    <AvatarPrimitive.Fallback
      className={cn('flex h-full w-full items-center justify-center', className)}
      {...props}
    />
  );
}
