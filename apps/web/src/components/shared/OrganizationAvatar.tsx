import { Avatar, type AvatarProps } from '@/components/ui';
import { getAvatarSizePixels } from '@/lib/api/image-utils';
import { getOrganizationAvatarUrl } from '@/lib/api/organization';

type OrganizationAvatarProps = {
  readonly organizationId: string;
  readonly name: string;
  readonly size?: AvatarProps['size'];
  readonly variant?: AvatarProps['variant'];
  readonly color?: AvatarProps['color'];
  readonly className?: string;
  readonly alt?: string;
  readonly hasImage?: boolean;
};

/**
 * Get organization initials from name
 */
function getOrganizationInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Reusable organization avatar component with automatic initials fallback.
 * Displays organization avatar image if available, otherwise shows organization initials.
 */
export function OrganizationAvatar({
  organizationId,
  name,
  size = 'md',
  variant = 'elevated',
  color = 'brand',
  className,
  alt,
  hasImage,
}: OrganizationAvatarProps) {
  const avatarSize = size ? getAvatarSizePixels(size) : 48;
  const avatarUrl = hasImage
    ? getOrganizationAvatarUrl(organizationId, { size: avatarSize })
    : undefined;

  return (
    <Avatar
      src={avatarUrl}
      alt={alt ?? name}
      size={size}
      variant={variant}
      color={color}
      className={className}
    >
      {getOrganizationInitials(name)}
    </Avatar>
  );
}
