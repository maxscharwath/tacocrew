import { Toaster } from '@tacobot/ui-kit';
import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router';
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
    <RouterProvider router={router} />
    <Toaster position="bottom-right" />
  </StrictMode>
);
