import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { AvatarProps } from './avatar';
import { Avatar } from './avatar';

type AvatarLabelGroupSize = 'sm' | 'md' | 'lg' | 'xl';

const sizeStyles = {
  sm: { root: 'gap-2', title: 'text-sm font-semibold', subtitle: 'text-xs' },
  md: { root: 'gap-2', title: 'text-sm font-semibold', subtitle: 'text-sm' },
  lg: { root: 'gap-3', title: 'text-base font-semibold', subtitle: 'text-base' },
  xl: { root: 'gap-4', title: 'text-lg font-semibold', subtitle: 'text-lg' },
};

export interface AvatarLabelGroupProps extends Omit<AvatarProps, 'size'> {
  size?: AvatarLabelGroupSize;
  title: string | ReactNode;
  subtitle: string | ReactNode;
  className?: string;
}

export function AvatarLabelGroup({
  title,
  subtitle,
  size = 'md',
  className,
  ...avatarProps
}: AvatarLabelGroupProps) {
  const styles = sizeStyles[size];

  return (
    <figure className={cn('flex min-w-0 flex-1 items-center', styles.root, className)}>
      <Avatar size={size} {...avatarProps} />
      <figcaption className="min-w-0 flex-1">
        <p className={cn('truncate text-white', styles.title)}>{title}</p>
        <p className={cn('truncate text-slate-400', styles.subtitle)}>{subtitle}</p>
      </figcaption>
    </figure>
  );
}
