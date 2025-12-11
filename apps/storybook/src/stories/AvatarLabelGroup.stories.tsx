import type { Meta, StoryObj } from '@storybook/react-vite';
import { AvatarLabelGroup } from '@tacobot/ui-kit';
import { User } from 'lucide-react';

const meta = {
  title: 'UI Kit/AvatarLabelGroup',
  component: AvatarLabelGroup,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'The size of the avatar and text',
    },
    color: {
      control: 'select',
      options: [
        'blue',
        'emerald',
        'orange',
        'indigo',
        'brand',
        'brandHero',
        'neutral',
        'rose',
        'amber',
        'violet',
        'sky',
        'cyan',
      ],
      description: 'Avatar color',
    },
    title: {
      control: 'text',
      description: 'Title text',
    },
    subtitle: {
      control: 'text',
      description: 'Subtitle text',
    },
  },
  args: {
    size: 'md',
    color: 'brand',
    title: 'John Doe',
    subtitle: 'Software Engineer',
    children: <User />,
  },
} satisfies Meta<typeof AvatarLabelGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

// Main story - use controls panel to explore all options
export const Default: Story = {};

// Showcase story - different sizes
export const Showcase: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="space-y-3">
        <h2 className="font-semibold text-lg text-white">Sizes</h2>
        <div className="space-y-4">
          <AvatarLabelGroup size="sm" color="brand" title="Small Size" subtitle="Compact layout">
            <User />
          </AvatarLabelGroup>
          <AvatarLabelGroup size="md" color="brand" title="Medium Size" subtitle="Default layout">
            <User />
          </AvatarLabelGroup>
          <AvatarLabelGroup size="lg" color="brand" title="Large Size" subtitle="Spacious layout">
            <User />
          </AvatarLabelGroup>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold text-lg text-white">With Text Initials</h2>
        <AvatarLabelGroup color="emerald" title="Alice Smith" subtitle="Product Manager">
          AS
        </AvatarLabelGroup>
      </div>
    </div>
  ),
};
