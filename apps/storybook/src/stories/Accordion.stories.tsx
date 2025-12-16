import type { Meta, StoryObj } from '@storybook/react-vite';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@tacocrew/ui-kit';

const meta = {
  title: 'UI Kit/Accordion',
  component: Accordion,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Collapsible accordion component for organizing content into expandable sections. Built on Radix UI for full keyboard navigation and accessibility.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['single', 'multiple'],
      description: 'Whether one or multiple items can be open at once',
    },
    collapsible: {
      control: 'boolean',
      description: 'Allow all items to be closed (only for type="single")',
    },
  },
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

// Main story - single collapsible accordion
export const Default: Story = {
  args: {
    type: 'single',
    collapsible: true,
  },
  render: () => (
    <Accordion type="single" collapsible className="w-full max-w-2xl">
      <AccordionItem value="item-1">
        <AccordionTrigger>What is TacoCrew?</AccordionTrigger>
        <AccordionContent>
          TacoCrew is a comprehensive taco ordering platform that makes it easy to coordinate group
          orders, manage delivery preferences, and track your favorite taco spots.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>How do I place a group order?</AccordionTrigger>
        <AccordionContent>
          Simply create a new order, invite your team members, and everyone can add their
          preferences. The system automatically consolidates orders and handles payment splitting.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Is delivery tracking included?</AccordionTrigger>
        <AccordionContent>
          Yes! Track your order in real-time from preparation to delivery. You'll receive
          notifications at each step of the process.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

// Multiple items can be open simultaneously
export const Multiple: Story = {
  args: {
    type: 'multiple',
  },
  render: () => (
    <Accordion type="multiple" className="w-full max-w-2xl">
      <AccordionItem value="item-1">
        <AccordionTrigger>Order Management</AccordionTrigger>
        <AccordionContent>
          Create, edit, and manage all your taco orders in one place. Set delivery windows,
          coordinate with team members, and track order history.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Payment Options</AccordionTrigger>
        <AccordionContent>
          We support multiple payment methods including credit cards, digital wallets, and team
          billing. Split costs automatically or designate a single payer.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Customization</AccordionTrigger>
        <AccordionContent>
          Customize your tacos with dozens of toppings, sauces, and sides. Save your favorite
          combinations for quick reordering.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

// FAQ Example
export const FAQ: Story = {
  args: {
    type: 'single',
    collapsible: true,
  },
  render: () => (
    <div className="w-full max-w-3xl space-y-6">
      <div>
        <h2 className="mb-2 font-bold text-2xl">Frequently Asked Questions</h2>
        <p className="text-slate-400 text-sm">Find answers to common questions about TacoCrew</p>
      </div>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="faq-1">
          <AccordionTrigger>What areas do you deliver to?</AccordionTrigger>
          <AccordionContent>
            We currently deliver to the San Francisco Bay Area, Los Angeles, San Diego, Austin, and
            Portland. We're constantly expanding to new cities based on demand.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="faq-2">
          <AccordionTrigger>Are there minimum order requirements?</AccordionTrigger>
          <AccordionContent>
            Minimum orders vary by restaurant partner. Typically, individual orders start at $10,
            while group orders have a $30 minimum. Check the specific restaurant page for details.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="faq-3">
          <AccordionTrigger>Can I schedule orders in advance?</AccordionTrigger>
          <AccordionContent>
            Absolutely! You can schedule orders up to 7 days in advance. This is especially useful
            for team lunches and catering needs.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="faq-4">
          <AccordionTrigger>What if I have dietary restrictions?</AccordionTrigger>
          <AccordionContent>
            All menu items are clearly labeled with allergen information and dietary tags
            (vegetarian, vegan, gluten-free, etc.). You can filter options based on your
            preferences.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="faq-5">
          <AccordionTrigger>How does group payment work?</AccordionTrigger>
          <AccordionContent>
            You can choose to split the bill evenly, have each person pay for their own items, or
            designate one person to cover the entire order. Payment is processed securely through
            our platform.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  ),
};

// With Rich Content
export const RichContent: Story = {
  args: {
    type: 'single',
    collapsible: true,
  },
  render: () => (
    <Accordion type="single" collapsible className="w-full max-w-2xl">
      <AccordionItem value="item-1">
        <AccordionTrigger>Premium Features</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-3">
            <p className="text-slate-300 text-sm">
              Upgrade to TacoCrew Premium for exclusive benefits:
            </p>
            <ul className="space-y-2 text-slate-400 text-sm">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-emerald-500">✓</span>
                <span>Free delivery on orders over $25</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-emerald-500">✓</span>
                <span>Priority customer support</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-emerald-500">✓</span>
                <span>Early access to new restaurant partners</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-emerald-500">✓</span>
                <span>Monthly rewards and exclusive discounts</span>
              </li>
            </ul>
          </div>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Team Plans</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2">
            <p className="text-slate-300 text-sm">
              Perfect for offices and organizations. Starting at $99/month for teams of 10+:
            </p>
            <div className="mt-3 rounded-lg bg-slate-800/40 p-4">
              <h4 className="mb-2 font-semibold">Enterprise Benefits</h4>
              <p className="text-slate-400 text-xs">
                Centralized billing, custom menus, dedicated account manager, and analytics
                dashboard to track team ordering patterns.
              </p>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

// Controlled Example (with default value)
export const DefaultOpen: Story = {
  args: {
    type: 'single',
    collapsible: true,
    defaultValue: 'item-2',
  },
  render: () => (
    <Accordion type="single" collapsible defaultValue="item-2" className="w-full max-w-2xl">
      <AccordionItem value="item-1">
        <AccordionTrigger>Getting Started</AccordionTrigger>
        <AccordionContent>
          Create your account and browse our partner restaurants to get started with your first
          order.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>This item is open by default</AccordionTrigger>
        <AccordionContent>
          Notice how this section is expanded when the page loads. This is achieved using the
          defaultValue prop on the Accordion component.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Advanced Features</AccordionTrigger>
        <AccordionContent>
          Explore scheduling, group orders, and premium features to get the most out of TacoCrew.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};
