import type { Meta, StoryObj } from '@storybook/react-vite';
import { SegmentedControl, SegmentedControlItem } from '@tacocrew/ui-kit';
import { Bell, Mail, Settings, User } from 'lucide-react';
import { useState } from 'react';

const meta = {
  title: 'UI Kit/SegmentedControl',
  component: SegmentedControl,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Tab-like selection control using compound component pattern. Supports primary and secondary variants with flexible composition.',
      },
    },
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

// Main story - two options
export const Default: Story = {
  render: () => {
    const [value, setValue] = useState('signin');
    return (
      <SegmentedControl value={value} onValueChange={setValue}>
        <SegmentedControlItem value="signin">Sign in</SegmentedControlItem>
        <SegmentedControlItem value="signup">Sign up</SegmentedControlItem>
      </SegmentedControl>
    );
  },
};

// Primary variant with different option counts
export const Primary: Story = {
  render: () => {
    const [value2, setValue2] = useState('a');
    const [value3, setValue3] = useState('one');
    const [value4, setValue4] = useState('tab1');

    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <h2 className="font-semibold text-lg text-white">Two Options</h2>
          <SegmentedControl value={value2} onValueChange={setValue2} variant="primary">
            <SegmentedControlItem value="a">Option A</SegmentedControlItem>
            <SegmentedControlItem value="b">Option B</SegmentedControlItem>
          </SegmentedControl>
        </div>

        <div className="space-y-3">
          <h2 className="font-semibold text-lg text-white">Three Options</h2>
          <SegmentedControl value={value3} onValueChange={setValue3} variant="primary">
            <SegmentedControlItem value="one">One</SegmentedControlItem>
            <SegmentedControlItem value="two">Two</SegmentedControlItem>
            <SegmentedControlItem value="three">Three</SegmentedControlItem>
          </SegmentedControl>
        </div>

        <div className="space-y-3">
          <h2 className="font-semibold text-lg text-white">Four Options</h2>
          <SegmentedControl value={value4} onValueChange={setValue4} variant="primary">
            <SegmentedControlItem value="tab1">Tab 1</SegmentedControlItem>
            <SegmentedControlItem value="tab2">Tab 2</SegmentedControlItem>
            <SegmentedControlItem value="tab3">Tab 3</SegmentedControlItem>
            <SegmentedControlItem value="tab4">Tab 4</SegmentedControlItem>
          </SegmentedControl>
        </div>
      </div>
    );
  },
};

// Secondary variant (premium look)
export const Secondary: Story = {
  render: () => {
    const [value, setValue] = useState('profile');

    return (
      <SegmentedControl value={value} onValueChange={setValue} variant="secondary">
        <SegmentedControlItem value="profile">Profile</SegmentedControlItem>
        <SegmentedControlItem value="settings">Settings</SegmentedControlItem>
        <SegmentedControlItem value="billing">Billing</SegmentedControlItem>
      </SegmentedControl>
    );
  },
};

// With icons
export const WithIcons: Story = {
  render: () => {
    const [value, setValue] = useState('profile');

    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <h2 className="font-semibold text-lg text-white">Primary with Icons</h2>
          <SegmentedControl value={value} onValueChange={setValue} variant="primary">
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
          <SegmentedControl value={value} onValueChange={setValue} variant="secondary">
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
    );
  },
};

// Icons only
export const IconsOnly: Story = {
  render: () => {
    const [value, setValue] = useState('inbox');

    return (
      <SegmentedControl value={value} onValueChange={setValue} variant="primary">
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
    );
  },
};

// Disabled state
export const Disabled: Story = {
  render: () => {
    const [value, setValue] = useState('signin');
    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <h2 className="font-semibold text-lg text-white">All Disabled</h2>
          <SegmentedControl value={value} onValueChange={setValue} disabled>
            <SegmentedControlItem value="signin">Sign in</SegmentedControlItem>
            <SegmentedControlItem value="signup">Sign up</SegmentedControlItem>
          </SegmentedControl>
        </div>

        <div className="space-y-3">
          <h2 className="font-semibold text-lg text-white">Individual Item Disabled</h2>
          <SegmentedControl value={value} onValueChange={setValue}>
            <SegmentedControlItem value="signin">Sign in</SegmentedControlItem>
            <SegmentedControlItem value="signup" disabled>
              Sign up (Coming Soon)
            </SegmentedControlItem>
          </SegmentedControl>
        </div>
      </div>
    );
  },
};

// Real-world example
export const RealWorld: Story = {
  render: () => {
    const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
    const [view, setView] = useState<'grid' | 'list'>('grid');

    return (
      <div className="space-y-8">
        <div className="space-y-4">
          <h2 className="font-semibold text-lg text-white">Authentication Form</h2>
          <div className="rounded-2xl border border-gray-700 bg-slate-900/50 p-6">
            <SegmentedControl value={authMode} onValueChange={setAuthMode} variant="primary">
              <SegmentedControlItem value="signin">Sign in</SegmentedControlItem>
              <SegmentedControlItem value="signup">Create account</SegmentedControlItem>
            </SegmentedControl>
            <div className="mt-6">
              <p className="text-slate-400 text-sm">
                {authMode === 'signin'
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
              <SegmentedControl value={view} onValueChange={setView} variant="secondary">
                <SegmentedControlItem value="grid">Grid</SegmentedControlItem>
                <SegmentedControlItem value="list">List</SegmentedControlItem>
              </SegmentedControl>
            </div>
            <p className="text-slate-400 text-sm">Viewing in {view} mode</p>
          </div>
        </div>
      </div>
    );
  },
};
