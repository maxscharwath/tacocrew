import type { Organization } from '@/lib/api/types';
import { OrganizationAvatar } from './OrganizationAvatar';

type OrganizationSelectItemProps = {
  readonly organization: Organization;
  readonly size?: 'sm' | 'md';
};

/**
 * Reusable organization item display for select components
 */
export function OrganizationSelectItem({ organization, size = 'sm' }: OrganizationSelectItemProps) {
  return (
    <div className="flex items-center gap-3">
      <OrganizationAvatar
        organizationId={organization.id}
        name={organization.name}
        size={size}
        className="shrink-0"
      />
      <span className="truncate">{organization.name}</span>
    </div>
  );
}
