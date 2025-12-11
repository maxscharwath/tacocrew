import type { Meta, StoryObj } from '@storybook/react-vite';
import { SegmentedControl } from '@tacobot/ui-kit';
import { useState } from 'react';

const meta = {
  title: 'UI Kit/SegmentedControl',
  component: SegmentedControl,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SegmentedControl>;

export default meta;
type Story = StoryObj<typeof meta>;

// Main story - two options
export const Default: Story = {
  render: () => {
    const [value, setValue] = useState<'signin' | 'signup'>('signin');
    return (
      <SegmentedControl
        value={value}
        onValueChange={setValue}
        options={[
          { value: 'signin', label: 'Sign in' },
          { value: 'signup', label: 'Sign up' },
        ]}
      />
    );
  },
};

// Showcase story - different option counts
export const Showcase: Story = {
  render: () => {
    const [value2, setValue2] = useState<'a' | 'b'>('a');
    const [value3, setValue3] = useState<'one' | 'two' | 'three'>('one');

    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <h2 className="font-semibold text-lg text-white">Two Options</h2>
          <SegmentedControl
            value={value2}
            onValueChange={setValue2}
            options={[
              { value: 'a', label: 'Option A' },
              { value: 'b', label: 'Option B' },
            ]}
          />
        </div>

        <div className="space-y-3">
          <h2 className="font-semibold text-lg text-white">Three Options</h2>
          <SegmentedControl
            value={value3}
            onValueChange={setValue3}
            options={[
              { value: 'one', label: 'One' },
              { value: 'two', label: 'Two' },
              { value: 'three', label: 'Three' },
            ]}
          />
        </div>
      </div>
    );
  },
};
