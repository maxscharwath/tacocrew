import { Avatar, Badge } from '@/components/ui';
import { getAvatarUrl } from '@/lib/api/user';
import { getAvatarSizeClass, getAvatarSizePixels, getUserInitials } from './user-utils';

type UserBadgeProps = {
  readonly userId: string;
  readonly name: string;
  readonly variant?: 'default' | 'highlighted';
  readonly size?: 'sm' | 'md';
  readonly className?: string;
};

const BADGE_CLASSES = {
  highlighted:
    'inline-flex shrink-0 items-center gap-1.5 border border-brand-400/50 bg-brand-400/30 py-1 pr-2 pl-1 font-bold text-[10px]',
  default: 'inline-flex shrink-0 items-center gap-1.5 py-1 pr-2 pl-1 font-semibold text-[11px]',
} as const;

/**
 * Reusable badge component with user avatar
 * Used to display user information with avatar in a compact badge format
 */
export function UserBadge({
  userId,
  name,
  variant = 'default',
  size = 'sm',
  className,
}: UserBadgeProps) {
  const avatarSize = getAvatarSizePixels(size);
  const avatarUrl = getAvatarUrl(userId, { size: avatarSize });
  const avatarSizeClass = getAvatarSizeClass(size, 'badge');

  return (
    <Badge tone="brand" className={`${BADGE_CLASSES[variant]} ${className ?? ''}`}>
      <Avatar
        color="brandHero"
        size={size === 'md' ? 'md' : 'sm'}
        variant="default"
        src={avatarUrl}
        className={`${avatarSizeClass} border-0`}
      >
        {getUserInitials(name)}
      </Avatar>
      {name}
    </Badge>
  );
}
