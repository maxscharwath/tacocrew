import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router/dom';
import { router } from './router';
import './lib/i18n';
import '@/globals.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root container element not found');
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
