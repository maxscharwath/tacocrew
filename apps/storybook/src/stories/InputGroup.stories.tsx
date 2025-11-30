import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from '@tacobot/ui-kit';
import {
  Check,
  Copy,
  CreditCard,
  DollarSign,
  Eye,
  EyeOff,
  Key,
  Lock,
  Mail,
  RefreshCw,
  Search,
  Settings,
  Trash2,
  User,
} from 'lucide-react';
import { useState } from 'react';
import { useCopyFeedback } from '../../../web/src/hooks/useCopyFeedback';

const meta = {
  title: 'UI Kit/Input Group',
  component: InputGroup,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Input groups combine inputs with addons like icons, buttons, and text for enhanced UX.',
      },
    },
  },
} satisfies Meta<typeof InputGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithIcon: Story = {
  render: () => (
    <div className="w-full max-w-sm space-y-4">
      <InputGroup>
        <InputGroupInput placeholder="Search tacos..." />
        <InputGroupAddon>
          <Search className="size-4" />
        </InputGroupAddon>
      </InputGroup>
    </div>
  ),
};

export const WithText: Story = {
  render: () => (
    <div className="w-full max-w-sm space-y-4">
      <InputGroup>
        <InputGroupAddon>
          <InputGroupText>https://</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput placeholder="example.com" />
      </InputGroup>

      <InputGroup>
        <InputGroupInput placeholder="0.00" />
        <InputGroupAddon>
          <InputGroupText>USD</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
    </div>
  ),
};

export const WithButton: Story = {
  render: () => (
    <div className="w-full max-w-sm space-y-4">
      <InputGroup>
        <InputGroupInput placeholder="Search..." />
        <InputGroupAddon>
          <InputGroupButton size="icon-xs">
            <Search className="size-4" />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>

      <InputGroup>
        <InputGroupInput placeholder="Enter code..." />
        <InputGroupAddon>
          <InputGroupButton variant="secondary">Verify</InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  ),
};

export const PasswordWithEyeIcon: Story = {
  render: function PasswordInput() {
    const [showPassword, setShowPassword] = useState(false);
    const [password, setPassword] = useState('');

    return (
      <div className="w-full max-w-sm space-y-4">
        <InputGroup>
          <InputGroupAddon>
            <Lock className="size-4" />
          </InputGroupAddon>
          <InputGroupInput
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <InputGroupAddon>
            <InputGroupButton
              size="icon-xs"
              variant="ghost"
              onClick={() => setShowPassword(!showPassword)}
              type="button"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </div>
    );
  },
};

export const LoadSecretPattern: Story = {
  render: function LoadSecretExample() {
    const [secret, setSecret] = useState<string | null>(null);
    const [showSecret, setShowSecret] = useState(false);
    const clientIdCopy = useCopyFeedback();
    const clientSecretCopy = useCopyFeedback();

    const loadSecret = () => {
      // Simulate loading
      setTimeout(() => {
        setSecret('sk-AbCdEfGhIjKlMnOpQrStUvWxYz1234567890abcdef==');
      }, 500);
    };

    const regenerateSecret = () => {
      // Simulate base64 encoded secret
      setSecret('sk-' + btoa(Math.random().toString()).substring(0, 43));
    };

    return (
      <div className="w-full max-w-sm space-y-4">
        {/* Client ID Example */}
        <div>
          <label className="mb-2 block font-medium text-sm">Client ID</label>
          <InputGroup>
            <InputGroupInput
              value="cl-AbCdEfGhIjKlMnOpQrStUvWxYz1234567890abcdef"
              readOnly
              className="font-mono text-sm"
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-xs"
                variant="ghost"
                onClick={() =>
                  clientIdCopy.copyToClipboard('cl-AbCdEfGhIjKlMnOpQrStUvWxYz1234567890abcdef')
                }
                title="Copy client ID"
              >
                {clientIdCopy.isCopied ? (
                  <Check className="size-4 text-green-500" />
                ) : (
                  <Copy className="size-4" />
                )}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </div>

        {/* Client Secret Example */}
        <div>
          <label className="mb-2 block font-medium text-sm">Client Secret</label>
          <InputGroup>
            <InputGroupInput
              value={secret || ''}
              readOnly
              type={showSecret && secret ? 'text' : 'password'}
              className="font-mono text-sm"
              placeholder={secret ? '' : 'Secret not loaded'}
            />
            <InputGroupAddon align="inline-end">
              {!secret ? (
                <InputGroupButton
                  size="icon-xs"
                  variant="ghost"
                  onClick={loadSecret}
                  title="Load client secret"
                >
                  <Key className="size-4" />
                </InputGroupButton>
              ) : (
                <>
                  <InputGroupButton
                    size="icon-xs"
                    variant="ghost"
                    onClick={() => setShowSecret(!showSecret)}
                    title={showSecret ? 'Hide secret' : 'Show secret'}
                  >
                    {showSecret ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </InputGroupButton>
                  <InputGroupButton
                    size="icon-xs"
                    variant="ghost"
                    onClick={() => clientSecretCopy.copyToClipboard(secret)}
                    title="Copy to clipboard"
                  >
                    {clientSecretCopy.isCopied ? (
                      <Check className="size-4 text-green-500" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                  </InputGroupButton>
                </>
              )}
            </InputGroupAddon>
          </InputGroup>
        </div>

        {/* Context Menu Example (separate from input) */}
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0" title="More options">
                <Settings size={18} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={regenerateSecret}>
                <RefreshCw className="mr-2 size-4" />
                Regenerate Secret
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem destructive>
                <Trash2 className="mr-2 size-4" />
                Delete Client
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  },
};

export const EmailInput: Story = {
  render: () => (
    <div className="w-full max-w-sm space-y-4">
      <InputGroup>
        <InputGroupAddon>
          <User className="size-4" />
        </InputGroupAddon>
        <InputGroupInput placeholder="username" />
        <InputGroupAddon>
          <InputGroupText>@company.com</InputGroupText>
        </InputGroupAddon>
      </InputGroup>

      <InputGroup>
        <InputGroupInput type="email" placeholder="Enter your email" />
        <InputGroupAddon>
          <InputGroupButton size="icon-xs">
            <Mail className="size-4" />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  ),
};

export const CreditCardInput: Story = {
  render: () => (
    <div className="w-full max-w-sm space-y-4">
      <InputGroup>
        <InputGroupAddon>
          <CreditCard className="size-4" />
        </InputGroupAddon>
        <InputGroupInput placeholder="1234 5678 9012 3456" />
        <InputGroupAddon>
          <InputGroupButton size="icon-xs" variant="ghost">
            <Check className="size-3 text-green-500" />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  ),
};

export const WithCopyButton: Story = {
  render: function CopyInput() {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
      navigator.clipboard.writeText('https://tacobot.com/oauth/client-123');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <div className="w-full max-w-sm space-y-4">
        <InputGroup>
          <InputGroupInput value="https://tacobot.com/oauth/client-123" readOnly />
          <InputGroupAddon>
            <InputGroupButton size="icon-xs" variant="ghost" onClick={handleCopy}>
              {copied ? <Check className="size-4 text-green-500" /> : <Copy className="size-4" />}
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </div>
    );
  },
};

export const TextareaWithButtons: Story = {
  render: () => (
    <div className="w-full max-w-md space-y-4">
      <InputGroup>
        <InputGroupTextarea placeholder="Ask a question about tacos..." className="min-h-[80px]" />
        <InputGroupAddon align="block-end">
          <InputGroupButton variant="secondary" size="sm">
            Send
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  ),
};

export const MultipleAddons: Story = {
  render: () => (
    <div className="w-full max-w-sm space-y-4">
      <InputGroup>
        <InputGroupAddon>
          <InputGroupText>$</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput placeholder="0.00" />
        <InputGroupAddon>
          <InputGroupText>USD</InputGroupText>
        </InputGroupAddon>
        <InputGroupAddon>
          <InputGroupButton size="icon-xs">
            <Check className="size-4 text-green-500" />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  ),
};

export const Alignments: Story = {
  render: () => (
    <div className="w-full max-w-sm space-y-4">
      <InputGroup>
        <InputGroupAddon>
          <Search className="size-4" />
        </InputGroupAddon>
        <InputGroupInput placeholder="Search..." />
        <InputGroupAddon align="inline-end">
          <InputGroupText>12 results</InputGroupText>
        </InputGroupAddon>
      </InputGroup>

      <InputGroup>
        <InputGroupTextarea placeholder="Type a message..." className="min-h-[60px]" />
        <InputGroupAddon align="block-end">
          <InputGroupText className="text-xs">120 chars left</InputGroupText>
          <InputGroupButton size="sm">Send</InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  ),
};
