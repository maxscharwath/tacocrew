import { useQuery } from '@tanstack/react-query';
import { authClient } from '@/lib/auth-client';

export type Passkey = {
  id: string;
  name?: string;
  deviceType: string;
  createdAt: string;
};

const passkeysKeys = {
  all: ['passkeys'] as const,
  list: () => [...passkeysKeys.all, 'list'] as const,
} as const;

async function fetchPasskeys(): Promise<Passkey[]> {
  const result = await authClient.passkey.listUserPasskeys();
  if (!result.data) {
    return [];
  }
  return result.data as unknown as Passkey[];
}

export function usePasskeys() {
  return useQuery({
    queryKey: passkeysKeys.list(),
    queryFn: fetchPasskeys,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
