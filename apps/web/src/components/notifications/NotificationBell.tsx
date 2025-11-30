import { Bell } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui';
import { usePolling } from '@/hooks';
import { getUnreadCount } from '@/lib/api/notifications';
import { NotificationDropdown } from './NotificationDropdown';

export function NotificationBell() {
  const { t } = useTranslation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  const fetchUnreadCount = async () => {
    try {
      const data = await getUnreadCount();
      setUnreadCount(data.count);
    } catch {
      // Silently fail
    }
  };

  // Smart polling - only when tab is visible
  usePolling(fetchUnreadCount, {
    interval: 30000, // 30 seconds when visible
    onlyWhenVisible: true,
    enabled: !open, // Pause polling when dropdown is open
  });

  // Listen for manual refresh events
  useEffect(() => {
    const handler = () => fetchUnreadCount();
    globalThis.addEventListener('notificationUpdated', handler);
    return () => globalThis.removeEventListener('notificationUpdated', handler);
  }, []);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
          title={t('notifications.title')}
          aria-label={t('notifications.title')}
        >
          <Bell size={16} />
          {unreadCount > 0 && (
            <span className="-top-0.5 -right-0.5 absolute flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 font-semibold text-[10px] text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 sm:w-96">
        <NotificationDropdown onClose={() => setOpen(false)} onMarkAsRead={fetchUnreadCount} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
