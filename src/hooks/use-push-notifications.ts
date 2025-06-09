import { useState, useEffect, useCallback } from 'react';

export interface PushNotificationSettings {
  enabled: boolean;
  newMessages: boolean;
  userJoined: boolean;
  userLeft: boolean;
}

export interface UsePushNotificationsReturn {
  permission: NotificationPermission;
  isSupported: boolean;
  isSubscribed: boolean;
  settings: PushNotificationSettings;
  requestPermission: () => Promise<NotificationPermission>;
  subscribeToNotifications: () => Promise<boolean>;
  unsubscribeFromNotifications: () => Promise<boolean>;
  updateSettings: (newSettings: Partial<PushNotificationSettings>) => void;
  sendTestNotification: () => void;
}

const defaultSettings: PushNotificationSettings = {
  enabled: true,
  newMessages: true,
  userJoined: false,
  userLeft: false
};

// Global settings state - shared across all hook instances
let globalSettings = { ...defaultSettings };
let globalSettingsListeners: Set<(settings: PushNotificationSettings) => void> = new Set();

// Load initial settings from localStorage
if (typeof window !== 'undefined') {
  try {
    const saved = localStorage.getItem('festivalchat_notification_settings');
    if (saved) {
      globalSettings = { ...defaultSettings, ...JSON.parse(saved) };
    }
  } catch (error) {
    console.warn('Failed to load initial notification settings:', error);
  }
}

export function usePushNotifications(roomId?: string): UsePushNotificationsReturn {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [settings, setSettings] = useState<PushNotificationSettings>(globalSettings);

  // Initialize support and permission
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  // Subscribe to global settings changes
  useEffect(() => {
    const listener = (newSettings: PushNotificationSettings) => {
      console.log('🔔 Settings updated from global state:', newSettings);
      setSettings(newSettings);
    };

    globalSettingsListeners.add(listener);
    
    return () => {
      globalSettingsListeners.delete(listener);
    };
  }, []);

  // Check subscription status separately
  useEffect(() => {
    if (!isSupported) return;
    
    const checkStatus = async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        const hasPermission = Notification.permission === 'granted';
        setIsSubscribed(!!registration && hasPermission);
      } catch (error) {
        console.warn('Failed to check subscription status:', error);
        setIsSubscribed(false);
      }
    };

    checkStatus();
  }, [isSupported, permission]);

  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported) return 'denied';

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return 'denied';
    }
  }, [isSupported]);

  const subscribeToNotifications = useCallback(async (): Promise<boolean> => {
    if (!isSupported || permission !== 'granted') return false;

    try {
      let registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        console.log('🔔 Service worker registered for notifications');
      }
      
      await navigator.serviceWorker.ready;
      setIsSubscribed(true);
      
      console.log('✅ Successfully subscribed to notifications');
      return true;
    } catch (error) {
      console.error('Failed to subscribe to notifications:', error);
      setIsSubscribed(false);
      return false;
    }
  }, [isSupported, permission]);

  const unsubscribeFromNotifications = useCallback(async (): Promise<boolean> => {
    try {
      setIsSubscribed(false);
      return true;
    } catch (error) {
      console.error('Failed to unsubscribe from notifications:', error);
      return false;
    }
  }, []);

  const updateSettings = useCallback((newSettings: Partial<PushNotificationSettings>) => {
    const updatedSettings = { ...globalSettings, ...newSettings };
    
    // Update global state
    globalSettings = updatedSettings;
    
    // Save to localStorage
    try {
      localStorage.setItem('festivalchat_notification_settings', JSON.stringify(updatedSettings));
      console.log('🔔 Settings saved to localStorage:', updatedSettings);
    } catch (error) {
      console.warn('Failed to save notification settings:', error);
    }
    
    // Notify all listeners
    globalSettingsListeners.forEach(listener => {
      try {
        listener(updatedSettings);
      } catch (error) {
        console.error('Error notifying settings listener:', error);
      }
    });
    
    console.log('🔔 Settings updated globally:', updatedSettings);
  }, []);

  const sendTestNotification = useCallback(() => {
    if (!isSupported || permission !== 'granted') return;

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification('Festival Chat Test', {
          body: 'Test notification - your notifications are working! 🎪',
          icon: '/favicon.ico',
          tag: 'festival-chat-test',
          data: { url: roomId ? `/chat/${roomId}` : '/', test: true }
        });
      }).catch(error => {
        console.error('Failed to show test notification:', error);
      });
    }
  }, [isSupported, permission, roomId]);

  return {
    permission,
    isSupported,
    isSubscribed,
    settings,
    requestPermission,
    subscribeToNotifications,
    unsubscribeFromNotifications,
    updateSettings,
    sendTestNotification
  };
}

// Helper hook for triggering notifications based on messages
export function useMessageNotifications(roomId: string, displayName: string) {
  const { permission, isSubscribed, settings } = usePushNotifications(roomId);

  const shouldNotify = useCallback((message: any): boolean => {
    console.log('🔔 shouldNotify check:', {
      sender: message.sender,
      displayName,
      senderMatch: message.sender === displayName,
      settingsEnabled: settings.enabled,
      newMessagesEnabled: settings.newMessages,
      permission,
      isSubscribed,
      documentHidden: typeof document !== 'undefined' ? document.hidden : 'unknown',
      documentVisibilityState: typeof document !== 'undefined' ? document.visibilityState : 'unknown'
    });
    
    // Don't notify for our own messages
    if (message.sender === displayName) {
      console.log('🔔 Not notifying: own message');
      return false;
    }
    
    // Check if notifications are enabled
    if (!settings.enabled || !settings.newMessages) {
      console.log('🔔 Not notifying: settings disabled', { enabled: settings.enabled, newMessages: settings.newMessages });
      return false;
    }
    
    // Check if permission is granted and subscribed
    if (permission !== 'granted' || !isSubscribed) {
      console.log('🔔 Not notifying: permission/subscription issue', { permission, isSubscribed });
      return false;
    }
    
    // Check if document is hidden (user is not actively viewing)
    // Use visibilityState as backup since document.hidden might not work in all browsers
    const isHidden = typeof document !== 'undefined' && 
      (document.hidden || document.visibilityState === 'hidden');
    
    if (!isHidden) {
      console.log('🔔 Not notifying: document is visible', { 
        hidden: document?.hidden, 
        visibilityState: document?.visibilityState 
      });
      return false;
    }
    
    console.log('✅ Should notify: all conditions met');
    return true;
  }, [displayName, settings, permission, isSubscribed]);

  const triggerNotification = useCallback((message: any) => {
    console.log('🔔 triggerNotification called for message:', message);
    
    if (!shouldNotify(message)) {
      console.log('🔔 shouldNotify returned false, not showing notification');
      return;
    }

    console.log('✅ Attempting to show notification for message:', message);
    
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        console.log('🔔 Service worker ready, showing notification');
        
        return registration.showNotification(`New Message in "${roomId}"`, {
          body: `${message.sender}: ${message.content}`,
          icon: '/favicon.ico',
          tag: 'festival-chat-message',
          vibrate: [200, 100, 200],
          requireInteraction: false,
          data: {
            url: `/chat/${roomId}`,
            roomId: roomId,
            messageId: message.id
          }
        });
      }).then(() => {
        console.log('✅ Notification shown successfully');
      }).catch(error => {
        console.error('❌ Failed to show notification:', error);
      });
    } else {
      console.warn('⚠️ Service worker not available');
    }
  }, [shouldNotify, roomId]);

  return {
    shouldNotify,
    triggerNotification
  };
}
