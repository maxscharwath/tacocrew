/**
 * Hook for orders list data loading and derived state
 * Consolidates data fetching and calculations
 */

import { useMyOrganizations } from '@/lib/api/organization';
import type { Organization, UserGroupOrder } from '@/lib/api/types';
import { useGroupOrders } from '@/lib/api/user';
import { toDate } from '@/lib/utils/date';
import {
  getActiveOrganizations,
} from '@/lib/utils/organization-helpers';

export interface OrdersListData {
  groupOrders: UserGroupOrder[];
  groupOrdersQuery: ReturnType<typeof useGroupOrders>;
  organizations: Organization[];
  activeOrganizations: Organization[];
  upcomingOrders: UserGroupOrder[];
  activeCount: number;
  hasNoOrganizations: boolean;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Load all data needed for orders list
 */
export function useOrdersListData(): OrdersListData {
  const groupOrdersQuery = useGroupOrders();
  const organizationsQuery = useMyOrganizations();

  const groupOrders = groupOrdersQuery.data || [];
  const organizations = organizationsQuery.data || [];

  // Filter to only active organizations
  const activeOrganizations = getActiveOrganizations(organizations);
  const hasNoOrganizations = activeOrganizations.length === 0;

  // Calculate upcoming orders
  const upcomingOrders = [...groupOrders]
    .filter((order) => toDate(order.endDate) > new Date())
    .sort((a, b) => toDate(a.startDate).getTime() - toDate(b.startDate).getTime());

  // Count active orders
  const activeCount = groupOrders.filter((order) => order.canAcceptOrders).length;

  return {
    groupOrders,
    groupOrdersQuery,
    organizations,
    activeOrganizations,
    upcomingOrders,
    activeCount,
    hasNoOrganizations,
    isLoading: groupOrdersQuery.isPending || organizationsQuery.isPending,
    error: (groupOrdersQuery.error || organizationsQuery.error),
  };
}
