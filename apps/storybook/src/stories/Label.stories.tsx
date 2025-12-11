import type { Meta, StoryObj } from '@storybook/react-vite';
import { Input, Label } from '@tacobot/ui-kit';

const meta = {
  title: 'UI Kit/Label',
  component: Label,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    required: {
      control: 'boolean',
      description: 'Whether the field is required',
    },
    htmlFor: {
      control: 'text',
      description: 'ID of the associated input element',
    },
  },
  args: {
    children: 'Email Address',
    required: false,
  },
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

// Main story - use controls panel to explore all options
export const Default: Story = {};

// Showcase story - with input examples
export const Showcase: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input id="email" type="email" placeholder="you@example.com" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email-required" required>
          Email Address
        </Label>
        <Input id="email-required" type="email" placeholder="you@example.com" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" placeholder="Enter your password" />
      </div>
    </div>
  ),
};
