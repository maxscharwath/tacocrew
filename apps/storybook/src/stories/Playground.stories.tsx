import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Alert,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Avatar,
  AvatarLabelGroup,
  Badge,
  Button,
  ButtonGroup,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  DateTimePicker,
  Divider,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  EmptyState,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Label,
  Modal,
  PhoneInput,
  SegmentedControl,
  SegmentedControlItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Skeleton,
  StatusBadge,
  Switch,
  Textarea,
  Toaster,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  toast,
} from '@tacocrew/ui-kit';
import {
  BellRing,
  CheckCircle2,
  Clock3,
  CreditCard,
  Edit,
  Mail,
  MapPin,
  MoreVertical,
  Plus,
  Search,
  Settings,
  Trash2,
  Truck,
  Users,
  Wallet,
} from 'lucide-react';
import { useState } from 'react';

const PlaygroundDemo = () => null;

const meta = {
  title: 'Playground',
  component: PlaygroundDemo,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
  },
} satisfies Meta<typeof PlaygroundDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

const PARTICIPANTS = [
  {
    id: '1',
    name: 'Max Schneider',
    subtitle: '2 tacos · extra guac',
    color: 'brand',
    status: 'Paid',
  },
  {
    id: '2',
    name: 'Camille Martin',
    subtitle: 'Veggie special',
    color: 'emerald',
    status: 'Waiting',
  },
  {
    id: '3',
    name: 'Rafael Lopez',
    subtitle: '3 tacos · 1 horchata',
    color: 'rose',
    status: 'Paid',
  },
  {
    id: '4',
    name: 'Lina Baumann',
    subtitle: '1 burrito · 1 agua fresca',
    color: 'violet',
    status: 'Waiting',
  },
] as const;

function PlaygroundContent() {
  const [status, setStatus] = useState<
    'draft' | 'pending' | 'active' | 'submitted' | 'completed' | 'closed'
  >('active');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [date, setDate] = useState('2025-03-15');
  const [time, setTime] = useState('18:30');
  const [phone, setPhone] = useState('');
  const [notifications, setNotifications] = useState(true);
  const [marketing, setMarketing] = useState(false);
  const [mysteryMode, setMysteryMode] = useState(false);
  const [autoSubmit, setAutoSubmit] = useState(true);

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 px-6 py-10 text-white">
      <Toaster />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        {/* Header Section */}
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Avatar size="xl" variant="elevated" color="brandHero">
              <Users />
            </Avatar>
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-[0.4em]">Group order</p>
              <h1 className="font-semibold text-2xl text-white">Taco Tuesday crew</h1>
              <div className="mt-1 flex items-center gap-2">
                <StatusBadge status={status} />
                <Badge tone="brand" pill>
                  24 participants
                </Badge>
              </div>
            </div>
          </div>
          <ButtonGroup className="w-full max-w-md">
            <Input placeholder="Search orders..." className="flex-1" />
            <Button variant="outline">
              <Search size={16} />
            </Button>
          </ButtonGroup>
          <ButtonGroup>
            <Button variant="outline">
              <Settings size={16} />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <MoreVertical size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowModal(true)}>
                  <Edit size={16} />
                  Edit Order
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Users size={16} />
                  Manage Participants
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowDeleteDialog(true)}>
                  <Trash2 size={16} />
                  Delete Order
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button color="emerald">
              <Plus size={16} />
              Submit
            </Button>
          </ButtonGroup>
        </header>

        {/* Alerts Section */}
        <div className="grid gap-4 md:grid-cols-2">
          <Alert tone="info" title="Delivery ETA">
            Kitchen prepping at 12:15 · Driver leaves at 12:40.
          </Alert>
          <Alert tone="success" title="Payment Complete">
            All participants have been reimbursed successfully.
          </Alert>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Order Status Card */}
            <Card>
              <CardHeader>
                <CardTitle>Order Status</CardTitle>
                <CardDescription>Manage order lifecycle and participant actions.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Label>Status</Label>
                  <Select
                    value={status}
                    onValueChange={(value) => setStatus(value as typeof status)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
                <div className="flex items-center gap-3">
                  <Label>View Mode</Label>
                  <SegmentedControl
                    value={viewMode}
                    onValueChange={(value) => setViewMode(value as 'list' | 'grid')}
                  >
                    <SegmentedControlItem value="list">List</SegmentedControlItem>
                    <SegmentedControlItem value="grid">Grid</SegmentedControlItem>
                  </SegmentedControl>
                </div>
                <Divider />
                <div className="flex flex-wrap gap-3">
                  <Button>Lock Submissions</Button>
                  <Button variant="outline">Send Reminder</Button>
                  <Button variant="ghost">Export Data</Button>
                </div>
              </CardContent>
            </Card>

            {/* Participants Card */}
            <Card>
              <CardHeader>
                <CardTitle>Participants</CardTitle>
                <CardDescription>Manage team members and their orders.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {PARTICIPANTS.map((participant) => (
                  <div key={participant.id} className="flex items-center justify-between gap-3">
                    <AvatarLabelGroup
                      size="md"
                      color={participant.color}
                      title={participant.name}
                      subtitle={participant.subtitle}
                    >
                      {participant.name
                        .split(' ')
                        .map((segment) => segment[0])
                        .slice(0, 2)
                        .join('')}
                    </AvatarLabelGroup>
                    <div className="flex items-center gap-2">
                      <Badge tone={participant.status === 'Paid' ? 'success' : 'warning'} pill>
                        {participant.status}
                      </Badge>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical size={14} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>More options</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                ))}
                <Separator />
                <Button variant="ghost" className="w-full border border-white/20 border-dashed">
                  <Users size={16} />
                  Add participant
                </Button>
              </CardContent>
            </Card>

            {/* Form Section */}
            <Card>
              <CardHeader>
                <CardTitle>Delivery Preferences</CardTitle>
                <CardDescription>
                  Configure delivery settings and contact information.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="contact" required>
                    Team Contact
                  </Label>
                  <InputGroup>
                    <InputGroupAddon>
                      <Mail size={16} />
                    </InputGroupAddon>
                    <InputGroupInput id="contact" placeholder="Slack handle or email" />
                  </InputGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" required>
                    Phone Number
                  </Label>
                  <PhoneInput id="phone" value={phone} onChange={setPhone} defaultCountry="CH" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="delivery-type">Delivery Type</Label>
                  <Select defaultValue="pickup">
                    <SelectTrigger id="delivery-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pickup">Pickup at Lausanne HQ</SelectItem>
                      <SelectItem value="delivery">Deliver to Avenue d'Echallens 82</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pickup-time">Pickup Window</Label>
                  <DateTimePicker
                    label=""
                    dateValue={date}
                    timeValue={time}
                    onDateChange={setDate}
                    onTimeChange={setTime}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Delivery Address</Label>
                  <InputGroup>
                    <InputGroupAddon>
                      <MapPin size={16} />
                    </InputGroupAddon>
                    <InputGroupInput id="address" placeholder="Street address" />
                  </InputGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="search-participant">Search Participant</Label>
                  <ButtonGroup className="w-full">
                    <Input id="search-participant" placeholder="Type to search..." />
                    <Button variant="outline">
                      <Search size={16} />
                    </Button>
                  </ButtonGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes for Driver</Label>
                  <Textarea id="notes" rows={4} placeholder="Special instructions..." />
                </div>

                <Divider label="Preferences" />

                <div className="space-y-3">
                  <Switch
                    label="Enable notifications"
                    checked={notifications}
                    onCheckedChange={setNotifications}
                  />
                  <Switch
                    label="Receive marketing emails"
                    checked={marketing}
                    onCheckedChange={setMarketing}
                    color="rose"
                  />
                  <Switch
                    label="Mystery taco mode"
                    checked={mysteryMode}
                    onCheckedChange={setMysteryMode}
                    color="violet"
                  />
                  <Switch
                    label="Auto-submit when ready"
                    checked={autoSubmit}
                    onCheckedChange={setAutoSubmit}
                    color="emerald"
                  />
                </div>

                <Button fullWidth color="emerald">
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Summary Card */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
                <CardDescription>Financial breakdown and payment status.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-slate-300 text-sm">
                  <div className="flex justify-between">
                    <span>Tacos & bowls</span>
                    <span className="font-semibold text-white">CHF 182.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Drinks & extras</span>
                    <span className="font-semibold text-white">CHF 42.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery fee</span>
                    <span className="font-semibold text-white">CHF 18.00</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-base text-white">
                    <span>Total due</span>
                    <span>CHF 242.00</span>
                  </div>
                </div>
                <Badge tone="brand" pill className="w-full justify-center">
                  <Wallet size={14} />
                  18 CHF split between 24 people
                </Badge>
                <Button fullWidth variant="outline">
                  <CreditCard size={16} />
                  Collect Payments
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks and shortcuts.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  fullWidth
                  variant="ghost"
                  className="justify-start border border-white/15"
                  onClick={() => toast.info('Reminder sent to all participants')}
                >
                  <BellRing size={16} />
                  Send Reminder
                </Button>
                <Button
                  fullWidth
                  variant="ghost"
                  className="justify-start border border-white/15"
                  onClick={() => toast.success('Receipt exported successfully')}
                >
                  <Truck size={16} />
                  Export Receipt
                </Button>
                <Button
                  fullWidth
                  variant="ghost"
                  className="justify-start border border-white/15"
                  onClick={() => toast.warning('Schedule courier feature coming soon')}
                >
                  <Clock3 size={16} />
                  Schedule Courier
                </Button>
              </CardContent>
            </Card>

            {/* Empty State Example */}
            <Card>
              <CardContent className="pt-6">
                <EmptyState
                  icon={CheckCircle2}
                  title="All caught up!"
                  description="No pending actions required at this time."
                  action={
                    <Button variant="outline" size="sm">
                      View History
                    </Button>
                  }
                />
              </CardContent>
            </Card>

            {/* Skeleton Loading Example */}
            <Card>
              <CardHeader>
                <CardTitle>Loading State</CardTitle>
                <CardDescription>Example of skeleton loaders.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton variant="circular" className="h-10 w-10" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal Example */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Edit Group Order"
        description="Update order details and settings."
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="order-name" required>
              Order Name
            </Label>
            <Input id="order-name" defaultValue="Taco Tuesday crew" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="order-description">Description</Label>
            <Textarea id="order-description" rows={3} placeholder="Optional description..." />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowModal(false)}>Save Changes</Button>
          </div>
        </div>
      </Modal>

      {/* Alert Dialog Example */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Group Order?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the group order and all
              associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                setShowDeleteDialog(false);
                toast.error('Order deleted');
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export const KitchenSink: Story = {
  render: () => <PlaygroundContent />,
};
