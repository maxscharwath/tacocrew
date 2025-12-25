/**
 * Profile data loading hook
 * Consolidates profile and previous orders data loading
 */

import { usePreviousOrders, useProfile } from '@/lib/api/user';

export interface ProfileData {
  profileQuery: ReturnType<typeof useProfile>;
  previousOrdersQuery: ReturnType<typeof usePreviousOrders>;
}

/**
 * Load and consolidate profile data
 */
export function useProfileData(): ProfileData {
  const profileQuery = useProfile();
  const previousOrdersQuery = usePreviousOrders();

  return {
    profileQuery,
    previousOrdersQuery,
  };
}
