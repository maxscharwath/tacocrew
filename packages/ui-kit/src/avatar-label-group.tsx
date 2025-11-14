import type { ReactNode } from 'react';
import { cn } from './utils';
import type { AvatarProps } from './avatar';
import { Avatar } from './avatar';

type AvatarLabelGroupSize = 'sm' | 'md' | 'lg';

const sizeStyles = {
  sm: { root: 'gap-2', title: 'text-sm font-semibold', subtitle: 'text-xs' },
  md: { root: 'gap-2', title: 'text-sm font-semibold', subtitle: 'text-sm' },
  lg: { root: 'gap-3', title: 'text-base font-semibold', subtitle: 'text-base' },
};

export interface AvatarLabelGroupProps extends Omit<AvatarProps, 'size' | 'title'> {
  readonly size?: AvatarLabelGroupSize;
  readonly title: string | ReactNode;
  readonly subtitle: string | ReactNode;
  readonly className?: string;
}

export function AvatarLabelGroup({
  title,
  subtitle,
  size = 'md',
  className,
  children,
  ...avatarProps
}: AvatarLabelGroupProps) {
  const styles = sizeStyles[size];

  return (
    <figure className={cn('flex min-w-0 flex-1 items-center', styles.root, className)}>
      <Avatar size={size} {...avatarProps}>
        {children}
      </Avatar>
      <figcaption className="min-w-0 flex-1">
        <p className={cn('truncate text-white', styles.title)}>{title}</p>
        <p className={cn('truncate text-slate-400', styles.subtitle)}>{subtitle}</p>
      </figcaption>
    </figure>
  );
}
