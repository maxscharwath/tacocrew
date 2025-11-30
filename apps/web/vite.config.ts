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
    chunkSizeWarningLimit: 1000, // Increase warning limit to 1000kb
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Define chunk mappings in a maintainable way
          const chunkMappings = {
            // Vendor chunks by library type
            'react-vendor': ['react', 'react-dom', 'react-router'],
            'ui-vendor': ['@radix-ui', 'lucide-react'],
            'form-vendor': ['zod', 'libphonenumber-js'],
            'utils-vendor': ['date-fns', 'clsx', 'tailwind-merge'],
            'i18n-vendor': ['react-i18next', 'i18next'],
            'http-vendor': ['axios', 'better-auth'],

            // Application chunks by feature
            'app-order-forms': ['/routes/orders.create.tsx', '/routes/orders.submit.tsx'],
            'app-profile': ['/routes/profile', '/components/profile/'],
            'app-orders': ['/components/orders/'],
            'app-utils': ['/lib/api/', '/utils/'],
          };

          // Check vendor chunks (exact package matches)
          for (const [chunkName, patterns] of Object.entries(chunkMappings)) {
            if (patterns.some(pattern => id.includes(pattern))) {
              return chunkName;
            }
          }

          // Default vendor chunk for any other node_modules
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
