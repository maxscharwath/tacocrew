import {
  Alert,
  Button,
  DateTimePicker,
  Field,
  FieldError,
  FieldLabel,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@tacocrew/ui-kit';
import { format, setHours, setMinutes } from 'date-fns';
import { ArrowRight, Calendar, Package, Tag, Truck } from 'lucide-react';
import { useEffect } from 'react';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, type LoaderFunctionArgs, redirect, useActionData, useSubmit } from 'react-router';
import { FormField } from '@/components/forms/FormField';
import { OrderListItem, StatBubble } from '@/components/orders';
import { SectionWrapper } from '@/components/sections';
import { OrganizationSelectItem } from '@/components/shared/OrganizationSelectItem';
import { OrdersGridSkeleton } from '@/components/skeletons/OrdersGridSkeleton';
import { useDateFormat } from '@/hooks/useDateFormat';
import { useOrdersListData } from '@/hooks/useOrdersListData';
import { useZodForm } from '@/hooks/useZodForm';
import { routes } from '@/lib/routes';
import { createGroupOrderSchema } from '@/lib/schemas/order.schema';
import { combineDateAndTime } from '@/lib/utils/date';
import {
  calculateQuickDeadline,
  getDefaultEndTime,
  getMinDateTime,
  validateAndAdjustEndDate,
} from '@/lib/utils/order-date-utils';
import { getRandomOrderName } from '@/lib/utils/order-name';

type ActionData = {
  errorKey?: string;
  errorMessage?: string;
};

export function ordersLoader(_: LoaderFunctionArgs) {
  return Response.json({});
}

import { handleCreateGroupOrder } from '@/lib/handlers/create-group-order-handler';
import { createActionHandler } from '@/lib/utils/action-handler';

export const ordersAction = createActionHandler({
  handlers: {
    POST: async ({ formData }, request) => {
      if (formData.get('_intent') !== 'create') {
        throw new Response('Invalid action', { status: 400 });
      }

      const result = await handleCreateGroupOrder(request);

      if (!result.id) {
        return Response.json(
          {
            form: 'create',
            errorKey: result.errorKey,
            errorMessage: result.errorMessage,
            requiresOrganization: result.requiresOrganization,
          },
          { status: 400 }
        );
      }

      return redirect(routes.root.orderDetail({ orderId: result.id }));
    },
  },
  getFormName: (method) => {
    if (method === 'POST') return 'create';
    return 'unknown';
  },
});

function OrdersContent() {
  const { t } = useTranslation();
  const { formatDateTime, formatDate, formatDateOnly, formatDayName, formatTime12Hour } =
    useDateFormat();
  const actionData = useActionData<ActionData | undefined>();
  const submit = useSubmit();

  // Load data from consolidated hook
  const {
    groupOrders,
    groupOrdersQuery,
    activeOrganizations,
    upcomingOrders,
    activeCount,
    hasNoOrganizations,
  } = useOrdersListData();

  // Get current date/time for smart defaults
  const now = new Date();
  const today = format(now, 'yyyy-MM-dd');
  const defaultStartTime = format(now, 'HH:mm');
  const defaultEnd = getDefaultEndTime(today, defaultStartTime);

  // Initialize form with useZodForm
  const form = useZodForm({
    schema: createGroupOrderSchema,
    defaultValues: {
      startDate: combineDateAndTime(today, defaultStartTime),
      endDate: defaultEnd,
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  // Watch activeOrganizations and set organizationId
  useEffect(() => {
      const firstOrgId = activeOrganizations[0]?.id;
      if (firstOrgId && !form.getValues('organizationId')) {
        form.setValue('organizationId', firstOrgId);
      }
  }, [activeOrganizations]);

  // Watch form values
  const startDateValue = form.watch('startDate');
  const endDateValue = form.watch('endDate');

  // Update random name when start date/time changes
  useEffect(() => {
    const randomName = getRandomOrderName({
      startDateValue,
      t,
      formatters: {
        formatDayName,
        formatDateOnly,
        formatTime12Hour,
      },
      fallbackDate: today,
      fallbackTime: defaultStartTime,
    });
    if (randomName && !form.getValues('name')) {
      form.setValue('name', randomName);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDateValue]);

  // Auto-adjust end date/time when start date/time changes
  useEffect(() => {
    if (!startDateValue || !endDateValue) return;
    const newEndDate = validateAndAdjustEndDate(startDateValue, endDateValue, getDefaultEndTime);
    if (newEndDate !== endDateValue) {
      form.setValue('endDate', newEndDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDateValue]);

  // Set quick deadline helper
  const setQuickDeadline = (hour: number) => {
    const deadline = calculateQuickDeadline(startDateValue, hour);
    if (deadline) {
      form.setValue('endDate', deadline);
    }
  };

  // Get quick deadline label (formatted time)
  const getQuickDeadlineLabel = (hour: number): string => {
    const date = setMinutes(setHours(new Date(), hour), 0);
    return formatTime12Hour(date);
  };

  // Handle form submission
  const handleSubmit = form.handleSubmit((data) => {
    const formData = new FormData();
    formData.append('_intent', 'create');
    formData.append('name', data.name || '');
    formData.append('startDate', data.startDate);
    formData.append('endDate', data.endDate);
    formData.append('organizationId', data.organizationId || '');
    submit(formData, { method: 'post' });
  });

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-brand-500/20 via-slate-900/80 to-slate-950/90 p-8 shadow-[0_40px_120px_rgba(8,47,73,0.35)] backdrop-blur-sm lg:p-10">
        <div className="absolute -top-24 right-0 h-60 w-60 animate-pulse rounded-full bg-brand-400/30 blur-3xl" />
        <div className="absolute -bottom-10 left-10 h-48 w-48 rounded-full bg-purple-500/25 blur-3xl" />
        <div className="absolute inset-0 bg-linear-to-br from-transparent via-transparent to-brand-500/5" />
        <div className="relative flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-400/50 bg-brand-500/10 px-3 py-1 font-semibold text-brand-100 text-xs uppercase tracking-[0.3em] shadow-[0_4px_12px_rgba(99,102,241,0.2)]">
              {t('orders.list.hero.badge')}
            </span>
            <h1 className="font-semibold text-2xl text-white leading-tight tracking-tight lg:text-3xl">
              {t('orders.list.hero.title')}
            </h1>
            <p className="max-w-2xl text-slate-200 text-sm leading-relaxed">
              {t('orders.list.hero.subtitle')}
            </p>
          </div>

          <div className="grid h-fit w-full grid-cols-1 items-stretch gap-3 rounded-2xl border border-white/10 bg-slate-900/70 p-3 shadow-[0_20px_60px_rgba(0,0,0,0.3)] backdrop-blur-sm sm:w-fit sm:grid-cols-3 sm:p-5">
            <StatBubble
              icon={Calendar}
              label={t('orders.list.hero.metrics.activeCycles')}
              value={activeCount}
              tone="brand"
            />
            <StatBubble
              icon={Package}
              label={t('orders.list.hero.metrics.totalBatches')}
              value={groupOrders.length}
              tone="violet"
            />
            <StatBubble
              icon={Truck}
              label={t('orders.list.hero.metrics.nextDispatch')}
              value={upcomingOrders[0]?.endDate ? formatDate(upcomingOrders[0].endDate) : '—'}
              tone="sunset"
            />
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-8">
        {/* Orders list section with independent skeleton */}
        <SectionWrapper query={groupOrdersQuery} skeleton={<OrdersGridSkeleton />}>
          {(orders) => (
            <section className="space-y-4">
              <header className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-lg text-white">
                    {t('orders.list.queue.title')}
                  </h2>
                  <p className="text-slate-300 text-sm">{t('orders.list.queue.subtitle')}</p>
                </div>
                <span className="rounded-full border border-white/10 bg-slate-800/80 px-4 py-1 font-medium text-slate-300 text-xs">
                  {t('orders.list.queue.scheduled', { count: orders.length })}
                </span>
              </header>

              <div className="grid gap-4">
                {orders.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/15 border-dashed bg-slate-900/60 p-10 text-center text-slate-300">
                    <Package size={24} className="text-brand-200" />
                    <p>{t('orders.list.queue.empty')}</p>
                  </div>
                ) : (
                  orders.map((order) => (
                    <OrderListItem
                      key={order.id}
                      order={order}
                      formatDateTimeRange={(start, end) =>
                        `${formatDateTime(start)} → ${formatDateTime(end)}`
                      }
                      unnamedOrderText={t('orders.common.unnamedDrop')}
                    />
                  ))
                )}
              </div>
            </section>
          )}
        </SectionWrapper>

        <section className="sticky top-4 h-fit space-y-4 rounded-3xl border border-white/10 bg-slate-900/80 p-3 shadow-[0_30px_80px_rgba(8,47,73,0.28)] backdrop-blur-sm sm:space-y-6 sm:p-6">
          <header className="space-y-1">
            <h2 className="font-semibold text-lg text-white">{t('orders.list.form.title')}</h2>
            <p className="text-slate-300 text-sm">{t('orders.list.form.subtitle')}</p>
          </header>

          {hasNoOrganizations ? (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/15 border-dashed bg-slate-950/60 p-10 text-center">
              <Package size={32} className="text-brand-200" />
              <div className="space-y-2">
                <h3 className="font-semibold text-white">
                  {t('orders.list.form.noOrganization.title')}
                </h3>
                <p className="text-slate-300 text-sm">
                  {t('orders.list.form.noOrganization.description')}
                </p>
              </div>
              <Link to={routes.root.profileOrganizations()}>
                <Button>
                  {t('orders.list.form.noOrganization.action')}
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="grid gap-4">
              <FormField
                name="name"
                control={form.control}
                label={t('common.labels.dropName')}
                required
              >
                {(field, fieldState) => (
                  <InputGroup>
                    <InputGroupAddon>
                      <Tag className="size-4" />
                    </InputGroupAddon>
                    <InputGroupInput
                      {...field}
                      id="name"
                      type="text"
                      placeholder={t('common.placeholders.dropName')}
                      disabled={isSubmitting}
                      aria-invalid={fieldState.invalid}
                    />
                  </InputGroup>
                )}
              </FormField>
              {activeOrganizations[0]?.id}
                <Controller
                  name="organizationId"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="organizationId" required>
                        {t('orders.list.form.labels.organization')}
                      </FieldLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger
                          id="organizationId"
                          error={fieldState.invalid}
                          className="w-full"
                        >
                          <SelectValue
                            placeholder={t('orders.list.form.placeholders.selectOrganization')}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {activeOrganizations.map((org) => (
                            <SelectItem key={org.id} value={org.id}>
                              <OrganizationSelectItem organization={org} size="sm" />
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

              <div className="space-y-4 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <div className="flex items-center gap-2">
                  <Calendar size={18} className="text-brand-400" />
                  <Label className="text-sm normal-case tracking-normal">
                    {t('orders.list.form.labels.timeWindow')}
                  </Label>
                </div>

                <div className="grid gap-4">
                  <Controller
                    name="startDate"
                    control={form.control}
                    render={({ field, fieldState }) => {
                      const date = new Date(field.value);
                      return (
                        <Field data-invalid={fieldState.invalid}>
                          <DateTimePicker
                            label={t('orders.list.form.labels.opens')}
                            dateValue={format(date, 'yyyy-MM-dd')}
                            timeValue={format(date, 'HH:mm')}
                            onDateChange={(newDate) => {
                              const time = format(date, 'HH:mm');
                              field.onChange(combineDateAndTime(newDate, time));
                            }}
                            onTimeChange={(newTime) => {
                              const dateStr = format(date, 'yyyy-MM-dd');
                              field.onChange(combineDateAndTime(dateStr, newTime));
                            }}
                            disabled={isSubmitting}
                            error={fieldState.invalid}
                            required
                          />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      );
                    }}
                  />

                  <div className="grid gap-2">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setQuickDeadline(10)}
                        disabled={isSubmitting}
                        className="cursor-pointer rounded-full border border-brand-400/30 bg-brand-500/10 px-2.5 py-1 font-medium text-brand-100 text-xs hover:border-brand-400/50 hover:bg-brand-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {getQuickDeadlineLabel(10)}
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickDeadline(12)}
                        disabled={isSubmitting}
                        className="cursor-pointer rounded-full border border-brand-400/30 bg-brand-500/10 px-2.5 py-1 font-medium text-brand-100 text-xs hover:border-brand-400/50 hover:bg-brand-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {getQuickDeadlineLabel(12)}
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickDeadline(14)}
                        disabled={isSubmitting}
                        className="cursor-pointer rounded-full border border-brand-400/30 bg-brand-500/10 px-2.5 py-1 font-medium text-brand-100 text-xs hover:border-brand-400/50 hover:bg-brand-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {getQuickDeadlineLabel(14)}
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickDeadline(17)}
                        disabled={isSubmitting}
                        className="cursor-pointer rounded-full border border-brand-400/30 bg-brand-500/10 px-2.5 py-1 font-medium text-brand-100 text-xs hover:border-brand-400/50 hover:bg-brand-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {getQuickDeadlineLabel(17)}
                      </button>
                    </div>
                    <Controller
                      name="endDate"
                      control={form.control}
                      render={({ field, fieldState }) => {
                        const date = new Date(field.value);
                        const { date: minDate } = getMinDateTime(startDateValue);
                        return (
                          <Field data-invalid={fieldState.invalid}>
                            <DateTimePicker
                              label={t('orders.list.form.labels.closes')}
                              dateValue={format(date, 'yyyy-MM-dd')}
                              timeValue={format(date, 'HH:mm')}
                              onDateChange={(newDate) => {
                                const time = format(date, 'HH:mm');
                                field.onChange(combineDateAndTime(newDate, time));
                              }}
                              onTimeChange={(newTime) => {
                                const dateStr = format(date, 'yyyy-MM-dd');
                                field.onChange(combineDateAndTime(dateStr, newTime));
                              }}
                              disabled={isSubmitting}
                              minDate={minDate}
                              error={fieldState.invalid}
                              required
                            />
                            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                          </Field>
                        );
                      }}
                    />
                    <p className="text-slate-400 text-xs">
                      {t('orders.list.form.labels.deadlineHint')}
                    </p>
                  </div>
                </div>
              </div>

              {actionData?.errorKey || actionData?.errorMessage ? (
                <Alert tone="error">
                  {actionData.errorMessage
                    ? actionData.errorMessage
                    : actionData.errorKey
                      ? t(actionData.errorKey)
                      : null}
                </Alert>
              ) : null}

              <Button type="submit" loading={isSubmitting} disabled={isSubmitting} fullWidth>
                {t('orders.list.form.actions.launch')}
              </Button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}

export function OrdersRoute() {
  // Loader now returns empty object - all data loaded via hooks in OrdersContent
  return <OrdersContent />;
}
