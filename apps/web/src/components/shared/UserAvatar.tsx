import { Avatar, AvatarFallback, AvatarImage, type AvatarProps } from '@tacocrew/ui-kit';
import { getUserInitials } from '@/components/orders/user-utils';
import { getAvatarSizePixels } from '@/lib/api/image-utils';
import { getAvatarUrl } from '@/lib/api/user';

type UserAvatarProps = Readonly<{
  userId: string;
  name: string | null;
  size?: AvatarProps['size'];
  variant?: AvatarProps['variant'];
  color?: AvatarProps['color'];
  className?: string;
  alt?: string;
}>;

/**
 * Reusable user avatar component with automatic initials fallback.
 * Displays user avatar image if available, otherwise shows user initials.
 */
export function UserAvatar({
  userId,
  name,
  size = 'md',
  variant = 'elevated',
  color = 'brandHero',
  className,
  alt,
}: UserAvatarProps) {
  const avatarSize = size ? getAvatarSizePixels(size) : 48;
  const avatarUrl = getAvatarUrl(userId, { size: avatarSize });

  return (
    <Avatar size={size} variant={variant} color={color} className={className}>
      <AvatarImage src={avatarUrl} alt={alt ?? name ?? ''} />
      <AvatarFallback>{getUserInitials(name)}</AvatarFallback>
    </Avatar>
  );
}
