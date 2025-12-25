import { Button } from '@tacocrew/ui-kit';
import { Terminal } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Link,
  type LoaderFunctionArgs,
  redirect,
  useLoaderData,
  useNavigation,
} from 'react-router';
import {
  CookieInjectionModal,
  GroupOrderReceipts,
  OrderHero,
  OrdersList,
  ShareButton,
} from '@/components/orders';
import { GroupOrderReceiptsSkeleton } from '@/components/orders/GroupOrderReceiptsSkeleton';
import { OrderHeroSkeleton } from '@/components/orders/OrderHeroSkeleton';
import { OrdersListSkeleton } from '@/components/orders/OrdersListSkeleton';
import { SectionWrapper } from '@/components/sections';
import { useDeveloperMode } from '@/hooks/useDeveloperMode';
import { useGroupOrderWithOrders } from '@/lib/api';
import { type Amount, Currency } from '@/lib/api/types';
import { useSession } from '@/lib/auth-client';
import {
  getFormHandlerName,
  handleDeleteUserOrder,
  handleSubmitGroupOrder,
  handleUpdateOrderStatus,
  handleUpsertUserOrder,
} from '@/lib/handlers/order-detail-handlers';
import { routes } from '@/lib/routes';
import { createActionHandler } from '@/lib/utils/action-handler';
import { getGroupOrderIdFromParams, getGroupOrderIdFromUrl } from '@/lib/utils/order-id-extractors';

export function orderDetailLoader({ params }: LoaderFunctionArgs) {
  const groupOrderId = getGroupOrderIdFromParams(params);
  return { groupOrderId };
}

export const orderDetailAction = createActionHandler({
  handlers: {
    POST: async ({ formData }, request, params) => {
      const groupOrderId = getGroupOrderIdFromParams(params);
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
      await handleDeleteUserOrder(groupOrderId, request);
    },
    PATCH: async (_, request) => {
      const groupOrderId = getGroupOrderIdFromUrl(new URL(request.url));
      await handleUpdateOrderStatus(groupOrderId, request);
    },
  },
  getFormName: async (method, request) => {
    if (method === 'POST') {
      const formData = await request.clone().formData();
      return getFormHandlerName(formData);
    }
    if (method === 'DELETE') return 'delete';
    if (method === 'PATCH') return 'status';
    return 'unknown';
  },
  onSuccess: (_request, params) => {
    const groupOrderId = getGroupOrderIdFromParams(params);
    return redirect(routes.root.orderDetail({ orderId: groupOrderId }));
  },
});

function OrderDetailContent({ groupOrderId }: Readonly<{ groupOrderId: string }>) {
  const { t } = useTranslation();

  const groupOrderQuery = useGroupOrderWithOrders(groupOrderId);
  const { data: session } = useSession();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';
  const { isEnabled: isDeveloperMode } = useDeveloperMode();
  const [isCookieModalOpen, setIsCookieModalOpen] = useState(false);

  const currentUserId = session?.user?.id;

  return (
    <div className="space-y-8">
      {/* Hero section with independent skeleton */}
      <SectionWrapper query={groupOrderQuery} skeleton={<OrderHeroSkeleton />}>
        {(data) => {
          const { groupOrder, userOrders } = data;
          const isLeader = currentUserId ? groupOrder.leader.id === currentUserId : false;
          const canSubmit = isLeader && groupOrder.canSubmitGroupOrder;
          const isSubmitted =
            groupOrder.status === 'submitted' || groupOrder.status === 'completed';
          const isClosedManually = groupOrder.status === 'closed';
          const totalPrice: Amount = userOrders.reduce<Amount>(
            (acc, order) => ({
              value: acc.value + order.totalPrice.value,
              currency: order.totalPrice.currency,
            }),
            { value: 0, currency: Currency.CHF }
          );

          return (
            <OrderHero
              groupOrder={groupOrder}
              userOrders={userOrders}
              totalPrice={totalPrice}
              canAddOrders={groupOrder.canAcceptOrders}
              canSubmit={canSubmit}
              orderId={groupOrderId}
              isClosedManually={isClosedManually}
              isSubmitting={isSubmitting}
              isLeader={isLeader}
              isDeveloperMode={isDeveloperMode}
              isSubmitted={isSubmitted}
            />
          );
        }}
      </SectionWrapper>

      {/* Orders list and sidebar */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)]">
        {/* Orders list section with independent skeleton */}
        <SectionWrapper query={groupOrderQuery} skeleton={<OrdersListSkeleton />}>
          {(data) => {
            const { groupOrder, userOrders } = data;
            const isLeader = currentUserId ? groupOrder.leader.id === currentUserId : false;

            return (
              <OrdersList
                userOrders={userOrders}
                groupOrder={groupOrder}
                currentUserId={currentUserId}
                isLeader={isLeader}
                orderId={groupOrderId}
                isSubmitting={isSubmitting}
                canAddOrders={groupOrder.canAcceptOrders}
              />
            );
          }}
        </SectionWrapper>

        {/* Sidebar */}
        <SectionWrapper
          query={groupOrderQuery}
          skeleton={<div className="h-32 rounded-lg bg-slate-900/50" />}
        >
          {(data) => {
            const { groupOrder } = data;
            const isSubmitted =
              groupOrder.status === 'submitted' || groupOrder.status === 'completed';

            return (
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
            );
          }}
        </SectionWrapper>
      </div>

      {/* Receipts section with independent skeleton */}
      <SectionWrapper query={groupOrderQuery} skeleton={<GroupOrderReceiptsSkeleton />}>
        {(data) => {
          const { groupOrder, userOrders } = data;
          const isLeader = currentUserId ? groupOrder.leader.id === currentUserId : false;

          return (
            <GroupOrderReceipts
              groupOrder={groupOrder}
              userOrders={userOrders}
              isLeader={isLeader}
              currentUserId={currentUserId}
            />
          );
        }}
      </SectionWrapper>

      {/* Modal and footer */}
      <CookieInjectionModal
        isOpen={isCookieModalOpen}
        onClose={() => setIsCookieModalOpen(false)}
        groupOrderId={groupOrderId}
      />

      <div className="flex flex-col gap-3 border-white/10 border-t pt-4 text-slate-400 text-sm sm:flex-row sm:items-center sm:justify-between">
        <Link
          to={routes.root.orders()}
          className="inline-flex cursor-pointer items-center gap-2 text-brand-100 transition-colors hover:text-brand-50"
        >
          {t('orders.detail.list.footer.backToOrders')}
        </Link>
        <span className="text-slate-500 text-xs uppercase tracking-[0.3em]">
          {t('orders.detail.list.footer.orderId')} {groupOrderId}
        </span>
      </div>
    </div>
  );
}

export function OrderDetailRoute() {
  const { groupOrderId } = useLoaderData<{ groupOrderId: string }>();
  return <OrderDetailContent groupOrderId={groupOrderId} />;
}
