import { resolve } from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { imagetools } from 'vite-imagetools';

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
    imagetools(),
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
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router-vendor': ['react-router'],
        },
      },
    },
  },
  server: {
    port: 5173,
  },
});
