import { Avatar, AvatarFallback, AvatarImage, type AvatarProps } from '@tacocrew/ui-kit';
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
  readonly imageUrl?: string | null;
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
  imageUrl,
}: OrganizationAvatarProps) {
  const avatarSize = size ? getAvatarSizePixels(size) : 48;

  // Use provided image URL with optimized size parameters, or generate one
  const avatarUrl = imageUrl
    ? (() => {
        const url = new URL(imageUrl, window.location.origin);
        url.searchParams.set('w', avatarSize.toString());
        url.searchParams.set('h', avatarSize.toString());
        url.searchParams.set('dpr', '2');
        return url.toString();
      })()
    : getOrganizationAvatarUrl(organizationId, { size: avatarSize });

  return (
    <Avatar size={size} variant={variant} color={color} className={className}>
      <AvatarImage src={avatarUrl} alt={alt ?? name} />
      <AvatarFallback>{getOrganizationInitials(name)}</AvatarFallback>
    </Avatar>
  );
}
