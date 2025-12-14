import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@tacocrew/ui-kit';
import { Bell } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { usePolling } from '@/hooks';
import { getUnreadCount } from '@/lib/api/notifications';
import { NotificationDropdown } from './NotificationDropdown';

// Hook to detect mobile screen size
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(globalThis.matchMedia('(max-width: 640px)').matches);
    };

    checkMobile();
    const mediaQuery = globalThis.matchMedia('(max-width: 640px)');
    mediaQuery.addEventListener('change', checkMobile);

    return () => mediaQuery.removeEventListener('change', checkMobile);
  }, []);

  return isMobile;
}

export function NotificationBell() {
  const { t } = useTranslation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

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

  const triggerButton = (
    <button
      type="button"
      className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
      title={t('notifications.title')}
      aria-label={t('notifications.title')}
      onClick={() => setOpen(true)}
    >
      <Bell size={16} />
      {unreadCount > 0 && (
        <span className="-top-0.5 -right-0.5 absolute flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 font-semibold text-[10px] text-white">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );

  // Lock body scroll when mobile modal is open
  useEffect(() => {
    if (isMobile && open) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isMobile, open]);

  // Use Modal on mobile (fullscreen), DropdownMenu on desktop
  if (isMobile) {
    return (
      <>
        {triggerButton}
        {open &&
          createPortal(
            <div className="fixed inset-0 z-[9999] flex h-screen w-screen flex-col bg-slate-950">
              {/* Header */}
              <div className="flex shrink-0 items-center justify-between border-white/10 border-b bg-slate-900/95 px-4 py-3">
                <h2 className="font-semibold text-lg text-white">{t('notifications.title')}</h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label={t('common.close')}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              </div>
              {/* Content */}
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <NotificationDropdown
                  onClose={() => setOpen(false)}
                  onMarkAsRead={fetchUnreadCount}
                />
              </div>
            </div>,
            document.body
          )}
      </>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>{triggerButton}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 sm:w-96">
        <NotificationDropdown onClose={() => setOpen(false)} onMarkAsRead={fetchUnreadCount} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
