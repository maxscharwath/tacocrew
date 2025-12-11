import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from '@tacobot/ui-kit';
import { FilterIcon } from 'lucide-react';

const meta = {
  title: 'UI Kit/ButtonGroup',
  component: ButtonGroup,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'ButtonGroup component for grouping related buttons together. Supports horizontal and vertical orientations with optional separators and text labels.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
      description: 'The layout direction of the button group',
    },
  },
} satisfies Meta<typeof ButtonGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

// Main story - use controls panel to explore all options
export const Default: Story = {
  render: (args) => (
    <ButtonGroup {...args}>
      <Button variant="outline">Left</Button>
      <Button variant="outline">Middle</Button>
      <Button variant="outline">Right</Button>
    </ButtonGroup>
  ),
};

// Showcase story - common patterns
export const Showcase: Story = {
  render: () => (
    <div className="space-y-8">
      <div className="space-y-3">
        <h2 className="font-semibold text-lg text-white">Horizontal</h2>
        <ButtonGroup>
          <Button variant="outline">Left</Button>
          <Button variant="outline">Middle</Button>
          <Button variant="outline">Right</Button>
        </ButtonGroup>
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold text-lg text-white">Vertical</h2>
        <ButtonGroup orientation="vertical">
          <Button variant="outline">Top</Button>
          <Button variant="outline">Middle</Button>
          <Button variant="outline">Bottom</Button>
        </ButtonGroup>
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold text-lg text-white">With Separator</h2>
        <ButtonGroup>
          <Button variant="outline">Copy</Button>
          <ButtonGroupSeparator />
          <Button variant="outline">Paste</Button>
        </ButtonGroup>
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold text-lg text-white">With Text Label</h2>
        <ButtonGroup>
          <ButtonGroupText>Sort by:</ButtonGroupText>
          <Button variant="outline">Name</Button>
          <Button variant="outline">Date</Button>
          <Button variant="outline">Size</Button>
        </ButtonGroup>
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold text-lg text-white">With Text and Icon</h2>
        <ButtonGroup>
          <ButtonGroupText>
            <FilterIcon className="size-4" />
            Filter
          </ButtonGroupText>
          <Button variant="outline">Active</Button>
          <Button variant="outline">Completed</Button>
          <Button variant="outline">All</Button>
        </ButtonGroup>
      </div>
    </div>
  ),
};
