import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from '@tacocrew/ui-kit';
import { Check, Copy, Eye, EyeOff, Lock, Search, User } from 'lucide-react';
import { useState } from 'react';

const meta = {
  title: 'UI Kit/Input Group',
  component: InputGroup,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Input groups combine inputs with addons like icons, buttons, and text for enhanced UX.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof InputGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

// Main story - simple example
export const Default: Story = {
  render: () => (
    <div className="w-full max-w-sm">
      <InputGroup>
        <InputGroupInput placeholder="Search tacos..." />
        <InputGroupAddon>
          <Search className="size-4" />
        </InputGroupAddon>
      </InputGroup>
    </div>
  ),
};

// Showcase component - common patterns
function ShowcaseStory() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="space-y-3">
        <h2 className="font-semibold text-lg text-white">With Icon</h2>
        <InputGroup>
          <InputGroupAddon>
            <User className="size-4" />
          </InputGroupAddon>
          <InputGroupInput placeholder="Username" />
        </InputGroup>
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold text-lg text-white">With Text</h2>
        <InputGroup>
          <InputGroupAddon>
            <InputGroupText>https://</InputGroupText>
          </InputGroupAddon>
          <InputGroupInput placeholder="example.com" />
        </InputGroup>
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold text-lg text-white">With Button</h2>
        <InputGroup>
          <InputGroupInput placeholder="Enter code..." />
          <InputGroupAddon>
            <InputGroupButton variant="secondary">Verify</InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold text-lg text-white">Password with Toggle</h2>
        <InputGroup>
          <InputGroupAddon>
            <Lock className="size-4" />
          </InputGroupAddon>
          <InputGroupInput type={showPassword ? 'text' : 'password'} placeholder="Enter password" />
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

      <div className="space-y-3">
        <h2 className="font-semibold text-lg text-white">With Copy Button</h2>
        <InputGroup>
          <InputGroupInput value="https://tacocrew.com/oauth/client-123" readOnly />
          <InputGroupAddon align="inline-end">
            <InputGroupButton size="icon-xs" variant="ghost" type="button">
              <Copy className="size-4" />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold text-lg text-white">Textarea with Button</h2>
        <InputGroup>
          <InputGroupTextarea
            placeholder="Ask a question about tacos..."
            className="min-h-[80px]"
          />
          <InputGroupAddon align="block-end">
            <InputGroupButton variant="secondary" size="sm">
              Send
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold text-lg text-white">Multiple Addons</h2>
        <InputGroup>
          <InputGroupAddon>
            <InputGroupText>$</InputGroupText>
          </InputGroupAddon>
          <InputGroupInput placeholder="0.00" />
          <InputGroupAddon>
            <InputGroupText>USD</InputGroupText>
          </InputGroupAddon>
          <InputGroupAddon>
            <InputGroupButton size="icon-xs" type="button">
              <Check className="size-4 text-green-500" />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </div>
    </div>
  );
}

// Showcase story - common patterns
export const Showcase: Story = {
  render: () => <ShowcaseStory />,
};
