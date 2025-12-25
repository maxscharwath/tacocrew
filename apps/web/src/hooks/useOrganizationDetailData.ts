/**
 * Organization detail data loading hook
 * Consolidates data loading for organization detail view
 */

import { useMyOrganizations, useOrganization } from '@/lib/api/organization';
import { useProfile } from '@/lib/api/user';

export interface OrganizationDetailData {
  organizationQuery: ReturnType<typeof useOrganization>;
  myOrganizationsQuery: ReturnType<typeof useMyOrganizations>;
  profileQuery: ReturnType<typeof useProfile>;
}

/**
 * Load organization detail data
 */
export function useOrganizationDetailData(organizationId: string): OrganizationDetailData {
  const organizationQuery = useOrganization(organizationId);
  const myOrganizationsQuery = useMyOrganizations();
  const profileQuery = useProfile();

  return {
    organizationQuery,
    myOrganizationsQuery,
    profileQuery,
  };
}
