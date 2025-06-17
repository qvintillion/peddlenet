'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { ServerUtils } from '../utils/server-utils';
import { useMessageNotifications } from './use-push-notifications';
import { unreadMessageManager } from './use-unread-messages';

// Global background notification state


// Connection coordinator to prevent conflicts
class ConnectionCoordinator {
  private static activeChatConnections = new Set<string>();
  private static backgroundConnection: Socket | null = null;
  
  static registerChatConnection(connectionId: string) {
    this.activeChatConnections.add(connectionId);
    console.log('🔗 Registered chat connection:', connectionId, `(${this.activeChatConnections.size} active)`);
    
    // If background connection exists, defer it
    if (this.backgroundConnection?.connected) {
      console.log('🔔 Deferring background notifications due to active chat');
      this.backgroundConnection.disconnect();
    }
  }
  
  static unregisterChatConnection(connectionId: string) {
    this.activeChatConnections.delete(connectionId);
    console.log('🔗 Unregistered chat connection:', connectionId, `(${this.activeChatConnections.size} active)`);
  }
  
  static hasActiveChatConnections(): boolean {
    return this.activeChatConnections.size > 0;
  }
  
  static setBackgroundConnection(socket: Socket | null) {
    this.backgroundConnection = socket;
  }
  
  static canConnectBackground(): boolean {
    return !this.hasActiveChatConnections();
  }
}

// Enhanced background notification manager with better coordination
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
  private deferredConnectionTimer: NodeJS.Timeout | null = null;
  private isInitialized = false;
  private isUserDisconnected = false;
  
  // Enhanced rate limiting
  private connectionAttempts = 0;
  private lastConnectionAttempt = 0;
  private isConnecting = false;
  private maxRetries = 3; // Reduced for faster coordination
  private baseDelay = 3000; // Start with 3 seconds
  private maxDelay = 30000; // Cap at 30 seconds

  initialize() {
    if (this.isInitialized) {
      console.log('🔔 Background notification manager already initialized');
      return;
    }
    
    console.log('🔔 Initializing Enhanced Background Notification Manager');
    this.isInitialized = true;
    this.loadPersistedState();
    
    // Only connect if we have active subscriptions AND no chat connections
    const hasActiveSubscriptions = Array.from(this.state.subscriptions.values()).some(sub => sub.subscribed);
    if (hasActiveSubscriptions && ConnectionCoordinator.canConnectBackground()) {
      console.log('🔔 Found active subscriptions and no chat conflicts, connecting...');
      this.connect();
    } else {
      console.log('🔔 Deferring connection:', hasActiveSubscriptions ? 'chat conflict' : 'no subscriptions');
    }
  }

  private loadPersistedState() {
    try {
      // SSR guard
      if (typeof window === 'undefined') return;
      
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
      // SSR guard
      if (typeof window === 'undefined') return;
      
      const subscriptions = Array.from(this.state.subscriptions.values());
      localStorage.setItem('background_notification_subscriptions', JSON.stringify(subscriptions));
    } catch (error) {
      console.warn('Failed to save notification subscriptions:', error);
    }
  }

  private shouldAttemptConnection(): boolean {
    const now = Date.now();
    
    // CRITICAL: Don't attempt if user deliberately disconnected
    if (this.isUserDisconnected) {
      console.log('🚫 User deliberately unsubscribed - not attempting connection');
      return false;
    }
    
    // CRITICAL: Don't attempt if there are active chat connections
    if (ConnectionCoordinator.hasActiveChatConnections()) {
      console.log('🚫 Active chat connections detected - deferring background notifications');
      this.scheduleDeferredConnection();
      return false;
    }
    
    // Rate limiting check
    if (this.connectionAttempts >= this.maxRetries) {
      const resetTime = this.lastConnectionAttempt + this.maxDelay;
      if (now < resetTime) {
        console.log('🚫 Rate limited - waiting before next connection attempt');
        return false;
      } else {
        this.connectionAttempts = 0; // Reset after delay
      }
    }
    
    // Don't connect if already connecting or connected
    if (this.isConnecting || this.socket?.connected) {
      return false;
    }
    
    // Check for active subscriptions
    const hasActiveSubscriptions = Array.from(this.state.subscriptions.values()).some(sub => sub.subscribed);
    if (!hasActiveSubscriptions) {
      console.log('🚫 No active subscriptions - skipping connection');
      return false;
    }
    
    return true;
  }

  private scheduleDeferredConnection() {
    // Clear existing deferred timer
    if (this.deferredConnectionTimer) {
      clearTimeout(this.deferredConnectionTimer);
    }
    
    // Schedule a deferred connection check in 30 seconds
    this.deferredConnectionTimer = setTimeout(() => {
      console.log('🔔 Checking for deferred background notification connection...');
      if (this.shouldAttemptConnection()) {
        this.connect();
      } else {
        this.scheduleDeferredConnection(); // Keep checking
      }
    }, 30000);
  }

  private getBackoffDelay(): number {
    // Enhanced exponential backoff with jitter
    const delay = Math.min(this.baseDelay * Math.pow(2, this.connectionAttempts), this.maxDelay);
    const jitter = Math.random() * 1000;
    return delay + jitter;
  }

  private connect() {
    if (!this.shouldAttemptConnection()) {
      return;
    }

    this.isConnecting = true;
    this.connectionAttempts++;
    this.lastConnectionAttempt = Date.now();

    const serverUrl = ServerUtils.getWebSocketServerUrl();
    if (!serverUrl) {
      console.error('❌ No WebSocket server URL for background notifications');
      this.isConnecting = false;
      return;
    }

    console.log(`🔔 Connecting background notification service (attempt ${this.connectionAttempts}/${this.maxRetries}) to:`, serverUrl);

    // Clean up existing socket
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    // CRITICAL: Enhanced Cloud Run compatible configuration
    this.socket = io(serverUrl, {
      // CRITICAL: Use polling first for Cloud Run compatibility
      transports: ['polling', 'websocket'],
      timeout: 20000, // Longer timeout for background connections
      reconnection: false, // Manual reconnection control
      forceNew: true,
      
      // Enhanced settings for background connections
      withCredentials: true,
      upgrade: true,
      rememberUpgrade: false,
      
      // Longer intervals for background connections (less aggressive)
      pingTimeout: 60000,
      pingInterval: 30000,
      
      // Extra headers for connection identification
      extraHeaders: {
        'X-Connection-Type': 'background-notifications'
      }
    });

    // Register with coordinator
    ConnectionCoordinator.setBackgroundConnection(this.socket);

    this.socket.on('connect', () => {
      console.log('🔔 Background notification service connected');
      this.state.isConnected = true;
      this.isConnecting = false;
      this.connectionAttempts = 0; // Reset on successful connection
      this.notifyListeners();

      // Re-subscribe to all rooms
      this.state.subscriptions.forEach((sub, roomId) => {
        if (sub.subscribed) {
          this.subscribeToRoom(roomId, sub.displayName, false);
        }
      });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔔 Background notification service disconnected:', reason);
      this.state.isConnected = false;
      this.isConnecting = false;
      this.notifyListeners();

      // Only auto-reconnect for certain reasons and if we should
      const shouldReconnect = reason !== 'io client disconnect' && 
                             !reason.includes('rate limit') &&
                             !this.isUserDisconnected;
      
      if (shouldReconnect) {
        this.scheduleReconnection();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔔 Background notification connection error:', error);
      this.state.isConnected = false;
      this.isConnecting = false;
      this.notifyListeners();

      // Enhanced error handling
      const isCorsError = error.message?.includes('CORS') || error.message?.includes('Access-Control');
      const isRateLimit = error.message?.includes('rate limit');
      
      if (isCorsError) {
        console.error('🚨 CORS error in background notifications - server needs fix');
        this.connectionAttempts = this.maxRetries; // Stop trying
      } else if (isRateLimit) {
        console.warn('🚫 Background notifications hit rate limit');
        this.connectionAttempts = this.maxRetries; // Stop trying temporarily
      }
      
      this.scheduleReconnection();
    });

    // Enhanced message handling with better coordination
    this.socket.on('chat-message', (message: any) => {
      console.log('🔔 Background notification received message:', message);
      
      const roomId = message.roomId;
      const subscription = this.state.subscriptions.get(roomId);
      
      if (subscription && subscription.subscribed) {
        const normalizedMessage: Message = {
          id: message.id || `bg-${Date.now()}`,
          content: message.content || '',
          sender: message.sender || 'Unknown',
          timestamp: message.timestamp || Date.now(),
          type: message.type || 'chat',
          roomId: roomId,
          synced: true
        };
        
        // Always track unread messages
        unreadMessageManager.initialize();
        unreadMessageManager.addUnreadMessage(normalizedMessage);
        
        // Only notify if we're not currently viewing this room
        if (this.state.currentRoom !== roomId) {
          console.log('🔔 Triggering notification for background room:', roomId);
          
          // Use room-specific handler first, then global
          const handler = this.messageHandlers.get(roomId);
          if (handler) {
            handler(normalizedMessage);
          } else if (this.globalNotificationHandler) {
            this.globalNotificationHandler(normalizedMessage);
          }
        } else {
          // Mark as read if we're viewing the room
          unreadMessageManager.markRoomAsRead(roomId);
        }
      }
    });
  }

  private scheduleReconnection() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (!this.shouldAttemptConnection()) {
      return;
    }

    const delay = this.getBackoffDelay();
    console.log(`🔔 Scheduling background notification reconnection in ${Math.round(delay/1000)}s`);
    
    this.reconnectTimer = setTimeout(() => {
      console.log('🔔 Attempting scheduled background notification reconnection...');
      this.connect();
    }, delay);
  }

  subscribeToRoom(roomId: string, displayName: string, save: boolean = true) {
    if (!roomId || !displayName) return;

    console.log('🔔 Subscribing to background notifications for room:', roomId);

    // Reset user disconnected flag when subscribing
    this.isUserDisconnected = false;

    // Update or create subscription
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

    // Connect if conditions are right
    if (!this.socket?.connected && !this.isConnecting && ConnectionCoordinator.canConnectBackground()) {
      console.log('🔔 Starting connection due to new subscription');
      this.connect();
    }

    // Subscribe on server if connected
    if (this.socket?.connected) {
      this.socket.emit('subscribe-notifications', {
        roomId,
        displayName
      });
    }
  }

  unsubscribeFromRoom(roomId: string) {
    console.log('🔔 Unsubscribing from background notifications for room:', roomId);
    
    const existingSubscription = this.state.subscriptions.get(roomId);
    if (existingSubscription) {
      existingSubscription.subscribed = false;
      existingSubscription.lastSeen = Date.now();
    } else {
      this.state.subscriptions.set(roomId, {
        roomId,
        displayName: '',
        subscribed: false,
        lastSeen: Date.now()
      });
    }
    
    this.savePersistedState();
    this.notifyListeners();

    // Unsubscribe on server if connected
    if (this.socket?.connected) {
      this.socket.emit('unsubscribe-notifications', { roomId });
    }

    // Disconnect if no more active subscriptions
    const hasActiveSubscriptions = Array.from(this.state.subscriptions.values()).some(sub => sub.subscribed);
    if (!hasActiveSubscriptions) {
      console.log('🔔 No more active subscriptions - disconnecting background service');
      this.disconnect();
      this.isUserDisconnected = true;
    }
    
    // Clear timers to prevent conflicts
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.deferredConnectionTimer) {
      clearTimeout(this.deferredConnectionTimer);
      this.deferredConnectionTimer = null;
    }
    
    this.connectionAttempts = 0;
    this.isConnecting = false;
  }

  private disconnect() {
    console.log('🔔 Manually disconnecting background notification service');
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.deferredConnectionTimer) {
      clearTimeout(this.deferredConnectionTimer);
      this.deferredConnectionTimer = null;
    }
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    ConnectionCoordinator.setBackgroundConnection(null);
    
    this.state.isConnected = false;
    this.isConnecting = false;
    this.connectionAttempts = 0;
    this.notifyListeners();
  }

  setCurrentRoom(roomId: string | null) {
    console.log('🔔 Setting current room for notifications:', roomId);
    this.state.currentRoom = roomId;
    
    if (roomId && this.state.subscriptions.has(roomId)) {
      const sub = this.state.subscriptions.get(roomId)!;
      sub.lastSeen = Date.now();
      this.savePersistedState();
    }
    
    if (roomId) {
      unreadMessageManager.initialize();
      unreadMessageManager.markRoomAsRead(roomId);
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
    
    // Try to connect when global handler is set
    if (!this.socket?.connected && !this.isConnecting && ConnectionCoordinator.canConnectBackground()) {
      console.log('🔔 Attempting connection due to global handler registration');
      this.connect();
    }
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
    
    if (this.deferredConnectionTimer) {
      clearTimeout(this.deferredConnectionTimer);
      this.deferredConnectionTimer = null;
    }
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    ConnectionCoordinator.setBackgroundConnection(null);
    
    this.listeners.clear();
    this.messageHandlers.clear();
    this.isInitialized = false;
    this.isConnecting = false;
    this.connectionAttempts = 0;
    this.isUserDisconnected = false;
  }

  // Method to check connection coordination status
  getCoordinationStatus() {
    return {
      hasActiveChatConnections: ConnectionCoordinator.hasActiveChatConnections(),
      canConnectBackground: ConnectionCoordinator.canConnectBackground(),
      isConnected: this.state.isConnected,
      isConnecting: this.isConnecting,
      connectionAttempts: this.connectionAttempts,
      isUserDisconnected: this.isUserDisconnected
    };
  }
}

// Global singleton instance
let backgroundNotificationManager: BackgroundNotificationManager | null = null;

// Function to get or create the manager safely
function getBackgroundNotificationManager(): BackgroundNotificationManager {
  if (typeof window === 'undefined') {
    // Return a mock manager for SSR
    return {
      initialize: () => {},
      getState: () => ({
        isConnected: false,
        subscriptions: new Map(),
        currentRoom: null
      }),
      addListener: () => () => {},
      subscribeToRoom: () => {},
      unsubscribeFromRoom: () => {},
      setCurrentRoom: () => {},
      setMessageHandler: () => {},
      removeMessageHandler: () => {},
      setGlobalNotificationHandler: () => {},
      removeGlobalNotificationHandler: () => {},
      getCoordinationStatus: () => ({
        hasActiveChatConnections: false,
        canConnectBackground: false,
        isConnected: false,
        isConnecting: false,
        connectionAttempts: 0,
        isUserDisconnected: false
      })
    } as any;
  }
  
  if (!backgroundNotificationManager) {
    backgroundNotificationManager = new BackgroundNotificationManager();
  }
  return backgroundNotificationManager;
}

// Hook for components to use background notifications
export function useBackgroundNotifications() {
  const [state, setState] = useState<BackgroundNotificationState>(() => {
    // SSR-safe initialization
    if (typeof window === 'undefined') {
      return {
        isConnected: false,
        subscriptions: new Map(),
        currentRoom: null
      };
    }
    return getBackgroundNotificationManager().getState();
  });

  useEffect(() => {
    // Only initialize on client side
    if (typeof window === 'undefined') return;
    
    const manager = getBackgroundNotificationManager();
    manager.initialize();
    const unsubscribe = manager.addListener(setState);
    return unsubscribe;
  }, []);

  const subscribeToRoom = useCallback((roomId: string, displayName: string) => {
    getBackgroundNotificationManager().subscribeToRoom(roomId, displayName);
  }, []);

  const unsubscribeFromRoom = useCallback((roomId: string) => {
    getBackgroundNotificationManager().unsubscribeFromRoom(roomId);
  }, []);

  const setCurrentRoom = useCallback((roomId: string | null) => {
    getBackgroundNotificationManager().setCurrentRoom(roomId);
  }, []);

  return {
    isConnected: state.isConnected,
    subscriptions: Array.from(state.subscriptions.values()),
    currentRoom: state.currentRoom,
    subscribeToRoom,
    unsubscribeFromRoom,
    setCurrentRoom,
    coordinationStatus: getBackgroundNotificationManager().getCoordinationStatus()
  };
}

// Hook for room-specific notification handling with better coordination
export function useRoomBackgroundNotifications(roomId: string, displayName: string) {
  const { triggerNotification } = useMessageNotifications(roomId, displayName);

  useEffect(() => {
    if (!roomId || !displayName) return;
    // SSR guard
    if (typeof window === 'undefined') return;

    const manager = getBackgroundNotificationManager();
    manager.initialize();

    const currentState = manager.getState();
    const existingSubscription = currentState.subscriptions.get(roomId);
    
    // More intelligent subscription logic
    if (!existingSubscription || existingSubscription.subscribed) {
      console.log('🔔 Auto-subscribing to enhanced background notifications for room:', roomId);
      manager.subscribeToRoom(roomId, displayName);
    } else {
      console.log('🔕 Skipping auto-subscription - notifications disabled for room:', roomId);
    }

    const messageHandler = (message: Message) => {
      console.log('🔔 Enhanced background notification handler triggered for room:', roomId, message);
      triggerNotification(message);
    };

    manager.setMessageHandler(roomId, messageHandler);

    return () => {
      manager.removeMessageHandler(roomId);
    };
  }, [roomId, displayName, triggerNotification]);

  return {
    coordinationStatus: getBackgroundNotificationManager().getCoordinationStatus()
  };
}

// Hook for global notification handling (homepage, etc.)
export function useGlobalBackgroundNotifications() {
  useEffect(() => {
    // SSR guard
    if (typeof window === 'undefined') return;
    
    console.log('🔔 Setting up enhanced global background notifications');
    
    const manager = getBackgroundNotificationManager();
    manager.initialize();

    const globalHandler = (message: Message) => {
      console.log('🔔 Enhanced global notification handler triggered:', message);
      
      const state = manager.getState();
      const subscription = state.subscriptions.get(message.roomId);
      
      if (subscription) {
        // Enhanced global notifications with better error handling
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
                { action: 'open', title: 'Open Chat' },
                { action: 'dismiss', title: 'Dismiss' }
              ]
            });
          }).then(() => {
            console.log('✅ Enhanced global notification shown successfully');
          }).catch(error => {
            console.error('❌ Enhanced global notification failed:', error);
            
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
              
              console.log('✅ Enhanced global fallback notification shown');
            } catch (fallbackError) {
              console.error('❌ Enhanced global fallback notification failed:', fallbackError);
            }
          });
        }
      }
    };

    manager.setGlobalNotificationHandler(globalHandler);
    console.log('✅ Enhanced global notification handler registered');

    return () => {
      console.log('🔔 Cleaning up enhanced global notification handler');
      manager.removeGlobalNotificationHandler();
    };
  }, []);

  return {
    coordinationStatus: getBackgroundNotificationManager().getCoordinationStatus()
  };
}

// Export the manager and coordinator for advanced use cases
export { getBackgroundNotificationManager as backgroundNotificationManager, ConnectionCoordinator };