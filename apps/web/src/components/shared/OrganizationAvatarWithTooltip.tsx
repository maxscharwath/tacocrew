import { Tooltip, TooltipContent, TooltipTrigger } from '@tacocrew/ui-kit';
import { OrganizationAvatar } from './OrganizationAvatar';

type OrganizationAvatarWithTooltipProps = {
  readonly organizationId: string;
  readonly name: string;
  readonly size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  readonly hasImage?: boolean;
  readonly className?: string;
};

/**
 * Reusable organization avatar with tooltip showing organization name
 */
export function OrganizationAvatarWithTooltip({
  organizationId,
  name,
  size = 'md',
  hasImage = false,
  className,
}: OrganizationAvatarWithTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={className}>
          <OrganizationAvatar
            organizationId={organizationId}
            name={name}
            size={size}
            hasImage={hasImage}
          />
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{name}</p>
      </TooltipContent>
    </Tooltip>
  );
}
