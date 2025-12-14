import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tacocrew/ui-kit';

const meta = {
  title: 'UI Kit/Card',
  component: Card,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

// Main story - use controls panel to explore all options
export const Default: Story = {
  render: () => (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Taco Lovers</CardTitle>
        <CardDescription>Plan your next group order in seconds.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-slate-300 text-sm">
          Coordinate toppings, delivery windows, and payment preferences without leaving the app.
        </p>
      </CardContent>
    </Card>
  ),
};
