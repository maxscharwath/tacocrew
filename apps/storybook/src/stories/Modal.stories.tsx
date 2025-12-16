import type { Meta, StoryObj } from '@storybook/react-vite';
import { action } from 'storybook/actions';
import { Button, Modal } from '@tacocrew/ui-kit';
import React, { useState } from 'react';

const meta = {
  title: 'UI Kit/Modal',
  component: Modal,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Modal title',
    },
    description: {
      control: 'text',
      description: 'Modal description',
    },
  },
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

// Stateful wrapper component for modal stories
function ModalDemo(props: React.ComponentProps<typeof Modal>) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-4">
      <Button onClick={() => setOpen(true)}>Open modal</Button>
      <Modal
        {...props}
        isOpen={open}
        onClose={() => setOpen(false)}
        title={props.title || 'Schedule delivery'}
        description={props.description || 'Pick a time slot for your crew.'}
      >
        <p className="text-slate-300 text-sm">
          11:30 AM - 1:00 PM slots usually fill up fast on Fridays. Consider earlier pickup if you
          have a large order.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => setOpen(false)}>Confirm</Button>
        </div>
      </Modal>
    </div>
  );
}

export const Default: Story = {
  render: (args: React.ComponentProps<typeof Modal>) => <ModalDemo {...args} />,
  args: {
    isOpen: false,
    onClose: action('on-close'),
    title: 'Schedule delivery',
    description: 'Pick a time slot for your crew.',
    children: null,
  },
};
