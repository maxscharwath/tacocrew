// Service Worker for Push Notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  const { title, body, icon, badge, tag, data: notificationData } = data;

  const options = {
    body,
    icon: icon ?? '/icon.png',
    badge: badge ?? '/icon.png',
    tag: tag ?? 'default',
    data: notificationData,
    requireInteraction: false,
    silent: false,
  };

  event.waitUntil(
    globalThis.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const notificationData = event.notification.data;
  const urlToOpen = notificationData?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window/tab open with the target URL
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

self.addEventListener('notificationclose', (event) => {
  // Optional: Track notification dismissals
  console.log('Notification closed:', event.notification.tag);
});

