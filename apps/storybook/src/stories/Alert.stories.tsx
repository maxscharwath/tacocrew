import type { Meta, StoryObj } from '@storybook/react-vite';
import { Alert } from '@tacocrew/ui-kit';

const meta = {
  title: 'UI Kit/Alert',
  component: Alert,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    tone: {
      control: 'select',
      options: ['error', 'success', 'warning', 'info'],
      description: 'The tone/color variant of the alert',
    },
    title: {
      control: 'text',
      description: 'Optional title for the alert',
    },
  },
  args: {
    tone: 'info',
    title: 'Information',
    children: 'This is an alert message.',
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

// Main story - use controls panel to explore all options
export const Default: Story = {};

// Showcase story - all tones for reference
export const AllTones: Story = {
  render: () => {
    const tones = ['error', 'success', 'warning', 'info'] as const;
    const titles = {
      error: 'Error',
      success: 'Success',
      warning: 'Warning',
      info: 'Information',
    };
    const messages = {
      error: 'An error has occurred. Please try again.',
      success: 'Operation completed successfully!',
      warning: 'Please review this warning message.',
      info: 'This is an informational alert message.',
    };

    return (
      <div className="space-y-4">
        {tones.map((tone) => (
          <Alert key={tone} tone={tone} title={titles[tone]}>
            {messages[tone]}
          </Alert>
        ))}
      </div>
    );
  },
};
