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

export function usePushNotifications(roomId?: string): UsePushNotificationsReturn {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [settings, setSettings] = useState<PushNotificationSettings>(defaultSettings);

  // Initialize support and permission
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
      
      // Load saved settings
      try {
        const savedSettings = localStorage.getItem('festivalchat_notification_settings');
        if (savedSettings) {
          setSettings({ ...defaultSettings, ...JSON.parse(savedSettings) });
        }
      } catch (error) {
        console.warn('Failed to load notification settings:', error);
      }
    }
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

  // Save settings to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('festivalchat_notification_settings', JSON.stringify(settings));
      } catch (error) {
        console.warn('Failed to save notification settings:', error);
      }
    }
  }, [settings]);

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
      }
      
      await navigator.serviceWorker.ready;
      setIsSubscribed(true);
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
    setSettings(prev => ({ ...prev, ...newSettings }));
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
    if (message.sender === displayName) return false;
    if (!settings.enabled || !settings.newMessages) return false;
    if (permission !== 'granted' || !isSubscribed) return false;
    if (typeof document !== 'undefined' && !document.hidden) return false;
    return true;
  }, [displayName, settings, permission, isSubscribed]);

  const triggerNotification = useCallback((message: any) => {
    if (!shouldNotify(message)) return;

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(`New Message in "${roomId}"`, {
          body: `${message.sender}: ${message.content}`,
          icon: '/favicon.ico',
          tag: 'festival-chat-message',
          data: {
            url: `/chat/${roomId}`,
            roomId: roomId,
            messageId: message.id
          }
        });
      }).catch(error => {
        console.error('Failed to show notification:', error);
      });
    }
  }, [shouldNotify, roomId]);

  return {
    shouldNotify,
    triggerNotification
  };
}
