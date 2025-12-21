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
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Form,
  type LoaderFunctionArgs,
  useActionData,
  useLoaderData,
  useNavigate,
  useNavigation,
  useParams,
} from 'react-router';
import { DeliveryFormFields } from '@/components/orders/DeliveryFormFields';
import { OrderConfirmationModal } from '@/components/orders/OrderConfirmationModal';
import { PreferencesSection } from '@/components/orders/PreferencesSection';
import { ProfileManager } from '@/components/orders/ProfileManager';
import { BackButton } from '@/components/shared';
import { SWITZERLAND_COUNTRY } from '@/constants/location';
import { useDeliveryForm } from '@/hooks/useDeliveryForm';
import { useDeveloperMode } from '@/hooks/useDeveloperMode';
import { OrdersApi, UserApi } from '@/lib/api';
import { routes } from '@/lib/routes';
import type { DeliveryFormData } from '@/lib/types/form-data';
import type { LoaderData } from '@/lib/types/loader-types';
import { createActionHandler } from '@/lib/utils/action-handler';
import { parseFormData } from '@/lib/utils/form-data';
import { createLoader } from '@/lib/utils/loader-factory';
import { requireParam } from '@/lib/utils/param-validators';

type ActionData = {
  errorKey?: string;
  errorMessage?: string;
  errorDetails?: Record<string, unknown>;
  fieldErrors?: Record<string, string>;
  success?: boolean;
  groupOrderId?: string;
};

export const orderSubmitLoader = createLoader(
  async ({ params }: LoaderFunctionArgs) => {
    const groupOrderId = requireParam(params, 'orderId', 'Order not found');

    const [groupOrderWithUsers, deliveryProfiles] = await Promise.all([
      OrdersApi.getGroupOrderWithOrders(groupOrderId),
      UserApi.getDeliveryProfiles(),
    ]);

    return {
      groupOrder: groupOrderWithUsers.groupOrder,
      userOrders: groupOrderWithUsers.userOrders,
      deliveryProfiles,
    };
  }
);

export const orderSubmitAction = createActionHandler({
  handlers: {
    POST: async (_unused, request, params) => {
      const groupOrderId = params?.orderId;
      if (!groupOrderId) throw new Response('Order not found', { status: 404 });

      const data = await parseFormData<DeliveryFormData>(request);
      const dryRun = data.dryRun === 'on';

      if (!data.paymentMethod) {
        throw new Response('Payment method is required', { status: 400 });
      }

      await OrdersApi.submitGroupOrder(groupOrderId, {
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
            state: data.state,
            country: SWITZERLAND_COUNTRY,
          },
          requestedFor: data.requestedFor,
        },
        paymentMethod: data.paymentMethod,
        dryRun,
      });
    },
  },
  getFormName: () => 'submit',
  onSuccess: (_request, params) => {
    const groupOrderId = params.orderId;
    if (!groupOrderId) throw new Response('Order not found', { status: 404 });
    return Response.json({
      success: true,
      groupOrderId,
    });
  },
});

/**
 * Map API field paths to user-friendly field names
 */
function getFieldLabel(fieldPath: string, t: ReturnType<typeof useTranslation>['t']): string {
  const fieldMap: Record<string, string> = {
    'customer.name': t('orders.submit.form.fields.customerName'),
    'customer.phone': t('orders.submit.form.fields.customerPhone'),
    'delivery.type': t('orders.submit.form.fields.deliveryType'),
    'delivery.address.road': t('orders.submit.form.fields.street'),
    'delivery.address.house_number': t('orders.submit.form.fields.houseNumber'),
    'delivery.address.postcode': t('orders.submit.form.fields.postcode'),
    'delivery.address.city': t('orders.submit.form.fields.city'),
    'delivery.address.state': t('orders.submit.form.fields.state'),
    'delivery.address.country': t('orders.submit.form.fields.country'),
    'delivery.requestedFor': t('orders.submit.form.fields.requestedFor'),
    paymentMethod: t('orders.submit.form.fields.paymentMethod'),
  };

  return fieldMap[fieldPath] || fieldPath;
}

export function OrderSubmitRoute() {
  const { t } = useTranslation();
  const { userOrders, deliveryProfiles } = useLoaderData<LoaderData<typeof orderSubmitLoader>>();
  const actionData = useActionData<ActionData | undefined>();
  const navigation = useNavigation();
  const params = useParams();
  const navigate = useNavigate();
  const isSubmitting = navigation.state === 'submitting';
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { isEnabled: isDeveloperMode } = useDeveloperMode();
  const [showDeleteProfileDialog, setShowDeleteProfileDialog] = useState(false);

  const form = useDeliveryForm({ initialProfiles: deliveryProfiles, t });

  const participantText =
    userOrders.length === 0
      ? t('orders.submit.hero.participants.none')
      : t('orders.submit.hero.participants.count', { count: userOrders.length });

  // Show confirmation modal when order is successfully submitted
  useEffect(() => {
    if (actionData?.success && actionData?.groupOrderId) {
      setShowConfirmation(true);
    }
  }, [actionData]);

  const handleCloseConfirmation = () => {
    setShowConfirmation(false);
    if (actionData?.groupOrderId) {
      navigate(routes.root.orderDetail({ orderId: actionData.groupOrderId }));
    }
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
          <Form method="post" className="space-y-4 sm:space-y-6">
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)] lg:items-start xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
              <div className="space-y-4 sm:space-y-5">
                <DeliveryFormFields
                  customerName={form.customerName}
                  setCustomerName={form.setCustomerName}
                  customerPhone={form.customerPhone}
                  setCustomerPhone={form.setCustomerPhone}
                  deliveryType={form.deliveryType}
                  setDeliveryType={form.setDeliveryType}
                  road={form.road}
                  setRoad={form.setRoad}
                  houseNumber={form.houseNumber}
                  setHouseNumber={form.setHouseNumber}
                  postcode={form.postcode}
                  setPostcode={form.setPostcode}
                  city={form.city}
                  setCity={form.setCity}
                  stateRegion={form.stateRegion}
                  setStateRegion={form.setStateRegion}
                  disabled={isSubmitting}
                />
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
                disabled={isSubmitting}
              />
            </div>

            <PreferencesSection
              requestedFor={form.requestedFor}
              setRequestedFor={form.setRequestedFor}
              paymentMethod={form.paymentMethod}
              setPaymentMethod={form.setPaymentMethod}
              disabled={isSubmitting}
            />

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
                      name="dryRun"
                      disabled={isSubmitting}
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

            {actionData?.errorKey || actionData?.errorMessage ? (
              <Alert tone="error">
                <div className="space-y-2">
                  <div>
                    {actionData?.errorKey
                      ? t(actionData.errorKey, actionData.errorDetails || {})
                      : actionData?.errorMessage}
                  </div>
                  {actionData?.fieldErrors && Object.keys(actionData.fieldErrors).length > 0 && (
                    <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
                      {Object.entries(actionData.fieldErrors).map(([field, message]) => (
                        <li key={field}>
                          <span className="font-medium">{getFieldLabel(field, t)}:</span> {message}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </Alert>
            ) : null}

            <div className="flex flex-wrap items-center gap-4">
              <BackButton
                to={routes.root.orderDetail({ orderId: params.orderId ?? '' })}
                label={t('orders.submit.form.actions.cancel')}
              />
              <Button
                type="submit"
                loading={isSubmitting}
                disabled={isSubmitting}
                variant="default"
                className="gap-2 shadow-[0_10px_35px_rgba(59,130,246,0.35)]"
              >
                <Send size={16} />
                {t('orders.submit.form.actions.submit')}
              </Button>
            </div>
          </Form>
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
