import type { Meta, StoryObj } from '@storybook/react-vite';
import { StatusBadge } from '@tacobot/ui-kit';

const meta = {
  title: 'UI Kit/StatusBadge',
  component: StatusBadge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: ['draft', 'pending', 'active', 'submitted', 'completed', 'closed'],
      description: 'The status value',
    },
  },
  args: {
    status: 'submitted',
  },
} satisfies Meta<typeof StatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

// Main story - use controls panel to explore all options
export const Default: Story = {};

// Showcase story - all statuses for reference
export const AllStatuses: Story = {
  render: () => {
    const statuses = ['draft', 'pending', 'active', 'submitted', 'completed', 'closed'] as const;
    return (
      <div className="flex flex-wrap gap-3">
        {statuses.map((status) => (
          <StatusBadge key={status} status={status} />
        ))}
      </div>
    );
  },
};
