import { useSyncExternalStore } from 'react';
import { sessionStore } from './store';
import type { Session } from './types';

export function useSession(): Session | null {
  return useSyncExternalStore(
    (listener) => sessionStore.subscribe(listener),
    () => sessionStore.getSession(),
    () => null
  );
}

export function useIsAuthenticated() {
  return useSession() !== null;
}
