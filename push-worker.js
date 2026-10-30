self.addEventListener('push', event => {
  event.waitUntil(self.registration.showNotification('Famli', {
    body: 'У вас новое задание. Откройте Famli, чтобы посмотреть его.',
    icon: new URL('../icons/Icon-192.png', self.registration.scope).href,
    tag: 'famli-task',
    data: { url: new URL('../', self.registration.scope).href }
  }));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil((async () => {
    const url = event.notification.data.url;
    const windows = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    const existing = windows.find(window => window.url.startsWith(url));
    if (existing) return existing.focus();
    return clients.openWindow(url);
  })());
});

