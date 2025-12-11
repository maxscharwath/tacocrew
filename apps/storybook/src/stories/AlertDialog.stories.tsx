import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
} from '@tacobot/ui-kit';

const meta = {
  title: 'UI Kit/AlertDialog',
  component: AlertDialog,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Blocking confirmation dialog built with Radix primitives and TacoBot styles.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof AlertDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

// Main story - default dialog
export const Default: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button>Pause submissions</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Mettre en pause ?</AlertDialogTitle>
          <AlertDialogDescription>
            Les participants ne pourront plus modifier leurs commandes tant que la pause est active.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction>Mettre en pause</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
};

// Showcase story - different dialog types
export const Showcase: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="space-y-3">
        <h2 className="font-semibold text-lg text-white">Default Action</h2>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button>Pause submissions</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Mettre en pause ?</AlertDialogTitle>
              <AlertDialogDescription>
                Les participants ne pourront plus modifier leurs commandes tant que la pause est
                active.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction>Mettre en pause</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold text-lg text-white">Destructive Action</h2>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Delete group order</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer la commande ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action supprimera la commande groupée et toutes les contributions associées.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction variant="destructive">Supprimer</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  ),
};
