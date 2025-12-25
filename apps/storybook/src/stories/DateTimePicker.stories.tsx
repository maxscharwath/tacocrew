import type { Meta, StoryObj } from '@storybook/react-vite';
import { DateTimePicker } from '@tacocrew/ui-kit';
import { action } from 'storybook/actions';

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
    disabled: {
      control: 'boolean',
      description: 'Whether the date time picker is disabled',
    },
    required: {
      control: 'boolean',
      description: 'Whether the field is required',
    },
  },
  args: {
    label: 'Pickup window',
    dateValue: '2025-03-15',
    timeValue: '18:30',
    onDateChange: action('on-date-change'),
    onTimeChange: action('on-time-change'),
  },
} satisfies Meta<typeof DateTimePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

// Main story - use controls panel to explore all options
export const Default: Story = {};
