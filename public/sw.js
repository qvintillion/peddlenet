// Service Worker for Festival Chat Push Notifications
// Handles push notifications when app is backgrounded

self.addEventListener('install', function(event) {
  console.log('🔔 Push notification service worker installed');
  console.log('📱 Enhanced mobile notification support active');
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

  // Enhanced mobile notification options
  const notificationOptions = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    tag: notificationData.tag,
    vibrate: notificationData.vibrate || [200, 100, 200, 100, 200], // Enhanced vibration pattern
    data: notificationData.data,
    actions: notificationData.actions,
    requireInteraction: true, // Keep visible until user interacts (critical for mobile)
    renotify: true, // Always show new notifications
    silent: false, // Make sure notification makes sound
    timestamp: Date.now()
  };
  
  console.log('📱 Showing notification with enhanced mobile options:', notificationOptions);
  
  const showNotification = self.registration.showNotification(
    notificationData.title,
    notificationOptions
  );

  event.waitUntil(showNotification);
});

self.addEventListener('notificationclick', function(event) {
  console.log('🔔 Notification clicked:', event);
  console.log('📝 Event action:', event.action);
  console.log('📝 Notification data:', event.notification.data);
  
  event.notification.close();

  if (event.action === 'dismiss') {
    console.log('🚫 User dismissed notification');
    return;
  }

  // Default action or "open" action
  const targetUrl = event.notification.data?.url || '/';
  const roomId = event.notification.data?.roomId;
  
  console.log('🎯 Target URL:', targetUrl, 'Room ID:', roomId);
  
  event.waitUntil(
    self.clients.matchAll({ 
      type: 'window',
      includeUncontrolled: true
    }).then(function(clients) {
      console.log('🔍 Found clients:', clients.length);
      
      // Look for existing Festival Chat window
      for (let client of clients) {
        console.log('🔍 Checking client:', client.url);
        
        // Check if this is our app (more flexible matching)
        if (client.url.includes(self.location.origin) || 
            client.url.includes('festival-chat') ||
            client.url.includes('peddlenet')) {
          console.log('✅ Found existing Festival Chat window, focusing...');
          
          // Navigate to the specific room if available
          if (roomId) {
            console.log('📨 Navigating to room:', roomId);
            client.navigate(`/chat/${roomId}`);
          }
          
          return client.focus();
        }
      }
      
      // No existing window found, open new one
      let openUrl = '/';
      if (roomId) {
        openUrl = `/chat/${roomId}`;
      } else if (targetUrl && targetUrl !== '/') {
        openUrl = targetUrl;
      }
      
      console.log('🆕 Opening new window:', openUrl);
      return self.clients.openWindow(openUrl);
    }).catch(error => {
      console.error('❌ Error handling notification click:', error);
      // Fallback: just open the home page
      return self.clients.openWindow('/');
    })
  );
});

self.addEventListener('notificationclose', function(event) {
  console.log('🔔 Notification closed:', event);
  // Could send analytics or cleanup here
});
