/**
 * Organization utilities
 * Helpers for organization data and routing
 */

/**
 * Extract selected organization ID from URL path
 * Matches /profile/organizations/[id] but not /profile/organizations/new
 */
export function extractSelectedOrgIdFromPath(pathname: string): string | undefined {
  if (pathname.endsWith('/new')) {
    return undefined;
  }

  const match = new RegExp(/\/profile\/organizations\/([^/]+)$/).exec(pathname);
  return match ? match[1] : undefined;
}

/**
 * Check if path is organization creation route
 */
export function isOrgCreationRoute(pathname: string): boolean {
  return pathname.endsWith('/new');
}

/**
 * Organization user role and status types
 */
export type OrgUserRole = 'ADMIN' | 'MEMBER' | null;
export type OrgUserStatusType = 'ACTIVE' | 'PENDING' | null;

export interface OrgUserStatusInfo {
  role: OrgUserRole;
  status: OrgUserStatusType;
  isAdmin: boolean;
  isPending: boolean;
}

/**
 * Calculate user's role and status in organization
 */
export function calculateUserOrgStatus(
  organizationId: string,
  userOrganizations: Array<{ id: string; role?: string; status?: string }>
): OrgUserStatusInfo {
  const userOrg = userOrganizations.find((org) => org.id === organizationId);
  const role = userOrg?.role ?? null;
  const status = userOrg?.status ?? null;

  return {
    role: role as OrgUserRole,
    status: status as OrgUserStatus,
    isAdmin: role === 'ADMIN' && status === 'ACTIVE',
    isPending: status === 'PENDING',
  };
}

/**
 * Create saved count text for display
 */
export function createSavedCountText(
  count: number,
  emptyLabel: string,
  countLabel: (count: number) => string
): string {
  return count === 0 ? emptyLabel : countLabel(count);
}
