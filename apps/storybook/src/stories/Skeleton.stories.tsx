import type { Meta, StoryObj } from '@storybook/react-vite';
import { Skeleton, SkeletonText } from '@tacobot/ui-kit';

const meta = {
  title: 'UI Kit/Skeleton',
  component: Skeleton,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'circular'],
      description: 'The variant of the skeleton',
    },
  },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

// Main story - use controls panel to explore all options
export const Default: Story = {
  render: (args) => <Skeleton {...args} className="h-32 w-64" />,
};

// Showcase story - different skeleton types
export const Showcase: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="space-y-3">
        <h2 className="font-semibold text-lg text-white">Block Skeleton</h2>
        <Skeleton className="h-32 w-64" />
      </div>
      <div className="space-y-3">
        <h2 className="font-semibold text-lg text-white">Circular Skeleton</h2>
        <Skeleton variant="circular" className="h-16 w-16" />
      </div>
      <div className="space-y-3">
        <h2 className="font-semibold text-lg text-white">Text Skeleton</h2>
        <SkeletonText lines={4} className="w-64" />
      </div>
    </div>
  ),
};
