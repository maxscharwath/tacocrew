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
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Button, SegmentedControl } from '@/components/ui';
import { useRelativeTime } from '@/hooks';
import {
  archiveAllNotifications,
  archiveNotification,
  getNotifications,
  markAsRead,
  type Notification,
} from '@/lib/api/notifications';
import { cn } from '@/lib/utils';

interface NotificationDropdownProps {
  onClose: () => void;
  onMarkAsRead: () => void;
}

type TabValue = 'inbox' | 'archive';

// Notification type configuration with icons and colors
const notificationConfig: Record<string, { icon: LucideIcon; color: string }> = {
  payment_reminder: { icon: Wallet, color: 'text-amber-400' },
  payment_update: { icon: CircleDollarSign, color: 'text-emerald-400' },
  reimbursement_update: { icon: Receipt, color: 'text-sky-400' },
  order_submitted: { icon: Package, color: 'text-violet-400' },
  default: { icon: Bell, color: 'text-slate-400' },
};

function getNotificationConfig(type: string) {
  return notificationConfig[type] || notificationConfig.default;
}

// Skeleton loader for notifications
function NotificationSkeleton() {
  return (
    <div className="flex animate-pulse items-start gap-3 px-4 py-3">
      <div className="mt-0.5 h-5 w-5 rounded-full bg-slate-700/50" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-3/4 rounded bg-slate-700/50" />
        <div className="h-3 w-full rounded bg-slate-700/30" />
        <div className="h-3 w-1/4 rounded bg-slate-700/30" />
      </div>
    </div>
  );
}

// Individual notification item with animations
function NotificationItem({
  notification,
  onArchive,
  onClick,
  showArchiveButton,
  formatRelativeTime,
  archiveLabel,
}: {
  notification: Notification;
  onArchive: (e: React.MouseEvent, id: string) => void;
  onClick: (notification: Notification) => void;
  showArchiveButton: boolean;
  formatRelativeTime: (date: string) => string;
  archiveLabel: string;
}) {
  const [isArchiving, setIsArchiving] = useState(false);
  const config = getNotificationConfig(notification.type);
  const Icon = config.icon;

  const handleArchive = async (e: React.MouseEvent) => {
    setIsArchiving(true);
    // Small delay for animation
    await new Promise((resolve) => setTimeout(resolve, 200));
    onArchive(e, notification.id);
  };

  return (
    <div
      className={cn(
        'group flex w-full items-start gap-3 px-4 py-3 text-left transition-all duration-200',
        'hover:bg-white/5',
        !notification.read && 'bg-gradient-to-r from-brand-500/10 via-brand-500/5 to-transparent',
        isArchiving && 'translate-x-full opacity-0'
      )}
    >
      <button
        type="button"
        onClick={() => onClick(notification)}
        className="flex min-w-0 flex-1 items-start gap-3"
      >
        {/* Icon with type-specific color */}
        <div
          className={cn(
            'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
            'bg-slate-800/80 ring-1 ring-white/10',
            'transition-transform duration-200 group-hover:scale-110'
          )}
        >
          <Icon size={16} className={config.color} />
        </div>

        <div className="min-w-0 flex-1 text-left">
          <div className="flex items-start justify-between gap-2">
            <p
              className={cn(
                'text-left text-sm transition-colors',
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
          <p className="mt-1 line-clamp-2 text-left text-slate-400 text-xs leading-relaxed">
            {notification.body}
          </p>
          <p className="mt-1.5 text-left text-[11px] text-slate-500 uppercase tracking-wide">
            {formatRelativeTime(notification.createdAt)}
          </p>
        </div>
      </button>

      {/* Archive button with improved hover state */}
      {showArchiveButton && (
        <button
          type="button"
          onClick={handleArchive}
          disabled={isArchiving}
          className={cn(
            'shrink-0 rounded-lg p-2 text-slate-500',
            'opacity-0 transition-all duration-200',
            'hover:bg-slate-700/50 hover:text-slate-300',
            'group-hover:opacity-100',
            'focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-brand-500/50'
          )}
          title={archiveLabel}
        >
          <Archive size={14} />
        </button>
      )}
    </div>
  );
}

export function NotificationDropdown({ onClose, onMarkAsRead }: NotificationDropdownProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { formatRelativeTime } = useRelativeTime();

  const [activeTab, setActiveTab] = useState<TabValue>('inbox');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isArchivingAll, setIsArchivingAll] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const loadMoreRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async (cursor?: string) => {
    const isFirstLoad = !cursor;
    if (isFirstLoad) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const data = await getNotifications({
        limit: 15,
        cursor,
        archived: activeTab === 'archive',
      });

      const items = isFirstLoad ? data.items : [...notifications, ...data.items];
      setNotifications(items);
      setTotal(data.total);
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);

      // Update unread count for inbox tab badge
      if (activeTab === 'inbox') {
        setUnreadCount(items.filter((n) => !n.read).length);
      }
    } catch {
      // Silently fail
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  // Fetch notifications when tab changes
  useEffect(() => {
    setNotifications([]);
    setNextCursor(null);
    fetchNotifications();
  }, [activeTab]);

  // Intersection observer for infinite scroll
  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element || !hasMore || isLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && nextCursor && !isLoadingMore) {
          fetchNotifications(nextCursor);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [hasMore, nextCursor, isLoadingMore]);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, read: true, readAt: new Date().toISOString() } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      try {
        await markAsRead(notification.id);
        onMarkAsRead();
        globalThis.dispatchEvent(new CustomEvent('notificationUpdated'));
      } catch {
        // Revert on failure
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, read: false, readAt: null } : n))
        );
        setUnreadCount((prev) => prev + 1);
      }
    }

    if (notification.url) {
      onClose();
      navigate(notification.url);
    }
  };

  const handleArchive = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    const notification = notifications.find((n) => n.id === notificationId);

    // Optimistic update
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    setTotal((prev) => prev - 1);
    if (notification && !notification.read) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    try {
      await archiveNotification(notificationId);
      onMarkAsRead();
      globalThis.dispatchEvent(new CustomEvent('notificationUpdated'));
    } catch {
      // Revert on failure
      if (notification) {
        setNotifications((prev) =>
          [...prev, notification].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        );
        setTotal((prev) => prev + 1);
        if (!notification.read) {
          setUnreadCount((prev) => prev + 1);
        }
      }
    }
  };

  const handleArchiveAll = async () => {
    // Optimistic update
    const previousNotifications = [...notifications];
    const previousTotal = total;
    setNotifications([]);
    setTotal(0);
    setUnreadCount(0);

    try {
      setIsArchivingAll(true);
      await archiveAllNotifications();
      onMarkAsRead();
      globalThis.dispatchEvent(new CustomEvent('notificationUpdated'));
    } catch {
      // Revert on failure
      setNotifications(previousNotifications);
      setTotal(previousTotal);
      setUnreadCount(previousNotifications.filter((n) => !n.read).length);
    } finally {
      setIsArchivingAll(false);
    }
  };

  const hasNotifications = notifications.length > 0;

  // Get counts for each tab
  const [archivedCount, setArchivedCount] = useState(0);

  // Fetch archived count when on inbox tab (for badge)
  useEffect(() => {
    if (activeTab === 'inbox') {
      getNotifications({ limit: 1, archived: true })
        .then((data) => setArchivedCount(data.total))
        .catch(() => {
          // Silently fail - archived count is not critical
        });
    }
  }, [activeTab, notifications.length]);

  return (
    <>
      {/* Tabs as Header */}
      <div className="border-white/10 border-b px-3 py-3">
        <SegmentedControl
          value={activeTab}
          onValueChange={setActiveTab}
          options={[
            {
              value: 'inbox' as const,
              label: (
                <span className="flex items-center gap-2">
                  <Inbox size={14} className="shrink-0" />
                  <span>{t('notifications.tabs.inbox')}</span>
                  {unreadCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1.5 font-semibold text-[10px] text-white tabular-nums">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </span>
              ),
            },
            {
              value: 'archive' as const,
              label: (
                <span className="flex items-center gap-2">
                  <Archive size={14} className="shrink-0" />
                  <span>{t('notifications.tabs.archive')}</span>
                  {archivedCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-700 px-1.5 font-medium text-[10px] text-slate-300 tabular-nums">
                      {archivedCount}
                    </span>
                  )}
                </span>
              ),
            },
          ]}
          className="w-full"
        />
      </div>

      {/* Notification List */}
      <div className="max-h-[50vh] min-h-[200px] overflow-y-auto overscroll-contain">
        {isLoading ? (
          // Skeleton loading
          <div className="divide-y divide-white/5">
            <NotificationSkeleton />
            <NotificationSkeleton />
            <NotificationSkeleton />
          </div>
        ) : notifications.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center px-4 py-12">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-800/50 ring-1 ring-white/10">
              {activeTab === 'archive' ? (
                <Archive size={28} className="text-slate-500" />
              ) : (
                <Sparkles size={28} className="text-slate-500" />
              )}
            </div>
            <p className="font-medium text-slate-300 text-sm">
              {activeTab === 'archive' ? t('notifications.emptyArchive') : t('notifications.empty')}
            </p>
            <p className="mt-1 text-center text-slate-500 text-xs">
              {activeTab === 'archive'
                ? t('notifications.emptyArchiveHint')
                : t('notifications.emptyHint')}
            </p>
          </div>
        ) : (
          // Notification list
          <div className="divide-y divide-white/5">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onArchive={handleArchive}
                onClick={handleNotificationClick}
                showArchiveButton={activeTab === 'inbox'}
                formatRelativeTime={formatRelativeTime}
                archiveLabel={t('notifications.archive')}
              />
            ))}

            {/* Load more trigger */}
            {hasMore && (
              <div ref={loadMoreRef} className="flex items-center justify-center py-4">
                {isLoadingMore && <Loader2 size={16} className="animate-spin text-slate-400" />}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer with Archive All button */}
      {activeTab === 'inbox' && hasNotifications && (
        <div className="border-white/10 border-t bg-slate-900/50 px-3 py-2">
          <Button
            type="button"
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
