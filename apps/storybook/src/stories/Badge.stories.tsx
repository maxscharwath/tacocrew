import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from '@tacocrew/ui-kit';

const meta = {
  title: 'UI Kit/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    tone: {
      control: 'select',
      options: ['brand', 'success', 'warning', 'error', 'info', 'neutral'],
      description: 'The tone/color variant of the badge',
    },
    pill: {
      control: 'boolean',
      description: 'Whether the badge should be pill-shaped',
    },
  },
  args: {
    children: 'Badge',
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

// Main story - use controls panel to explore all options
export const Default: Story = {};

// Showcase story - all tones for reference
export const AllTones: Story = {
  render: () => {
    const tones = ['brand', 'success', 'warning', 'neutral'] as const;
    return (
      <div className="flex flex-wrap gap-3">
        {tones.map((tone) => (
          <Badge key={tone} tone={tone}>
            {tone.charAt(0).toUpperCase() + tone.slice(1)}
          </Badge>
        ))}
      </div>
    );
  },
};

// Truncate example - truncate is now default behavior
export const Truncate: Story = {
  render: () => (
    <div className="w-32 space-y-2">
      <Badge>Very long badge text that will be truncated</Badge>
      <Badge pill tone="brand">
        Very long pill badge text
      </Badge>
      <Badge tone="success">
        Another long badge text example
      </Badge>
    </div>
  ),
};
