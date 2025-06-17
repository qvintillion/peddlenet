'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Message } from '../lib/types';
import { ServerUtils } from '../utils/server-utils';
import { useMessageNotifications } from './use-push-notifications';

// Global background notification state
interface NotificationSubscription {
  roomId: string;
  displayName: string;
  subscribed: boolean;
  lastSeen: number;
}

interface BackgroundNotificationState {
  isConnected: boolean;
  subscriptions: Map<string, NotificationSubscription>;
  currentRoom: string | null;
}

// Singleton background connection manager
class BackgroundNotificationManager {
  private socket: Socket | null = null;
  private state: BackgroundNotificationState = {
    isConnected: false,
    subscriptions: new Map(),
    currentRoom: null
  };
  private listeners: Set<(state: BackgroundNotificationState) => void> = new Set();
  private messageHandlers: Map<string, (message: Message) => void> = new Map();
  private globalNotificationHandler: ((message: Message) => void) | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isInitialized = false;

  initialize() {
    if (this.isInitialized) return;
    
    console.log('🔔 Initializing Background Notification Manager');
    this.isInitialized = true;
    this.loadPersistedState();
    this.connect();
  }

  private loadPersistedState() {
    try {
      const saved = localStorage.getItem('background_notification_subscriptions');
      if (saved) {
        const data = JSON.parse(saved);
        data.forEach((sub: NotificationSubscription) => {
          // Only restore recent subscriptions (within last 24 hours)
          if (Date.now() - sub.lastSeen < 24 * 60 * 60 * 1000) {
            this.state.subscriptions.set(sub.roomId, sub);
          }
        });
        console.log('🔔 Restored notification subscriptions:', this.state.subscriptions.size);
      }
    } catch (error) {
      console.warn('Failed to load notification subscriptions:', error);
    }
  }

  private savePersistedState() {
    try {
      const subscriptions = Array.from(this.state.subscriptions.values());
      localStorage.setItem('background_notification_subscriptions', JSON.stringify(subscriptions));
    } catch (error) {
      console.warn('Failed to save notification subscriptions:', error);
    }
  }

  private connect() {
    if (this.socket?.connected) return;

    const serverUrl = ServerUtils.getWebSocketServerUrl();
    if (!serverUrl) {
      console.error('❌ No WebSocket server URL for background notifications');
      return;
    }

    console.log('🔔 Connecting background notification service to:', serverUrl);

    this.socket = io(serverUrl, {
      transports: ['polling', 'websocket'],
      timeout: 10000,
      reconnection: false, // Manual reconnection control
      forceNew: true
    });

    this.socket.on('connect', () => {
      console.log('🔔 Background notification service connected');
      this.state.isConnected = true;
      this.notifyListeners();

      // Re-subscribe to all rooms
      this.state.subscriptions.forEach((sub, roomId) => {
        if (sub.subscribed) {
          this.subscribeToRoom(roomId, sub.displayName, false); // Don't save again
        }
      });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔔 Background notification service disconnected:', reason);
      this.state.isConnected = false;
      this.notifyListeners();

      // Auto-reconnect after delay
      if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
      this.reconnectTimer = setTimeout(() => {
        console.log('🔔 Attempting background notification reconnection...');
        this.connect();
      }, 5000);
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔔 Background notification connection error:', error);
      this.state.isConnected = false;
      this.notifyListeners();
    });

    // Listen for messages from any subscribed room
    this.socket.on('chat-message', (message: any) => {
      console.log('🔔 Background notification received message:', message);
      
      const roomId = message.roomId;
      const subscription = this.state.subscriptions.get(roomId);
      
      if (subscription && subscription.subscribed) {
        // Only notify if we're not currently viewing this room
        if (this.state.currentRoom !== roomId) {
          console.log('🔔 Triggering notification for background room:', roomId);
          
          const normalizedMessage: Message = {
            id: message.id || `bg-${Date.now()}`,
            content: message.content || '',
            sender: message.sender || 'Unknown',
            timestamp: message.timestamp || Date.now(),
            type: message.type || 'chat',
            roomId: roomId,
            synced: true
          };
          
          // Trigger notification handler for this room
          const handler = this.messageHandlers.get(roomId);
          if (handler) {
            console.log('🔔 Using room-specific handler for:', roomId);
            handler(normalizedMessage);
          } else if (this.globalNotificationHandler) {
            console.log('🔔 Using global notification handler for:', roomId);
            this.globalNotificationHandler(normalizedMessage);
          } else {
            console.warn('🔔 No notification handler available for room:', roomId);
          }
        } else {
          console.log('🔔 Skipping notification - currently viewing room:', roomId);
        }
      }
    });
  }

  subscribeToRoom(roomId: string, displayName: string, save: boolean = true) {
    if (!roomId || !displayName) return;

    console.log('🔔 Subscribing to background notifications for room:', roomId);

    // Update existing subscription or create new one
    const existingSubscription = this.state.subscriptions.get(roomId);
    if (existingSubscription) {
      existingSubscription.subscribed = true;
      existingSubscription.displayName = displayName;
      existingSubscription.lastSeen = Date.now();
    } else {
      const subscription: NotificationSubscription = {
        roomId,
        displayName,
        subscribed: true,
        lastSeen: Date.now()
      };
      this.state.subscriptions.set(roomId, subscription);
    }
    
    if (save) {
      this.savePersistedState();
    }
    
    this.notifyListeners();

    // Tell server to include this room in our notification feed
    if (this.socket?.connected) {
      this.socket.emit('subscribe-notifications', {
        roomId,
        displayName
      });
    }
  }

  unsubscribeFromRoom(roomId: string) {
    console.log('🔔 Unsubscribing from background notifications for room:', roomId);
    
    // Keep the subscription but mark it as unsubscribed to preserve user preference
    const existingSubscription = this.state.subscriptions.get(roomId);
    if (existingSubscription) {
      existingSubscription.subscribed = false;
      existingSubscription.lastSeen = Date.now();
    } else {
      // Create a new subscription record marked as unsubscribed
      this.state.subscriptions.set(roomId, {
        roomId,
        displayName: '', // Will be updated when user enters room
        subscribed: false,
        lastSeen: Date.now()
      });
    }
    
    this.savePersistedState();
    this.notifyListeners();

    // Tell server to stop sending notifications for this room
    if (this.socket?.connected) {
      this.socket.emit('unsubscribe-notifications', { roomId });
    }

    // Keep message handler in case user re-enables notifications later
    // this.messageHandlers.delete(roomId);
  }

  setCurrentRoom(roomId: string | null) {
    console.log('🔔 Setting current room for notifications:', roomId);
    this.state.currentRoom = roomId;
    
    // Update last seen time if we have a subscription
    if (roomId && this.state.subscriptions.has(roomId)) {
      const sub = this.state.subscriptions.get(roomId)!;
      sub.lastSeen = Date.now();
      this.savePersistedState();
    }
    
    this.notifyListeners();
  }

  setMessageHandler(roomId: string, handler: (message: Message) => void) {
    this.messageHandlers.set(roomId, handler);
  }

  removeMessageHandler(roomId: string) {
    this.messageHandlers.delete(roomId);
  }

  setGlobalNotificationHandler(handler: (message: Message) => void) {
    console.log('🔔 Setting global notification handler');
    this.globalNotificationHandler = handler;
  }

  removeGlobalNotificationHandler() {
    console.log('🔔 Removing global notification handler');
    this.globalNotificationHandler = null;
  }

  addListener(listener: (state: BackgroundNotificationState) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener({ ...this.state });
      } catch (error) {
        console.error('Background notification listener error:', error);
      }
    });
  }

  getState(): BackgroundNotificationState {
    return { ...this.state };
  }

  cleanup() {
    console.log('🔔 Cleaning up background notification manager');
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.listeners.clear();
    this.messageHandlers.clear();
    this.isInitialized = false;
  }
}

// Global singleton instance
const backgroundNotificationManager = new BackgroundNotificationManager();

// Hook for components to use background notifications
export function useBackgroundNotifications() {
  const [state, setState] = useState<BackgroundNotificationState>(
    backgroundNotificationManager.getState()
  );

  useEffect(() => {
    // Initialize on first use
    backgroundNotificationManager.initialize();
    
    // Subscribe to state changes
    const unsubscribe = backgroundNotificationManager.addListener(setState);
    
    return unsubscribe;
  }, []);

  const subscribeToRoom = useCallback((roomId: string, displayName: string) => {
    backgroundNotificationManager.subscribeToRoom(roomId, displayName);
  }, []);

  const unsubscribeFromRoom = useCallback((roomId: string) => {
    backgroundNotificationManager.unsubscribeFromRoom(roomId);
  }, []);

  const setCurrentRoom = useCallback((roomId: string | null) => {
    backgroundNotificationManager.setCurrentRoom(roomId);
  }, []);

  return {
    isConnected: state.isConnected,
    subscriptions: Array.from(state.subscriptions.values()),
    currentRoom: state.currentRoom,
    subscribeToRoom,
    unsubscribeFromRoom,
    setCurrentRoom
  };
}

// Hook for room-specific notification handling
export function useRoomBackgroundNotifications(roomId: string, displayName: string) {
  const { triggerNotification } = useMessageNotifications(roomId, displayName);

  useEffect(() => {
    if (!roomId || !displayName) return;

    // Initialize background notification manager
    backgroundNotificationManager.initialize();

    // Check if this room already has a subscription preference
    const currentState = backgroundNotificationManager.getState();
    const existingSubscription = currentState.subscriptions.get(roomId);
    
    // Only auto-subscribe if:
    // 1. No existing subscription exists, OR
    // 2. Existing subscription is explicitly set to subscribed = true
    // This prevents re-subscribing when user has explicitly disabled notifications
    if (!existingSubscription || existingSubscription.subscribed) {
      console.log('🔔 Auto-subscribing to background notifications for room:', roomId, 
                  existingSubscription ? '(existing subscription active)' : '(new room)');
      backgroundNotificationManager.subscribeToRoom(roomId, displayName);
    } else {
      console.log('🔕 Skipping auto-subscription - notifications disabled for room:', roomId);
    }

    // Always set up message handler regardless of subscription status
    // This allows us to handle notifications if the user re-enables them later
    const messageHandler = (message: Message) => {
      console.log('🔔 Background notification handler triggered for room:', roomId, message);
      triggerNotification(message);
    };

    backgroundNotificationManager.setMessageHandler(roomId, messageHandler);

    return () => {
      // Clean up message handler but keep subscription active
      backgroundNotificationManager.removeMessageHandler(roomId);
    };
  }, [roomId, displayName, triggerNotification]);

  return {
    // This hook mainly sets up the background notification subscription
    // The actual notification triggering is handled internally
  };
}

// Hook for global notification handling (use this on pages like homepage)
export function useGlobalBackgroundNotifications() {
  useEffect(() => {
    // Initialize background notification manager
    backgroundNotificationManager.initialize();

    // Create a global notification handler that can trigger notifications for any room
    const globalHandler = (message: Message) => {
      console.log('🔔 Global notification handler triggered:', message);
      
      // Get subscription info to get display name
      const state = backgroundNotificationManager.getState();
      const subscription = state.subscriptions.get(message.roomId);
      
      if (subscription) {
        // Create a temporary notification trigger for this message
        console.log('🔔 Creating temporary notification trigger for:', message.roomId);
        
        // We need to create a notification trigger without a specific room context
        // This is a bit of a hack, but it works for global notifications
        if ('serviceWorker' in navigator && 'Notification' in window && Notification.permission === 'granted') {
          navigator.serviceWorker.ready.then(registration => {
            return registration.showNotification(`New Message in "${message.roomId}"`, {
              body: `${message.sender}: ${message.content}`,
              icon: '/favicon.ico',
              badge: '/favicon.ico',
              tag: `festival-chat-${message.roomId}`,
              vibrate: [200, 100, 200],
              requireInteraction: true,
              renotify: true,
              timestamp: Date.now(),
              data: {
                url: `/chat/${message.roomId}`,
                roomId: message.roomId,
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
            console.log('✅ Global notification shown successfully');
          }).catch(error => {
            console.error('❌ Global notification failed:', error);
            
            // Fallback to direct notification
            try {
              const notification = new Notification(`New Message in "${message.roomId}"`, {
                body: `${message.sender}: ${message.content}`,
                icon: '/favicon.ico',
                tag: `festival-chat-${message.roomId}`,
                vibrate: [200, 100, 200]
              });
              
              notification.onclick = () => {
                window.focus();
                window.location.href = `/chat/${message.roomId}`;
                notification.close();
              };
              
              console.log('✅ Global fallback notification shown');
            } catch (fallbackError) {
              console.error('❌ Global fallback notification failed:', fallbackError);
            }
          });
        } else {
          console.warn('⚠️ Notification requirements not met for global handler');
        }
      } else {
        console.warn('🔔 No subscription found for room:', message.roomId);
      }
    };

    backgroundNotificationManager.setGlobalNotificationHandler(globalHandler);

    return () => {
      backgroundNotificationManager.removeGlobalNotificationHandler();
    };
  }, []);

  return {
    // This hook sets up global notification handling
  };
}

// Export the manager for advanced use cases
export { backgroundNotificationManager };
