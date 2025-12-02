import type { LucideIcon } from 'lucide-react';
import {
  Archive,
  ArchiveX,
  Bell,
  CircleDollarSign,
  Inbox,
  Loader2,
  Package,
  Receipt,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Button, EmptyState, SegmentedControl } from '@/components/ui';
import { useRelativeTime } from '@/hooks';
import {
  archiveAllNotifications,
  archiveNotification,
  getNotifications,
  getUnreadCount,
  markAsRead,
  type Notification,
} from '@/lib/api/notifications';
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
}: Readonly<{
  notification: Notification;
  onArchive: (id: string) => void;
  onClick: (notification: Notification) => void;
  canArchive: boolean;
  formatRelativeTime: (date: string) => string;
  archiveLabel: string;
}>) {
  const [isArchiving, setIsArchiving] = useState(false);
  const { icon: Icon, color } = NOTIFICATION_ICONS[notification.type] ?? DEFAULT_ICON;

  const handleArchive = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsArchiving(true);
    await new Promise((r) => setTimeout(r, 200)); // Animation delay
    onArchive(notification.id);
  };

  return (
    <div
      className={cn(
        'group flex w-full items-start gap-3 px-4 py-3 text-left transition-all duration-200 hover:bg-white/5',
        !notification.read && 'bg-gradient-to-r from-brand-500/10 via-brand-500/5 to-transparent',
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
                'text-sm',
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
          disabled={isArchiving}
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

export function NotificationDropdown({ onClose, onMarkAsRead }: NotificationDropdownProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { formatRelativeTime } = useRelativeTime();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<TabValue>('inbox');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [archivedCount, setArchivedCount] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isArchivingAll, setIsArchivingAll] = useState(false);

  const isArchiveTab = activeTab === 'archive';

  // Fetch notifications for current tab
  const fetchNotifications = useCallback(
    async (cursor?: string) => {
      cursor ? setIsLoadingMore(true) : setIsLoading(true);

      try {
        const data = await getNotifications({ limit: 15, cursor, archived: isArchiveTab });
        setNotifications((prev) => (cursor ? [...prev, ...data.items] : data.items));
        setNextCursor(data.nextCursor);
        setHasMore(data.hasMore);
      } catch {
        // Silently fail
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [isArchiveTab]
  );

  // Fetch counts (unread + archived) - only once on mount
  const fetchCounts = useCallback(async () => {
    try {
      const [unread, archived] = await Promise.all([
        getUnreadCount(),
        getNotifications({ limit: 1, archived: true }),
      ]);
      setUnreadCount(unread.count);
      setArchivedCount(archived.total);
    } catch {
      // Silently fail
    }
  }, []);

  // Initial load: fetch notifications + counts
  useEffect(() => {
    setNotifications([]);
    setNextCursor(null);
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  // Infinite scroll observer
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el || !hasMore || isLoadingMore) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && nextCursor) fetchNotifications(nextCursor);
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, nextCursor, isLoadingMore, fetchNotifications]);

  const refreshAfterAction = () => {
    onMarkAsRead();
    fetchCounts();
    globalThis.dispatchEvent(new CustomEvent('notificationUpdated'));
  };

  const handleClick = async (notification: Notification) => {
    if (!notification.read) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));

      try {
        await markAsRead(notification.id);
        refreshAfterAction();
      } catch {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, read: false } : n))
        );
        setUnreadCount((c) => c + 1);
      }
    }

    if (notification.url) {
      onClose();
      navigate(notification.url);
    }
  };

  const handleArchive = async (id: string) => {
    const notification = notifications.find((n) => n.id === id);
    if (!notification) return;

    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (!notification.read) setUnreadCount((c) => Math.max(0, c - 1));
    setArchivedCount((c) => c + 1);

    try {
      await archiveNotification(id);
      refreshAfterAction();
    } catch {
      setNotifications((prev) =>
        [...prev, notification].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
      if (!notification.read) setUnreadCount((c) => c + 1);
      setArchivedCount((c) => Math.max(0, c - 1));
    }
  };

  const handleArchiveAll = async () => {
    const prev = { notifications: [...notifications], unread: unreadCount };
    setNotifications([]);
    setUnreadCount(0);
    setIsArchivingAll(true);

    try {
      await archiveAllNotifications();
      setArchivedCount((c) => c + prev.notifications.length);
      refreshAfterAction();
    } catch {
      setNotifications(prev.notifications);
      setUnreadCount(prev.unread);
    } finally {
      setIsArchivingAll(false);
    }
  };

  const tabOptions = [
    {
      value: 'inbox' as const,
      label: (
        <span className="flex items-center gap-2">
          <Inbox size={14} className="shrink-0" />
          <span>{t('notifications.tabs.inbox')}</span>
          <CountBadge count={unreadCount} variant="unread" />
        </span>
      ),
    },
    {
      value: 'archive' as const,
      label: (
        <span className="flex items-center gap-2">
          <Archive size={14} className="shrink-0" />
          <span>{t('notifications.tabs.archive')}</span>
          <CountBadge count={archivedCount} variant="muted" />
        </span>
      ),
    },
  ];

  return (
    <>
      <div className="shrink-0 border-white/10 border-b px-3 py-3">
        <SegmentedControl
          value={activeTab}
          onValueChange={setActiveTab}
          options={tabOptions}
          className="w-full"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain sm:max-h-[50vh] sm:min-h-[200px]">
        {isLoading ? (
          <div className="divide-y divide-white/5">
            <NotificationSkeleton />
            <NotificationSkeleton />
            <NotificationSkeleton />
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={isArchiveTab ? Archive : Sparkles}
            title={t(isArchiveTab ? 'notifications.emptyArchive' : 'notifications.empty')}
            description={t(
              isArchiveTab ? 'notifications.emptyArchiveHint' : 'notifications.emptyHint'
            )}
            className="border-0 bg-transparent"
          />
        ) : (
          <div className="divide-y divide-white/5">
            {notifications.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onArchive={handleArchive}
                onClick={handleClick}
                canArchive={!isArchiveTab}
                formatRelativeTime={formatRelativeTime}
                archiveLabel={t('notifications.archive')}
              />
            ))}
            {hasMore && (
              <div ref={loadMoreRef} className="flex items-center justify-center py-4">
                {isLoadingMore && <Loader2 size={16} className="animate-spin text-slate-400" />}
              </div>
            )}
          </div>
        )}
      </div>

      {!isArchiveTab && notifications.length > 0 && (
        <div className="shrink-0 border-white/10 border-t bg-slate-900/50 px-3 py-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleArchiveAll}
            disabled={isArchivingAll}
            className="h-8 w-full gap-1.5 text-slate-400 text-xs hover:text-white"
          >
            {isArchivingAll ? (
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
