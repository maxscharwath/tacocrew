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
          // Vendor chunks
          if (id.includes('node_modules')) {
            // React ecosystem
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            // UI libraries
            if (id.includes('@radix-ui') || id.includes('@headlessui') || id.includes('lucide-react')) {
              return 'ui-vendor';
            }
            // Form and validation
            if (id.includes('react-hook-form') || id.includes('zod') || id.includes('libphonenumber-js')) {
              return 'form-vendor';
            }
            // Utilities
            if (id.includes('date-fns') || id.includes('clsx') || id.includes('tailwind-merge')) {
              return 'utils-vendor';
            }
            // I18n
            if (id.includes('react-i18next') || id.includes('i18next')) {
              return 'i18n-vendor';
            }
            // HTTP and auth
            if (id.includes('axios') || id.includes('better-auth')) {
              return 'http-vendor';
            }
            // Large libraries
            if (id.includes('sharp') || id.includes('prisma') || id.includes('winston')) {
              return 'heavy-vendor';
            }
            // Other libraries
            return 'vendor';
          }
          // Application chunks
          if (id.includes('/routes/orders.create.tsx') || id.includes('/routes/orders.submit.tsx')) {
            return 'app-order-forms';
          }
          if (id.includes('/routes/profile') || id.includes('/components/profile/')) {
            return 'app-profile';
          }
          if (id.includes('/components/orders/')) {
            return 'app-orders';
          }
          if (id.includes('/lib/api/') || id.includes('/utils/')) {
            return 'app-utils';
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
