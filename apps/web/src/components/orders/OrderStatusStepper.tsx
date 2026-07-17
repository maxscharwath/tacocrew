import { Alert } from '@tacocrew/ui-kit';
import { CheckCircle2, Clock, Printer, ShoppingBag, Truck, XCircle } from 'lucide-react';
import type { ComponentType } from 'react';
import { useTranslation } from 'react-i18next';
import { ProgressStepper } from '@/components/orders/ProgressStepper';
import { ORDER_STATUS_FLOW, type OrderStatus, orderStatusLabelKey } from '@/lib/order-status';
import type { ProgressStep } from '@/types/orders';

type IconComponent = ComponentType<{ size?: number; className?: string }>;

const STATUS_ICONS: Record<OrderStatus, IconComponent> = {
  pending: Clock,
  confirmed: CheckCircle2,
  printed: Printer,
  delivering: Truck,
  completed: ShoppingBag,
  cancelled: XCircle,
};

type OrderStatusStepperProps = Readonly<{
  status: OrderStatus | null;
  /** commande.app status → ISO timestamp; shown as HH:MM under reached steps. */
  statusTimestamps?: Record<string, string> | null;
}>;

/** Format an ISO timestamp as a local wall-clock time (e.g. "08:58"). */
function formatStepTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function OrderStatusStepper({ status, statusTimestamps }: OrderStatusStepperProps) {
  const { t } = useTranslation();

  if (status === null) {
    return (
      <div className="rounded-2xl border border-white/10 border-dashed bg-slate-900/40 p-6 text-center">
        <h3 className="font-semibold text-base text-white">
          {t('orders.progression.notSubmitted.title')}
        </h3>
        <p className="mt-1 text-slate-400 text-sm">
          {t('orders.progression.notSubmitted.description')}
        </p>
      </div>
    );
  }

  if (status === 'cancelled') {
    return (
      <Alert tone="error" className="border-rose-500/40 bg-rose-500/10 text-rose-100">
        <div className="flex flex-col gap-1">
          <span className="font-semibold">{t('orders.progression.cancelled.title')}</span>
          <span className="text-rose-100/80 text-sm">
            {t('orders.progression.cancelled.description')}
          </span>
        </div>
      </Alert>
    );
  }

  // Unknown/off-flow statuses (commande.app adds them without notice) must not
  // reset the stepper: fall back to the furthest flow step present in the
  // status timestamps.
  let flowIndex = ORDER_STATUS_FLOW.indexOf(status);
  if (flowIndex === -1 && statusTimestamps) {
    flowIndex = ORDER_STATUS_FLOW.reduce(
      (max, stage, index) => (statusTimestamps[stage] !== undefined ? index : max),
      -1
    );
  }
  const steps: ProgressStep[] = ORDER_STATUS_FLOW.map((stage, index) => {
    const reachedAt = statusTimestamps?.[stage];
    return {
      key: stage,
      // `delivered` is only marked completed once reached; earlier stages fill as the
      // order progresses.
      completed: index <= flowIndex,
      label: t(orderStatusLabelKey(stage)),
      icon: STATUS_ICONS[stage],
      description: t(orderStatusLabelKey(stage)),
      ...(reachedAt !== undefined && { time: formatStepTime(reachedAt) }),
    };
  });

  return <ProgressStepper steps={steps} />;
}
