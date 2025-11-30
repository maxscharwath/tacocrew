import { Edit, Lock, LockOpen, MoreVertical, Plus, Send, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useRevalidator } from 'react-router';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  StatusBadge,
} from '@/components/ui';
import { useDateFormat } from '@/hooks/useDateFormat';
import type { GroupOrder, UserOrderSummary } from '@/lib/api';
import { OrdersApi, resolveImageUrl } from '@/lib/api';
import { routes } from '@/lib/routes';
import { toDate } from '@/lib/utils/date';
import { EditGroupOrderDialog } from './EditGroupOrderDialog';

/**
 * OrderHero - Hero section for order detail page
 * @component
 */
type OrderHeroProps = {
  readonly groupOrder: GroupOrder;
  readonly userOrders: UserOrderSummary[];
  readonly totalPrice: number;
  readonly currency: string;
  readonly canAddOrders: boolean;
  readonly canSubmit: boolean;
  readonly orderId: string;
  readonly statusIntent?: 'close-group-order' | 'reopen-group-order';
  readonly isClosedManually?: boolean;
  readonly isSubmitting?: boolean;
  readonly isLeader?: boolean;
  readonly isDeveloperMode?: boolean;
  readonly isSubmitted?: boolean;
};

export function OrderHero({
  groupOrder,
  userOrders,
  totalPrice,
  currency,
  canAddOrders,
  canSubmit,
  orderId,
  isClosedManually = false,
  isSubmitting = false,
  isLeader = false,
  isDeveloperMode = false,
  isSubmitted = false,
}: OrderHeroProps) {
  const { t } = useTranslation();
  const { formatDateTimeRange } = useDateFormat();
  const revalidator = useRevalidator();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { status, name, startDate, endDate, leader } = groupOrder;

  // Determine which actions are available
  const canEdit = isLeader;
  const canDelete = isLeader && !isSubmitted;
  const canReopen = isLeader && isSubmitted && isDeveloperMode;

  // Show menu only if at least one action is available
  const shouldShowLeaderMenu = canEdit || canDelete || canReopen;

  const nowTime = Date.now();
  const startTime = toDate(startDate).getTime();
  const endTime = toDate(endDate).getTime();
  const isNotStartedYet = nowTime < startTime;
  const isExpired = nowTime > endTime;
  const leaderName = leader?.name ?? t('orders.detail.hero.leaderInfo.unknown');
  const leaderInitial = leaderName.slice(0, 2).toUpperCase();
  const uniqueParticipantCount = new Set(userOrders.map((o) => o.userId)).size;

  const closedReasonKey =
    status === 'open' ? (isNotStartedYet ? 'notStarted' : isExpired ? 'expired' : 'open') : status;

  const isReopening = isClosedManually || (isDeveloperMode && isSubmitted);
  const statusButtonConfig = isReopening
    ? {
        variant: 'primary' as const,
        className: 'gap-2 bg-emerald-600 text-white hover:bg-emerald-500',
        icon: <LockOpen size={18} />,
        label: t('orders.detail.hero.actions.reopenOrder'),
      }
    : {
        variant: 'outline' as const,
        className: 'gap-2 border-rose-400/60 text-rose-100 hover:bg-rose-500/20',
        icon: <Lock size={18} />,
        label: t('orders.detail.hero.actions.closeOrder'),
      };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    setShowDeleteDialog(false);
    try {
      await OrdersApi.deleteGroupOrder(groupOrder.id);
      navigate(routes.root.orders());
    } catch (error) {
      console.error('Failed to delete group order:', error);
      setIsDeleting(false);
      setShowErrorDialog(true);
    }
  };

  const handleEditSuccess = () => {
    revalidator.revalidate();
  };

  const handleStatusChange = async () => {
    const newStatus = isReopening ? 'open' : 'closed';
    try {
      await OrdersApi.updateGroupOrderStatus(groupOrder.id, newStatus);
      revalidator.revalidate();
    } catch (error) {
      console.error('Failed to update group order status:', error);
      setShowErrorDialog(true);
    }
  };

  return (
    <Card className="relative overflow-hidden border-brand-400/30 bg-linear-to-br from-brand-500/20 via-slate-900/80 to-slate-950/90 p-6 lg:p-8">
      <div className="-top-24 pointer-events-none absolute right-0 h-60 w-60 rounded-full bg-brand-400/30 blur-3xl" />
      <div className="-bottom-16 pointer-events-none absolute left-10 h-56 w-56 rounded-full bg-purple-500/25 blur-3xl" />
      <CardContent className="relative space-y-4 p-0">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone="brand" pill>
              {t('orders.detail.hero.badge')}
            </Badge>
            <StatusBadge
              status={groupOrder.status}
              label={t(`common.status.${groupOrder.status}`)}
            />
          </div>
          <div className="flex items-center gap-6 divide-x divide-white/10">
            {userOrders.length > 0 && (
              <div className="flex items-center divide-x divide-white/10 pr-6">
                <div className="pr-6 text-right">
                  <p className="font-semibold text-slate-300 text-xs uppercase tracking-wider">
                    {t('orders.detail.hero.participants.label')}
                  </p>
                  <p className="mt-1 font-bold text-2xl text-white">{uniqueParticipantCount}</p>
                  <p className="mt-0.5 text-slate-400 text-xs">
                    {t('orders.detail.hero.participants.count', { count: userOrders.length })}
                  </p>
                </div>
                <div className="pl-6 text-right">
                  <p className="font-semibold text-slate-300 text-xs uppercase tracking-wider">
                    {t('orders.detail.hero.total.label')}
                  </p>
                  <p className="mt-1 font-bold text-2xl text-brand-100">
                    {totalPrice.toFixed(2)} {currency}
                  </p>
                  <p className="mt-0.5 text-slate-400 text-xs">
                    {t('orders.detail.hero.total.caption')}
                  </p>
                </div>
              </div>
            )}
            {shouldShowLeaderMenu && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0"
                    title={t('orders.detail.hero.actions.moreOptions')}
                  >
                    <MoreVertical size={18} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canEdit && (
                    <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                      <Edit size={16} />
                      {t('orders.detail.hero.actions.editOrder')}
                    </DropdownMenuItem>
                  )}
                  {canReopen && (
                    <DropdownMenuItem
                      onClick={handleStatusChange}
                      disabled={
                        isSubmitting ||
                        (isDeveloperMode && isSubmitted && revalidator.state === 'loading')
                      }
                    >
                      {statusButtonConfig.icon}
                      {statusButtonConfig.label}
                    </DropdownMenuItem>
                  )}
                  {canDelete && (
                    <DropdownMenuItem
                      destructive
                      onClick={handleDeleteClick}
                      disabled={isDeleting || isSubmitting}
                    >
                      <Trash2 size={16} />
                      {t('orders.detail.hero.actions.deleteOrder')}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        <div className="space-y-1">
          <h1 className="font-semibold text-2xl text-white tracking-tight lg:text-3xl">
            {name ?? t('orders.common.unnamedDrop')}
          </h1>
          <p className="text-slate-200 text-sm">{formatDateTimeRange(startDate, endDate)}</p>
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
            <Avatar
              color="brandHero"
              size="md"
              variant="elevated"
              src={resolveImageUrl(leader?.image)}
              alt={leaderName}
            >
              {leaderInitial}
            </Avatar>
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-[0.3em]">
                {t('orders.detail.hero.leaderInfo.label')}
              </p>
              <p className="font-semibold text-white">
                {leaderName}{' '}
                {isLeader && (
                  <span className="font-semibold text-emerald-300 text-xs">
                    {t('orders.detail.hero.leaderInfo.you')}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 border-white/10 border-t pt-4">
          {canAddOrders ? (
            <Link to={routes.root.orderCreate({ orderId })} className="cursor-pointer">
              <Button variant="outline" className="gap-2" size="sm">
                <Plus size={16} />
                {t('orders.detail.hero.actions.create')}
              </Button>
            </Link>
          ) : (
            <Button variant="outline" className="gap-2" size="sm" disabled>
              <Lock size={16} />
              {t(`orders.detail.hero.actions.closedReasons.${closedReasonKey}`)}
            </Button>
          )}
          <div className="flex-1" />
          {canSubmit && (
            <Link to={routes.root.orderSubmit({ orderId })} className="ml-auto cursor-pointer">
              <Button
                variant="primary"
                className="gap-2 bg-linear-to-r from-emerald-500 via-emerald-600 to-teal-600 font-bold text-white shadow-emerald-500/30 shadow-xl hover:from-emerald-600 hover:via-emerald-700 hover:to-teal-700"
                size="sm"
              >
                <Send size={18} />
                {t('orders.detail.hero.actions.submit')}
              </Button>
            </Link>
          )}
        </div>
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('orders.detail.hero.actions.deleteOrder')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('orders.detail.hero.actions.deleteConfirmation', {
                orderName: name ?? t('orders.common.unnamedDrop'),
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleConfirmDelete}>
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Error Alert Dialog */}
      <AlertDialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.error')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('orders.detail.hero.actions.deleteError')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowErrorDialog(false)}>
              {t('common.ok')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Group Order Dialog */}
      <EditGroupOrderDialog
        groupOrder={groupOrder}
        isOpen={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        onSuccess={handleEditSuccess}
      />
    </Card>
  );
}
