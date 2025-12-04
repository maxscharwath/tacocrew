import { Phone, ScrollText } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRevalidator } from 'react-router';
import { toast } from 'sonner';
import {
  type ReceiptItem,
  type ReceiptStatusVariant,
  ReceiptTicket,
  type ReceiptTicketModel,
} from '@/components/orders/ReceiptTicket';
import { Avatar, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { useLocaleFormatter } from '@/hooks/useLocaleFormatter';
import { calculateOrderPrice } from '@/hooks/useOrderPrice';
import type { StockResponse } from '@/lib/api';
import { OrdersApi } from '@/lib/api';
import { sendPaymentReminder } from '@/lib/api/notifications';
import type { GroupOrder, UserOrderSummary } from '@/lib/api/types';
import { formatPhoneNumber } from '@/utils/phone-formatter';

type GroupedOrders = {
  userId: string;
  name: string | null | undefined;
  orders: UserOrderSummary[];
};

type ReceiptViewModel = {
  group: GroupedOrders;
  subtotal: number;
  items: ReceiptItem[];
  reimbursementComplete: boolean;
  participantPaid: boolean;
  isLeaderReceipt: boolean;
  canSendReminder: boolean;
};

type ProcessingState = {
  userId: string;
  action: 'reimburse' | 'paid' | 'reminder';
} | null;

function formatTacoDetails(order: UserOrderSummary['items']['tacos'][number]) {
  const details: string[] = [];
  if (order.meats.length > 0) {
    details.push(order.meats.map((meat) => meat.name).join(', '));
  }
  if (order.garnitures.length > 0) {
    details.push(order.garnitures.map((item) => item.name).join(', '));
  }
  if (order.sauces.length > 0) {
    details.push(order.sauces.map((item) => item.name).join(', '));
  }
  return details.join(' • ');
}

function buildReceiptItems(order: UserOrderSummary, stock: StockResponse): ReceiptItem[] {
  const items: ReceiptItem[] = [];

  for (const taco of order.items.tacos) {
    const sizePrice = stock.tacos.find((size) => size.code === taco.size)?.price ?? 0;
    const subtotal = (sizePrice + taco.price) * (taco.quantity ?? 1);
    items.push({
      name: `${taco.size.toUpperCase()} x${taco.quantity ?? 1}`,
      details: formatTacoDetails(taco),
      price: subtotal,
    });
  }

  const addCollection = (
    collection: typeof order.items.extras | typeof order.items.drinks | typeof order.items.desserts
  ) => {
    for (const item of collection) {
      items.push({
        name: `${item.name}${item.quantity > 1 ? ` x${item.quantity}` : ''}`,
        details: '',
        price: item.price * (item.quantity ?? 1),
      });
    }
  };

  addCollection(order.items.extras);
  addCollection(order.items.drinks);
  addCollection(order.items.desserts);

  return items;
}

function resolveReceiptStatusVariant(receipt: ReceiptViewModel): ReceiptStatusVariant {
  if (receipt.isLeaderReceipt) {
    return 'leader';
  }
  if (receipt.reimbursementComplete) {
    return 'settled';
  }
  if (!receipt.participantPaid) {
    return 'awaitingParticipant';
  }
  return 'awaitingConfirmation';
}

type GroupOrderReceiptsProps = {
  readonly groupOrder: GroupOrder;
  readonly userOrders: UserOrderSummary[];
  readonly stock: StockResponse;
  readonly currency: string;
  readonly isLeader: boolean;
  readonly currentUserId: string;
};

export function GroupOrderReceipts({
  groupOrder,
  userOrders,
  stock,
  currency,
  isLeader,
  currentUserId,
}: GroupOrderReceiptsProps) {
  // ALL hooks must be called unconditionally before any early returns
  const { t } = useTranslation();
  const revalidator = useRevalidator();
  const { formatDate, formatTime } = useLocaleFormatter(currency);
  const [processing, setProcessing] = useState<ProcessingState>(null);

  // Conditional checks
  const hasFee = groupOrder.fee !== undefined && groupOrder.fee !== null;
  const shouldShowReceipts = groupOrder.status === 'submitted' || groupOrder.status === 'completed';
  const canRender = userOrders.length > 0 && hasFee && shouldShowReceipts;

  // Group orders by user (React Compiler will memoize automatically)
  const groupedOrders: GroupedOrders[] = canRender
    ? (() => {
        const map = new Map<string, GroupedOrders>();

        for (const order of userOrders) {
          const existing = map.get(order.userId);
          if (existing) {
            existing.orders.push(order);
          } else {
            map.set(order.userId, { userId: order.userId, name: order.name, orders: [order] });
          }
        }

        return Array.from(map.values()).sort((a, b) => {
          const nameA = (a.name ?? '').trim().toLowerCase();
          const nameB = (b.name ?? '').trim().toLowerCase();
          if (nameA && nameB) {
            return nameA.localeCompare(nameB);
          }
          if (nameA) return -1;
          if (nameB) return 1;
          return a.userId.localeCompare(b.userId);
        });
      })()
    : [];

  // Build receipt view models (React Compiler will memoize automatically)
  const receipts: ReceiptViewModel[] = canRender
    ? groupedOrders.map((group) => {
        const items = group.orders.flatMap((order) => buildReceiptItems(order, stock));
        const subtotal = group.orders.reduce(
          (sum, order) => sum + calculateOrderPrice(order, stock),
          0
        );
        const reimbursementComplete = group.orders.every((order) => order.reimbursement.settled);
        const isLeaderReceipt = group.userId === groupOrder.leader.id;
        const participantPaid = isLeaderReceipt
          ? true
          : group.orders.every((order) => order.participantPayment.paid);

        // Leader can send reminder when order hasn't been confirmed yet (participant might have lied about paying)
        const canSendReminder = isLeader && !isLeaderReceipt && !reimbursementComplete;

        return {
          group,
          items,
          subtotal,
          reimbursementComplete,
          participantPaid,
          isLeaderReceipt,
          canSendReminder,
        } satisfies ReceiptViewModel;
      })
    : [];

  const totalFee = groupOrder.fee ?? 0;
  const participantCount = receipts.length || 1;
  const feePerPerson = participantCount > 0 ? totalFee / participantCount : 0;
  const displayDate = new Date(groupOrder.updatedAt ?? groupOrder.endDate ?? groupOrder.startDate);
  const ticketTime = formatTime(displayDate, { hour: '2-digit', minute: '2-digit' });
  const ticketDate = formatDate(displayDate, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const sectionTitle = t('orders.detail.receipts.badge');
  const sectionSubtitle = t('orders.detail.receipts.subtitle');

  const toggleParticipantPayment = async (
    userId: string,
    orders: UserOrderSummary[],
    paid: boolean
  ) => {
    setProcessing({ userId, action: 'paid' });
    try {
      await Promise.all(
        orders.map((order) =>
          OrdersApi.updateUserOrderParticipantPayment(groupOrder.id, order.id, paid)
        )
      );
      revalidator.revalidate();
    } catch (error) {
      console.error('Failed to update participant payment status', error);
    } finally {
      setProcessing(null);
    }
  };

  const toggleReimbursement = async (
    userId: string,
    orders: UserOrderSummary[],
    settled: boolean
  ) => {
    setProcessing({ userId, action: 'reimburse' });
    try {
      await Promise.all(
        orders.map((order) =>
          OrdersApi.updateUserOrderReimbursementStatus(groupOrder.id, order.id, settled)
        )
      );
      revalidator.revalidate();
    } catch (error) {
      console.error('Failed to update reimbursement status', error);
    } finally {
      setProcessing(null);
    }
  };

  const handleSendReminder = async (userId: string, orders: UserOrderSummary[]) => {
    setProcessing({ userId, action: 'reminder' });
    try {
      // Send reminder for the first order
      const order = orders[0];
      if (order) {
        await sendPaymentReminder(groupOrder.id, order.id);
        toast.success(t('orders.detail.receipts.toast.reminderSent'));
      }
    } catch (error) {
      console.error('Failed to send payment reminder', error);
      toast.error(t('orders.detail.receipts.toast.reminderFailed'));
    } finally {
      setProcessing(null);
    }
  };

  // Build ticket entries (React Compiler will memoize automatically)
  const ticketEntries = canRender
    ? receipts.map((receipt, index) => ({
        key: receipt.group.userId,
        model: {
          index,
          participantName: receipt.group.name ? receipt.group.name.toUpperCase() : null,
          statusVariant: resolveReceiptStatusVariant(receipt),
          items: receipt.items,
          subtotal: receipt.subtotal,
          participantPaid: receipt.participantPaid,
          reimbursementComplete: receipt.reimbursementComplete,
          canShowParticipantAction: receipt.group.userId === currentUserId && !isLeader,
          canShowReimbursementAction: isLeader && !receipt.isLeaderReceipt,
          canShowSendReminder: receipt.canSendReminder,
        } satisfies ReceiptTicketModel,
        userId: receipt.group.userId,
        orders: receipt.group.orders,
        participantPaid: receipt.participantPaid,
        reimbursementComplete: receipt.reimbursementComplete,
        canSendReminder: receipt.canSendReminder,
      }))
    : [];

  // Now we can safely do conditional rendering (not early return)
  if (!canRender) {
    return null;
  }

  return (
    <Card className="border-white/10 bg-slate-900/50">
      <CardHeader className="gap-2">
        <div className="flex items-center gap-3">
          <Avatar color="brandHero" size="md" variant="elevated">
            <ScrollText />
          </Avatar>
          <div>
            <CardTitle className="text-lg text-white">{sectionTitle}</CardTitle>
            <CardDescription className="mt-0.5 text-xs">{sectionSubtitle}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Leader Phone Number for Reimbursement */}
        {groupOrder.leader.phone && (
          <div className="rounded-xl border border-brand-400/30 bg-brand-500/10 p-4">
            <div className="flex items-center gap-3">
              <Avatar color="brandHero" size="sm" variant="elevated">
                <Phone />
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold text-brand-100 text-sm">
                  {t('orders.detail.receipts.leaderPhone.title')}
                </p>
                <p className="mt-1 text-brand-200 text-xs">
                  {t('orders.detail.receipts.leaderPhone.description')}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-brand-50 text-lg">
                  {formatPhoneNumber(groupOrder.leader.phone)}
                </p>
                <p className="mt-0.5 text-brand-300 text-xs">
                  {t('orders.detail.receipts.leaderPhone.twint')}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {ticketEntries.map(
            ({
              key,
              model,
              userId,
              orders,
              participantPaid,
              reimbursementComplete,
              canSendReminder,
            }) => (
              <ReceiptTicket
                key={key}
                ticket={model}
                userId={userId}
                timestamp={{ date: ticketDate, time: ticketTime }}
                feePerPerson={feePerPerson}
                feeInfo={{ total: totalFee, participants: participantCount }}
                currency={currency}
                isBusy={processing?.userId === userId && processing.action !== 'reminder'}
                isSendingReminder={
                  processing?.userId === userId && processing.action === 'reminder'
                }
                onParticipantToggle={() =>
                  toggleParticipantPayment(userId, orders, !participantPaid)
                }
                onReimbursementToggle={() =>
                  toggleReimbursement(userId, orders, !reimbursementComplete)
                }
                onSendReminder={
                  canSendReminder ? () => handleSendReminder(userId, orders) : undefined
                }
              />
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
}
