import { ArrowLeft } from '@untitledui/icons/ArrowLeft';
import { Lock01 } from '@untitledui/icons/Lock01';
import { Send03 } from '@untitledui/icons/Send03';
import { Truck01 } from '@untitledui/icons/Truck01';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  type ActionFunctionArgs,
  Form,
  Link,
  type LoaderFunctionArgs,
  redirect,
  useActionData,
  useLoaderData,
  useNavigation,
  useParams,
} from 'react-router';
import { z } from 'zod';
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Input,
  Label,
} from '@/components/ui';
import { type DeliveryType, DeliveryTypeSelector } from '../components/orders/DeliveryTypeSelector';
import { PaymentMethodSelector } from '../components/orders/PaymentMethodSelector';
import { TimeSlotSelector } from '../components/orders/TimeSlotSelector';
import { SWISS_CANTONS, SWITZERLAND_COUNTRY } from '../constants/location';
import { useDeveloperMode } from '../hooks/useDeveloperMode';
import { OrdersApi, UserApi } from '../lib/api';
import { ApiError } from '../lib/api/http';
import type { DeliveryProfile, DeliveryProfilePayload, PaymentMethod } from '../lib/api/types';
import { authClient } from '../lib/auth-client';
import { routes } from '../lib/routes';

type LoaderData = {
  groupOrder: Awaited<ReturnType<typeof OrdersApi.getGroupOrderWithOrders>>['groupOrder'];
  userOrders: Awaited<ReturnType<typeof OrdersApi.getGroupOrderWithOrders>>['userOrders'];
  deliveryProfiles: Awaited<ReturnType<typeof UserApi.getDeliveryProfiles>>;
};

type ActionData = {
  errorKey?: string;
  errorMessage?: string;
  errorDetails?: Record<string, unknown>;
};

const CANTON_CODES = SWISS_CANTONS.map((canton) => canton.code) as [string, ...string[]];

const DeliveryFormSchema = z.object({
  customerName: z.string().trim().min(1),
  customerPhone: z.string().trim().min(1),
  deliveryType: z.enum(['livraison', 'emporter']),
  road: z.string().trim().min(1),
  houseNumber: z.string().trim().optional(),
  postcode: z.string().trim().min(1),
  city: z.string().trim().min(1),
  state: z.enum(CANTON_CODES),
  country: z.literal(SWITZERLAND_COUNTRY).optional(),
  requestedFor: z.string().trim().optional(),
  paymentMethod: z.enum(['especes', 'carte', 'twint']),
  dryRun: z.string().optional(),
});

export async function orderSubmitLoader({ params }: LoaderFunctionArgs) {
  const groupOrderId = params.orderId;
  if (!groupOrderId) {
    throw new Response('Order not found', { status: 404 });
  }

  // Check Better Auth session
  const session = await authClient.getSession();
  if (!session?.data?.user) {
    throw redirect(routes.login());
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
      throw redirect(routes.login());
    }
    throw error;
  }
}

export async function orderSubmitAction({ request, params }: ActionFunctionArgs) {
  const groupOrderId = params.orderId;
  if (!groupOrderId) {
    throw new Response('Order not found', { status: 404 });
  }

  const formData = await request.formData();
  const parsed = DeliveryFormSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return Response.json(
      {
        errorKey: 'orders.submit.errors.missingFields',
      },
      { status: 400 }
    );
  }

  const {
    customerName,
    customerPhone,
    deliveryType,
    road,
    houseNumber,
    postcode,
    city,
    state,
    requestedFor,
    paymentMethod,
    dryRun: dryRunRaw,
  } = parsed.data;
  const dryRun = dryRunRaw === 'on';

  try {
    await OrdersApi.submitGroupOrder(groupOrderId, {
      customer: {
        name: customerName,
        phone: customerPhone,
      },
      delivery: {
        type: deliveryType,
        address: {
          road,
          house_number: houseNumber,
          postcode,
          city,
          state,
          country: SWITZERLAND_COUNTRY,
        },
        requestedFor: requestedFor ?? '',
      },
      paymentMethod,
      dryRun,
    });

    return redirect(routes.root.orderDetail({ orderId: groupOrderId }));
  } catch (error) {
    if (error instanceof ApiError) {
      // Use the error's key for translation, fall back to message
      if (error.key) {
        return Response.json(
          { errorKey: error.key, errorDetails: error.details },
          { status: error.status }
        );
      }
      const errorMessage =
        typeof error.body === 'object' && error.body && 'error' in error.body
          ? ((error.body as { error?: { message?: string } }).error?.message ?? error.message)
          : error.message;

      return Response.json({ errorMessage }, { status: error.status });
    }

    return Response.json({ errorKey: 'orders.submit.errors.unexpected' }, { status: 500 });
  }
}

export function OrderSubmitRoute() {
  const { t } = useTranslation();
  const tt = (key: string, options?: Record<string, unknown>) => t(`orders.submit.${key}`, options);
  const { userOrders, deliveryProfiles } = useLoaderData() as LoaderData;
  const actionData = useActionData() as ActionData | undefined;
  const navigation = useNavigation();
  const params = useParams();
  const isSubmitting = navigation.state === 'submitting';
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
  const [stateRegion, setStateRegion] = useState(SWISS_CANTONS[0]?.code ?? '');
  const [profileLabel, setProfileLabel] = useState('');
  const [profileMessage, setProfileMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const participantText =
    userOrders.length === 0
      ? tt('hero.participants.none')
      : tt('hero.participants.count', { count: userOrders.length });

  const resolveProfileError = useCallback(
    (error: unknown) =>
      error instanceof ApiError ? error.message : tt('saved.messages.genericError'),
    [tt]
  );

  const applyProfile = useCallback((profile: DeliveryProfile) => {
    setCustomerName(profile.contactName);
    setCustomerPhone(profile.phone);
    setDeliveryType(profile.deliveryType as DeliveryType);
    setRoad(profile.address.road);
    setHouseNumber(profile.address.houseNumber ?? '');
    setPostcode(profile.address.postcode);
    setCity(profile.address.city);
    setStateRegion(
      SWISS_CANTONS.find((canton) => canton.code === profile.address.state)?.code ??
        SWISS_CANTONS[0]?.code ??
        ''
    );
    setProfileLabel(profile.label ?? '');
    setProfileMessage(null);
  }, []);

  useEffect(() => {
    if (!selectedProfileId) {
      return;
    }
    const profile = deliveryProfilesState.find((item) => item.id === selectedProfileId);
    if (profile) {
      applyProfile(profile);
    }
  }, [selectedProfileId, deliveryProfilesState, applyProfile]);

  useEffect(() => {
    if (deliveryProfilesState.length > 0 && !selectedProfileId && !manualProfileClearRef.current) {
      const first = deliveryProfilesState[0];
      setSelectedProfileId(first.id);
      applyProfile(first);
    }
  }, [deliveryProfilesState, selectedProfileId, applyProfile]);

  const handleProfileSelect = useCallback((profileId: string) => {
    manualProfileClearRef.current = false;
    setSelectedProfileId(profileId);
  }, []);

  const handleClearProfileSelection = useCallback(() => {
    manualProfileClearRef.current = true;
    setSelectedProfileId('');
  }, []);

  const buildProfilePayload = useCallback(
    (labelOverride?: string): DeliveryProfilePayload => ({
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
    }),
    [
      profileLabel,
      customerName,
      customerPhone,
      deliveryType,
      road,
      houseNumber,
      postcode,
      city,
      stateRegion,
    ]
  );

  const ensureProfileFields = useCallback(() => {
    if (!customerName || !customerPhone || !road || !postcode || !city) {
      setProfileMessage({ type: 'error', text: tt('saved.messages.missingFields') });
      return false;
    }
    return true;
  }, [customerName, customerPhone, road, postcode, city, tt]);

  const ensureProfileLabel = useCallback(() => {
    if (!profileLabel.trim()) {
      setProfileMessage({ type: 'error', text: tt('saved.messages.missingLabel') });
      return false;
    }
    return true;
  }, [profileLabel, tt]);

  const handleSaveProfile = useCallback(async () => {
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
      setProfileMessage({ type: 'success', text: tt('saved.messages.saved') });
    } catch (error) {
      setProfileMessage({ type: 'error', text: resolveProfileError(error) });
    } finally {
      setProfileLoading(false);
    }
  }, [buildProfilePayload, ensureProfileFields, ensureProfileLabel, resolveProfileError, tt]);

  const handleUpdateProfile = useCallback(async () => {
    if (!selectedProfileId) {
      setProfileMessage({ type: 'error', text: tt('saved.messages.selectProfile') });
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
      setProfileMessage({ type: 'success', text: tt('saved.messages.updated') });
    } catch (error) {
      setProfileMessage({ type: 'error', text: resolveProfileError(error) });
    } finally {
      setProfileLoading(false);
    }
  }, [
    buildProfilePayload,
    ensureProfileFields,
    ensureProfileLabel,
    resolveProfileError,
    selectedProfileId,
    tt,
  ]);

  const handleDeleteProfile = useCallback(async () => {
    if (!selectedProfileId) {
      setProfileMessage({ type: 'error', text: tt('saved.messages.selectProfile') });
      return;
    }
    if (!window.confirm(tt('saved.confirmDelete'))) {
      return;
    }
    setProfileLoading(true);
    setProfileMessage(null);
    try {
      await UserApi.deleteDeliveryProfile(selectedProfileId);
      setDeliveryProfilesState((prev) => prev.filter((item) => item.id !== selectedProfileId));
      manualProfileClearRef.current = false;
      setSelectedProfileId('');
      setProfileLabel('');
      setProfileMessage({ type: 'success', text: tt('saved.messages.deleted') });
    } catch (error) {
      setProfileMessage({ type: 'error', text: resolveProfileError(error) });
    } finally {
      setProfileLoading(false);
    }
  }, [resolveProfileError, selectedProfileId, tt]);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link
          to={`/orders/${params.orderId}`}
          className="inline-flex cursor-pointer items-center gap-2 font-medium text-slate-300 text-sm hover:text-brand-100"
        >
          <ArrowLeft size={18} />
          {tt('navigation.back')}
        </Link>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-amber-500/10 via-slate-900/80 to-slate-950/90 p-8">
        <div className="-top-24 pointer-events-none absolute right-0 h-72 w-72 rounded-full bg-amber-400/20 blur-3xl" />
        <div className="-bottom-16 pointer-events-none absolute left-12 h-60 w-60 rounded-full bg-rose-500/20 blur-3xl" />
        <div className="relative space-y-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-linear-to-br from-amber-400 via-amber-500 to-rose-500">
              <Lock01 size={24} className="text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-2xl text-white tracking-tight">
                {tt('hero.title')}
              </h1>
              <p className="text-slate-300 text-sm">{tt('hero.description')}</p>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
            <p className="text-slate-400 text-xs uppercase tracking-[0.2em]">
              {tt('hero.participants.label')}
            </p>
            <p className="mt-2 font-semibold text-2xl text-white">{userOrders.length}</p>
            <p className="mt-1 text-slate-400 text-xs">{participantText}</p>
          </div>
        </div>
      </div>

      <Card className="p-6">
        <CardHeader className="gap-2">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-linear-to-br from-amber-400 via-amber-500 to-rose-500">
              <Truck01 size={20} className="text-white" />
            </div>
            <div>
              <CardTitle className="text-white">{tt('form.title')}</CardTitle>
              <CardDescription>{tt('form.description')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form method="post" className="space-y-6">
            <input type="hidden" name="requestedFor" value={requestedFor} />
            <input type="hidden" name="country" value={SWITZERLAND_COUNTRY} />
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)] lg:items-start xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
              <div className="space-y-5">
                <section className="space-y-5 rounded-2xl border border-white/10 bg-slate-900/50 p-5">
                  <div className="space-y-1">
                    <p className="font-semibold text-sm text-white">
                      {tt('form.sections.address.title')}
                    </p>
                    <p className="text-slate-400 text-xs">
                      {tt('form.sections.address.description')}
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="customerName" required>
                        {tt('form.fields.customerName')}
                      </Label>
                      <Input
                        id="customerName"
                        name="customerName"
                        type="text"
                        required
                        disabled={isSubmitting}
                        value={customerName}
                        onChange={(event) => setCustomerName(event.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="customerPhone" required>
                        {tt('form.fields.customerPhone')}
                      </Label>
                      <Input
                        id="customerPhone"
                        name="customerPhone"
                        type="tel"
                        required
                        disabled={isSubmitting}
                        value={customerPhone}
                        onChange={(event) => setCustomerPhone(event.target.value)}
                      />
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
                        {tt('form.fields.street')}
                      </Label>
                      <Input
                        id="road"
                        name="road"
                        type="text"
                        required
                        disabled={isSubmitting}
                        value={road}
                        onChange={(event) => setRoad(event.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="houseNumber">{tt('form.fields.houseNumber')}</Label>
                      <Input
                        id="houseNumber"
                        name="houseNumber"
                        type="text"
                        disabled={isSubmitting}
                        value={houseNumber}
                        onChange={(event) => setHouseNumber(event.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="postcode" required>
                        {tt('form.fields.postcode')}
                      </Label>
                      <Input
                        id="postcode"
                        name="postcode"
                        type="text"
                        required
                        disabled={isSubmitting}
                        value={postcode}
                        onChange={(event) => setPostcode(event.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="city" required>
                        {tt('form.fields.city')}
                      </Label>
                      <Input
                        id="city"
                        name="city"
                        type="text"
                        required
                        disabled={isSubmitting}
                        value={city}
                        onChange={(event) => setCity(event.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="state">{tt('form.fields.state')}</Label>
                      <select
                        id="state"
                        name="state"
                        className="rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-white focus:border-brand-400 focus:outline-none disabled:opacity-60"
                        value={stateRegion}
                        onChange={(event) => setStateRegion(event.target.value)}
                        disabled={isSubmitting}
                      >
                        {SWISS_CANTONS.map((canton) => (
                          <option key={canton.code} value={canton.code}>
                            {canton.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="country">{tt('form.fields.country')}</Label>
                      <Input
                        id="country"
                        name="country"
                        type="text"
                        value={SWITZERLAND_COUNTRY}
                        readOnly
                        disabled
                        className="text-white"
                      />
                    </div>
                  </div>
                </section>
              </div>

              <div className="flex h-full flex-col rounded-3xl border border-white/10 bg-slate-900/60 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className="font-semibold text-sm text-white">{tt('saved.title')}</p>
                    <p className="text-slate-400 text-xs">{tt('saved.description')}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearProfileSelection}
                    disabled={profileLoading}
                  >
                    {tt('saved.actions.clear')}
                  </Button>
                </div>

                <div className="mt-4 flex-1 space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2 lg:max-h-[360px] lg:overflow-y-auto lg:pr-1">
                    {deliveryProfilesState.slice(0, 4).map((profile) => (
                      <button
                        key={profile.id}
                        type="button"
                        className={`flex w-full flex-col gap-1 rounded-2xl border px-4 py-3 text-left transition duration-200 ${
                          profile.id === selectedProfileId
                            ? 'border-brand-400 bg-brand-500/10 text-white shadow-[0_10px_30px_rgba(99,102,241,0.35)]'
                            : 'border-white/10 bg-slate-900/50 text-slate-200 hover:border-brand-400/40 hover:text-white'
                        }`}
                        onClick={() => handleProfileSelect(profile.id)}
                        disabled={isSubmitting || profileLoading}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-sm">
                            {profile.label ?? tt('saved.unnamedProfile')}
                          </p>
                          <span className="rounded-full border border-white/15 px-2 py-0.5 text-[11px] text-slate-300 uppercase tracking-wide">
                            {tt(`form.deliveryTypes.${profile.deliveryType}`)}
                          </span>
                        </div>
                        <p className="text-slate-400 text-xs">
                          {profile.contactName} • {profile.phone}
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
                      <div className="rounded-2xl border border-white/10 border-dashed bg-slate-900/30 p-4 text-center text-slate-500 text-sm">
                        {tt('saved.emptyState')}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-auto space-y-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <div className="grid gap-2">
                    <Label htmlFor="profileLabelMain">{tt('saved.labelField')}</Label>
                    <Input
                      id="profileLabelMain"
                      placeholder={tt('saved.inputPlaceholder')}
                      value={profileLabel}
                      onChange={(event) => setProfileLabel(event.target.value)}
                      disabled={profileLoading}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSaveProfile}
                      disabled={profileLoading}
                    >
                      {tt('saved.actions.save')}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleUpdateProfile}
                      disabled={profileLoading || !selectedProfileId}
                    >
                      {tt('saved.actions.update')}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleDeleteProfile}
                      disabled={profileLoading || !selectedProfileId}
                      className="text-rose-300 hover:text-rose-200"
                    >
                      {tt('saved.actions.delete')}
                    </Button>
                  </div>
                  {profileMessage ? (
                    <Alert tone={profileMessage.type === 'success' ? 'success' : 'error'}>
                      {profileMessage.text}
                    </Alert>
                  ) : null}
                </div>
              </div>
            </div>

            <section className="space-y-4 rounded-2xl border border-white/10 bg-slate-900/50 p-5">
              <div className="space-y-1">
                <p className="font-semibold text-sm text-white">
                  {tt('form.sections.preferences.title')}
                </p>
                <p className="text-slate-400 text-xs">
                  {tt('form.sections.preferences.description')}
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
              {tt('reminder.body')}
            </Alert>

            {isDeveloperMode && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
                <div className="flex items-start gap-3">
                  <Checkbox id="dryRun" name="dryRun" disabled={isSubmitting} className="mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <Label
                      htmlFor="dryRun"
                      className="cursor-pointer font-medium text-amber-100 text-sm"
                    >
                      Dry Run Mode (Developer)
                    </Label>
                    <p className="text-amber-200/80 text-xs">
                      Skip actual submission to external backend. Creates session and cart for
                      testing cookie injection.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {actionData?.errorKey || actionData?.errorMessage ? (
              <Alert tone="error">
                {actionData?.errorKey
                  ? t(actionData.errorKey, actionData.errorDetails || {})
                  : actionData?.errorMessage}
              </Alert>
            ) : null}

            <div className="flex flex-wrap items-center gap-4">
              <Link to={`/orders/${params.orderId}`} className="cursor-pointer">
                <Button type="button" variant="outline" disabled={isSubmitting}>
                  {tt('form.actions.cancel')}
                </Button>
              </Link>
              <Button
                type="submit"
                loading={isSubmitting}
                disabled={isSubmitting}
                variant="primary"
                className="gap-2 shadow-[0_10px_35px_rgba(59,130,246,0.35)]"
              >
                <Send03 size={16} />
                {tt('form.actions.submit')}
              </Button>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
