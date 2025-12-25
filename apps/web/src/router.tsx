import { createBrowserRouter } from 'react-router';
import { routerConfig } from './lib/routes';

export const router = createBrowserRouter(routerConfig, {
  // Client-side only app, no server-side hydration
  // Suppress React Router v7 hydration warnings for deferred data
  future: {
    v7_skipActionErrorRevalidation: true,
  },
});
