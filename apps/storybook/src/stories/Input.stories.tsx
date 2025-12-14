import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  Label,
} from '@tacocrew/ui-kit';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { useState } from 'react';

const meta = {
  title: 'UI Kit/Input',
  component: Input,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'tel', 'url', 'search'],
      description: 'Input type',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the input is disabled',
    },
    value: {
      control: 'text',
      description: 'Input value',
    },
  },
  args: {
    placeholder: 'Search tacos…',
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

// Password toggle component for showcase
function PasswordToggleExample() {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');

  return (
    <div className="max-w-md space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password-toggle" required>
          Password
        </Label>
        <InputGroup>
          <InputGroupAddon>
            <Lock className="size-4" />
          </InputGroupAddon>
          <InputGroupInput
            id="password-toggle"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              type="button"
              size="icon-xs"
              variant="ghost"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </div>
    </div>
  );
}

// Main story - use controls panel to explore all options
export const Default: Story = {
  render: (args) => (
    <div className="w-full max-w-sm">
      <Input {...args} />
    </div>
  ),
};

// Showcase story - all input types and states
export const Showcase: Story = {
  render: () => (
    <div className="space-y-8">
      <div className="space-y-3">
        <h2 className="font-semibold text-lg text-white">Input Types</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="text-input">Text</Label>
            <Input id="text-input" type="text" placeholder="Enter text..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email-input">Email</Label>
            <Input id="email-input" type="email" placeholder="you@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password-input">Password</Label>
            <Input id="password-input" type="password" placeholder="Enter password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="number-input">Number</Label>
            <Input id="number-input" type="number" placeholder="0" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tel-input">Telephone</Label>
            <Input id="tel-input" type="tel" placeholder="+1 (555) 123-4567" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="url-input">URL</Label>
            <Input id="url-input" type="url" placeholder="https://example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="search-input">Search</Label>
            <Input id="search-input" type="search" placeholder="Search..." />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold text-lg text-white">States</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="default-input">Default</Label>
            <Input id="default-input" placeholder="Normal input" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="with-value-input">With Value</Label>
            <Input id="with-value-input" value="Pre-filled value" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="disabled-input">Disabled</Label>
            <Input id="disabled-input" placeholder="Disabled input" disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="error-input">Error State</Label>
            <Input
              id="error-input"
              placeholder="Invalid input"
              aria-invalid={true}
              defaultValue="invalid@"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold text-lg text-white">Password with Toggle</h2>
        <PasswordToggleExample />
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold text-lg text-white">With Labels</h2>
        <div className="max-w-md space-y-4">
          <div className="space-y-2">
            <Label htmlFor="required-input" required>
              Required Field
            </Label>
            <Input id="required-input" placeholder="This field is required" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="optional-input">Optional Field</Label>
            <Input id="optional-input" placeholder="This field is optional" />
          </div>
        </div>
      </div>
    </div>
  ),
};
