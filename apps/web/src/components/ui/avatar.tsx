import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/utils';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
  size?: AvatarSize;
  src?: string;
  alt?: string;
  initials?: string;
}

const sizeStyles: Record<AvatarSize, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
};

export function Avatar({ size = 'md', src, alt, initials, className, ...props }: AvatarProps) {
  const hasImage = !!src;

  return (
    <div
      className={cn(
        'relative flex shrink-0 items-center justify-center overflow-hidden rounded-full',
        'bg-linear-to-br from-brand-400 via-brand-500 to-sky-500',
        'border border-brand-400/30',
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {hasImage ? (
        <img src={src} alt={alt ?? ''} className="h-full w-full object-cover" />
      ) : (
        <span className="font-semibold text-white">{initials ?? '?'}</span>
      )}
    </div>
  );
}
