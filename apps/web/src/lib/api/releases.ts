import * as pkg from '@build/package';
import { useQuery } from '@tanstack/react-query';

export type GitHubRelease = {
  id: number;
  tag_name: string;
  name: string;
  body: string;
  html_url: string;
  published_at: string;
  prerelease: boolean;
  draft: boolean;
  author: {
    login: string;
    avatar_url: string;
    html_url: string;
  };
  assets: Array<{
    name: string;
    size: number;
    download_count: number;
    browser_download_url: string;
  }>;
};

/** Internal query key factory for releases */
const releasesKeys = {
  all: () => ['releases'] as const,
  list: () => [...releasesKeys.all(), 'list'] as const,
} as const;

export function useReleases() {
  return useQuery({
    queryKey: releasesKeys.list(),
    queryFn: async (): Promise<GitHubRelease[]> => {
      try {
        const response = await fetch(
          `${pkg.repository.url.replace('github.com', 'api.github.com/repos')}/releases`,
          {
            headers: {
              Accept: 'application/vnd.github.v3+json',
            },
          }
        );

        if (!response.ok) {
          return [];
        }

        return await response.json();
      } catch (_error) {
        return [];
      }
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}
