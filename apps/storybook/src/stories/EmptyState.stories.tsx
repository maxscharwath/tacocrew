import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, EmptyState } from '@tacocrew/ui-kit';
import { Inbox } from 'lucide-react';

const meta = {
  title: 'UI Kit/EmptyState',
  component: EmptyState,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Title text',
    },
    description: {
      control: 'text',
      description: 'Description text',
    },
  },
  args: {
    icon: Inbox,
    title: 'No group orders yet',
    description: 'Start a new order to invite your team for taco night.',
    action: <Button variant="outline">Create order</Button>,
  },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

// Main story - use controls panel to explore all options
export const Default: Story = {};
