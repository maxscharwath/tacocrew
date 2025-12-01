/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

interface PushNotificationData {
  title: string;
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: {
    url?: string;
  };
}

// Handle push notifications
self.addEventListener('push', (event) => {
  const data: PushNotificationData = event.data?.json() ?? { title: 'Notification' };
  const { title, body, icon, badge, tag, data: notificationData } = data;

  const options: NotificationOptions = {
    body,
    icon: icon ?? '/icon.png',
    badge: badge ?? '/icon.png',
    tag: tag ?? 'default',
    data: notificationData,
    requireInteraction: false,
    silent: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const notificationData = event.notification.data as { url?: string } | undefined;
  const urlToOpen = notificationData?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (_event) => {
  // Notification was dismissed
});
