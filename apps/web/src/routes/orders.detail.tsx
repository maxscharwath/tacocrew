import { Terminal } from 'lucide-react';
import { Suspense, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Await,
  Link,
  type LoaderFunctionArgs,
  redirect,
  useLoaderData,
  useNavigation,
  useParams,
} from 'react-router';
import {
  CookieInjectionModal,
  GroupOrderReceipts,
  OrderHero,
  OrdersList,
  ShareButton,
} from '@/components/orders';
import { OrderDetailSkeleton } from '@/components/skeletons';
import { Button } from '@/components/ui';
import { useDeveloperMode } from '@/hooks/useDeveloperMode';
import type { UpsertUserOrderBody } from '@/lib/api';
import { OrdersApi, StockApi } from '@/lib/api';
import { type Amount, Currency } from '@/lib/api/types';
import { routes } from '@/lib/routes';
import type {
  DeleteUserOrderFormData,
  ManageOrderStatusFormData,
  SubmitGroupOrderFormData,
  UserOrderFormData,
} from '@/lib/types/form-data';
import { createActionHandler } from '@/lib/utils/action-handler';
import { defer } from '@/lib/utils/defer';
import { parseFormData } from '@/lib/utils/form-data';
import { createDeferredWithAuth, requireSession } from '@/lib/utils/loader-helpers';

type LoaderData = {
  groupOrder: Awaited<ReturnType<typeof OrdersApi.getGroupOrderWithOrders>>['groupOrder'];
  userOrders: Awaited<ReturnType<typeof OrdersApi.getGroupOrderWithOrders>>['userOrders'];
  myOrders: Awaited<ReturnType<typeof OrdersApi.getGroupOrderWithOrders>>['userOrders'];
  isLeader: boolean;
  currentUserId: string;
  stock: Awaited<ReturnType<typeof StockApi.getStock>>;
};

type GroupOrderData = {
  groupOrder: LoaderData['groupOrder'];
  userOrders: LoaderData['userOrders'];
  myOrders: LoaderData['myOrders'];
  isLeader: LoaderData['isLeader'];
  currentUserId: LoaderData['currentUserId'];
};

async function loadOrderDetail(groupOrderId: string, userId: string) {
  const [groupOrderWithUsers, stockData] = await Promise.all([
    createDeferredWithAuth(() => OrdersApi.getGroupOrderWithOrders(groupOrderId)),
    createDeferredWithAuth(() => StockApi.getStock()),
  ]);

  const myOrders = groupOrderWithUsers.userOrders.filter((order) => order.userId === userId);
  const isLeader = groupOrderWithUsers.groupOrder.leader.id === userId;

  return {
    groupOrderData: {
      groupOrder: groupOrderWithUsers.groupOrder,
      userOrders: groupOrderWithUsers.userOrders,
      myOrders,
      isLeader,
      currentUserId: userId,
    },
    stock: stockData,
  };
}

export async function orderDetailLoader({ params }: LoaderFunctionArgs) {
  const groupOrderId = params.orderId;
  if (!groupOrderId) {
    throw new Response('Order not found', { status: 404 });
  }

  const { userId } = await requireSession();

  return defer({
    data: loadOrderDetail(groupOrderId, userId),
  });
}

/**
 * Helper to convert form data to array format
 */
function toArray(val: string | string[]): string[] {
  if (Array.isArray(val)) {
    return val;
  }
  if (val) {
    return [val];
  }
  return [];
}

/**
 * Handle group order submission
 */
async function handleSubmitGroupOrder(groupOrderId: string, request: Request) {
  const data = await parseFormData<SubmitGroupOrderFormData>(request);
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
        country: data.country,
      },
      requestedFor: data.requestedFor,
    },
    paymentMethod: data.paymentMethod,
  });
}

/**
 * Handle user order creation/update
 */
async function handleUpsertUserOrder(groupOrderId: string, request: Request) {
  const rawData = await parseFormData<UserOrderFormData>(request);
  type TacoSize = UpsertUserOrderBody['items']['tacos'][number]['size'];

  const tacoQuantity = Number(rawData.tacoQuantity) || 1;

  await OrdersApi.upsertUserOrder(groupOrderId, {
    items: {
      tacos: [
        {
          size: rawData.tacoSize as TacoSize,
          meats: toArray(rawData.meats).map((id) => ({ id, quantity: 1 })),
          sauces: toArray(rawData.sauces).map((id) => ({ id })),
          garnitures: toArray(rawData.garnitures).map((id) => ({ id })),
          note: rawData.note,
          quantity: tacoQuantity,
        },
      ],
      extras: toArray(rawData.extras).map((id) => ({ id, quantity: 1 })),
      drinks: toArray(rawData.drinks).map((id) => ({ id, quantity: 1 })),
      desserts: toArray(rawData.desserts).map((id) => ({ id, quantity: 1 })),
    },
  });
}

/**
 * Get group order ID from params or throw 404
 */
function getGroupOrderId(params?: Record<string, string | undefined>): string {
  const groupOrderId = params?.orderId;
  if (!groupOrderId) throw new Response('Order not found', { status: 404 });
  return groupOrderId;
}

/**
 * Get group order ID from URL path
 */
function getGroupOrderIdFromUrl(url: URL): string {
  const groupOrderId = url.pathname.split('/').pop();
  if (!groupOrderId) throw new Response('Order not found', { status: 404 });
  return groupOrderId;
}

export const orderDetailAction = createActionHandler({
  handlers: {
    POST: async ({ formData }, request, params) => {
      const groupOrderId = getGroupOrderId(params);

      if (formData.has('customerName')) {
        await handleSubmitGroupOrder(groupOrderId, request);
      } else if (formData.has('tacoSize')) {
        await handleUpsertUserOrder(groupOrderId, request);
      } else {
        throw new Response('Invalid POST request', { status: 400 });
      }
    },
    DELETE: async (_, request) => {
      const groupOrderId = getGroupOrderIdFromUrl(new URL(request.url));
      const data = await parseFormData<DeleteUserOrderFormData>(request);
      await OrdersApi.deleteUserOrder(groupOrderId, data.itemId);
    },
    PATCH: async (_, request) => {
      const groupOrderId = getGroupOrderIdFromUrl(new URL(request.url));
      const data = await parseFormData<ManageOrderStatusFormData>(request);
      await OrdersApi.updateGroupOrderStatus(groupOrderId, data.status);
    },
  },
  getFormName: async (method, request) => {
    if (method === 'POST') {
      const formData = await request.clone().formData();
      if (formData.has('customerName')) return 'submit';
      if (formData.has('tacoSize')) return 'user-order';
    }
    if (method === 'DELETE') return 'delete';
    if (method === 'PATCH') return 'status';
    return 'unknown';
  },
  onSuccess: (_request, params) => {
    const groupOrderId = getGroupOrderId(params);
    return redirect(routes.root.orderDetail({ orderId: groupOrderId }));
  },
});

function OrderDetailContent({
  groupOrderData,
}: Readonly<{
  groupOrderData: GroupOrderData;
  stock: LoaderData['stock'];
}>) {
  const { t } = useTranslation();
  const tt = (key: string, options?: Record<string, unknown>) => t(`orders.detail.${key}`, options);
  const { groupOrder, userOrders, isLeader, currentUserId } = groupOrderData;
  const navigation = useNavigation();
  const params = useParams();
  const isSubmitting = navigation.state === 'submitting';
  const { isEnabled: isDeveloperMode } = useDeveloperMode();
  const [isCookieModalOpen, setIsCookieModalOpen] = useState(false);

  // Check if the group order can accept new orders
  const canAddOrders = groupOrder.canAcceptOrders;
  const canSubmit = isLeader && groupOrder.canSubmitGroupOrder;
  const isSubmitted = groupOrder.status === 'submitted' || groupOrder.status === 'completed';
  const isClosedManually = groupOrder.status === 'closed';
  const statusIntent =
    isClosedManually || (isDeveloperMode && isSubmitted)
      ? 'reopen-group-order'
      : 'close-group-order';
  // Calculate total price from API response
  const totalPrice: Amount = userOrders.reduce<Amount>(
    (acc, order) => ({
      value: acc.value + order.totalPrice.value,
      currency: order.totalPrice.currency,
    }),
    { value: 0, currency: Currency.CHF }
  );

  return (
    <div className="space-y-8">
      <OrderHero
        groupOrder={groupOrder}
        userOrders={userOrders}
        totalPrice={totalPrice}
        canAddOrders={canAddOrders}
        canSubmit={canSubmit}
        orderId={params.orderId ?? ''}
        statusIntent={statusIntent}
        isClosedManually={isClosedManually}
        isSubmitting={isSubmitting}
        isLeader={isLeader}
        isDeveloperMode={isDeveloperMode}
        isSubmitted={isSubmitted}
      />

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)]">
        <OrdersList
          userOrders={userOrders}
          groupOrder={groupOrder}
          currentUserId={currentUserId}
          isLeader={isLeader}
          orderId={params.orderId ?? ''}
          isSubmitting={isSubmitting}
          canAddOrders={canAddOrders}
        />

        <div className="space-y-3 lg:sticky lg:top-8 lg:h-fit">
          <ShareButton groupOrderId={groupOrder.id} />
          {isDeveloperMode && isSubmitted && (
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
      </div>

      <GroupOrderReceipts
        groupOrder={groupOrder}
        userOrders={userOrders}
        isLeader={isLeader}
        currentUserId={currentUserId}
      />

      <CookieInjectionModal
        isOpen={isCookieModalOpen}
        onClose={() => setIsCookieModalOpen(false)}
        groupOrderId={params.orderId ?? ''}
      />

      <div className="flex flex-col gap-3 border-white/10 border-t pt-4 text-slate-400 text-sm sm:flex-row sm:items-center sm:justify-between">
        <Link
          to={routes.root.orders()}
          className="inline-flex cursor-pointer items-center gap-2 text-brand-100 transition-colors hover:text-brand-50"
        >
          {tt('list.footer.backToOrders')}
        </Link>
        <span className="text-slate-500 text-xs uppercase tracking-[0.3em]">
          {tt('list.footer.orderId')} {params.orderId}
        </span>
      </div>
    </div>
  );
}

export function OrderDetailRoute() {
  const { data } = useLoaderData<{
    data: Promise<{
      groupOrderData: GroupOrderData;
      stock: LoaderData['stock'];
    }>;
  }>();

  return (
    <Suspense fallback={<OrderDetailSkeleton />}>
      <Await resolve={data}>
        {(resolvedData) => (
          <OrderDetailContent
            groupOrderData={resolvedData.groupOrderData}
            stock={resolvedData.stock}
          />
        )}
      </Await>
    </Suspense>
  );
}
