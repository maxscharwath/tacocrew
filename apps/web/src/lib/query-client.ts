import { QueryClient } from '@tanstack/react-query';

let cacheEnabled = false;

function getCacheConfig() {
  return {
    staleTime: cacheEnabled ? 1000 * 60 * 5 : 0,
    gcTime: cacheEnabled ? 1000 * 60 * 5 : 0,
  };
}

/**
 * Shared query client instance
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      ...getCacheConfig(),
    },
  },
});

/**
 * Update query cache setting
 */
export function setQueryCacheEnabled(enabled: boolean) {
  cacheEnabled = enabled;
  queryClient.setDefaultOptions({
    queries: {
      ...queryClient.getDefaultOptions().queries,
      ...getCacheConfig(),
    },
  });
  queryClient.invalidateQueries();
}

/**
 * Get current cache setting
 */
export function getQueryCacheEnabled(): boolean {
  return cacheEnabled;
}
