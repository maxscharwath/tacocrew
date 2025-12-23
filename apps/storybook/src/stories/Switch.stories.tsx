import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Switch } from '@tacocrew/ui-kit';

const meta = {
  title: 'UI Kit/Switch',
  component: Switch,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'Label text for the switch',
    },
    checked: {
      control: 'boolean',
      description: 'Whether the switch is checked',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the switch is disabled',
    },
    color: {
      control: 'select',
      options: ['brand', 'rose', 'amber', 'emerald', 'violet', 'sky', 'cyan'],
      description: 'Color variant of the switch',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size variant of the switch',
    },
  },
  args: {
    label: 'Enable notifications',
    checked: false,
    disabled: false,
    color: 'brand',
    size: 'md',
  },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

// Main story - use controls panel to explore all options
export const Default: Story = {
  render: (args) => {
    const [checked, setChecked] = useState(args.checked ?? false);
    return (
      <Switch
        {...args}
        checked={checked}
        onCheckedChange={setChecked}
      />
    );
  },
};

// Without label
export const WithoutLabel: Story = {
  render: (args) => {
    const [checked, setChecked] = useState(args.checked ?? false);
    return (
      <Switch
        {...args}
        label={undefined}
        checked={checked}
        onCheckedChange={setChecked}
      />
    );
  },
};

// Color variants
export const Colors: Story = {
  render: () => {
    const colors = ['brand', 'rose', 'amber', 'emerald', 'violet', 'sky', 'cyan'] as const;
    return (
      <div className="flex flex-col gap-4">
        {colors.map((color) => {
          const [checked, setChecked] = useState(false);
          return (
            <Switch
              key={color}
              label={`${color.charAt(0).toUpperCase() + color.slice(1)} color`}
              checked={checked}
              onCheckedChange={setChecked}
              color={color}
            />
          );
        })}
      </div>
    );
  },
};

// Size variants
export const Sizes: Story = {
  render: () => {
    const sizes = ['sm', 'md', 'lg'] as const;
    return (
      <div className="flex flex-col gap-4">
        {sizes.map((size) => {
          const [checked, setChecked] = useState(false);
          return (
            <Switch
              key={size}
              label={`${size.toUpperCase()} size`}
              checked={checked}
              onCheckedChange={setChecked}
              size={size}
            />
          );
        })}
      </div>
    );
  },
};

// Disabled states
export const Disabled: Story = {
  render: () => {
    return (
      <div className="flex flex-col gap-4">
        <Switch label="Disabled unchecked" checked={false} disabled />
        <Switch label="Disabled checked" checked={true} disabled />
      </div>
    );
  },
};

// Checked state
export const Checked: Story = {
  render: () => {
    const [checked, setChecked] = useState(true);
    return (
      <Switch
        label="Notifications enabled"
        checked={checked}
        onCheckedChange={setChecked}
      />
    );
  },
};

