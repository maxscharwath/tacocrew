import { Plus } from '@untitledui/icons/Plus';
import { ShoppingBag01 } from '@untitledui/icons/ShoppingBag01';
import { Terminal } from '@untitledui/icons/Terminal';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  type ActionFunctionArgs,
  Link,
  type LoaderFunctionArgs,
  redirect,
  useLoaderData,
  useNavigation,
  useParams,
} from 'react-router';
import { CookieInjectionModal, OrderCard, OrderHero, ShareButton } from '@/components/orders';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
} from '@/components/ui';
import { useDeveloperMode } from '@/hooks/useDeveloperMode';
import { OrdersApi, StockApi } from '../lib/api';
import { ApiError } from '../lib/api/http';
import type { UpsertUserOrderBody } from '../lib/api/orders';
import { authClient } from '../lib/auth-client';
import { routes } from '../lib/routes';
import { toDate } from '../lib/utils/date';

type LoaderData = {
  groupOrder: Awaited<ReturnType<typeof OrdersApi.getGroupOrderWithOrders>>['groupOrder'];
  userOrders: Awaited<ReturnType<typeof OrdersApi.getGroupOrderWithOrders>>['userOrders'];
  myOrders: Awaited<ReturnType<typeof OrdersApi.getGroupOrderWithOrders>>['userOrders'];
  isLeader: boolean;
  currentUserId: string;
  stock: Awaited<ReturnType<typeof StockApi.getStock>>;
};

export async function orderDetailLoader({ params }: LoaderFunctionArgs) {
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
    const [groupOrderWithUsers, stock] = await Promise.all([
      OrdersApi.getGroupOrderWithOrders(groupOrderId),
      StockApi.getStock(),
    ]);

    const myOrders = groupOrderWithUsers.userOrders.filter((order) => order.userId === userId);
    const isLeader = groupOrderWithUsers.groupOrder.leader.id === userId;

    return Response.json({
      groupOrder: groupOrderWithUsers.groupOrder,
      userOrders: groupOrderWithUsers.userOrders,
      myOrders,
      isLeader,
      currentUserId: userId,
      stock,
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      throw redirect(routes.login());
    }
    throw error;
  }
}

export async function orderDetailAction({ request, params }: ActionFunctionArgs) {
  const groupOrderId = params.orderId;
  if (!groupOrderId) {
    throw new Response('Order not found', { status: 404 });
  }

  const formData = await request.formData();
  const intent = formData.get('_intent');

  try {
    if (intent === 'user-order') {
      type TacoSize = UpsertUserOrderBody['items']['tacos'][number]['size'];

      const size = formData.get('tacoSize')?.toString() as TacoSize | undefined;
      const meats = formData
        .getAll('meats')
        .map((value) => ({ id: value.toString(), quantity: 1 }));
      const sauces = formData.getAll('sauces').map((value) => ({ id: value.toString() }));
      const garnitures = formData.getAll('garnitures').map((value) => ({ id: value.toString() }));
      const extras = formData
        .getAll('extras')
        .map((value) => ({ id: value.toString(), quantity: 1 }));
      const drinks = formData
        .getAll('drinks')
        .map((value) => ({ id: value.toString(), quantity: 1 }));
      const desserts = formData
        .getAll('desserts')
        .map((value) => ({ id: value.toString(), quantity: 1 }));
      const note = formData.get('note')?.toString().trim();
      const tacoQuantity = Number(formData.get('tacoQuantity') ?? 1) || 1;

      if (!size || meats.length === 0 || sauces.length === 0 || garnitures.length === 0) {
        return Response.json(
          {
            form: 'user-order',
            errorKey: 'orders.detail.errors.missingSelection',
          },
          { status: 400 }
        );
      }

      await OrdersApi.upsertUserOrder(groupOrderId, {
        items: {
          tacos: [
            {
              size,
              meats,
              sauces,
              garnitures,
              note: note || undefined,
              quantity: tacoQuantity,
            },
          ],
          extras,
          drinks,
          desserts,
        },
      });

      return redirect(routes.root.orderDetail({ orderId: groupOrderId }));
    }

    if (intent === 'delete-user-order') {
      const itemId = formData.get('itemId')?.toString();
      if (!itemId) {
        return Response.json(
          { form: 'delete', errorKey: 'orders.detail.errors.missingIdentifier' },
          { status: 400 }
        );
      }

      await OrdersApi.deleteUserOrder(groupOrderId, itemId);
      return redirect(routes.root.orderDetail({ orderId: groupOrderId }));
    }

    if (intent === 'close-group-order' || intent === 'reopen-group-order') {
      const status = intent === 'close-group-order' ? 'closed' : 'open';
      await OrdersApi.updateGroupOrderStatus(groupOrderId, status);
      return redirect(routes.root.orderDetail({ orderId: groupOrderId }));
    }

    if (intent === 'submit-group-order') {
      const customerName = formData.get('customerName')?.toString().trim();
      const customerPhone = formData.get('customerPhone')?.toString().trim();
      const deliveryType = formData.get('deliveryType')?.toString() as 'livraison' | 'emporter';
      const road = formData.get('road')?.toString().trim();
      const houseNumber = formData.get('houseNumber')?.toString().trim();
      const postcode = formData.get('postcode')?.toString().trim();
      const city = formData.get('city')?.toString().trim();
      const state = formData.get('state')?.toString().trim();
      const country = formData.get('country')?.toString().trim();
      const requestedFor = formData.get('requestedFor')?.toString();

      if (
        !customerName ||
        !customerPhone ||
        !deliveryType ||
        !road ||
        !postcode ||
        !city ||
        !requestedFor
      ) {
        return Response.json(
          {
            form: 'submit',
            errorKey: 'orders.detail.errors.missingCustomerDetails',
          },
          { status: 400 }
        );
      }

      await OrdersApi.submitGroupOrder(groupOrderId, {
        customer: {
          name: customerName,
          phone: customerPhone,
        },
        delivery: {
          type: deliveryType,
          address: {
            road,
            house_number: houseNumber || undefined,
            postcode,
            city,
            state: state || undefined,
            country: country || undefined,
          },
          requestedFor,
        },
      });

      return redirect(routes.root.orderDetail({ orderId: groupOrderId }));
    }
  } catch (error) {
    if (error instanceof ApiError) {
      const errorMessage =
        typeof error.body === 'object' && error.body && 'error' in error.body
          ? ((error.body as { error?: { message?: string } }).error?.message ?? error.message)
          : error.message;

      const form =
        intent === 'submit-group-order'
          ? 'submit'
          : intent === 'delete-user-order'
            ? 'delete'
            : intent === 'close-group-order' || intent === 'reopen-group-order'
              ? 'status'
              : 'user-order';
      return Response.json({ form, errorMessage }, { status: error.status });
    }

    return Response.json(
      {
        form:
          intent === 'delete-user-order'
            ? 'delete'
            : intent === 'submit-group-order'
              ? 'submit'
              : intent === 'close-group-order' || intent === 'reopen-group-order'
                ? 'status'
                : 'user-order',
        errorKey: 'orders.detail.errors.unexpected',
      },
      { status: 500 }
    );
  }

  return redirect(`/orders/${groupOrderId}`);
}

export function OrderDetailRoute() {
  const { t } = useTranslation();
  const tt = (key: string, options?: Record<string, unknown>) => t(`orders.detail.${key}`, options);
  const { groupOrder, userOrders, isLeader, currentUserId, stock } = useLoaderData<LoaderData>();
  const navigation = useNavigation();
  const params = useParams();
  const isSubmitting = navigation.state === 'submitting';
  const { isEnabled: isDeveloperMode } = useDeveloperMode();
  const [isCookieModalOpen, setIsCookieModalOpen] = useState(false);

  // Check if the group order can accept new orders
  const canAddOrders = groupOrder.canAcceptOrders;
  const canSubmit = isLeader && groupOrder.canAcceptOrders;
  const canManageStatus =
    isLeader && groupOrder.status !== 'submitted' && groupOrder.status !== 'completed';
  const isClosedManually = groupOrder.status === 'closed';
  const statusIntent = isClosedManually ? 'reopen-group-order' : 'close-group-order';
  const currency = t('common.currency.chf');

  // Determine if the order period hasn't started yet or has expired
  const now = new Date();
  const startDate = toDate(groupOrder.startDate);
  const endDate = toDate(groupOrder.endDate);
  const nowTime = now.getTime();
  const startTime = startDate.getTime();
  const endTime = endDate.getTime();
  const isNotStartedYet = nowTime < startTime;
  const isExpired = nowTime > endTime;

  // Calculate total price across all orders
  // Backend stores taco.price as sum of meat prices only (not including base taco size price)
  // So we need: base taco size price + taco.price (meat prices)
  const totalPrice = userOrders.reduce((sum, order) => {
    // Safety check: ensure order.items exists
    if (!order.items) {
      return sum;
    }

    const taco = order.items.tacos?.[0];

    // Get base taco size price from stock
    const tacoSizeBasePrice = taco
      ? (() => {
          const tacoSize = stock.tacos.find((t) => t.code === taco.size);
          return tacoSize ? tacoSize.price * (taco.quantity ?? 1) : 0;
        })()
      : 0;

    // taco.price is already the sum of meat prices (from backend)
    const meatPrices = taco ? taco.price * (taco.quantity ?? 1) : 0;
    const tacoTotalPrice = tacoSizeBasePrice + meatPrices;

    const extras = Array.isArray(order.items.extras) ? order.items.extras : [];
    const drinks = Array.isArray(order.items.drinks) ? order.items.drinks : [];
    const desserts = Array.isArray(order.items.desserts) ? order.items.desserts : [];

    const orderTotal =
      tacoTotalPrice +
      extras.reduce((s, extra) => s + extra.price * (extra.quantity ?? 1), 0) +
      drinks.reduce((s, drink) => s + drink.price * (drink.quantity ?? 1), 0) +
      desserts.reduce((s, dessert) => s + dessert.price * (dessert.quantity ?? 1), 0);
    return sum + orderTotal;
  }, 0);

  const emptyStateDescription = canAddOrders
    ? tt('list.emptyState.description.default')
    : groupOrder.status === 'open'
      ? isNotStartedYet
        ? tt('list.emptyState.description.notStarted')
        : isExpired
          ? tt('list.emptyState.description.expired')
          : tt('list.emptyState.description.expired')
      : groupOrder.status === 'closed'
        ? tt('list.emptyState.description.closed')
        : tt('list.emptyState.description.finalized');

  return (
    <div className="space-y-8">
      <OrderHero
        groupOrder={groupOrder}
        userOrders={userOrders}
        totalPrice={totalPrice}
        currency={currency}
        canAddOrders={canAddOrders}
        canSubmit={canSubmit}
        orderId={params.orderId ?? ''}
        tt={tt}
        t={t}
        canManageStatus={canManageStatus}
        statusIntent={statusIntent}
        isClosedManually={isClosedManually}
        isSubmitting={isSubmitting}
        isLeader={isLeader}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)]">
        <Card className="border-white/10 bg-slate-900/50 p-5">
          <CardHeader className="gap-2 pb-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-linear-to-br from-brand-400 via-brand-500 to-sky-500 shadow-brand-500/25 shadow-lg">
                <ShoppingBag01 size={18} className="text-white" />
              </div>
              <div>
                <CardTitle className="text-lg text-white">{tt('list.title')}</CardTitle>
                <CardDescription className="mt-0.5 text-xs">
                  {tt('list.description')}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="gap-4 pt-0">
            {userOrders.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {userOrders.map((order) => {
                  const canEdit = isLeader || order.userId === currentUserId;
                  const canDelete = isLeader || order.userId === currentUserId;
                  const isMyOrder = order.userId === currentUserId;

                  return (
                    <OrderCard
                      key={order.id}
                      order={order}
                      isMyOrder={isMyOrder}
                      canEdit={canEdit}
                      canDelete={canDelete}
                      orderId={params.orderId ?? ''}
                      isSubmitting={isSubmitting}
                      stock={stock}
                      currency={currency}
                      tt={tt}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4 py-8">
                <EmptyState
                  icon={ShoppingBag01}
                  title={tt('list.emptyState.title')}
                  description={emptyStateDescription}
                />
                {canAddOrders && (
                  <Link
                    to={routes.root.orderCreate({ orderId: params.orderId ?? '' })}
                    className="cursor-pointer"
                  >
                    <Button fullWidth className="gap-2">
                      <Plus size={16} />
                      {tt('list.emptyState.cta')}
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {groupOrder.shareCode && (
          <div className="space-y-3 lg:sticky lg:top-8 lg:h-fit">
            <ShareButton
              groupOrderId={groupOrder.id}
              shareCode={groupOrder.shareCode}
              orderName={groupOrder.name}
            />
            {isDeveloperMode && (
              <Button
                variant="outline"
                fullWidth
                onClick={() => setIsCookieModalOpen(true)}
                className="gap-2"
              >
                <Terminal size={16} />
                Cookie Injection
              </Button>
            )}
          </div>
        )}
      </div>

      {isDeveloperMode && !groupOrder.shareCode && (
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => setIsCookieModalOpen(true)} className="gap-2">
            <Terminal size={16} />
            Cookie Injection
          </Button>
        </div>
      )}

      <CookieInjectionModal
        isOpen={isCookieModalOpen}
        onClose={() => setIsCookieModalOpen(false)}
        groupOrderId={params.orderId ?? ''}
      />

      <div className="flex flex-col gap-3 border-white/10 border-t pt-4 text-slate-400 text-sm sm:flex-row sm:items-center sm:justify-between">
        <Link
          to="/orders"
          className="inline-flex cursor-pointer items-center gap-2 text-brand-100 transition-colors hover:text-brand-50"
        >
          {tt('list.footer.backToOrders')}
        </Link>
        <span className="text-slate-500 text-xs uppercase tracking-[0.3em]">
          {tt('list.footer.orderId')} {params.orderId?.slice(0, 8)}
        </span>
      </div>
    </div>
  );
}
