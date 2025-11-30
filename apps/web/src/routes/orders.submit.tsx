import { ArrowLeft, Globe, Hash, Lock, MapPin, Phone, Send, Tag, Truck, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Form,
  Link,
  type LoaderFunctionArgs,
  redirect,
  useActionData,
  useLoaderData,
  useNavigate,
  useNavigation,
  useParams,
} from 'react-router';
import { type DeliveryType, DeliveryTypeSelector } from '@/components/orders/DeliveryTypeSelector';
import { OrderConfirmationModal } from '@/components/orders/OrderConfirmationModal';
import { PaymentMethodSelector } from '@/components/orders/PaymentMethodSelector';
import { TimeSlotSelector } from '@/components/orders/TimeSlotSelector';
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
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Label,
} from '@/components/ui';
import {
  DEFAULT_CANTON_CODE,
  getSwissCantons,
  getSwitzerlandName,
  SWISS_CANTON_CODES,
  SWITZERLAND_COUNTRY,
  SwissCanton,
} from '@/constants/location';
import { useDeveloperMode } from '@/hooks/useDeveloperMode';
import { OrdersApi, UserApi } from '@/lib/api';
import { ApiError } from '@/lib/api/http';
import type { DeliveryProfile, DeliveryProfilePayload, PaymentMethod } from '@/lib/api/types';
import { authClient } from '@/lib/auth-client';
import { routes } from '@/lib/routes';
import type { DeliveryFormData } from '@/lib/types/form-data';
import { createActionHandler } from '@/lib/utils/action-handler';
import { parseFormData } from '@/lib/utils/form-data';
import { formatPhoneNumber } from '@/utils/phone-formatter';

type LoaderData = {
  groupOrder: Awaited<ReturnType<typeof OrdersApi.getGroupOrderWithOrders>>['groupOrder'];
  userOrders: Awaited<ReturnType<typeof OrdersApi.getGroupOrderWithOrders>>['userOrders'];
  deliveryProfiles: Awaited<ReturnType<typeof UserApi.getDeliveryProfiles>>;
};

type ActionData = {
  errorKey?: string;
  errorMessage?: string;
  errorDetails?: Record<string, unknown>;
  fieldErrors?: Record<string, string>;
  success?: boolean;
  groupOrderId?: string;
};

export async function orderSubmitLoader({ params }: LoaderFunctionArgs): Promise<Response> {
  const groupOrderId = params.orderId;
  if (!groupOrderId) {
    throw new Response('Order not found', { status: 404 });
  }

  // Check Better Auth session
  const session = await authClient.getSession();
  if (!session?.data?.user) {
    throw redirect(routes.signin());
  }

  const userId = session.data.user.id;

  try {
    const [groupOrderWithUsers, deliveryProfiles] = await Promise.all([
      OrdersApi.getGroupOrderWithOrders(groupOrderId),
      UserApi.getDeliveryProfiles(),
    ]);

    // Only leaders can submit
    const isLeader = groupOrderWithUsers.groupOrder.leader.id === userId;
    if (!isLeader) {
      return redirect(routes.root.orderDetail({ orderId: groupOrderId }));
    }

    return Response.json({
      groupOrder: groupOrderWithUsers.groupOrder,
      userOrders: groupOrderWithUsers.userOrders,
      deliveryProfiles,
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      throw redirect(routes.signin());
    }
    throw error;
  }
}

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

      // Ensure requestedFor is a string (handle case where it might be an array from duplicate form fields)
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
    // Return success data - the component will handle showing the modal and redirecting
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
  const { userOrders, deliveryProfiles } = useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData | undefined>();
  const navigation = useNavigation();
  const params = useParams();
  const navigate = useNavigate();
  const isSubmitting = navigation.state === 'submitting';
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { isEnabled: isDeveloperMode } = useDeveloperMode();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('especes');
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('livraison');
  const [requestedFor, setRequestedFor] = useState<string>('');
  const [deliveryProfilesState, setDeliveryProfilesState] = useState(deliveryProfiles);
  const [selectedProfileId, setSelectedProfileId] = useState<string>(deliveryProfiles[0]?.id ?? '');
  const manualProfileClearRef = useRef(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [road, setRoad] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [postcode, setPostcode] = useState('');
  const [city, setCity] = useState('');
  const [stateRegion, setStateRegion] = useState<SwissCanton>(DEFAULT_CANTON_CODE);
  const [profileLabel, setProfileLabel] = useState('');
  const [profileMessage, setProfileMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [showDeleteProfileDialog, setShowDeleteProfileDialog] = useState(false);
  const participantText =
    userOrders.length === 0
      ? t('orders.submit.hero.participants.none')
      : t('orders.submit.hero.participants.count', { count: userOrders.length });

  const resolveProfileError = (error: unknown) =>
    error instanceof ApiError ? error.message : t('orders.submit.saved.messages.genericError');

  const applyProfile = (profile: DeliveryProfile) => {
    setCustomerName(profile.contactName);
    setCustomerPhone(profile.phone);
    setDeliveryType(profile.deliveryType);
    setRoad(profile.address.road);
    setHouseNumber(profile.address.houseNumber ?? '');
    setPostcode(profile.address.postcode);
    setCity(profile.address.city);
    setStateRegion(
      SWISS_CANTON_CODES.find((code) => code === profile.address.state) ?? DEFAULT_CANTON_CODE
    );
    setProfileLabel(profile.label ?? '');
    setProfileMessage(null);
  };

  useEffect(() => {
    if (!selectedProfileId) {
      return;
    }
    const profile = deliveryProfilesState.find((item) => item.id === selectedProfileId);
    if (profile) {
      applyProfile(profile);
    }
  }, [selectedProfileId, deliveryProfilesState]);

  useEffect(() => {
    if (deliveryProfilesState.length > 0 && !selectedProfileId && !manualProfileClearRef.current) {
      const first = deliveryProfilesState[0];
      setSelectedProfileId(first.id);
      applyProfile(first);
    }
  }, [deliveryProfilesState, selectedProfileId]);

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

  const handleProfileSelect = (profileId: string) => {
    manualProfileClearRef.current = false;
    setSelectedProfileId(profileId);
  };

  const handleClearProfileSelection = () => {
    manualProfileClearRef.current = true;
    setSelectedProfileId('');
  };

  const buildProfilePayload = (labelOverride?: string): DeliveryProfilePayload => ({
    label: (labelOverride ?? profileLabel).trim() || undefined,
    contactName: customerName,
    phone: customerPhone,
    deliveryType,
    address: {
      road,
      houseNumber: houseNumber || undefined,
      postcode,
      city,
      state: stateRegion,
      country: SWITZERLAND_COUNTRY,
    },
  });

  const ensureProfileFields = () => {
    if (!customerName || !customerPhone || !road || !postcode || !city) {
      setProfileMessage({ type: 'error', text: t('orders.submit.saved.messages.missingFields') });
      return false;
    }
    return true;
  };

  const ensureProfileLabel = () => {
    if (!profileLabel.trim()) {
      setProfileMessage({ type: 'error', text: t('orders.submit.saved.messages.missingLabel') });
      return false;
    }
    return true;
  };

  const handleSaveProfile = async () => {
    if (!ensureProfileFields() || !ensureProfileLabel()) {
      return;
    }
    setProfileLoading(true);
    setProfileMessage(null);
    try {
      const payload = buildProfilePayload();
      const profile = await UserApi.createDeliveryProfile(payload);
      setDeliveryProfilesState((prev) => [...prev, profile]);
      manualProfileClearRef.current = false;
      setSelectedProfileId(profile.id);
      setProfileMessage({ type: 'success', text: t('orders.submit.saved.messages.saved') });
    } catch (error) {
      setProfileMessage({ type: 'error', text: resolveProfileError(error) });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!selectedProfileId) {
      setProfileMessage({ type: 'error', text: t('orders.submit.saved.messages.selectProfile') });
      return;
    }
    if (!ensureProfileFields() || !ensureProfileLabel()) {
      return;
    }
    setProfileLoading(true);
    setProfileMessage(null);
    try {
      const payload = buildProfilePayload();
      const profile = await UserApi.updateDeliveryProfile(selectedProfileId, payload);
      setDeliveryProfilesState((prev) =>
        prev.map((item) => (item.id === profile.id ? profile : item))
      );
      setProfileMessage({ type: 'success', text: t('orders.submit.saved.messages.updated') });
    } catch (error) {
      setProfileMessage({ type: 'error', text: resolveProfileError(error) });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleDeleteProfile = () => {
    if (!selectedProfileId) {
      setProfileMessage({ type: 'error', text: t('orders.submit.saved.messages.selectProfile') });
      return;
    }
    setShowDeleteProfileDialog(true);
  };

  const handleConfirmDeleteProfile = async () => {
    if (!selectedProfileId) return;

    setShowDeleteProfileDialog(false);
    setProfileLoading(true);
    setProfileMessage(null);
    try {
      await UserApi.deleteDeliveryProfile(selectedProfileId);
      setDeliveryProfilesState((prev) => prev.filter((item) => item.id !== selectedProfileId));
      manualProfileClearRef.current = false;
      setSelectedProfileId('');
      setProfileLabel('');
      setProfileMessage({ type: 'success', text: t('orders.submit.saved.messages.deleted') });
    } catch (error) {
      setProfileMessage({ type: 'error', text: resolveProfileError(error) });
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link
          to={routes.root.orderDetail({ orderId: params.orderId! })}
          className="inline-flex cursor-pointer items-center gap-2 font-medium text-slate-300 text-sm hover:text-brand-100"
        >
          <ArrowLeft size={18} />
          {t('orders.submit.navigation.back')}
        </Link>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-amber-500/10 via-slate-900/80 to-slate-950/90 p-8">
        <div className="-top-24 pointer-events-none absolute right-0 h-72 w-72 rounded-full bg-amber-400/20 blur-3xl" />
        <div className="-bottom-16 pointer-events-none absolute left-12 h-60 w-60 rounded-full bg-rose-500/20 blur-3xl" />
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
          <Form method="post" className="space-y-6">
            <input type="hidden" name="country" value={SWITZERLAND_COUNTRY} />
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)] lg:items-start xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
              <div className="space-y-5">
                <section className="space-y-5 rounded-2xl border border-white/10 bg-slate-900/50 p-5">
                  <div className="space-y-1">
                    <p className="font-semibold text-sm text-white">
                      {t('orders.submit.form.sections.address.title')}
                    </p>
                    <p className="text-slate-400 text-xs">
                      {t('orders.submit.form.sections.address.description')}
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="customerName" required>
                        {t('orders.submit.form.fields.customerName')}
                      </Label>
                      <InputGroup>
                        <InputGroupAddon>
                          <User className="size-4" />
                        </InputGroupAddon>
                        <InputGroupInput
                          id="customerName"
                          name="customerName"
                          type="text"
                          required
                          disabled={isSubmitting}
                          value={customerName}
                          onChange={(event) => setCustomerName(event.target.value)}
                        />
                      </InputGroup>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="customerPhone" required>
                        {t('orders.submit.form.fields.customerPhone')}
                      </Label>
                      <InputGroup>
                        <InputGroupAddon>
                          <Phone className="size-4" />
                        </InputGroupAddon>
                        <InputGroupInput
                          id="customerPhone"
                          name="customerPhone"
                          type="tel"
                          required
                          disabled={isSubmitting}
                          value={customerPhone}
                          onChange={(event) => setCustomerPhone(event.target.value)}
                        />
                      </InputGroup>
                    </div>
                  </div>

                  <DeliveryTypeSelector
                    selected={deliveryType}
                    onSelect={setDeliveryType}
                    disabled={isSubmitting}
                    required
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="road" required>
                        {t('orders.submit.form.fields.street')}
                      </Label>
                      <InputGroup>
                        <InputGroupAddon>
                          <MapPin className="size-4" />
                        </InputGroupAddon>
                        <InputGroupInput
                          id="road"
                          name="road"
                          type="text"
                          required
                          disabled={isSubmitting}
                          value={road}
                          onChange={(event) => setRoad(event.target.value)}
                        />
                      </InputGroup>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="houseNumber">
                        {t('orders.submit.form.fields.houseNumber')}
                      </Label>
                      <InputGroup>
                        <InputGroupAddon>
                          <Hash className="size-4" />
                        </InputGroupAddon>
                        <InputGroupInput
                          id="houseNumber"
                          name="houseNumber"
                          type="text"
                          disabled={isSubmitting}
                          value={houseNumber}
                          onChange={(event) => setHouseNumber(event.target.value)}
                        />
                      </InputGroup>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="postcode" required>
                        {t('orders.submit.form.fields.postcode')}
                      </Label>
                      <InputGroup>
                        <InputGroupAddon>
                          <Hash className="size-4" />
                        </InputGroupAddon>
                        <InputGroupInput
                          id="postcode"
                          name="postcode"
                          type="text"
                          required
                          disabled={isSubmitting}
                          value={postcode}
                          onChange={(event) => setPostcode(event.target.value)}
                        />
                      </InputGroup>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="city" required>
                        {t('orders.submit.form.fields.city')}
                      </Label>
                      <InputGroup>
                        <InputGroupAddon>
                          <MapPin className="size-4" />
                        </InputGroupAddon>
                        <InputGroupInput
                          id="city"
                          name="city"
                          type="text"
                          required
                          disabled={isSubmitting}
                          value={city}
                          onChange={(event) => setCity(event.target.value)}
                        />
                      </InputGroup>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="state">{t('orders.submit.form.fields.state')}</Label>
                      <select
                        id="state"
                        name="state"
                        className="rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-white focus:border-brand-400 focus:outline-none disabled:opacity-60"
                        value={stateRegion}
                        onChange={(event) => setStateRegion(event.target.value as SwissCanton)}
                        disabled={isSubmitting}
                      >
                        {getSwissCantons(t).map((canton) => (
                          <option key={canton.code} value={canton.code}>
                            {canton.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="country">{t('orders.submit.form.fields.country')}</Label>
                      <InputGroup>
                        <InputGroupAddon>
                          <Globe className="size-4" />
                        </InputGroupAddon>
                        <InputGroupInput
                          id="country"
                          name="country"
                          type="text"
                          value={getSwitzerlandName(t)}
                          readOnly
                          disabled
                        />
                      </InputGroup>
                    </div>
                  </div>
                </section>
              </div>

              <Card className="flex h-full flex-col border-white/10 bg-slate-800/30">
                <CardHeader className="gap-2">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-white">{t('orders.submit.saved.title')}</CardTitle>
                      <CardDescription>{t('orders.submit.saved.description')}</CardDescription>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleClearProfileSelection}
                      disabled={profileLoading}
                    >
                      {t('orders.submit.saved.actions.clear')}
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="flex min-h-0 flex-1 flex-col">
                  <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:max-h-[360px] lg:overflow-y-auto lg:pr-1">
                    {deliveryProfilesState.slice(0, 4).map((profile) => (
                      <button
                        key={profile.id}
                        type="button"
                        className={`flex w-full flex-col gap-1 rounded-xl border px-4 py-3 text-left transition duration-200 ${
                          profile.id === selectedProfileId
                            ? 'border-brand-400 bg-brand-500/10 text-white shadow-[0_10px_30px_rgba(99,102,241,0.35)]'
                            : 'border-white/10 bg-slate-900/50 text-slate-200 hover:border-brand-400/40 hover:text-white'
                        }`}
                        onClick={() => handleProfileSelect(profile.id)}
                        disabled={isSubmitting || profileLoading}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-sm">
                            {profile.label ?? t('orders.submit.saved.unnamedProfile')}
                          </p>
                          <span className="rounded-full border border-white/15 px-2 py-0.5 text-[11px] text-slate-300 uppercase tracking-wide">
                            {t(`orders.submit.form.deliveryTypes.${profile.deliveryType}`)}
                          </span>
                        </div>
                        <p className="text-slate-400 text-xs">
                          {profile.contactName} • {formatPhoneNumber(profile.phone)}
                        </p>
                        <p className="text-slate-500 text-xs">
                          {profile.address.road}
                          {profile.address.houseNumber ? ` ${profile.address.houseNumber}` : ''}
                          ,&nbsp;
                          {profile.address.postcode} {profile.address.city}
                          {profile.address.state ? ` (${profile.address.state})` : ''}
                        </p>
                      </button>
                    ))}
                    {deliveryProfilesState.length === 0 && (
                      <div className="col-span-full rounded-xl border border-white/10 border-dashed bg-slate-900/30 p-4 text-center text-slate-500 text-sm">
                        {t('orders.submit.saved.emptyState')}
                      </div>
                    )}
                  </div>

                  <div className="mt-auto space-y-3">
                    <div className="grid gap-2">
                      <Label htmlFor="profileLabelMain">
                        {t('orders.submit.saved.labelField')}
                      </Label>
                      <InputGroup>
                        <InputGroupAddon>
                          <Tag className="size-4" />
                        </InputGroupAddon>
                        <InputGroupInput
                          id="profileLabelMain"
                          placeholder={t('orders.submit.saved.inputPlaceholder')}
                          value={profileLabel}
                          onChange={(event) => setProfileLabel(event.target.value)}
                          disabled={profileLoading}
                        />
                      </InputGroup>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleSaveProfile}
                        disabled={profileLoading}
                      >
                        {t('orders.submit.saved.actions.save')}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleUpdateProfile}
                        disabled={profileLoading || !selectedProfileId}
                      >
                        {t('orders.submit.saved.actions.update')}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={handleDeleteProfile}
                        disabled={profileLoading || !selectedProfileId}
                        className="text-rose-300 hover:text-rose-200"
                      >
                        {t('orders.submit.saved.actions.delete')}
                      </Button>
                    </div>
                    {profileMessage ? (
                      <Alert tone={profileMessage.type === 'success' ? 'success' : 'error'}>
                        {profileMessage.text}
                      </Alert>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </div>

            <section className="space-y-4 rounded-2xl border border-white/10 bg-slate-900/50 p-5">
              <div className="space-y-1">
                <p className="font-semibold text-sm text-white">
                  {t('orders.submit.form.sections.preferences.title')}
                </p>
                <p className="text-slate-400 text-xs">
                  {t('orders.submit.form.sections.preferences.description')}
                </p>
              </div>

              <TimeSlotSelector
                selected={requestedFor}
                onSelect={setRequestedFor}
                disabled={isSubmitting}
                required
              />

              <PaymentMethodSelector
                selected={paymentMethod}
                onSelect={setPaymentMethod}
                disabled={isSubmitting}
                required
              />
            </section>

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
              <Link
                to={routes.root.orderDetail({ orderId: params.orderId! })}
                className="cursor-pointer"
              >
                <Button type="button" variant="outline" disabled={isSubmitting}>
                  {t('orders.submit.form.actions.cancel')}
                </Button>
              </Link>
              <Button
                type="submit"
                loading={isSubmitting}
                disabled={isSubmitting}
                variant="primary"
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
            <AlertDialogCancel disabled={profileLoading}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleConfirmDeleteProfile} disabled={profileLoading}>
              {t('orders.submit.saved.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
