import { createBrowserRouter } from 'react-router';
import { routerConfig } from './lib/routes';

export const router = createBrowserRouter(routerConfig, {
  future: {
    v7_fetcherPersist: true,
    v7_normalizeFormMethod: true,
    v7_partialHydration: true,
  },
});
