import type { Decorator, Preview } from '@storybook/react-vite';
import { useEffect } from 'react';
import { useGlobals } from 'storybook/internal/preview-api';
import '../src/globals.css';

type ThemeMode = 'light' | 'dark';

const themeDecorator: Decorator = (Story, context) => {
  const theme = (context.globals.theme as ThemeMode) ?? 'dark';
  const [{ backgrounds }, updateGlobals] = useGlobals();

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }
    const root = document.documentElement;
    const body = document.body;

    root.classList.toggle('dark-mode', theme === 'dark');
    root.classList.toggle('light-mode', theme === 'light');
    root.style.colorScheme = theme;
    body.style.backgroundColor = theme === 'dark' ? '#0f172a' : '#ffffff';
    body.dataset.theme = theme;

    const desiredBackground = theme === 'dark' ? 'dark' : 'light';
    if (backgrounds?.value !== desiredBackground) {
      updateGlobals({
        backgrounds: {
          ...backgrounds,
          value: desiredBackground,
        },
      });
    }

    return () => {
      root.classList.remove('dark-mode', 'light-mode');
      root.style.removeProperty('color-scheme');
      body.style.removeProperty('background-color');
      delete body.dataset.theme;
    };
  }, [theme, backgrounds, updateGlobals]);

  return (
    <div className={theme === 'dark' ? 'dark-mode' : 'light-mode'}>
      <Story />
    </div>
  );
};

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      options: {
        dark: { name: 'dark', value: '#0f172a' },
        light: { name: 'light', value: '#ffffff' }
      }
    },
    previewTabs: {
      'storybook/docs/panel': { hidden: true },
      canvas: { title: 'Playground' },
    },
  },

  globalTypes: {
    theme: {
      name: 'Theme',
      description: 'Global theme for components',
      defaultValue: 'dark',
      toolbar: {
        icon: 'mirror',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
  },

  decorators: [themeDecorator],

  initialGlobals: {
    theme: 'dark',
    backgrounds: {
      value: 'dark',
    },
  },
};

export default preview;
