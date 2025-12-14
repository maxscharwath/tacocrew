import type { Meta, StoryObj } from '@storybook/react-vite';
import { MultiSelect, Select } from '@tacocrew/ui-kit';

const meta = {
  title: 'UI Kit/Select',
  component: Select,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    disabled: {
      control: 'boolean',
      description: 'Whether the select is disabled',
    },
  },
  args: {
    children: (
      <>
        <option value="al-pastor">Al Pastor</option>
        <option value="barbacoa">Barbacoa</option>
        <option value="carnitas">Carnitas</option>
      </>
    ),
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

// Main story - use controls panel to explore all options
export const Default: Story = {};

// Showcase story - different select patterns
export const Showcase: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="space-y-3">
        <h2 className="font-semibold text-lg text-white">With Placeholder</h2>
        <Select defaultValue="">
          <option value="" disabled>
            Choose a filling
          </option>
          <option value="pollo">Pollo</option>
          <option value="veg">Veggie</option>
        </Select>
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold text-lg text-white">Multiple Selection</h2>
        <MultiSelect defaultValue={['chips']} multiple aria-label="Sides">
          <option value="chips">Chips & salsa</option>
          <option value="queso">Queso</option>
          <option value="guac">Guacamole</option>
        </MultiSelect>
      </div>
    </div>
  ),
};
