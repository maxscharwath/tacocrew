import { ShoppingBag01 } from '@untitledui/icons/ShoppingBag01';
import { useTranslation } from 'react-i18next';
import { Link, type LoaderFunctionArgs, redirect, useLoaderData, useParams } from 'react-router';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
} from '@/components/ui';
import { useDateFormat } from '../hooks/useDateFormat';
import { OrdersApi } from '../lib/api';
import { ApiError } from '../lib/api/http';
import { authClient } from '../lib/auth-client';
import { routes } from '../lib/routes';
import { toDate } from '../lib/utils/date';

type LoaderData = {
  groupOrder: Awaited<ReturnType<typeof OrdersApi.getGroupOrderPublic>>['groupOrder'];
  userOrders: Awaited<ReturnType<typeof OrdersApi.getGroupOrderPublic>>['userOrders'];
  isAuthenticated: boolean;
};

export async function orderJoinLoader({ params }: LoaderFunctionArgs) {
  const orderId = params.orderId;
  if (!orderId) {
    throw new Response('Order not found', { status: 404 });
  }

  try {
    const groupOrderData = await OrdersApi.getGroupOrderPublic(orderId);
    const session = await authClient.getSession();

    return Response.json({
      groupOrder: groupOrderData.groupOrder,
      userOrders: groupOrderData.userOrders,
      isAuthenticated: !!session?.data?.user,
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      throw new Response('Order not found', { status: 404 });
    }
    throw error;
  }
}

export function OrderJoinRoute() {
  const { t } = useTranslation();
  const { formatDateTime } = useDateFormat();
  const { groupOrder, userOrders, isAuthenticated } = useLoaderData() as LoaderData;
  const params = useParams();

  const canAddOrders = groupOrder.canAcceptOrders;
  const now = new Date();
  const endDate = toDate(groupOrder.endDate);
  const isExpired = now > endDate;

  // Determine status message
  let statusMessage = '';
  let statusDescription = '';

  if (groupOrder.status === 'submitted' || groupOrder.status === 'completed') {
    statusMessage = t('orders.join.closed');
    statusDescription = t('orders.detail.list.emptyState.description.finalized');
  } else if (groupOrder.status === 'closed') {
    statusMessage = t('orders.join.closed');
    statusDescription = t('orders.detail.list.emptyState.description.closed');
  } else if (isExpired) {
    statusMessage = t('orders.join.expired');
    statusDescription = t('orders.detail.list.emptyState.description.expired');
  } else if (!canAddOrders && groupOrder.status === 'open') {
    statusMessage = t('orders.join.notStarted');
    statusDescription = t('orders.detail.list.emptyState.description.notStarted');
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="container mx-auto max-w-4xl px-6 py-12">
        <div className="space-y-8">
          {/* Hero Section */}
          <div className="space-y-4 text-center">
            <h1 className="font-bold text-3xl text-white">{t('orders.join.title')}</h1>
            <p className="text-slate-300">{t('orders.join.subtitle')}</p>
            {groupOrder.name && (
              <p className="font-semibold text-brand-400 text-xl">{groupOrder.name}</p>
            )}
          </div>

          {/* Order Info Card */}
          <Card className="border-white/10 bg-slate-900/50">
            <CardHeader>
              <CardTitle className="text-white">{t('orders.detail.hero.badge')}</CardTitle>
              <CardDescription>
                {formatDateTime(groupOrder.startDate)} → {formatDateTime(groupOrder.endDate)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">
                  {t('orders.join.deadline', { time: formatDateTime(groupOrder.endDate) })}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">
                  {t('orders.detail.hero.participants.label')}
                </span>
                <span className="font-semibold text-lg text-white">
                  {t('orders.detail.hero.participants.count', { count: userOrders.length })}
                </span>
              </div>

              {statusMessage && (
                <div className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-4 py-3">
                  <p className="font-medium text-amber-200 text-sm">{statusMessage}</p>
                  <p className="mt-1 text-amber-300/80 text-xs">{statusDescription}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            {canAddOrders && !isAuthenticated && (
              <div className="rounded-lg border border-brand-400/30 bg-brand-500/10 px-4 py-3">
                <p className="mb-3 text-brand-200 text-sm">{t('orders.join.signInPrompt')}</p>
                <Link
                  to={routes.login({
                    search: {
                      redirect: `/orders/${params.orderId}/join`,
                    },
                  })}
                >
                  <Button fullWidth className="gap-2">
                    {t('common.signIn')}
                  </Button>
                </Link>
              </div>
            )}

            {canAddOrders && isAuthenticated && (
              <Link to={routes.root.orderCreate({ orderId: params.orderId ?? '' })}>
                <Button fullWidth size="lg" className="gap-2">
                  <ShoppingBag01 size={20} />
                  {t('orders.join.joinButton')}
                </Button>
              </Link>
            )}

            <Link to={routes.root.orderDetail({ orderId: params.orderId ?? '' })}>
              <Button variant="outline" fullWidth>
                {t('orders.join.viewOrders')}
              </Button>
            </Link>
          </div>

          {/* Orders Preview */}
          {userOrders.length > 0 && (
            <Card className="border-white/10 bg-slate-900/50">
              <CardHeader>
                <CardTitle className="text-white">{t('orders.detail.list.title')}</CardTitle>
                <CardDescription>
                  {t('orders.join.participants', { count: userOrders.length })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {userOrders.slice(0, 5).map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between rounded-lg border border-white/5 bg-slate-800/40 px-4 py-2"
                    >
                      <span className="text-slate-300 text-sm">
                        {order.username || t('orders.detail.list.unknownUser')}
                      </span>
                      <span className="text-slate-400 text-xs">
                        {order.items.tacos.length > 0
                          ? t('orders.detail.list.tagCounts.tacos', {
                              count: order.items.tacos.reduce(
                                (sum, t) => sum + (t.quantity || 1),
                                0
                              ),
                            })
                          : t('orders.detail.list.extrasOnly')}
                      </span>
                    </div>
                  ))}
                  {userOrders.length > 5 && (
                    <p className="pt-2 text-center text-slate-400 text-xs">
                      +{userOrders.length - 5}{' '}
                      {t('orders.join.participants', { count: userOrders.length - 5 })}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {userOrders.length === 0 && (
            <EmptyState
              icon={ShoppingBag01}
              title={t('orders.detail.list.emptyState.title')}
              description={t('orders.detail.list.emptyState.description.default')}
            />
          )}
        </div>
      </div>
    </div>
  );
}
