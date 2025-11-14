import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, EmptyState } from '@tacobot/ui-kit';
import { Inbox } from 'lucide-react';

const meta = {
  title: 'UI Kit/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
  args: {
    icon: Inbox,
    title: 'No group orders yet',
    description: 'Start a new order to invite your team for taco night.',
    action: <Button variant="outline">Create order</Button>,
  },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
