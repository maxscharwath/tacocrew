import { Toaster } from '@tacocrew/ui-kit';
import { QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { queryClient } from '@/lib/query-client';
import { router } from './router';
import '@/lib/i18n';
import '@/globals.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root container element not found');
}

// Render immediately - this is a client-side only app
ReactDOM.createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster position="bottom-right" />
    </QueryClientProvider>
  </StrictMode>
);
