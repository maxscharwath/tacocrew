// This file has been automatically migrated to valid ESM format by Storybook.
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { StorybookConfig } from '@storybook/react-vite';

const __filename = fileURLToPath(import.meta.url);

const __dirname = dirname(fileURLToPath(import.meta.url));
const uiKitPath = resolve(__dirname, '../../../packages/ui-kit/src');

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [getAbsolutePath('@storybook/addon-links')],

  framework: {
    name: getAbsolutePath('@storybook/react-vite'),
    options: {},
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
      dedupe: [...(config.resolve?.dedupe ?? []), 'react', 'react-dom', 'react/jsx-runtime'],
    };

    config.optimizeDeps = {
      ...config.optimizeDeps,
      exclude: [...(config.optimizeDeps?.exclude ?? []), '@tacobot/ui-kit'],
      include: [...(config.optimizeDeps?.include ?? []), 'react', 'react-dom'],
    };

    return config;
  },
};

export default config;

function getAbsolutePath(value: string): any {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));
}
