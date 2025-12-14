import { Avatar, AvatarFallback, AvatarImage, Badge } from '@tacocrew/ui-kit';
import { getAvatarUrl } from '@/lib/api/user';
import { getAvatarSizeClass, getAvatarSizePixels, getUserInitials } from './user-utils';

type UserBadgeProps = {
  readonly userId: string;
  readonly name: string; // User's actual name (used for avatar initials)
  readonly displayName?: string; // Optional display name (e.g., "My Order"). Defaults to name if not provided
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
  displayName,
  variant = 'default',
  size = 'sm',
  className,
}: UserBadgeProps) {
  const avatarSize = getAvatarSizePixels(size);
  const avatarUrl = getAvatarUrl(userId, { size: avatarSize });
  const avatarSizeClass = getAvatarSizeClass(size, 'badge');
  const badgeText = displayName ?? name;

  return (
    <Badge tone="brand" className={`${BADGE_CLASSES[variant]} ${className ?? ''}`}>
      <Avatar
        color="brandHero"
        size={size === 'md' ? 'md' : 'sm'}
        variant="default"
        className={`${avatarSizeClass} border-0`}
      >
        <AvatarImage src={avatarUrl} alt={name} />
        <AvatarFallback>{getUserInitials(name)}</AvatarFallback>
      </Avatar>
      {badgeText}
    </Badge>
  );
}
