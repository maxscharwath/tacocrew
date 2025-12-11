import type { Meta, StoryObj } from '@storybook/react-vite';
import { PhoneInput } from '@tacobot/ui-kit';
import { useState } from 'react';

const meta = {
  title: 'UI Kit/PhoneInput',
  component: PhoneInput,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    defaultCountry: {
      control: 'text',
      description: 'Default country code (e.g., "CH", "US", "FR")',
    },
    error: {
      control: 'boolean',
      description: 'Whether the input has an error state',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the input is disabled',
    },
  },
} satisfies Meta<typeof PhoneInput>;

export default meta;
type Story = StoryObj<typeof meta>;

// Main story - use controls panel to explore all options
export const Default: Story = {
  render: (args) => {
    const [value, setValue] = useState('');
    return (
      <div className="w-full max-w-sm">
        <PhoneInput
          {...args}
          value={value}
          onChange={setValue}
          defaultCountry={args.defaultCountry || 'CH'}
        />
      </div>
    );
  },
  args: {
    defaultCountry: 'CH',
  },
};

// Showcase story - different states
export const Showcase: Story = {
  render: () => {
    const [value1, setValue1] = useState('');
    const [value2, setValue2] = useState('');
    const [value3, setValue3] = useState('');

    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <h2 className="font-semibold text-lg text-white">Default</h2>
          <div className="w-full max-w-sm">
            <PhoneInput value={value1} onChange={setValue1} defaultCountry="CH" />
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="font-semibold text-lg text-white">With Value</h2>
          <div className="w-full max-w-sm">
            <PhoneInput value={value2} onChange={setValue2} defaultCountry="US" />
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="font-semibold text-lg text-white">Error State</h2>
          <div className="w-full max-w-sm">
            <PhoneInput value={value3} onChange={setValue3} defaultCountry="FR" error />
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="font-semibold text-lg text-white">Disabled</h2>
          <div className="w-full max-w-sm">
            <PhoneInput
              value="+41 79 123 45 67"
              onChange={() => {
                // Disabled input - no-op handler
              }}
              defaultCountry="CH"
              disabled
            />
          </div>
        </div>
      </div>
    );
  },
};
