import type { Meta, StoryObj } from '@storybook/react-vite';
import { DateTimePicker } from '@tacocrew/ui-kit';
import { useState } from 'react';

const meta = {
  title: 'UI Kit/DateTimePicker',
  component: DateTimePicker,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'Label for the date time picker',
    },
  },
} satisfies Meta<typeof DateTimePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

// Main story - use controls panel to explore all options
export const Default: Story = {
  render: (args) => {
    const [date, setDate] = useState('2025-03-15');
    const [time, setTime] = useState('18:30');

    return (
      <DateTimePicker
        label={args.label || 'Pickup window'}
        dateValue={date}
        timeValue={time}
        onDateChange={setDate}
        onTimeChange={setTime}
      />
    );
  },
  args: {
    label: 'Pickup window',
  },
};
