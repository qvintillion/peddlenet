import { useState, useEffect, useCallback } from 'react';
import { backgroundNotificationManager } from './use-background-notifications';

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

    // MOBILE FIX: More lenient support detection for mobile browsers
    // Some mobile browsers support notifications without full PushManager API
    const hasBasicNotifications = 'Notification' in window;
    const hasServiceWorker = 'serviceWorker' in navigator;
    const hasPushManager = 'PushManager' in window;
    
    // Consider supported if we have at least basic notifications
    // Full push support is preferred but not required for basic functionality
    const supported = hasBasicNotifications && (hasServiceWorker || hasPushManager);
    
    console.log('🔔 Notification support check:', {
      hasBasicNotifications,
      hasServiceWorker,
      hasPushManager,
      supported,
      userAgent: navigator.userAgent
    });
    
    setIsSupported(supported);

    if (supported && hasBasicNotifications) {
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
        const hasServiceWorkerRegistration = !!registration;
        
        // For room-specific usage, also check if notifications are enabled for this room
        let roomNotificationsEnabled = true;
        if (roomId) {
          const bgState = backgroundNotificationManager.getState();
          const roomSubscription = bgState.subscriptions.get(roomId);
          roomNotificationsEnabled = roomSubscription ? roomSubscription.subscribed : true;
          console.log('🔔 Room-specific notification status for', roomId, ':', roomNotificationsEnabled);
        }
        
        // Only consider subscribed if:
        // 1. Service worker is registered
        // 2. Permission is granted  
        // 3. Notifications are enabled for this specific room (if roomId provided)
        const finalSubscriptionStatus = hasServiceWorkerRegistration && hasPermission && roomNotificationsEnabled;
        
        console.log('🔔 Push notification subscription check:', {
          roomId,
          hasServiceWorkerRegistration,
          hasPermission,
          roomNotificationsEnabled,
          finalSubscriptionStatus
        });
        
        setIsSubscribed(finalSubscriptionStatus);
      } catch (error) {
        console.warn('Failed to check subscription status:', error);
        setIsSubscribed(false);
      }
    };

    checkStatus();
    
    // Also listen for background notification changes if we have a roomId
    if (roomId) {
      const unsubscribe = backgroundNotificationManager.addListener(() => {
        checkStatus(); // Re-check when background notifications change
      });
      
      return unsubscribe;
    }
  }, [isSupported, permission, roomId]);

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
      
      // If we have a roomId, also enable background notifications for this room
      if (roomId) {
        backgroundNotificationManager.initialize();
        const storedName = localStorage.getItem('displayName') || 'User';
        backgroundNotificationManager.subscribeToRoom(roomId, storedName);
        console.log('🔔 Also enabled background notifications for room:', roomId);
      }
      
      setIsSubscribed(true);
      
      console.log('✅ Successfully subscribed to notifications');
      return true;
    } catch (error) {
      console.error('Failed to subscribe to notifications:', error);
      setIsSubscribed(false);
      return false;
    }
  }, [isSupported, permission, roomId]);

  const unsubscribeFromNotifications = useCallback(async (): Promise<boolean> => {
    try {
      // If we have a roomId, also disable background notifications for this room
      if (roomId) {
        backgroundNotificationManager.unsubscribeFromRoom(roomId);
        console.log('🔔 Also disabled background notifications for room:', roomId);
      }
      
      setIsSubscribed(false);
      return true;
    } catch (error) {
      console.error('Failed to unsubscribe from notifications:', error);
      return false;
    }
  }, [roomId]);

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
  
  // Track visibility state changes for better mobile background detection
  useEffect(() => {
    let lastVisibilityState = document?.visibilityState;
    let lastHidden = document?.hidden;
    
    const handleVisibilityChange = () => {
      const currentState = document?.visibilityState;
      const currentHidden = document?.hidden;
      
      console.log('📱 VISIBILITY CHANGE detected:', {
        previous: { state: lastVisibilityState, hidden: lastHidden },
        current: { state: currentState, hidden: currentHidden },
        timestamp: Date.now(),
        event: 'visibilitychange'
      });
      
      lastVisibilityState = currentState;
      lastHidden = currentHidden;
    };
    
    const handlePageShow = () => {
      console.log('📱 PAGE SHOW event - app restored from background');
    };
    
    const handlePageHide = () => {
      console.log('📱 PAGE HIDE event - app going to background');
    };
    
    const handleFocus = () => {
      console.log('📱 WINDOW FOCUS event - app gained focus');
    };
    
    const handleBlur = () => {
      console.log('📱 WINDOW BLUR event - app lost focus');
    };
    
    // Add all the mobile-relevant event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  const shouldNotify = useCallback((message: any): boolean => {
    console.log('🚀🚀🚀 SHOULDNOTIFY ENTRY - ENHANCED MOBILE BACKGROUND DETECTION');
    console.log('🔔 shouldNotify check:', {
      messageSender: message.sender,
      myDisplayName: displayName,
      senderMatch: message.sender === displayName,
      settingsEnabled: settings.enabled,
      newMessagesEnabled: settings.newMessages,
      permission,
      isSubscribed,
      documentHidden: typeof document !== 'undefined' ? document.hidden : 'unknown',
      documentVisibilityState: typeof document !== 'undefined' ? document.visibilityState : 'unknown',
      hasFocus: typeof window !== 'undefined' ? document.hasFocus() : 'unknown'
    });
    
    // Don't notify for our own messages (unless in test mode)
    if (message.sender === displayName) {
      // Check for test mode in URL or localStorage
      const isTestMode = typeof window !== 'undefined' && (
        window.location.search.includes('testNotifications=true') ||
        localStorage.getItem('testNotifications') === 'true'
      );
      
      if (isTestMode) {
        console.log('🧪 TEST MODE: Allowing notification for own message');
      } else {
        console.log('🔔 Not notifying: own message (sender:', message.sender, 'vs displayName:', displayName, ')');
        return false;
      }
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
    
    // Enhanced mobile-first notification logic with better background detection
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    console.log('🚀 ENHANCED MOBILE DETECTION:', {
      userAgent: navigator.userAgent,
      isMobile,
      platform: navigator.platform,
      timestamp: Date.now(),
      triggeredBy: 'mobile-background-detection-fix'
    });
    
    // CRITICAL MOBILE FIX: Check for page visibility events
    // Mobile browsers often don't fire visibility events correctly when home button is pressed
    const isPageHidden = typeof document !== 'undefined' && document.hidden;
    const visibilityState = typeof document !== 'undefined' ? document.visibilityState : 'unknown';
    const hasFocus = typeof document !== 'undefined' && document.hasFocus();
    
    // For mobile devices, be VERY aggressive with notifications
    if (isMobile) {
      console.log('📱 MOBILE AGGRESSIVE NOTIFICATION MODE ACTIVE');
      console.log('📱 Mobile state check:', {
        isPageHidden,
        visibilityState,
        hasFocus,
        documentExists: typeof document !== 'undefined'
      });
      
      // MOBILE STRATEGY: Show notification in ANY of these cases:
      // 1. Page is explicitly hidden
      // 2. Visibility state is hidden
      // 3. Document doesn't have focus
      // 4. We can't determine the state (safer to notify)
      // 5. ANY uncertainty at all (mobile browsers are unreliable)
      
      const shouldNotifyMobile = (
        isPageHidden || 
        visibilityState === 'hidden' || 
        !hasFocus || 
        typeof document === 'undefined' ||
        visibilityState !== 'visible' // Extra safety check
      );
      
      console.log('📱 Mobile notification decision:', {
        shouldNotifyMobile,
        reasons: {
          isPageHidden,
          visibilityHidden: visibilityState === 'hidden',
          noFocus: !hasFocus,
          noDocument: typeof document === 'undefined',
          notExplicitlyVisible: visibilityState !== 'visible'
        }
      });
      
      if (shouldNotifyMobile) {
        console.log('📱 ✅ MOBILE: Showing notification - app likely backgrounded');
        return true;
      }
      
      // Only skip if we're absolutely certain the app is active and visible
      console.log('📱 ❌ MOBILE: Skipping notification - app appears definitely active');
      return false;
    } else {
      // Desktop behavior - more conservative
      const isInBackground = (
        isPageHidden || 
        visibilityState === 'hidden' ||
        !hasFocus
      );
      
      console.log('🖥️ DESKTOP notification check:', {
        isInBackground,
        isPageHidden,
        visibilityState,
        hasFocus
      });
      
      if (isInBackground) {
        console.log('🖥️ ✅ DESKTOP: Showing notification - app is backgrounded');
        return true;
      }
      
      console.log('🖥️ ❌ DESKTOP: Skipping notification - app is in foreground');
      return false;
    }
  }, [displayName, settings, permission, isSubscribed]);

  const triggerNotification = useCallback((message: any) => {
    console.log('🔔 triggerNotification called for message:', message);
    
    if (!shouldNotify(message)) {
      console.log('🔔 shouldNotify returned false, not showing notification');
      return;
    }

    console.log('✅ PROCEEDING WITH NOTIFICATION for message:', message);
    
    // ENHANCED MOBILE NOTIFICATION with multiple fallback methods
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    console.log('📱 Mobile notification attempt:', { isMobile, hasServiceWorker: 'serviceWorker' in navigator, hasNotification: 'Notification' in window });
    
    // Method 1: Try Service Worker notification (best for mobile)
    if ('serviceWorker' in navigator && 'Notification' in window) {
      console.log('🔔 Method 1: Attempting service worker notification');
      
      navigator.serviceWorker.ready.then(registration => {
        console.log('🔔 Service worker ready, showing notification via SW');
        
        return registration.showNotification(`New Message in "${roomId}"`, {
          body: `${message.sender}: ${message.content}`,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: `festival-chat-${roomId}`,
          vibrate: [200, 100, 200],
          requireInteraction: true, // Keep visible until user interacts
          renotify: true, // Show even if same tag exists
          timestamp: Date.now(),
          data: {
            url: `/chat/${roomId}`,
            roomId: roomId,
            messageId: message.id,
            sender: message.sender,
            content: message.content
          },
          actions: [
            {
              action: 'open',
              title: 'Open Chat'
            },
            {
              action: 'dismiss',
              title: 'Dismiss'
            }
          ]
        });
      }).then(() => {
        console.log('✅ Method 1 SUCCESS: Service worker notification shown');
      }).catch(error => {
        console.error('❌ Method 1 FAILED: Service worker notification error:', error);
        
        // Method 2: Direct Notification API fallback
        console.log('🔔 Method 2: Attempting direct notification API');
        try {
          const notification = new Notification(`New Message in "${roomId}"`, {
            body: `${message.sender}: ${message.content}`,
            icon: '/favicon.ico',
            tag: `festival-chat-${roomId}`,
            vibrate: [200, 100, 200],
            requireInteraction: true
          });
          
          notification.onclick = () => {
            window.focus();
            window.location.href = `/chat/${roomId}`;
            notification.close();
          };
          
          console.log('✅ Method 2 SUCCESS: Direct notification shown');
        } catch (directError) {
          console.error('❌ Method 2 FAILED: Direct notification error:', directError);
          
          // Method 3: Basic Notification API (last resort)
          console.log('🔔 Method 3: Attempting basic notification API');
          tryBasicNotification();
        }
      });
    } else if ('Notification' in window) {
      // Method 2: Direct to Notification API if no service worker
      console.log('🔔 Method 2: Service worker not available, using direct notification');
      try {
        const notification = new Notification(`New Message in "${roomId}"`, {
          body: `${message.sender}: ${message.content}`,
          icon: '/favicon.ico',
          tag: `festival-chat-${roomId}`,
          vibrate: [200, 100, 200]
        });
        
        notification.onclick = () => {
          window.focus();
          window.location.href = `/chat/${roomId}`;
          notification.close();
        };
        
        console.log('✅ Method 2 SUCCESS: Direct notification shown (no SW)');
      } catch (error) {
        console.error('❌ Method 2 FAILED: Direct notification error (no SW):', error);
        tryBasicNotification();
      }
    } else {
      console.warn('⚠️ All notification methods unavailable in this browser');
    }
    
    // Method 3: Basic fallback function
    function tryBasicNotification() {
      try {
        console.log('🔔 Method 3: Basic notification fallback');
        const notification = new Notification(`Festival Chat: ${message.sender}`, {
          body: message.content,
          icon: '/favicon.ico'
        });
        
        notification.onclick = () => {
          window.focus();
          window.location.href = `/chat/${roomId}`;
          notification.close();
        };
        
        console.log('✅ Method 3 SUCCESS: Basic notification shown');
      } catch (basicError) {
        console.error('❌ Method 3 FAILED: All notification methods exhausted:', basicError);
      }
    }
  }, [shouldNotify, roomId]);

  return {
    shouldNotify,
    triggerNotification
  };
}
