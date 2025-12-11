import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, Tooltip, TooltipContent, TooltipTrigger } from '@tacobot/ui-kit';
import { Info } from 'lucide-react';

const meta = {
  title: 'UI Kit/Tooltip',
  component: Tooltip,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

// Main story - simple tooltip
export const Default: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline">Hover me</Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>This is a tooltip</p>
      </TooltipContent>
    </Tooltip>
  ),
};

// Showcase story - different tooltip patterns
export const Showcase: Story = {
  render: () => (
    <div className="space-y-8">
      <div className="space-y-3">
        <h2 className="font-semibold text-lg text-white">Basic Tooltip</h2>
        <div className="flex flex-wrap gap-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline">Hover me</Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>This is a helpful tooltip</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold text-lg text-white">With Icon</h2>
        <div className="flex flex-wrap gap-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-xs">
                <Info size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Click for more information</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold text-lg text-white">Different Positions</h2>
        <div className="flex flex-wrap gap-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline">Top</Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Tooltip on top</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline">Right</Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Tooltip on right</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline">Bottom</Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Tooltip on bottom</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline">Left</Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Tooltip on left</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  ),
};
