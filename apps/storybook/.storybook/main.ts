import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { StorybookConfig } from '@storybook/react-vite';

const __dirname = dirname(fileURLToPath(import.meta.url));
const uiKitPath = resolve(__dirname, '../../../packages/ui-kit/src');

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: ['@storybook/addon-links'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  viteFinal: async (config) => {
    const { default: tailwindcss } = await import('@tailwindcss/vite');

    config.plugins = [...(config.plugins ?? []), tailwindcss()];

    config.resolve = {
      ...config.resolve,
      alias: {
        ...config.resolve?.alias,
        '@tacobot/ui-kit': uiKitPath,
      },
    };

    config.optimizeDeps = {
      ...config.optimizeDeps,
      exclude: [...(config.optimizeDeps?.exclude ?? []), '@tacobot/ui-kit'],
    };

    return config;
  },
};

export default config;
