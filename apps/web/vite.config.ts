import { resolve } from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import Info from 'unplugin-info/vite';
import { defineConfig } from 'vite';
import { imagetools } from 'vite-imagetools';
import { VitePWA } from 'vite-plugin-pwa';

const uiKitPath = resolve(__dirname, '../../packages/ui-kit/src');

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
    Info({
      prefix: '@build',
      package: {
        contributors: true,
        repository: true,
      },
    }),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      injectRegister: 'script-defer',
      manifest: {
        name: 'TacoCrew',
        short_name: 'TacoCrew',
        description: 'TacoCrew - Order your favorite tacos',
        theme_color: '#6366f1',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: '/icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      injectManifest: {
        injectionPoint: undefined,
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@tacocrew/ui-kit': uiKitPath,
    },
    dedupe: ['react', 'react-dom', 'react-router'],
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router'],
    exclude: ['@tacocrew/ui-kit'],
    force: true,
  },
  build: {
    chunkSizeWarningLimit: 1000, // Increase warning limit to 1000kb
    // Don't fail build on TypeScript errors - Vite handles image imports with query params at build time
    // TypeScript errors for image imports are non-blocking
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router'],
        },
      },
    },
  },
  server: {
    port: 5173,
    watch: {
      ignored: ['!**/packages/ui-kit/**'],
    },
    fs: {
      allow: ['..'],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
