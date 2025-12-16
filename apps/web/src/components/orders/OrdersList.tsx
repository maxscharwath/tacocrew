import {
  Avatar,
  AvatarFallback,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
} from '@tacocrew/ui-kit';
import { Plus, ShoppingBag } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useRevalidator } from 'react-router';
import type { GroupOrder, UserOrderSummary } from '@/lib/api/types';
import { routes } from '@/lib/routes';
import { getOrderPermissions, useEmptyStateDescription } from '@/utils/order-helpers';
import { OrderCard } from './OrderCard';

type OrdersListProps = Readonly<{
  userOrders: UserOrderSummary[];
  groupOrder: GroupOrder;
  currentUserId: string;
  isLeader: boolean;
  orderId: string;
  isSubmitting: boolean;
  canAddOrders: boolean;
}>;

export function OrdersList({
  userOrders,
  groupOrder,
  currentUserId,
  isLeader,
  orderId,
  isSubmitting,
  canAddOrders,
}: OrdersListProps) {
  const { t } = useTranslation();
  const revalidator = useRevalidator();
  const emptyStateDescription = useEmptyStateDescription(canAddOrders, groupOrder);

  return (
    <Card className="border-white/10 bg-slate-900/50">
      <CardHeader className="gap-2">
        <div className="flex items-center gap-3">
          <Avatar color="brandHero" size="md" variant="elevated">
            <AvatarFallback>
              <ShoppingBag />
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-lg text-white">{t('orders.detail.list.title')}</CardTitle>
            <CardDescription className="mt-0.5 text-xs">
              {t('orders.detail.list.description')}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="gap-4">
        {userOrders.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {userOrders.map((order) => {
              const { canEdit, canDelete, isMyOrder } = getOrderPermissions(
                order,
                currentUserId,
                isLeader
              );

              return (
                <OrderCard
                  key={order.id}
                  order={order}
                  isMyOrder={isMyOrder}
                  canEdit={canEdit}
                  canDelete={canDelete}
                  orderId={orderId}
                  isSubmitting={isSubmitting}
                  onDuplicate={() => {
                    revalidator.revalidate();
                  }}
                  onOrderChange={() => {
                    revalidator.revalidate();
                  }}
                />
              );
            })}
          </div>
        ) : (
          <div className="space-y-4 py-8">
            <EmptyState
              icon={ShoppingBag}
              title={t('orders.detail.list.emptyState.title')}
              description={emptyStateDescription}
            />
            {canAddOrders && (
              <Link to={routes.root.orderCreate({ orderId })} className="cursor-pointer">
                <Button fullWidth className="gap-2">
                  <Plus size={16} />
                  {t('orders.detail.list.emptyState.cta')}
                </Button>
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
