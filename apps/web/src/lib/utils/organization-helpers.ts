import type { Organization } from '@/lib/api/types';

/**
 * Filter organizations to only active ones
 */
export function getActiveOrganizations(organizations: Organization[]): Organization[] {
  return organizations.filter((org) => org.status === 'ACTIVE');
}

/**
 * Check if user has multiple active organizations
 */
export function hasMultipleActiveOrganizations(organizations: Organization[]): boolean {
  return getActiveOrganizations(organizations).length > 1;
}
