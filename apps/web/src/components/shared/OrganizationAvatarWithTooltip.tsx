import { Tooltip, TooltipContent, TooltipTrigger } from '@tacocrew/ui-kit';
import { OrganizationAvatar } from './OrganizationAvatar';

type OrganizationAvatarWithTooltipProps = {
  readonly organizationId: string;
  readonly name: string;
  readonly size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  readonly className?: string;
  readonly imageUrl?: string | null;
};

/**
 * Reusable organization avatar with tooltip showing organization name
 */
export function OrganizationAvatarWithTooltip({
  organizationId,
  name,
  size = 'md',
  className,
  imageUrl,
}: OrganizationAvatarWithTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={className}>
          <OrganizationAvatar
            organizationId={organizationId}
            name={name}
            size={size}
            imageUrl={imageUrl}
          />
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{name}</p>
      </TooltipContent>
    </Tooltip>
  );
}
