import type { Meta, StoryObj } from '@storybook/react-vite';
import { SegmentedControl, SegmentedControlItem } from '@tacocrew/ui-kit';
import { Bell, Mail, Settings, User } from 'lucide-react';
import { action } from 'storybook/actions';

/**
 * Tab-like selection control using compound component pattern.
 *
 * ## Features
 * - Primary and secondary variants
 * - Icon support
 * - Disabled states
 * - Keyboard navigation
 * - Flexible composition
 */
const meta = {
  title: 'UI Kit/SegmentedControl',
  component: SegmentedControl,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary'],
      description: 'Visual style variant',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable all items',
    },
  },
} satisfies Meta<typeof SegmentedControl>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default segmented control with two options
 */
export const Default: Story = {
  args: {
    value: 'signin',
    onValueChange: action('on-value-change'),
    children: null,
  },
  render: (args) => (
    <SegmentedControl {...args}>
      <SegmentedControlItem value="signin">Sign in</SegmentedControlItem>
      <SegmentedControlItem value="signup">Sign up</SegmentedControlItem>
    </SegmentedControl>
  ),
};

/**
 * Primary variant with different option counts
 */
export const Primary: Story = {
  args: {
    value: 'a',
    onValueChange: action('on-value-change'),
    variant: 'primary',
    children: null,
  },
  render: (args) => (
    <div className="space-y-6">
      <div className="space-y-3">
        <h2 className="font-semibold text-lg text-white">Two Options</h2>
        <SegmentedControl {...args} value="a">
          <SegmentedControlItem value="a">Option A</SegmentedControlItem>
          <SegmentedControlItem value="b">Option B</SegmentedControlItem>
        </SegmentedControl>
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold text-lg text-white">Three Options</h2>
        <SegmentedControl {...args} value="one">
          <SegmentedControlItem value="one">One</SegmentedControlItem>
          <SegmentedControlItem value="two">Two</SegmentedControlItem>
          <SegmentedControlItem value="three">Three</SegmentedControlItem>
        </SegmentedControl>
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold text-lg text-white">Four Options</h2>
        <SegmentedControl {...args} value="tab1">
          <SegmentedControlItem value="tab1">Tab 1</SegmentedControlItem>
          <SegmentedControlItem value="tab2">Tab 2</SegmentedControlItem>
          <SegmentedControlItem value="tab3">Tab 3</SegmentedControlItem>
          <SegmentedControlItem value="tab4">Tab 4</SegmentedControlItem>
        </SegmentedControl>
      </div>
    </div>
  ),
};

/**
 * Secondary variant (premium look)
 */
export const Secondary: Story = {
  args: {
    value: 'profile',
    onValueChange: action('on-value-change'),
    variant: 'secondary',
    children: null,
  },
  render: (args) => (
    <SegmentedControl {...args}>
      <SegmentedControlItem value="profile">Profile</SegmentedControlItem>
      <SegmentedControlItem value="settings">Settings</SegmentedControlItem>
      <SegmentedControlItem value="billing">Billing</SegmentedControlItem>
    </SegmentedControl>
  ),
};

/**
 * Segmented control with icons
 */
export const WithIcons: Story = {
  args: {
    value: 'profile',
    onValueChange: action('on-value-change'),
    variant: 'primary',
    children: null,
  },
  render: (args) => (
    <div className="space-y-6">
      <div className="space-y-3">
        <h2 className="font-semibold text-lg text-white">Primary with Icons</h2>
        <SegmentedControl {...args} variant="primary">
          <SegmentedControlItem value="profile">
            <User size={16} />
            Profile
          </SegmentedControlItem>
          <SegmentedControlItem value="settings">
            <Settings size={16} />
            Settings
          </SegmentedControlItem>
        </SegmentedControl>
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold text-lg text-white">Secondary with Icons</h2>
        <SegmentedControl {...args} variant="secondary">
          <SegmentedControlItem value="profile">
            <User size={14} />
            Profile
          </SegmentedControlItem>
          <SegmentedControlItem value="settings">
            <Settings size={14} />
            Settings
          </SegmentedControlItem>
        </SegmentedControl>
      </div>
    </div>
  ),
};

/**
 * Icons only (no text labels)
 */
export const IconsOnly: Story = {
  args: {
    value: 'inbox',
    onValueChange: action('on-value-change'),
    variant: 'primary',
    children: null,
  },
  render: (args) => (
    <SegmentedControl {...args}>
      <SegmentedControlItem value="inbox" aria-label="Inbox">
        <Mail size={18} />
      </SegmentedControlItem>
      <SegmentedControlItem value="notifications" aria-label="Notifications">
        <Bell size={18} />
      </SegmentedControlItem>
      <SegmentedControlItem value="settings" aria-label="Settings">
        <Settings size={18} />
      </SegmentedControlItem>
      <SegmentedControlItem value="profile" aria-label="Profile">
        <User size={18} />
      </SegmentedControlItem>
    </SegmentedControl>
  ),
};

/**
 * Disabled states
 */
export const Disabled: Story = {
  args: {
    value: 'signin',
    onValueChange: action('on-value-change'),
    disabled: true,
    children: null,
  },
  render: (args) => (
    <div className="space-y-6">
      <div className="space-y-3">
        <h2 className="font-semibold text-lg text-white">All Disabled</h2>
        <SegmentedControl {...args}>
          <SegmentedControlItem value="signin">Sign in</SegmentedControlItem>
          <SegmentedControlItem value="signup">Sign up</SegmentedControlItem>
        </SegmentedControl>
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold text-lg text-white">Individual Item Disabled</h2>
        <SegmentedControl {...args} disabled={false}>
          <SegmentedControlItem value="signin">Sign in</SegmentedControlItem>
          <SegmentedControlItem value="signup" disabled>
            Sign up (Coming Soon)
          </SegmentedControlItem>
        </SegmentedControl>
      </div>
    </div>
  ),
};

/**
 * Real-world usage examples
 */
export const RealWorld: Story = {
  args: {
    value: 'signin',
    onValueChange: action('on-value-change'),
    variant: 'primary',
    children: null,
  },
  render: (args) => (
    <div className="space-y-8">
      <div className="space-y-4">
        <h2 className="font-semibold text-lg text-white">Authentication Form</h2>
        <div className="rounded-2xl border border-gray-700 bg-slate-900/50 p-6">
          <SegmentedControl {...args}>
            <SegmentedControlItem value="signin">Sign in</SegmentedControlItem>
            <SegmentedControlItem value="signup">Create account</SegmentedControlItem>
          </SegmentedControl>
          <div className="mt-6">
            <p className="text-slate-400 text-sm">
              {args.value === 'signin'
                ? 'Sign in to your account to continue'
                : 'Create a new account to get started'}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="font-semibold text-lg text-white">View Switcher</h2>
        <div className="rounded-2xl border border-gray-700 bg-slate-900/50 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-medium text-white">Orders</h3>
            <SegmentedControl {...args} variant="secondary" value="grid">
              <SegmentedControlItem value="grid">Grid</SegmentedControlItem>
              <SegmentedControlItem value="list">List</SegmentedControlItem>
            </SegmentedControl>
          </div>
          <p className="text-slate-400 text-sm">Viewing in grid mode</p>
        </div>
      </div>
    </div>
  ),
};
