import type { Meta, StoryObj } from '@storybook/react-vite';
import { Separator } from '@tacobot/ui-kit';

const meta = {
  title: 'UI Kit/Separator',
  component: Separator,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
      description: 'The orientation of the separator',
    },
    decorative: {
      control: 'boolean',
      description: 'Whether the separator is purely decorative',
    },
  },
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

// Main story - use controls panel to explore all options
export const Default: Story = {
  render: (args) => (
    <div className={args.orientation === 'vertical' ? 'flex h-20 items-center gap-4' : 'w-full'}>
      <span className="text-slate-300 text-sm">Item 1</span>
      <Separator {...args} className={args.orientation === 'vertical' ? 'mx-2' : 'my-4'} />
      <span className="text-slate-300 text-sm">Item 2</span>
    </div>
  ),
};

// Showcase story - different orientations
export const Showcase: Story = {
  render: () => (
    <div className="space-y-8">
      <div className="space-y-3">
        <h2 className="font-semibold text-lg text-white">Horizontal Separator</h2>
        <div className="space-y-4">
          <div>
            <p className="text-slate-300 text-sm">Content above</p>
            <Separator className="my-4" />
            <p className="text-slate-300 text-sm">Content below</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold text-lg text-white">Vertical Separator</h2>
        <div className="flex h-20 items-center gap-4">
          <span className="text-slate-300 text-sm">Left</span>
          <Separator orientation="vertical" className="mx-2" />
          <span className="text-slate-300 text-sm">Right</span>
        </div>
      </div>
    </div>
  ),
};
