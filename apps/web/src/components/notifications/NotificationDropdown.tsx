import { Button, EmptyState, SegmentedControl, SegmentedControlItem } from '@tacocrew/ui-kit';
import type { LucideIcon } from 'lucide-react';
import {
  Archive,
  ArchiveX,
  Bell,
  CheckCircle,
  CircleDollarSign,
  Inbox,
  Loader2,
  Package,
  Receipt,
  Shield,
  Sparkles,
  UserMinus,
  UserPlus,
  Wallet,
  XCircle,
} from 'lucide-react';
import { type MouseEvent, type RefObject, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { useRelativeTime } from '@/hooks';
import {
  type Notification,
  useArchiveAllNotifications,
  useArchiveNotification,
  useMarkAsRead,
} from '@/lib/api/notifications';
import {
  useInfiniteNotifications,
  useUnreadNotificationsCount,
} from '@/lib/api/notifications.hooks';
import { cn } from '@/lib/utils';

interface NotificationDropdownProps {
  readonly onClose: () => void;
  readonly onMarkAsRead: () => void;
}

type TabValue = 'inbox' | 'archive';

// Notification type icons and colors
const NOTIFICATION_ICONS: Record<string, { icon: LucideIcon; color: string }> = {
  payment_reminder: { icon: Wallet, color: 'text-amber-400' },
  payment_update: { icon: CircleDollarSign, color: 'text-emerald-400' },
  reimbursement_update: { icon: Receipt, color: 'text-sky-400' },
  order_submitted: { icon: Package, color: 'text-violet-400' },
  organization_join_request: { icon: UserPlus, color: 'text-blue-400' },
  organization_join_accepted: { icon: CheckCircle, color: 'text-emerald-400' },
  organization_join_rejected: { icon: XCircle, color: 'text-rose-400' },
  organization_role_updated: { icon: Shield, color: 'text-purple-400' },
  organization_member_removed: { icon: UserMinus, color: 'text-orange-400' },
};

const DEFAULT_ICON = { icon: Bell, color: 'text-slate-400' };

function NotificationSkeleton() {
  return (
    <div className="flex animate-pulse items-start gap-3 px-4 py-3">
      <div className="mt-0.5 h-8 w-8 rounded-full bg-slate-700/50" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-3/4 rounded bg-slate-700/50" />
        <div className="h-3 w-full rounded bg-slate-700/30" />
        <div className="h-3 w-1/4 rounded bg-slate-700/30" />
      </div>
    </div>
  );
}

function NotificationItem({
  notification,
  onArchive,
  onClick,
  canArchive,
  formatRelativeTime,
  archiveLabel,
  isArchiving,
}: Readonly<{
  notification: Notification;
  onArchive: (id: string) => void;
  onClick: (notification: Notification) => void;
  canArchive: boolean;
  formatRelativeTime: (date: string) => string;
  archiveLabel: string;
  isArchiving: boolean;
}>) {
  const { icon: Icon, color } = NOTIFICATION_ICONS[notification.type] ?? DEFAULT_ICON;

  const handleArchive = (e: MouseEvent) => {
    e.stopPropagation();
    onArchive(notification.id);
  };

  return (
    <div
      className={cn(
        'group flex w-full items-start gap-3 px-4 py-3 text-left transition-all duration-300 hover:bg-white/5',
        !notification.read && 'bg-linear-to-r from-brand-500/10 via-brand-500/5 to-transparent',
        isArchiving && 'translate-x-full opacity-0'
      )}
    >
      <button
        type="button"
        onClick={() => onClick(notification)}
        className="flex min-w-0 flex-1 items-start gap-3"
      >
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800/80 ring-1 ring-white/10 transition-transform duration-200 group-hover:scale-110">
          <Icon size={16} className={color} />
        </div>

        <div className="min-w-0 flex-1 text-left">
          <div className="flex items-start justify-between gap-2">
            <p
              className={cn(
                'truncate text-sm',
                notification.read ? 'text-slate-300' : 'font-semibold text-white'
              )}
            >
              {notification.title}
            </p>
            {!notification.read && (
              <span className="relative mt-1.5 flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
              </span>
            )}
          </div>
          <p className="mt-1 line-clamp-2 text-slate-400 text-xs leading-relaxed">
            {notification.body}
          </p>
          <p className="mt-1.5 text-[11px] text-slate-500 uppercase tracking-wide">
            {formatRelativeTime(notification.createdAt)}
          </p>
        </div>
      </button>

      {canArchive && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleArchive}
          className="h-8 w-8 shrink-0 p-0 text-slate-500 opacity-0 transition-all duration-200 hover:text-slate-300 focus:opacity-100 group-hover:opacity-100"
          title={archiveLabel}
        >
          <Archive size={14} />
        </Button>
      )}
    </div>
  );
}

function CountBadge({ count, variant }: Readonly<{ count: number; variant: 'unread' | 'muted' }>) {
  if (count === 0) return null;

  const styles =
    variant === 'unread'
      ? 'bg-rose-500 text-white font-semibold'
      : 'bg-slate-600 text-slate-300 font-medium';

  return (
    <span
      className={cn(
        'flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] tabular-nums',
        styles
      )}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}

function NotificationListContent({
  isLoading,
  notifications,
  isArchiveTab,
  hasMore,
  isLoadingMore,
  loadMoreRef,
  onArchive,
  onClick,
  formatRelativeTime,
  archivingId,
}: Readonly<{
  isLoading: boolean;
  notifications: Notification[];
  isArchiveTab: boolean;
  hasMore: boolean;
  isLoadingMore: boolean;
  loadMoreRef: RefObject<HTMLDivElement | null>;
  onArchive: (id: string) => void;
  onClick: (notification: Notification) => void;
  formatRelativeTime: (date: string) => string;
  archivingId: string | null;
}>) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="divide-y divide-white/5">
        <NotificationSkeleton />
        <NotificationSkeleton />
        <NotificationSkeleton />
      </div>
    );
  }

  if (notifications.length === 0) {
    const emptyIcon = isArchiveTab ? Archive : Sparkles;
    const emptyTitle = isArchiveTab ? 'notifications.emptyArchive' : 'notifications.empty';
    const emptyDescription = isArchiveTab
      ? 'notifications.emptyArchiveHint'
      : 'notifications.emptyHint';

    return (
      <EmptyState
        icon={emptyIcon}
        title={t(emptyTitle)}
        description={t(emptyDescription)}
        className="border-0 bg-transparent"
      />
    );
  }

  return (
    <div className="divide-y divide-white/5">
      {notifications.map((n) => (
        <NotificationItem
          key={n.id}
          notification={n}
          onArchive={onArchive}
          onClick={onClick}
          canArchive={!isArchiveTab}
          formatRelativeTime={formatRelativeTime}
          archiveLabel={t('notifications.archive')}
          isArchiving={archivingId === n.id}
        />
      ))}
      {hasMore && (
        <div ref={loadMoreRef} className="flex items-center justify-center py-4">
          {isLoadingMore && <Loader2 size={16} className="animate-spin text-slate-400" />}
        </div>
      )}
    </div>
  );
}

export function NotificationDropdown({ onClose, onMarkAsRead }: NotificationDropdownProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { formatRelativeTime } = useRelativeTime();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<TabValue>('inbox');
  const [archivingId, setArchivingId] = useState<string | null>(null);

  const isArchiveTab = activeTab === 'archive';

  // Use infinite query for notifications
  const notificationsQuery = useInfiniteNotifications(isArchiveTab);
  const unreadCountQuery = useUnreadNotificationsCount();
  const archiveNotificationMutation = useArchiveNotification();
  const archiveAllNotificationsMutation = useArchiveAllNotifications();
  const markAsReadMutation = useMarkAsRead();

  // Flatten pages into a single notifications list
  const notifications = notificationsQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const isLoading = notificationsQuery.isPending;
  const hasMore = notificationsQuery.hasNextPage ?? false;
  const isFetchingNextPage = notificationsQuery.isFetchingNextPage ?? false;
  const unreadCount = unreadCountQuery.data ?? 0;

  // Tab change is handled automatically by the query key change

  // Infinite scroll observer
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el || !hasMore || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          notificationsQuery.fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, isFetchingNextPage, notificationsQuery]);

  const refreshAfterAction = () => {
    onMarkAsRead();
    unreadCountQuery.refetch();
  };

  const handleClick = async (notification: Notification) => {
    if (!notification.read) {
      try {
        await markAsReadMutation.mutateAsync(notification.id);
        refreshAfterAction();
      } catch {
        // Silently fail
      }
    }

    if (notification.url) {
      onClose();
      navigate(notification.url);
    }
  };

  const handleArchive = async (id: string) => {
    setArchivingId(id);
    try {
      await archiveNotificationMutation.mutateAsync(id);
      refreshAfterAction();
      await notificationsQuery.refetch();
    } finally {
      setArchivingId(null);
    }
  };

  const handleArchiveAll = async () => {
    await archiveAllNotificationsMutation.mutateAsync();
    refreshAfterAction();
    notificationsQuery.refetch();
  };

  return (
    <>
      <div className="shrink-0 border-white/10 border-b px-3 py-3">
        <SegmentedControl value={activeTab} onValueChange={setActiveTab} className="w-full">
          <SegmentedControlItem value="inbox">
            <span className="flex items-center gap-2">
              <Inbox size={14} className="shrink-0" />
              <span>{t('notifications.tabs.inbox')}</span>
              <CountBadge count={unreadCount} variant="unread" />
            </span>
          </SegmentedControlItem>
          <SegmentedControlItem value="archive">
            <span className="flex items-center gap-2">
              <Archive size={14} className="shrink-0" />
              <span>{t('notifications.tabs.archive')}</span>
            </span>
          </SegmentedControlItem>
        </SegmentedControl>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain sm:max-h-[50vh] sm:min-h-[200px]">
        <NotificationListContent
          isLoading={isLoading}
          notifications={notifications}
          isArchiveTab={isArchiveTab}
          hasMore={hasMore}
          isLoadingMore={isFetchingNextPage}
          loadMoreRef={loadMoreRef}
          onArchive={handleArchive}
          onClick={handleClick}
          formatRelativeTime={formatRelativeTime}
          archivingId={archivingId}
        />
      </div>

      {!isArchiveTab && notifications && notifications.length > 0 && (
        <div className="shrink-0 border-white/10 border-t bg-slate-900/50 px-3 py-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleArchiveAll}
            disabled={archiveAllNotificationsMutation.isPending}
            className="h-8 w-full gap-1.5 text-slate-400 text-xs hover:text-white"
          >
            {archiveAllNotificationsMutation.isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <ArchiveX size={14} />
            )}
            {t('notifications.archiveAll')}
          </Button>
        </div>
      )}
    </>
  );
}
