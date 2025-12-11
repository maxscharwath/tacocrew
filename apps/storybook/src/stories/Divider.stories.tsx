import type { Meta, StoryObj } from '@storybook/react-vite';
import { Divider } from '@tacobot/ui-kit';

const meta = {
  title: 'UI Kit/Divider',
  component: Divider,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'Optional label text for the divider',
    },
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
      description: 'The orientation of the divider',
    },
  },
} satisfies Meta<typeof Divider>;

export default meta;
type Story = StoryObj<typeof meta>;

// Main story - use controls panel to explore all options
export const Default: Story = {
  render: (args) => <Divider {...args} className="w-64" />,
};
