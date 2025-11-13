import { resolve } from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: ['babel-plugin-react-compiler'],
      },
    }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@tacobot/ui-kit': resolve(__dirname, '../../packages/ui-kit/src'),
    },
  },
  optimizeDeps: {
    include: ['react-router'],
    exclude: ['react-router-dom'],
  },
  server: {
    port: 5173,
  },
});
