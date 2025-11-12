import { ArrowUpRight } from '@untitledui/icons/ArrowUpRight';
import { Calendar } from '@untitledui/icons/Calendar';
import { Package } from '@untitledui/icons/Package';
import { Truck01 } from '@untitledui/icons/Truck01';
import { addHours, format, setHours, setMinutes } from 'date-fns';
import { useEffect, useState } from 'react';
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
} from 'react-router';
import { StatBubble } from '@/components/orders';
import { Alert, Button, DateTimePicker, Input, Label, StatusBadge } from '@/components/ui';
import { useDateFormat } from '@/hooks/useDateFormat';
import { OrdersApi, UserApi } from '../lib/api';
import { ApiError } from '../lib/api/http';
import { routes } from '../lib/routes';
import { toDate } from '../lib/utils/date';

type LoaderData = {
  groupOrders: Awaited<ReturnType<typeof UserApi.getGroupOrders>>;
};

type ActionData = {
  errorKey?: string;
  errorMessage?: string;
};

export async function ordersLoader(_: LoaderFunctionArgs) {
  try {
    const groupOrders = await UserApi.getGroupOrders();
    return Response.json({ groupOrders });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      throw redirect(routes.login());
    }
    throw error;
  }
}

export async function ordersAction({ request }: ActionFunctionArgs): Promise<Response | null> {
  const formData = await request.formData();
  const intent = formData.get('_intent');

  if (intent === 'create') {
    const name = (formData.get('name') ?? '').toString().trim();
    const startDateRaw = formData.get('startDate')?.toString();
    const endDateRaw = formData.get('endDate')?.toString();

    if (!startDateRaw || !endDateRaw) {
      return Response.json({ errorKey: 'orders.list.errors.datesRequired' }, { status: 400 });
    }

    const startDate = new Date(startDateRaw);
    const endDate = new Date(endDateRaw);

    if (Number.isNaN(startDate.valueOf()) || Number.isNaN(endDate.valueOf())) {
      return Response.json({ errorKey: 'orders.list.errors.invalidDates' }, { status: 400 });
    }

    if (endDate <= startDate) {
      return Response.json({ errorKey: 'orders.list.errors.endBeforeStart' }, { status: 400 });
    }

    try {
      const created = await OrdersApi.createGroupOrder({
        name: name || undefined,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      return redirect(routes.root.orderDetail({ orderId: created.id }));
    } catch (error) {
      if (error instanceof ApiError) {
        const message =
          typeof error.body === 'object' && error.body && 'error' in error.body
            ? ((error.body as { error?: { message?: string } }).error?.message ?? error.message)
            : error.message;

        return Response.json(
          {
            errorKey: 'orders.common.errors.api',
            errorMessage: message,
          },
          { status: error.status }
        );
      }

      return Response.json({ errorKey: 'orders.list.errors.unexpected' }, { status: 500 });
    }
  }

  return null;
}

export function OrdersRoute() {
  const { t } = useTranslation();
  const {
    formatDateTime,
    formatDate,
    formatDateOnly,
    formatDayName,
    formatTime12Hour,
    formatDateTimeWithYear,
  } = useDateFormat();
  const { groupOrders } = useLoaderData() as LoaderData;
  const actionData = useActionData() as ActionData | undefined;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  // Get current date/time for smart defaults
  const now = new Date();
  const today = format(now, 'yyyy-MM-dd');

  // Calculate default end time based on start date/time (same day, but later)
  const getDefaultEndTime = (startDateValue: string, startTimeValue: string) => {
    const startDateTime = new Date(`${startDateValue}T${startTimeValue}`);

    // Default to same day, but find a good deadline time
    // Try common deadlines: 5pm (17:00), 2pm (14:00), 12pm (12:00), or 3 hours later
    const commonDeadlines = [17, 14, 12];

    // Find the first common deadline that's at least 1 hour after start time
    for (const deadlineHour of commonDeadlines) {
      const endDateTime = setHours(startDateTime, deadlineHour);
      const hoursDiff = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60);
      if (hoursDiff >= 1) {
        return format(endDateTime, "yyyy-MM-dd'T'HH:mm");
      }
    }

    // If no common deadline works, default to 3 hours later (minimum 1 hour)
    let endDateTime = addHours(startDateTime, 3);
    // Ensure at least 1 hour difference
    if (endDateTime <= startDateTime) {
      endDateTime = addHours(startDateTime, 1);
    }
    return format(endDateTime, "yyyy-MM-dd'T'HH:mm");
  };

  const [startDate, setStartDate] = useState(today);
  const [startTime, setStartTime] = useState(format(now, 'HH:mm'));
  const [endDate, setEndDate] = useState(() => {
    const defaultEnd = getDefaultEndTime(today, format(now, 'HH:mm'));
    return defaultEnd.split('T')[0];
  });
  const [endTime, setEndTime] = useState(() => {
    const defaultEnd = getDefaultEndTime(today, format(now, 'HH:mm'));
    return defaultEnd.split('T')[1];
  });

  // Get random order name from translations with date injection
  const getRandomOrderName = (): string => {
    const randomNames = t('orders.common.randomNames', { returnObjects: true }) as string[];
    if (Array.isArray(randomNames) && randomNames.length > 0) {
      const template = randomNames[Math.floor(Math.random() * randomNames.length)] || '';
      const startDateObj = new Date(`${startDate}T${startTime}`);
      // Use formatDayName for day name only (e.g., "Monday", "Lundi", "Montag")
      const dayName = formatDayName(startDateObj);
      const dateStr = formatDateOnly(startDateObj, 'MMM d');

      // Use i18n interpolation instead of manual replace
      return t(template, { day: dayName, date: dateStr });
    }
    return '';
  };

  // Set default random name when component loads (will update when dates change)
  const [defaultOrderName, setDefaultOrderName] = useState(() => getRandomOrderName());

  // Update random name when start date/time changes
  useEffect(() => {
    setDefaultOrderName(getRandomOrderName());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, startTime]);

  // Calculate minimum date/time for closes based on start date/time
  const getMinDateTime = () => {
    const startDateTime = new Date(`${startDate}T${startTime}`);
    return {
      date: startDate,
      datetime: startDateTime,
    };
  };

  // Auto-adjust end date/time when start date/time changes
  useEffect(() => {
    const minDateTime = getMinDateTime();
    const endDateTime = new Date(`${endDate}T${endTime}`);

    // If end is before start, recalculate default end time based on new start
    if (endDateTime < minDateTime.datetime) {
      const defaultEnd = getDefaultEndTime(startDate, startTime);
      setEndDate(defaultEnd.split('T')[0]);
      setEndTime(defaultEnd.split('T')[1]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, startTime]);

  const setQuickDeadline = (hour: number) => {
    const minDateTime = getMinDateTime();
    // Set hour and minutes to 00 using date-fns
    let deadline = setMinutes(setHours(minDateTime.datetime, hour), 0);

    // If the deadline time is before or equal to the start time, move to next day
    if (deadline <= minDateTime.datetime) {
      deadline = setMinutes(addHours(setHours(minDateTime.datetime, hour), 24), 0);
    }

    setEndDate(format(deadline, 'yyyy-MM-dd'));
    setEndTime(format(deadline, 'HH:mm'));
  };

  // Get smart label for quick deadline button (just show time, keep it short)
  const getQuickDeadlineLabel = (hour: number): string => {
    // Create a date object with the specified hour and minutes set to 00 using date-fns
    const date = setMinutes(setHours(new Date(), hour), 0);

    // Use formatTime12Hour from useDateFormat hook for locale-aware time formatting
    return formatTime12Hour(date);
  };

  const getStartDateTime = () => {
    return `${startDate}T${startTime}`;
  };

  const getEndDateTime = () => {
    return `${endDate}T${endTime}`;
  };

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
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
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
              icon={Truck01}
              label={t('orders.list.hero.metrics.nextDispatch')}
              value={upcomingOrders[0]?.endDate ? formatDate(upcomingOrders[0].endDate) : '—'}
              tone="sunset"
            />
          </div>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
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
                <article
                  key={order.id}
                  className="flex items-center justify-between gap-6 rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-[0_20px_60px_rgba(8,47,73,0.25)] hover:border-brand-400/30"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-brand-500/15 px-3 py-1 font-semibold text-brand-200 text-xs uppercase tracking-[0.3em]">
                        {order.name ?? t('orders.common.unnamedDrop')}
                      </span>
                      <span className="text-slate-400 text-xs">
                        {t('orders.common.labels.shortId', { id: order.id.slice(0, 8) })}
                      </span>
                    </div>
                    <p className="text-slate-200 text-sm">
                      {formatDateTime(order.startDate)} → {formatDateTime(order.endDate)}
                    </p>
                    <p className="text-slate-400 text-xs">
                      {t('orders.list.queue.createdMeta', {
                        name: order.leader?.name ?? t('orders.list.queue.unknownLeader'),
                        date: formatDateTimeWithYear(order.createdAt),
                      })}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <StatusBadge status={order.status} className="text-xs" />
                    <Link
                      to={`/orders/${order.id}`}
                      className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-brand-400/40 bg-brand-500/15 px-4 py-2 font-semibold text-brand-100 text-sm hover:border-brand-400/70"
                    >
                      {t('common.open')}
                      <ArrowUpRight size={16} />
                    </Link>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="space-y-6 rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-[0_30px_80px_rgba(8,47,73,0.28)] backdrop-blur-sm">
          <header className="space-y-1">
            <h2 className="font-semibold text-lg text-white">{t('orders.list.form.title')}</h2>
            <p className="text-slate-300 text-sm">{t('orders.list.form.subtitle')}</p>
          </header>

          <Form method="post" className="grid gap-4">
            <input type="hidden" name="_intent" value="create" />
            <input type="hidden" name="startDate" value={getStartDateTime()} />
            <input type="hidden" name="endDate" value={getEndDateTime()} />

            <div className="grid gap-2">
              <Label htmlFor="name">{t('common.labels.dropName')}</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder={t('common.placeholders.dropName')}
                defaultValue={defaultOrderName}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-4 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-brand-400" />
                <Label className="text-sm normal-case tracking-normal">
                  {t('orders.list.form.labels.timeWindow')}
                </Label>
              </div>

              <div className="grid gap-4">
                <DateTimePicker
                  label={t('orders.list.form.labels.opens')}
                  dateValue={startDate}
                  timeValue={startTime}
                  onDateChange={setStartDate}
                  onTimeChange={setStartTime}
                  disabled={isSubmitting}
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
                  <DateTimePicker
                    label={t('orders.list.form.labels.closes')}
                    dateValue={endDate}
                    timeValue={endTime}
                    onDateChange={setEndDate}
                    onTimeChange={setEndTime}
                    disabled={isSubmitting}
                    minDate={getMinDateTime().date}
                  />
                  <p className="text-slate-400 text-xs">
                    {t('orders.list.form.labels.deadlineHint')}
                  </p>
                </div>
              </div>
            </div>

            {actionData?.errorKey ? (
              <Alert tone="error">
                {t(
                  actionData.errorKey,
                  actionData.errorMessage ? { message: actionData.errorMessage } : undefined
                )}
              </Alert>
            ) : null}

            <Button type="submit" loading={isSubmitting} disabled={isSubmitting} fullWidth>
              {t('orders.list.form.actions.launch')}
            </Button>
          </Form>
        </section>
      </div>
    </div>
  );
}
