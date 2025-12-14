import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '@tacocrew/ui-kit';

const meta = {
  title: 'UI Kit/Button',
  component: Button,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'secondary', 'outline', 'ghost', 'link', 'tab'],
      description: 'The visual style variant of the button',
    },
    color: {
      control: 'select',
      options: ['brand', 'rose', 'amber', 'emerald', 'violet', 'sky', 'cyan'],
      description: 'Color theme for the button',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'The size of the button',
    },
    pill: {
      control: 'boolean',
      description:
        'Whether the button should be pill-shaped (rounded-full) or rounded (rounded-xl)',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Whether the button should take full width',
    },
    loading: {
      control: 'boolean',
      description: 'Shows loading spinner',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the button is disabled',
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// Main story - use controls panel to explore all options
export const Default: Story = {
  args: {
    variant: 'default',
    children: 'Button',
  },
  render: (args) => (
    <div className="w-full max-w-md">
      <Button {...args} />
    </div>
  ),
};

// Showcase story - all variants and colors for reference
export const AllVariantsAndColors: Story = {
  render: () => {
    const colors = ['brand', 'rose', 'amber', 'emerald', 'violet', 'sky', 'cyan'] as const;

    return (
      <div className="space-y-8">
        {/* Default Variant */}
        <div className="space-y-3">
          <h2 className="font-semibold text-lg text-white">Default Variant</h2>
          <p className="text-slate-400 text-sm">
            Default action buttons with gradient backgrounds. All colors available.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="default">Default</Button>
            {colors.map((color) => (
              <Button key={color} variant="default" color={color}>
                {color.charAt(0).toUpperCase() + color.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Destructive Variant */}
        <div className="space-y-3">
          <h2 className="font-semibold text-lg text-white">Destructive Variant</h2>
          <p className="text-slate-400 text-sm">For dangerous or destructive actions.</p>
          <div className="flex flex-wrap gap-3">
            <Button variant="destructive">Delete</Button>
          </div>
        </div>

        {/* Secondary Variant */}
        <div className="space-y-3">
          <h2 className="font-semibold text-lg text-white">Secondary Variant</h2>
          <p className="text-slate-400 text-sm">
            Secondary actions with subtle backgrounds. All colors available.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary">Default</Button>
            {colors.map((color) => (
              <Button key={color} variant="secondary" color={color}>
                {color.charAt(0).toUpperCase() + color.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Outline Variant */}
        <div className="space-y-3">
          <h2 className="font-semibold text-lg text-white">Outline Variant</h2>
          <p className="text-slate-400 text-sm">
            Outlined buttons with transparent backgrounds. Color affects border and text. All colors
            available.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline">Default</Button>
            {colors.map((color) => (
              <Button key={color} variant="outline" color={color}>
                {color.charAt(0).toUpperCase() + color.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Ghost Variant */}
        <div className="space-y-3">
          <h2 className="font-semibold text-lg text-white">Ghost Variant</h2>
          <p className="text-slate-400 text-sm">
            Minimal buttons with subtle hover effects. All colors available.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="ghost">Default</Button>
            {colors.map((color) => (
              <Button key={color} variant="ghost" color={color}>
                {color.charAt(0).toUpperCase() + color.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Tab Variant */}
        <div className="space-y-3">
          <h2 className="font-semibold text-lg text-white">Tab Variant</h2>
          <p className="text-slate-400 text-sm">
            Tab-style buttons, typically used in navigation. All colors available.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="tab">Default</Button>
            {colors.map((color) => (
              <Button key={color} variant="tab" color={color}>
                {color.charAt(0).toUpperCase() + color.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Link Variant */}
        <div className="space-y-3">
          <h2 className="font-semibold text-lg text-white">Link Variant</h2>
          <p className="text-slate-400 text-sm">Text link styled as a button.</p>
          <div className="flex flex-wrap gap-3">
            <Button variant="link">Link Button</Button>
          </div>
        </div>
      </div>
    );
  },
  parameters: {
    layout: 'padded',
  },
};
