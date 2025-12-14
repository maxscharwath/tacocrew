import type { Meta, StoryObj } from '@storybook/react-vite';
import { Checkbox } from '@tacocrew/ui-kit';

const meta = {
  title: 'UI Kit/Checkbox',
  component: Checkbox,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'Label text for the checkbox',
    },
    defaultChecked: {
      control: 'boolean',
      description: 'Whether the checkbox is checked by default',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the checkbox is disabled',
    },
  },
  args: {
    label: 'Include chips',
    defaultChecked: false,
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

// Main story - use controls panel to explore all options
export const Default: Story = {};
