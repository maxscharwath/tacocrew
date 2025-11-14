import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatar } from '@tacobot/ui-kit';
import { Mail, Settings, User } from 'lucide-react';

const meta = {
  title: 'UI Kit/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  args: {
    children: 'TL',
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'TL',
  },
};

export const WithIcon: Story = {
  args: {
    color: 'blue',
    size: 'md',
    children: <User />,
  },
};

export const WithText: Story = {
  args: {
    color: 'emerald',
    size: 'md',
    children: 'MS',
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <Avatar key={size} size={size} color="blue">
          <User />
        </Avatar>
      ))}
    </div>
  ),
};

export const Colors: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      {(
        [
          'blue',
          'emerald',
          'orange',
          'indigo',
          'brand',
          'rose',
          'amber',
          'violet',
          'sky',
          'cyan',
        ] as const
      ).map((color) => (
        <Avatar key={color} color={color} size="md">
          <User />
        </Avatar>
      ))}
    </div>
  ),
};

export const TextVariants: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar color="blue" size="md">
        MS
      </Avatar>
      <Avatar color="emerald" size="md">
        JD
      </Avatar>
      <Avatar color="orange" size="md">
        AB
      </Avatar>
      <Avatar color="indigo" size="md">
        TL
      </Avatar>
    </div>
  ),
};

export const IconVariants: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar color="blue" size="md">
        <User />
      </Avatar>
      <Avatar color="emerald" size="md">
        <Mail />
      </Avatar>
      <Avatar color="orange" size="md">
        <Settings />
      </Avatar>
    </div>
  ),
};
