import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatar } from '@tacobot/ui-kit';
import { User } from 'lucide-react';

const COLOR_OPTIONS = [
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
] as const;

const SIZE_OPTIONS = ['sm', 'md', 'lg', 'xl'] as const;

const meta = {
  title: 'UI Kit/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  args: {
    color: 'brand' as (typeof COLOR_OPTIONS)[number],
    size: 'md' as (typeof SIZE_OPTIONS)[number],
    variant: 'default',
    children: 'TL',
  },
  argTypes: {
    color: {
      control: { type: 'select' },
      options: COLOR_OPTIONS,
      description: 'Accent color. BrandHero/neutral are ideal for hero/neutral avatars.',
    },
    size: {
      control: { type: 'radio' },
      options: SIZE_OPTIONS,
      description: 'Avatar size – icons resize automatically.',
    },
    variant: {
      control: { type: 'inline-radio' },
      options: ['default', 'elevated'],
      description: 'Default = bordered tile, Elevated = soft shadow tile.',
    },
    children: {
      control: 'text',
      description: 'Supports text initials, emoji or an icon element.',
    },
    className: { control: false },
  },
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

// Main story - use controls panel to explore all options
export const Default: Story = {};

// Showcase story - all options for reference
export const Showcase: Story = {
  render: () => (
    <div className="space-y-8">
      <div className="space-y-3">
        <h2 className="font-semibold text-lg text-white">Sizes</h2>
        <div className="flex items-end gap-4">
          {SIZE_OPTIONS.map((size) => (
            <div key={size} className="flex flex-col items-center gap-2 text-slate-400 text-xs">
              <Avatar size={size} color="brand">
                <User />
              </Avatar>
              <span>{size.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold text-lg text-white">Colors</h2>
        <div className="flex flex-wrap gap-4">
          {COLOR_OPTIONS.map((color) => (
            <div key={color} className="flex flex-col items-center gap-2 text-slate-400 text-xs">
              <Avatar color={color}>
                <User />
              </Avatar>
              <span className="uppercase tracking-wide">{color}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold text-lg text-white">Variants</h2>
        <div className="flex items-center gap-6">
          <div className="text-slate-400 text-xs">
            <p className="mb-2 font-semibold text-white">Default</p>
            <Avatar variant="default" color="brand">
              TL
            </Avatar>
          </div>
          <div className="text-slate-400 text-xs">
            <p className="mb-2 font-semibold text-white">Elevated</p>
            <Avatar variant="elevated" color="brandHero">
              TL
            </Avatar>
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};
