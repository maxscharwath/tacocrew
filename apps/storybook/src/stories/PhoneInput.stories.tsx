import type { Meta, StoryObj } from '@storybook/react-vite';
import { PhoneInput } from '@tacocrew/ui-kit';
import React, { useState } from 'react';

/**
 * PhoneInput component with international phone number support
 *
 * ## Features
 * - Country selection with flags
 * - Automatic formatting
 * - Validation support
 * - Error states
 */
const meta = {
  title: 'UI Kit/PhoneInput',
  component: PhoneInput,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    defaultCountry: {
      control: 'select',
      options: ['CH', 'US', 'FR', 'DE', 'GB'],
      description: 'Default country code',
    },
    error: {
      control: 'boolean',
      description: 'Error state',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
    value: {
      control: 'text',
      description: 'Phone number value',
    },
  },
} satisfies Meta<typeof PhoneInput>;

export default meta;
type Story = StoryObj<typeof meta>;

// Wrapper component for stateful stories
function StatefulPhoneInput(props: React.ComponentProps<typeof PhoneInput>) {
  const [value, setValue] = useState(props.value || '');
  return <PhoneInput {...props} value={value} onChange={setValue} />;
}

/**
 * Default phone input - use controls to explore all options
 */
export const Default: Story = {
  render: (args) => (
    <div className="w-full max-w-sm">
      <StatefulPhoneInput {...args} />
    </div>
  ),
};

/**
 * Phone input with pre-filled value
 */
export const WithValue: Story = {
  args: {
    value: '+41 79 123 45 67',
  },
  render: (args) => (
    <div className="w-full max-w-sm">
      <StatefulPhoneInput {...args} />
    </div>
  ),
};

/**
 * Phone input in error state
 */
export const ErrorState: Story = {
  args: {
    error: true,
  },
  render: (args) => (
    <div className="w-full max-w-sm">
      <StatefulPhoneInput {...args} />
    </div>
  ),
};

/**
 * Disabled phone input
 */
export const Disabled: Story = {
  args: {
    value: '+41 79 123 45 67',
    disabled: true,
  },
  render: (args) => (
    <div className="w-full max-w-sm">
      <PhoneInput
        {...args}
        onChange={() => {
          // No-op for disabled state
        }}
      />
    </div>
  ),
};

/**
 * Different country defaults
 */
export const Countries: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="font-semibold text-sm text-white">Switzerland (CH)</h3>
        <div className="w-full max-w-sm">
          <StatefulPhoneInput defaultCountry="CH" />
        </div>
      </div>
      <div className="space-y-2">
        <h3 className="font-semibold text-sm text-white">United States (US)</h3>
        <div className="w-full max-w-sm">
          <StatefulPhoneInput defaultCountry="US" />
        </div>
      </div>
      <div className="space-y-2">
        <h3 className="font-semibold text-sm text-white">France (FR)</h3>
        <div className="w-full max-w-sm">
          <StatefulPhoneInput defaultCountry="FR" />
        </div>
      </div>
    </div>
  ),
};
