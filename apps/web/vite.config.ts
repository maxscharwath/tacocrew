import { resolve } from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          [
            'babel-plugin-react-compiler',
            {
              runtimeModule: 'react/compiler-runtime',
              compilationMode: 'annotation',
            },
          ],
        ],
      },
    }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@tacobot/ui-kit': resolve(__dirname, '../../packages/ui-kit/src'),
    },
    dedupe: ['react', 'react-dom', 'react-router'],
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router'],
  },
  server: {
    port: 5173,
  },
});
