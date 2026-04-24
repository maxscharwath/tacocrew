import { NotFoundError, OrganizationAccessError } from '@tacocrew/errors';
import { Card, CardContent, CardHeader, CardTitle } from '@tacocrew/ui-kit';
import { Activity } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, type LoaderFunctionArgs, redirect, useLoaderData } from 'react-router';
import { OrderStatusStepper, TacoCard } from '@/components/orders';
import { BackButton } from '@/components/shared';
import { useDateFormat } from '@/hooks/useDateFormat';
import { getGroupOrderWithOrders, useGroupOrderWithOrders } from '@/lib/api';
import { useOrderStatus } from '@/lib/api/order-status';
import type { GroupOrderWithUserOrders, UserOrderSummary } from '@/lib/api/types';
import { routes } from '@/lib/routes';
import { getGroupOrderIdFromParams } from '@/lib/utils/order-id-extractors';

export async function orderProgressionLoader({ params }: LoaderFunctionArgs) {
  const groupOrderId = getGroupOrderIdFromParams(params);

  try {
    const data = await getGroupOrderWithOrders(groupOrderId);
    return { groupOrderId, data };
  } catch (error) {
    if (error instanceof OrganizationAccessError) {
      throw redirect(routes.organizationJoin({ id: error.organizationId }));
    }
    if (error instanceof NotFoundError) {
      throw new Response('Order not found', { status: 404 });
    }
    throw error;
  }
}

interface OrderProgressionContentProps {
  readonly groupOrderId: string;
  readonly initialData: GroupOrderWithUserOrders;
}

function OrderProgressionContent({ groupOrderId, initialData }: OrderProgressionContentProps) {
  const { t } = useTranslation();
  const { formatRelativeTime } = useDateFormat();

  const groupOrderQuery = useGroupOrderWithOrders(groupOrderId, true);
  const data = groupOrderQuery.data ?? initialData;
  const { groupOrder, userOrders } = data;

  const statusQuery = useOrderStatus(groupOrderId);
  const status = statusQuery.data?.status ?? null;
  const updatedAt = statusQuery.data?.updatedAt ?? null;

  const lastUpdatedText = updatedAt
    ? t('orders.progression.lastUpdated', { relative: formatRelativeTime(updatedAt) })
    : t('orders.progression.lastUpdatedNever');

  return (
    <div className="space-y-6">
      <BackButton
        to={routes.root.orderDetail({ orderId: groupOrderId })}
        label={t('orders.progression.back')}
      />

      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-emerald-500/10 via-slate-900/80 to-slate-950/90 p-8">
        <div className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="relative space-y-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-linear-to-br from-emerald-400 via-emerald-500 to-sky-500">
              <Activity size={24} className="text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate font-semibold text-2xl text-white tracking-tight">
                {groupOrder.name ?? t('orders.progression.title')}
              </h1>
              <p className="text-slate-300 text-sm">{t('orders.progression.subtitle')}</p>
              <p className="mt-1 text-slate-400 text-xs">{lastUpdatedText}</p>
            </div>
          </div>
        </div>
      </div>

      <OrderStatusStepper status={status} />

      <OrderItemsSummary userOrders={userOrders} />

      <div className="flex border-white/10 border-t pt-4 text-slate-400 text-sm">
        <Link
          to={routes.root.orderDetail({ orderId: groupOrderId })}
          className="inline-flex cursor-pointer items-center gap-2 text-brand-100 transition-colors hover:text-brand-50"
        >
          {t('orders.progression.back')}
        </Link>
      </div>
    </div>
  );
}

interface OrderItemsSummaryProps {
  readonly userOrders: UserOrderSummary[];
}

function OrderItemsSummary({ userOrders }: OrderItemsSummaryProps) {
  const { t } = useTranslation();

  // Flatten all user orders into a combined view for a compact summary.
  const allTacos = userOrders.flatMap((o) => o.items.tacos);
  const allExtras = userOrders.flatMap((o) => o.items.extras);
  const allDrinks = userOrders.flatMap((o) => o.items.drinks);
  const allDesserts = userOrders.flatMap((o) => o.items.desserts);

  const hasAnything =
    allTacos.length > 0 || allExtras.length > 0 || allDrinks.length > 0 || allDesserts.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-white">{t('orders.progression.items.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasAnything ? (
          <p className="text-slate-400 text-sm">{t('orders.progression.items.empty')}</p>
        ) : (
          <div className="space-y-6">
            {allTacos.length > 0 && (
              <section className="space-y-3">
                <h3 className="font-semibold text-slate-300 text-xs uppercase tracking-[0.2em]">
                  {t('orders.progression.items.tacos')}
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {allTacos.map((taco, idx) => (
                    <TacoCard key={`${taco.tacoID ?? 'mystery'}-${idx}`} taco={taco} />
                  ))}
                </div>
              </section>
            )}
            {allExtras.length > 0 && (
              <SimpleItemList
                title={t('orders.progression.items.extras')}
                items={allExtras.map((i) => ({ name: i.name, quantity: i.quantity }))}
              />
            )}
            {allDrinks.length > 0 && (
              <SimpleItemList
                title={t('orders.progression.items.drinks')}
                items={allDrinks.map((i) => ({ name: i.name, quantity: i.quantity }))}
              />
            )}
            {allDesserts.length > 0 && (
              <SimpleItemList
                title={t('orders.progression.items.desserts')}
                items={allDesserts.map((i) => ({ name: i.name, quantity: i.quantity }))}
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface SimpleItemListProps {
  readonly title: string;
  readonly items: ReadonlyArray<{ readonly name: string; readonly quantity: number }>;
}

function SimpleItemList({ title, items }: SimpleItemListProps) {
  return (
    <section className="space-y-2">
      <h3 className="font-semibold text-slate-300 text-xs uppercase tracking-[0.2em]">{title}</h3>
      <ul className="space-y-1.5">
        {items.map((item, idx) => (
          <li
            key={`${item.name}-${idx}`}
            className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-900/40 px-3 py-2 text-sm"
          >
            <span className="text-slate-200">{item.name}</span>
            <span className="text-slate-400">×{item.quantity}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function OrderProgressionRoute() {
  const { groupOrderId, data } = useLoaderData<{
    groupOrderId: string;
    data: GroupOrderWithUserOrders;
  }>();
  return <OrderProgressionContent groupOrderId={groupOrderId} initialData={data} />;
}
