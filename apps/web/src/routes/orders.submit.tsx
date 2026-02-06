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
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Label,
} from '@tacocrew/ui-kit';
import { Lock, Send, Truck } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type LoaderFunctionArgs, useLoaderData, useNavigate, useParams } from 'react-router';
import { DeliveryFormFields } from '@/components/orders/DeliveryFormFields';
import { OrderConfirmationModal } from '@/components/orders/OrderConfirmationModal';
import { PreferencesSection } from '@/components/orders/PreferencesSection';
import { ProfileManager } from '@/components/orders/ProfileManager';
import { BackButton } from '@/components/shared';
import { useDeliveryForm } from '@/hooks/useDeliveryForm';
import { useDeveloperMode } from '@/hooks/useDeveloperMode';
import { useDeliveryProfiles, useGroupOrderWithOrders, useSubmitGroupOrder } from '@/lib/api';
import { routes } from '@/lib/routes';
import { requireParam } from '@/lib/utils/param-validators';

export function orderSubmitLoader({ params }: LoaderFunctionArgs) {
  const groupOrderId = requireParam(params, 'orderId', 'Order not found');
  return Response.json({ groupOrderId });
}

export function OrderSubmitRoute() {
  // ALL HOOKS MUST BE CALLED HERE UNCONDITIONALLY - BEFORE ANY CONDITIONAL LOGIC
  const { t } = useTranslation();
  const { groupOrderId } = useLoaderData<{ groupOrderId: string }>();
  const params = useParams();
  const navigate = useNavigate();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [submitError, setSubmitError] = useState<{ message: string } | null>(null);
  const [dryRun, setDryRun] = useState(false);
  const { isEnabled: isDeveloperMode } = useDeveloperMode();
  const [showDeleteProfileDialog, setShowDeleteProfileDialog] = useState(false);
  const submitMutation = useSubmitGroupOrder();

  const groupOrderQuery = useGroupOrderWithOrders(groupOrderId);
  const deliveryProfilesQuery = useDeliveryProfiles();

  // Initialize form with data from queries (even if loading)
  const deliveryProfiles = deliveryProfilesQuery.data ?? [];
  const form = useDeliveryForm({ initialProfiles: deliveryProfiles });

  // Handle loading and error states AFTER all hooks
  if (groupOrderQuery.isLoading || deliveryProfilesQuery.isLoading) {
    return <div>Loading...</div>;
  }

  if (groupOrderQuery.error || deliveryProfilesQuery.error) {
    throw new Response('Failed to load data', { status: 500 });
  }

  if (!groupOrderQuery.data) {
    throw new Response('Order not found', { status: 404 });
  }

  const { userOrders } = groupOrderQuery.data;

  const participantText =
    userOrders.length === 0
      ? t('orders.submit.hero.participants.none')
      : t('orders.submit.hero.participants.count', { count: userOrders.length });

  const handleCloseConfirmation = () => {
    setShowConfirmation(false);
    navigate(routes.root.orderDetail({ orderId: groupOrderId }));
  };

  const handleDeleteProfile = () => {
    if (!form.selectedProfileId) {
      return;
    }
    setShowDeleteProfileDialog(true);
  };

  const handleConfirmDeleteProfile = async () => {
    setShowDeleteProfileDialog(false);
    await form.handleDeleteProfile();
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    form.form.handleSubmit(async (data) => {
      setSubmitError(null);
      try {
        await submitMutation.mutateAsync({
          groupOrderId,
          body: {
            customer: {
              name: data.customerName,
              phone: data.customerPhone,
            },
            delivery: {
              type: data.deliveryType,
              address: {
                road: data.road,
                house_number: data.houseNumber,
                postcode: data.postcode,
                city: data.city,
                state: data.stateRegion,
                country: 'CH',
              },
              requestedFor: data.requestedFor,
            },
            paymentMethod: data.paymentMethod,
            dryRun,
          },
        });
        setShowConfirmation(true);
      } catch (error) {
        setSubmitError({
          message: error instanceof Error ? error.message : 'Failed to submit order',
        });
      }
    })();
  };

  return (
    <div className="space-y-8">
      <BackButton
        to={routes.root.orderDetail({ orderId: params.orderId ?? '' })}
        label={t('orders.submit.navigation.back')}
      />

      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-amber-500/10 via-slate-900/80 to-slate-950/90 p-8">
        <div className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-amber-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-12 h-60 w-60 rounded-full bg-rose-500/20 blur-3xl" />
        <div className="relative space-y-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-linear-to-br from-amber-400 via-amber-500 to-rose-500">
              <Lock size={24} className="text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-2xl text-white tracking-tight">
                {t('orders.submit.hero.title')}
              </h1>
              <p className="text-slate-300 text-sm">{t('orders.submit.hero.description')}</p>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
            <p className="text-slate-400 text-xs uppercase tracking-[0.2em]">
              {t('orders.submit.hero.participants.label')}
            </p>
            <p className="mt-2 font-semibold text-2xl text-white">{userOrders.length}</p>
            <p className="mt-1 text-slate-400 text-xs">{participantText}</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="gap-2">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-linear-to-br from-amber-400 via-amber-500 to-rose-500">
              <Truck size={20} className="text-white" />
            </div>
            <div>
              <CardTitle className="text-white">{t('orders.submit.form.title')}</CardTitle>
              <CardDescription>{t('orders.submit.form.description')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFormSubmit} className="space-y-4 sm:space-y-6">
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)] lg:items-start xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
              <div className="space-y-4 sm:space-y-5">
                <DeliveryFormFields form={form.form} disabled={submitMutation.isPending} />
              </div>

              <ProfileManager
                deliveryProfiles={form.deliveryProfiles}
                selectedProfileId={form.selectedProfileId}
                profileLabel={form.profileLabel}
                setProfileLabel={form.setProfileLabel}
                profileMessage={form.profileMessage}
                profileLoading={form.profileLoading}
                onProfileSelect={form.handleProfileSelect}
                onClearProfileSelection={form.handleClearProfileSelection}
                onSaveProfile={form.handleSaveProfile}
                onUpdateProfile={form.handleUpdateProfile}
                onDeleteProfile={handleDeleteProfile}
                disabled={submitMutation.isPending}
              />
            </div>

            <PreferencesSection form={form.form} disabled={submitMutation.isPending} />

            <Alert
              tone="warning"
              className="mt-4 border-amber-400/40 bg-amber-500/10 text-amber-100"
            >
              {t('orders.submit.reminder.body')}
            </Alert>

            {isDeveloperMode && (
              <label htmlFor="dryRun" className="block cursor-pointer">
                <Alert tone="warning" hideIcon className="cursor-pointer">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="dryRun"
                      checked={dryRun}
                      onChange={(e) => setDryRun(e.currentTarget.checked)}
                      disabled={submitMutation.isPending}
                      color="amber"
                      className="mt-0.5"
                    />
                    <div className="flex-1 space-y-1">
                      <Label
                        htmlFor="dryRun"
                        className="cursor-pointer font-medium text-amber-100 text-sm"
                      >
                        Dry Run Mode (Developer)
                      </Label>
                      <p className="text-amber-100/80 text-xs">
                        Skip actual submission to external backend. Creates session and cart for
                        testing cookie injection.
                      </p>
                    </div>
                  </div>
                </Alert>
              </label>
            )}

            {submitError ? <Alert tone="error">{submitError.message}</Alert> : null}

            <div className="flex flex-wrap items-center gap-4">
              <BackButton
                to={routes.root.orderDetail({ orderId: params.orderId ?? '' })}
                label={t('orders.submit.form.actions.cancel')}
              />
              <Button
                type="submit"
                loading={submitMutation.isPending}
                disabled={submitMutation.isPending}
                variant="default"
                className="gap-2 shadow-[0_10px_35px_rgba(59,130,246,0.35)]"
              >
                <Send size={16} />
                {t('orders.submit.form.actions.submit')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <OrderConfirmationModal isOpen={showConfirmation} onClose={handleCloseConfirmation} />

      {/* Delete Profile Confirmation Dialog */}
      <AlertDialog open={showDeleteProfileDialog} onOpenChange={setShowDeleteProfileDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('orders.submit.saved.delete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('orders.submit.saved.confirmDelete')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={form.profileLoading}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleConfirmDeleteProfile}
              disabled={form.profileLoading}
            >
              {t('orders.submit.saved.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
