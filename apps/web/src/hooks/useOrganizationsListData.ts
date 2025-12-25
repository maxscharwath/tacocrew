/**
 * Organizations list data loading hook
 * Consolidates data loading for organizations list routes
 */

import { useMyOrganizations } from '@/lib/api/organization';

export interface OrganizationsListData {
  organizationsQuery: ReturnType<typeof useMyOrganizations>;
}

/**
 * Load organizations list data
 */
export function useOrganizationsListData(): OrganizationsListData {
  const organizationsQuery = useMyOrganizations();

  return {
    organizationsQuery,
  };
}
