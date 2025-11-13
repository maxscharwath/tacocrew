import { createBrowserRouter } from 'react-router';
import { HydrateFallback } from './components/hydrate-fallback';
import { routerConfig } from './lib/routes';

export const router = createBrowserRouter(routerConfig, {
  hydrateFallback: <HydrateFallback />,
  future: {
    v7_fetcherPersist: true,
    v7_normalizeFormMethod: true,
    v7_partialHydration: true,
  },
});
