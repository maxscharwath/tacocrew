import type { LucideIcon } from 'lucide-react';
import { Bell, Clock3, RefreshCcw, ShieldCheck, Undo2, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Avatar, Badge, Button } from '@/components/ui';
import { useLocaleFormatter } from '@/hooks/useLocaleFormatter';
import { getAvatarUrl } from '@/lib/api/user';
import { getUserInitials } from './user-utils';

export type ReceiptStatusVariant =
  | 'leader'
  | 'settled'
  | 'awaitingParticipant'
  | 'awaitingConfirmation';

const STATUS_ICONS: Record<ReceiptStatusVariant, LucideIcon> = {
  leader: ShieldCheck,
  settled: ShieldCheck,
  awaitingParticipant: Clock3,
  awaitingConfirmation: RefreshCcw,
};

const STATUS_TONES: Record<ReceiptStatusVariant, 'success' | 'warning' | 'neutral'> = {
  leader: 'success',
  settled: 'success',
  awaitingParticipant: 'warning',
  awaitingConfirmation: 'warning',
};

const BADGE_BASE_CLASS =
  'inline-flex max-w-max border px-2 py-1 text-[9px] uppercase tracking-wide';

const STATUS_BADGE_CLASS: Record<'success' | 'warning' | 'neutral', string> = {
  success: `${BADGE_BASE_CLASS} border-emerald-400/60 bg-emerald-400/90 text-emerald-950`,
  warning: `${BADGE_BASE_CLASS} border-amber-400/60 bg-amber-400/90 text-amber-950`,
  neutral: `${BADGE_BASE_CLASS} border-slate-400/60 bg-slate-400/90 text-slate-950`,
};

const ACTION_BUTTON_CLASS =
  'border border-white/20 bg-slate-900/90 text-white text-xs uppercase tracking-wide';

export type ReceiptItem = {
  name: string;
  details: string;
  price: number;
};

export type ReceiptTicketModel = {
  index: number;
  participantName: string | null;
  statusVariant: ReceiptStatusVariant;
  items: ReceiptItem[];
  subtotal: number;
  participantPaid: boolean;
  reimbursementComplete: boolean;
  canShowParticipantAction: boolean;
  canShowReimbursementAction: boolean;
  canShowSendReminder: boolean;
};

type ReceiptTicketProps = {
  ticket: ReceiptTicketModel;
  userId: string;
  timestamp: { date: string; time: string };
  feePerPerson: number;
  feeInfo: {
    total: number;
    participants: number;
  };
  currency: string;
  isBusy: boolean;
  isSendingReminder?: boolean;
  onParticipantToggle: () => void;
  onReimbursementToggle: () => void;
  onSendReminder?: () => void;
};

export function ReceiptTicket({
  ticket,
  userId,
  timestamp,
  feePerPerson,
  feeInfo,
  currency,
  isBusy,
  isSendingReminder,
  onParticipantToggle,
  onReimbursementToggle,
  onSendReminder,
}: ReceiptTicketProps) {
  const { t } = useTranslation();
  const { formatCurrency } = useLocaleFormatter(currency);
  const participantName =
    ticket.participantName ?? t('orders.detail.receipts.unknownGuest').toUpperCase();
  const userInitials = getUserInitials(participantName);
  const avatarUrl = getAvatarUrl(userId, { size: 48 });
  const total = ticket.subtotal + feePerPerson;
  const feeExplanation = t('orders.detail.receipts.feeExplanation', {
    total: formatCurrency(feeInfo.total),
    share: formatCurrency(feePerPerson),
    count: feeInfo.participants,
  });

  return (
    <div className="transform bg-white/90 p-1 shadow-2xl transition-transform hover:scale-[1.01]">
      <div className="flex h-full flex-col border-4 border-gray-300 border-dashed bg-white p-5 font-mono text-gray-900 text-xs">
        <div className="mb-3 border-gray-800 border-b-2 border-dashed pb-3">
          <div className="space-y-1 text-center">
            <p className="font-black text-lg tracking-[0.3em]">TACOCREW</p>
            <p className="font-semibold text-[10px] tracking-[0.4em]">
              {t('orders.detail.receipts.header')}
            </p>
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px]">
            <span>#{ticket.index + 1}</span>
            <div className="text-right leading-tight">
              <span className="block">{timestamp.date}</span>
              <span className="block">{timestamp.time}</span>
            </div>
          </div>
        </div>

        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Avatar color="brandHero" size="md" variant="elevated" src={avatarUrl}>
              {userInitials}
            </Avatar>
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-[0.3em]">
                {t('orders.detail.receipts.guest')}
              </p>
              <p className="font-black text-xl">{participantName}</p>
            </div>
          </div>
          <ReceiptStatusBadge
            variant={ticket.statusVariant}
            label={t(`orders.detail.receipts.status.${ticket.statusVariant}`)}
          />
        </div>

        <ReceiptItemsList
          items={ticket.items}
          itemsLabel={t('orders.detail.receipts.items')}
          currency={currency}
        />

        <ReceiptTotals
          subtotal={ticket.subtotal}
          total={total}
          feePerPerson={feePerPerson}
          currency={currency}
          labels={{
            subtotal: t('orders.detail.receipts.subtotal'),
            feeShare: t('orders.detail.receipts.deliveryFeeShare'),
            total: t('orders.detail.receipts.total'),
            explanation: feeExplanation,
          }}
        />

        <ReceiptActions
          participantPaid={ticket.participantPaid}
          reimbursementComplete={ticket.reimbursementComplete}
          canShowParticipantAction={ticket.canShowParticipantAction}
          canShowReimbursementAction={ticket.canShowReimbursementAction}
          canShowSendReminder={ticket.canShowSendReminder}
          isBusy={isBusy}
          isSendingReminder={isSendingReminder}
          labels={{
            markSelfPaid: t('orders.detail.receipts.actions.markSelfPaid'),
            unmarkSelfPaid: t('orders.detail.receipts.actions.unmarkSelfPaid'),
            confirmReceipt: t('orders.detail.receipts.actions.confirmReceipt'),
            reopenReceipt: t('orders.detail.receipts.actions.reopenReceipt'),
            sendReminder: t('orders.detail.receipts.actions.sendReminder'),
          }}
          onParticipantToggle={onParticipantToggle}
          onReimbursementToggle={onReimbursementToggle}
          onSendReminder={onSendReminder}
        />
      </div>
    </div>
  );
}

type ReceiptItemsListProps = {
  items: ReceiptItem[];
  itemsLabel: string;
  currency: string;
};

function ReceiptItemsList({ items, itemsLabel, currency }: ReceiptItemsListProps) {
  const { formatCurrency } = useLocaleFormatter(currency);
  return (
    <div className="my-3 flex-1 space-y-2 border-gray-800 border-t border-b border-dashed py-3">
      <p className="font-bold text-[10px] text-gray-500 tracking-[0.3em]">{itemsLabel}</p>
      <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
        {items.map((item, index) => (
          <div
            key={`${item.name}-${index}`}
            className="border-gray-200 border-b pb-2 last:border-b-0"
          >
            <div className="flex justify-between font-semibold text-[11px]">
              <span className="pr-3">{item.name}</span>
              <span>{formatCurrency(item.price)}</span>
            </div>
            {item.details ? <p className="text-[10px] text-gray-600">{item.details}</p> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

type ReceiptTotalsProps = {
  subtotal: number;
  total: number;
  feePerPerson: number;
  currency: string;
  labels: {
    subtotal: string;
    feeShare: string;
    total: string;
    explanation: string;
  };
};

function ReceiptTotals({ subtotal, total, feePerPerson, currency, labels }: ReceiptTotalsProps) {
  const { formatCurrency } = useLocaleFormatter(currency);
  return (
    <div className="space-y-2 rounded-lg bg-slate-100/70 p-3 text-[11px] text-slate-900">
      <div className="flex justify-between">
        <span>{labels.subtotal}</span>
        <span>{formatCurrency(subtotal)}</span>
      </div>
      <div className="flex justify-between">
        <span>{labels.feeShare}</span>
        <span>{formatCurrency(feePerPerson)}</span>
      </div>
      <p className="text-[10px] text-slate-600">{labels.explanation}</p>
      <div className="flex justify-between border-slate-300 border-t pt-2 font-black text-base">
        <span>{labels.total}</span>
        <span>{formatCurrency(total)}</span>
      </div>
    </div>
  );
}

type ReceiptActionsProps = {
  participantPaid: boolean;
  reimbursementComplete: boolean;
  canShowParticipantAction: boolean;
  canShowReimbursementAction: boolean;
  canShowSendReminder: boolean;
  isBusy: boolean;
  isSendingReminder?: boolean;
  labels: {
    markSelfPaid: string;
    unmarkSelfPaid: string;
    confirmReceipt: string;
    reopenReceipt: string;
    sendReminder: string;
  };
  onParticipantToggle: () => void;
  onReimbursementToggle: () => void;
  onSendReminder?: () => void;
};

function ReceiptActions({
  participantPaid,
  reimbursementComplete,
  canShowParticipantAction,
  canShowReimbursementAction,
  canShowSendReminder,
  isBusy,
  isSendingReminder,
  labels,
  onParticipantToggle,
  onReimbursementToggle,
  onSendReminder,
}: ReceiptActionsProps) {
  if (!canShowParticipantAction && !canShowReimbursementAction && !canShowSendReminder) {
    return null;
  }

  return (
    <div className="mt-auto flex flex-col gap-2 pt-3">
      {canShowParticipantAction && (
        <Button
          size="sm"
          variant="ghost"
          disabled={isBusy}
          onClick={onParticipantToggle}
          className={`${ACTION_BUTTON_CLASS} ${participantPaid ? 'opacity-80' : ''}`}
        >
          <div className="flex items-center gap-2">
            {participantPaid ? (
              <Undo2 className="h-3.5 w-3.5" />
            ) : (
              <Wallet className="h-3.5 w-3.5" />
            )}
            <span>{participantPaid ? labels.unmarkSelfPaid : labels.markSelfPaid}</span>
          </div>
        </Button>
      )}
      {canShowReimbursementAction && (
        <Button
          size="sm"
          variant="ghost"
          disabled={isBusy}
          onClick={onReimbursementToggle}
          className={`${ACTION_BUTTON_CLASS} ${reimbursementComplete ? 'opacity-80' : ''}`}
        >
          <div className="flex items-center gap-2">
            {reimbursementComplete ? (
              <RefreshCcw className="h-3.5 w-3.5" />
            ) : (
              <ShieldCheck className="h-3.5 w-3.5" />
            )}
            <span>{reimbursementComplete ? labels.reopenReceipt : labels.confirmReceipt}</span>
          </div>
        </Button>
      )}
      {canShowSendReminder && onSendReminder && (
        <Button
          size="sm"
          variant="ghost"
          disabled={isBusy || isSendingReminder}
          onClick={onSendReminder}
          className={`${ACTION_BUTTON_CLASS} border-amber-400/50 text-amber-100`}
        >
          <div className="flex items-center gap-2">
            <Bell className="h-3.5 w-3.5" />
            <span>{labels.sendReminder}</span>
          </div>
        </Button>
      )}
    </div>
  );
}

type ReceiptStatusBadgeProps = {
  variant: ReceiptStatusVariant;
  label: string;
};

function ReceiptStatusBadge({ variant, label }: ReceiptStatusBadgeProps) {
  const tone = STATUS_TONES[variant];
  const Icon = STATUS_ICONS[variant];

  return (
    <Badge tone={tone} className={STATUS_BADGE_CLASS[tone]}>
      <div className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        <span>{label}</span>
      </div>
    </Badge>
  );
}
