// Service Worker for Festival Chat Push Notifications
// Handles push notifications when app is backgrounded

self.addEventListener('install', function(event) {
  console.log('🔔 Push notification service worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  console.log('🔔 Push notification service worker activated');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', function(event) {
  console.log('📨 Push notification received:', event);
  
  let notificationData = {
    title: 'Festival Chat',
    body: 'New message received',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'festival-chat-message',
    data: {
      url: '/'
    }
  };

  // Parse notification data if available
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || 'Festival Chat',
        body: data.body || 'New message received',
        icon: data.icon || '/favicon.ico',
        badge: data.badge || '/favicon.ico',
        tag: data.tag || 'festival-chat-message',
        vibrate: data.vibrate || [200, 100, 200],
        data: {
          url: data.url || '/',
          roomId: data.roomId || null,
          messageId: data.messageId || null
        },
        actions: [
          {
            action: 'open',
            title: 'Open Chat',
            icon: '/favicon.ico'
          },
          {
            action: 'dismiss',
            title: 'Dismiss',
            icon: '/favicon.ico'
          }
        ]
      };
    } catch (error) {
      console.error('Failed to parse push notification data:', error);
    }
  }

  const showNotification = self.registration.showNotification(
    notificationData.title,
    {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      vibrate: notificationData.vibrate,
      data: notificationData.data,
      actions: notificationData.actions,
      requireInteraction: true // Keep notification visible until user interacts
    }
  );

  event.waitUntil(showNotification);
});

self.addEventListener('notificationclick', function(event) {
  console.log('🔔 Notification clicked:', event);
  
  event.notification.close();

  if (event.action === 'dismiss') {
    // User dismissed the notification
    return;
  }

  // Default action or "open" action
  const targetUrl = event.notification.data.url || '/';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(function(clients) {
      // Check if Festival Chat is already open
      for (let client of clients) {
        if (client.url.includes(self.location.origin)) {
          // Focus existing window and navigate to room if specified
          if (event.notification.data.roomId) {
            client.navigate(`/chat/${event.notification.data.roomId}`);
          }
          return client.focus();
        }
      }
      
      // Open new window
      let openUrl = targetUrl;
      if (event.notification.data.roomId) {
        openUrl = `/chat/${event.notification.data.roomId}`;
      }
      
      return self.clients.openWindow(openUrl);
    })
  );
});

self.addEventListener('notificationclose', function(event) {
  console.log('🔔 Notification closed:', event);
  // Could send analytics or cleanup here
});
