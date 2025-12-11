import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, Toaster, toast } from '@tacobot/ui-kit';

const meta = {
  title: 'UI Kit/Toast',
  component: Toaster,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

// Main story - interactive toast demo
export const Default: Story = {
  render: () => {
    return (
      <div className="space-y-4">
        <Toaster />
        <div className="space-y-3">
          <h2 className="font-semibold text-lg text-white">Toast Types</h2>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => {
                toast.success('Order submitted successfully!');
              }}
            >
              Success Toast
            </Button>
            <Button
              onClick={() => {
                toast.error('Failed to submit order');
              }}
            >
              Error Toast
            </Button>
            <Button
              onClick={() => {
                toast.warning('Order is about to expire');
              }}
            >
              Warning Toast
            </Button>
            <Button
              onClick={() => {
                toast.info('New order available');
              }}
            >
              Info Toast
            </Button>
            <Button
              onClick={() => {
                toast.loading('Processing order...');
              }}
            >
              Loading Toast
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="font-semibold text-lg text-white">With Title and Description</h2>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => {
                toast.success('Order Submitted', {
                  description:
                    'Your order has been successfully submitted and will be processed shortly.',
                });
              }}
            >
              Toast with Description
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="font-semibold text-lg text-white">With Action</h2>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => {
                toast('Order created', {
                  description: 'Your order has been created successfully.',
                  action: {
                    label: 'View Order',
                    onClick: () => {
                      toast.info('Opening order...');
                    },
                  },
                });
              }}
            >
              Toast with Action
            </Button>
          </div>
        </div>
      </div>
    );
  },
};
