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
import { addHours, format, setHours, setMinutes } from 'date-fns';
import { ArrowRight, Calendar, Package, Tag, Truck } from 'lucide-react';
import { Suspense, useEffect } from 'react';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  Await,
  Link,
  type LoaderFunctionArgs,
  redirect,
  useActionData,
  useLoaderData,
  useSubmit,
} from 'react-router';
import { FormField } from '@/components/forms/FormField';
import { OrderListItem, StatBubble } from '@/components/orders';
import { OrganizationSelectItem } from '@/components/shared/OrganizationSelectItem';
import { OrdersSkeleton } from '@/components/skeletons';
import { useDateFormat } from '@/hooks/useDateFormat';
import { useZodForm } from '@/hooks/useZodForm';
import { OrdersApi, OrganizationApi, UserApi } from '@/lib/api';
import { routes } from '@/lib/routes';
import { createGroupOrderSchema } from '@/lib/schemas/order.schema';
import { combineDateAndTime, toDate } from '@/lib/utils/date';
import { defer } from '@/lib/utils/defer';
import { extractErrorMessage, isMultipleOrganizationsError } from '@/lib/utils/error-helpers';
import { createDeferredWithAuth, requireSession } from '@/lib/utils/loader-helpers';
import { getRandomOrderName } from '@/lib/utils/order-name';
import {
  getActiveOrganizations,
  shouldShowOrganizationSelector,
} from '@/lib/utils/organization-helpers';

type LoaderData = {
  groupOrders: Awaited<ReturnType<typeof UserApi.getGroupOrders>>;
  organizations: Awaited<ReturnType<typeof OrganizationApi.getMyOrganizations>>;
};

type ActionData = {
  errorKey?: string;
  errorMessage?: string;
  requiresOrganization?: boolean;
};

export async function ordersLoader(_: LoaderFunctionArgs) {
  await requireSession();

  return defer({
    groupOrders: createDeferredWithAuth(() => UserApi.getGroupOrders()),
    organizations: createDeferredWithAuth(() => OrganizationApi.getMyOrganizations()),
  });
}

import type { CreateGroupOrderFormData } from '@/lib/types/form-data';
import { createActionHandler } from '@/lib/utils/action-handler';
import { parseFormData } from '@/lib/utils/form-data';

/**
 * Normalize date string by adding seconds if missing
 */
function normalizeDateString(dateStr: string): string {
  if (dateStr.includes(':') && !dateStr.includes('Z') && !dateStr.includes('+')) {
    return `${dateStr}:00`;
  }
  return dateStr;
}

/**
 * Validate and convert date strings to Date objects
 */
function validateDates(
  startDateStr: string,
  endDateStr: string
): { startDate: Date; endDate: Date } | Response {
  const startDate = new Date(normalizeDateString(startDateStr));
  const endDate = new Date(normalizeDateString(endDateStr));

  if (Number.isNaN(startDate.valueOf()) || Number.isNaN(endDate.valueOf())) {
    return Response.json(
      {
        form: 'create',
        errorKey: 'errors.validation.failed',
        errorMessage: 'Invalid date format. Please check your dates and times.',
      },
      { status: 400 }
    );
  }

  if (endDate <= startDate) {
    return Response.json(
      {
        form: 'create',
        errorKey: 'errors.validation.failed',
        errorMessage: 'End date must be after start date.',
      },
      { status: 400 }
    );
  }

  return { startDate, endDate };
}

export const ordersAction = createActionHandler({
  handlers: {
    POST: async ({ formData }, request) => {
      if (formData.get('_intent') !== 'create') {
        throw new Response('Invalid action', { status: 400 });
      }

      const data = await parseFormData<CreateGroupOrderFormData>(request);
      const dateResult = validateDates(data.startDate, data.endDate);

      if (dateResult instanceof Response) {
        return dateResult;
      }

      const { startDate, endDate } = dateResult;

      try {
        const created = await OrdersApi.createGroupOrder({
          name: data.name,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          organizationId: data.organizationId,
        });

        return redirect(routes.root.orderDetail({ orderId: created.id }));
      } catch (error) {
        if (isMultipleOrganizationsError(error)) {
          return Response.json(
            {
              form: 'create',
              errorKey: 'errors.validation.failed',
              errorMessage: extractErrorMessage(error),
              requiresOrganization: true,
            },
            { status: 400 }
          );
        }
        throw error;
      }
    },
  },
  getFormName: (method) => {
    if (method === 'POST') return 'create';
    return 'unknown';
  },
});

function OrdersContent({
  groupOrders,
  organizations,
}: Readonly<{
  groupOrders: LoaderData['groupOrders'];
  organizations: LoaderData['organizations'];
}>) {
  const { t } = useTranslation();
  const { formatDateTime, formatDate, formatDateOnly, formatDayName, formatTime12Hour } =
    useDateFormat();
  const actionData = useActionData<ActionData | undefined>();
  const submit = useSubmit();

  // Filter to only active organizations
  const activeOrganizations = getActiveOrganizations(organizations);
  const hasNoOrganizations = activeOrganizations.length === 0;
  const showOrganizationSelector = shouldShowOrganizationSelector(
    organizations,
    actionData?.requiresOrganization
  );

  // Get current date/time for smart defaults
  const now = new Date();
  const today = format(now, 'yyyy-MM-dd');

  // Calculate default end time based on start date/time (same day, but later)
  const getDefaultEndTime = (startDateValue: string, startTimeValue: string) => {
    const startDateTime = toDate(combineDateAndTime(startDateValue, startTimeValue));

    // Default to same day, but find a good deadline time
    // Try common deadlines: 5pm (17:00), 2pm (14:00), 12pm (12:00), or 3 hours later
    const commonDeadlines = [17, 14, 12];

    // Find the first common deadline that's at least 1 hour after start time
    for (const deadlineHour of commonDeadlines) {
      const endDateTime = setHours(startDateTime, deadlineHour);
      const hoursDiff = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60);
      if (hoursDiff >= 1) {
        return endDateTime.toISOString();
      }
    }

    // If no common deadline works, default to 3 hours later (minimum 1 hour)
    let endDateTime = addHours(startDateTime, 3);
    // Ensure at least 1-hour difference
    if (endDateTime <= startDateTime) {
      endDateTime = addHours(startDateTime, 1);
    }
    return endDateTime.toISOString();
  };

  const defaultStartTime = format(now, 'HH:mm');
  const defaultEnd = getDefaultEndTime(today, defaultStartTime);

  // Initialize form with useZodForm
  const form = useZodForm({
    schema: createGroupOrderSchema,
    defaultValues: {
      name: '',
      startDate: combineDateAndTime(today, defaultStartTime),
      endDate: defaultEnd,
      organizationId: activeOrganizations[0]?.id ?? '',
    },
  });

  const isSubmitting = form.formState.isSubmitting;

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

  // Calculate minimum date/time for closes based on start date/time
  const getMinDateTime = (startDateValue: string) => {
    const startDateTime = new Date(startDateValue);
    const dateStr = format(startDateTime, 'yyyy-MM-dd');
    return {
      date: dateStr,
      datetime: startDateTime,
    };
  };

  // Auto-adjust end date/time when start date/time changes
  useEffect(() => {
    if (!startDateValue || !endDateValue) return;

    const minDateTime = getMinDateTime(startDateValue);
    const endDateTime = new Date(endDateValue);

    // If end is before start, recalculate default end time based on new start
    if (endDateTime < minDateTime.datetime) {
      const dateStr = format(minDateTime.datetime, 'yyyy-MM-dd');
      const timeStr = format(minDateTime.datetime, 'HH:mm');
      const defaultEnd = getDefaultEndTime(dateStr, timeStr);
      form.setValue('endDate', defaultEnd);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDateValue]);

  const setQuickDeadline = (hour: number) => {
    if (!startDateValue) return;
    const minDateTime = getMinDateTime(startDateValue);
    // Set hour and minutes to 00 using date-fns
    let deadline = setMinutes(setHours(minDateTime.datetime, hour), 0);

    // If the deadline time is before or equal to the start time, move to next day
    if (deadline <= minDateTime.datetime) {
      deadline = setMinutes(addHours(setHours(minDateTime.datetime, hour), 24), 0);
    }

    form.setValue('endDate', deadline.toISOString());
  };

  // Get smart label for quick deadline button (just show time, keep it short)
  const getQuickDeadlineLabel = (hour: number): string => {
    // Create a date object with the specified hour and minutes set to 00 using date-fns
    const date = setMinutes(setHours(new Date(), hour), 0);

    // Use formatTime12Hour from useDateFormat hook for locale-aware time formatting
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
    void submit(formData, { method: 'post' });
  });

  const upcomingOrders = [...groupOrders]
    .filter((order) => toDate(order.endDate) > new Date())
    .sort((a, b) => toDate(a.startDate).getTime() - toDate(b.startDate).getTime());

  const activeCount = groupOrders.filter((order) => order.canAcceptOrders).length;

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-brand-500/20 via-slate-900/80 to-slate-950/90 p-8 shadow-[0_40px_120px_rgba(8,47,73,0.35)] backdrop-blur-sm lg:p-10">
        <div className="-top-24 absolute right-0 h-60 w-60 animate-pulse rounded-full bg-brand-400/30 blur-3xl" />
        <div className="-bottom-10 absolute left-10 h-48 w-48 rounded-full bg-purple-500/25 blur-3xl" />
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
        <section className="space-y-4">
          <header className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-lg text-white">{t('orders.list.queue.title')}</h2>
              <p className="text-slate-300 text-sm">{t('orders.list.queue.subtitle')}</p>
            </div>
            <span className="rounded-full border border-white/10 bg-slate-800/80 px-4 py-1 font-medium text-slate-300 text-xs">
              {t('orders.list.queue.scheduled', { count: groupOrders.length })}
            </span>
          </header>

          <div className="grid gap-4">
            {groupOrders.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/15 border-dashed bg-slate-900/60 p-10 text-center text-slate-300">
                <Package size={24} className="text-brand-200" />
                <p>{t('orders.list.queue.empty')}</p>
              </div>
            ) : (
              groupOrders.map((order) => (
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

              {showOrganizationSelector && (
                <Controller
                  name="organizationId"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid || actionData?.requiresOrganization}>
                      <FieldLabel htmlFor="organizationId" required>
                        {t('orders.list.form.labels.organization')}
                      </FieldLabel>
                      <Select
                        value={field.value || undefined}
                        onValueChange={field.onChange}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger
                          id="organizationId"
                          error={fieldState.invalid || actionData?.requiresOrganization}
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
                      {actionData?.requiresOrganization && !fieldState.invalid && (
                        <p className="text-rose-400 text-xs">
                          {t('orders.list.form.errors.organizationRequired')}
                        </p>
                      )}
                    </Field>
                  )}
                />
              )}

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
                        const minDateTime = getMinDateTime(startDateValue);
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
                              minDate={minDateTime.date}
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
  const { groupOrders, organizations } = useLoaderData<{
    groupOrders: Promise<LoaderData['groupOrders']>;
    organizations: Promise<LoaderData['organizations']>;
  }>();

  return (
    <Suspense fallback={<OrdersSkeleton />}>
      <Await resolve={Promise.all([groupOrders, organizations])}>
        {([resolvedGroupOrders, resolvedOrganizations]) => (
          <OrdersContent groupOrders={resolvedGroupOrders} organizations={resolvedOrganizations} />
        )}
      </Await>
    </Suspense>
  );
}
