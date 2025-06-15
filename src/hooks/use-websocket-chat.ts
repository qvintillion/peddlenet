'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Message, ConnectionStatus } from '@/lib/types';
import { generateCompatibleUUID } from '@/utils/peer-utils';
import { NetworkUtils } from '@/utils/network-utils';
import { MessagePersistence } from '@/utils/message-persistence';
import { ServerUtils } from '@/utils/server-utils';
import { unreadMessageManager } from '@/hooks/use-unread-messages';

// Enhanced connection resilience with Cloud Run optimizations
const createEnhancedConnectionResilience = () => {
  let circuitBreaker = {
    isOpen: false,
    failureCount: 0,
    lastFailureTime: 0,
    successCount: 0,
    lastSuccessTime: 0
  };
  
  let backoffState = {
    currentAttempt: 0,
    lastAttemptTime: 0
  };
  
  const FAILURE_THRESHOLD = 3;
  const RECOVERY_TIMEOUT = 8000;
  const SUCCESS_THRESHOLD = 2;
  const MAX_BACKOFF = 12000;
  const COLD_START_BACKOFF = 2000;
  
  return {
    shouldAllowConnection(): boolean {
      const now = Date.now();
      const timeSinceLastFailure = now - circuitBreaker.lastFailureTime;
      
      if (circuitBreaker.isOpen) {
        if (timeSinceLastFailure > RECOVERY_TIMEOUT) {
          console.log('🔄 Circuit breaker attempting recovery - allowing test connection');
          return true;
        }
        console.log('🚫 Circuit breaker open - blocking connection');
        return false;
      }
      
      return true;
    },
    
    recordSuccess(): void {
      const now = Date.now();
      circuitBreaker.successCount++;
      circuitBreaker.lastSuccessTime = now;
      backoffState.currentAttempt = 0;
      
      if (circuitBreaker.isOpen && circuitBreaker.successCount >= SUCCESS_THRESHOLD) {
        circuitBreaker.isOpen = false;
        circuitBreaker.failureCount = 0;
        circuitBreaker.successCount = 0;
        console.log('✅ Circuit breaker closed - connection stable');
      }
    },
    
    recordFailure(): void {
      const now = Date.now();
      circuitBreaker.failureCount++;
      circuitBreaker.lastFailureTime = now;
      circuitBreaker.successCount = 0;
      
      if (circuitBreaker.failureCount >= FAILURE_THRESHOLD) {
        circuitBreaker.isOpen = true;
        console.log(`⚡ Circuit breaker opened after ${circuitBreaker.failureCount} failures`);
      }
    },
    
    getExponentialBackoffDelay(attempt?: number, isColdStart?: boolean): number {
      if (isColdStart) {
        const jitter = Math.random() * 500;
        const delay = COLD_START_BACKOFF + jitter;
        console.log(`❄️ Cold start backoff: ${Math.round(delay)}ms`);
        return delay;
      }
      
      const currentAttempt = attempt !== undefined ? attempt : backoffState.currentAttempt;
      const baseDelay = 1000;
      const jitter = Math.random() * 500;
      
      const delay = Math.min(baseDelay * Math.pow(1.5, currentAttempt) + jitter, MAX_BACKOFF);
      backoffState.currentAttempt = currentAttempt + 1;
      backoffState.lastAttemptTime = Date.now();
      
      console.log(`⏱️ Enhanced backoff: attempt ${currentAttempt}, delay ${Math.round(delay)}ms`);
      return delay;
    },
    
    getAdaptiveTimeout(): number {
      const recentFailures = circuitBreaker.failureCount;
      const baseTimeout = 15000; // Increased for Cloud Run cold starts
      
      if (recentFailures > 1) {
        return Math.min(baseTimeout * 1.8, 30000); // Up to 30s for cold starts
      }
      
      return baseTimeout;
    },
    
    reset(): void {
      circuitBreaker = {
        isOpen: false,
        failureCount: 0,
        lastFailureTime: 0,
        successCount: 0,
        lastSuccessTime: 0
      };
      backoffState = {
        currentAttempt: 0,
        lastAttemptTime: 0
      };
      console.log('🔄 Circuit breaker reset for Cloud Run compatibility');
    },
    
    getState() {
      return {
        circuitBreaker: { ...circuitBreaker },
        backoffState: { ...backoffState }
      };
    }
  };
};

const EnhancedConnectionResilience = createEnhancedConnectionResilience();

// Health monitoring with Cloud Run awareness
const createHealthMonitor = () => {
  let healthState = {
    lastPing: 0,
    lastPong: 0,
    pingCount: 0,
    pongCount: 0,
    averageLatency: 0,
    connectionQuality: 'unknown' as 'excellent' | 'good' | 'poor' | 'unknown',
    coldStartDetected: false
  };
  
  return {
    recordPing(): void {
      healthState.lastPing = Date.now();
      healthState.pingCount++;
    },
    
    recordPong(): void {
      const now = Date.now();
      const latency = now - healthState.lastPing;
      
      healthState.lastPong = now;
      healthState.pongCount++;
      
      healthState.averageLatency = healthState.averageLatency === 0 
        ? latency 
        : (healthState.averageLatency * 0.7) + (latency * 0.3);
      
      // Cloud Run aware quality assessment
      if (latency < 200) {
        healthState.connectionQuality = 'excellent';
        healthState.coldStartDetected = false;
      } else if (latency < 500) {
        healthState.connectionQuality = 'good';
        healthState.coldStartDetected = false;
      } else if (latency < 2000) {
        healthState.connectionQuality = 'poor';
        healthState.coldStartDetected = latency > 1000;
      } else {
        healthState.connectionQuality = 'poor';
        healthState.coldStartDetected = true;
      }
      
      if (healthState.coldStartDetected) {
        console.log(`❄️ Cold start detected: ${latency}ms latency`);
      }
    },
    
    isHealthy(): boolean {
      const now = Date.now();
      const timeSinceLastPong = now - healthState.lastPong;
      return timeSinceLastPong < 60000 && healthState.connectionQuality !== 'poor';
    },
    
    getHealthMetrics() {
      return {
        ...healthState,
        timeSinceLastPong: Date.now() - healthState.lastPong,
        isHealthy: this.isHealthy()
      };
    }
  };
};

export function useWebSocketChat(roomId: string, displayName?: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [connectedPeers, setConnectedPeers] = useState<string[]>([]);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [connectionCooldown, setConnectionCooldown] = useState(false);
  const [shouldAutoReconnect, setShouldAutoReconnect] = useState(true);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor' | 'unknown'>('unknown');
  
  const socketRef = useRef<Socket | null>(null);
  const messageHandlersRef = useRef<Set<(message: Message) => void>>(new Set());
  const healthMonitor = useRef(createHealthMonitor());
  const autoReconnectTimer = useRef<NodeJS.Timeout | null>(null);
  const healthCheckTimer = useRef<NodeJS.Timeout | null>(null);
  
  const effectiveDisplayName = displayName && displayName.trim() && displayName !== 'Anonymous' ? displayName.trim() : null;
  const myPeerId = useRef<string>(generateCompatibleUUID());
  const connectionId = useRef<string>(Math.random().toString(36).substring(7));
  const roomConnectionRef = useRef<string>('');
  const isConnectingRef = useRef(false);
  const lastSuccessfulConnection = useRef<number>(0);

  const status: ConnectionStatus = {
    isConnected,
    connectedPeers: connectedPeers.length,
    networkReach: isConnected ? 'server' as const : 'isolated' as const,
    signalStrength: connectionQuality === 'excellent' ? 'strong' as const : 
                   connectionQuality === 'good' ? 'medium' as const : 
                   connectionQuality === 'poor' ? 'weak' as const : 'none' as const,
  };

  const startHealthMonitoring = useCallback((socket: Socket) => {
    if (healthCheckTimer.current) {
      clearInterval(healthCheckTimer.current);
    }
    
    healthCheckTimer.current = setInterval(() => {
      if (socket && socket.connected) {
        healthMonitor.current.recordPing();
        socket.emit('health-ping', { timestamp: Date.now() });
      }
    }, 20000); // Every 20 seconds for Cloud Run
    
    console.log('🏥 Health monitoring started (Cloud Run optimized)');
  }, []);

  const stopHealthMonitoring = useCallback(() => {
    if (healthCheckTimer.current) {
      clearInterval(healthCheckTimer.current);
      healthCheckTimer.current = null;
      console.log('🏥 Health monitoring stopped');
    }
  }, []);

  // Enhanced Cloud Run compatible connection
  const connectToServer = useCallback(async () => {
    if (!EnhancedConnectionResilience.shouldAllowConnection()) {
      console.log(`🚫 [${connectionId.current}] Circuit breaker blocking connection`);
      return;
    }
    
    if (!roomId || !effectiveDisplayName || isConnectingRef.current) {
      console.log(`⏸️ [${connectionId.current}] Skipping connection - missing requirements`);
      return;
    }
    
    const now = Date.now();
    const timeSinceLastSuccess = now - lastSuccessfulConnection.current;
    if (timeSinceLastSuccess < 3000 && socketRef.current?.connected) {
      console.log(`⏳ [${connectionId.current}] Too soon since last connection`);
      return;
    }
    
    if (connectionCooldown && roomConnectionRef.current === roomId) {
      console.log(`⏳ [${connectionId.current}] In cooldown`);
      return;
    }
    
    // Handle room switching
    if (socketRef.current?.connected && roomConnectionRef.current !== roomId) {
      console.log(`🔄 [${connectionId.current}] Room switching:`, roomConnectionRef.current, '→', roomId);
      stopHealthMonitoring();
      socketRef.current.disconnect();
      socketRef.current = null;
      roomConnectionRef.current = '';
    }
    
    isConnectingRef.current = true;
    
    if (socketRef.current) {
      console.log('Disconnecting existing socket before new connection');
      stopHealthMonitoring();
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    const serverUrl = ServerUtils.getWebSocketServerUrl();
    const envInfo = ServerUtils.getEnvironmentInfo();
    
    console.log('🔍 Enhanced Cloud Run connection details:');
    console.log('  - WebSocket URL:', serverUrl);
    console.log('  - Environment:', envInfo.environment);
    console.log('  - Adaptive timeout:', EnhancedConnectionResilience.getAdaptiveTimeout());
    
    if (!serverUrl) {
      console.error('❌ No WebSocket server URL configured');
      isConnectingRef.current = false;
      return;
    }

    setIsRetrying(true);
    console.log(`🔌 [${connectionId.current}] Enhanced Cloud Run connection to:`, serverUrl, 'as:', effectiveDisplayName);

    const adaptiveTimeout = EnhancedConnectionResilience.getAdaptiveTimeout();
    
    // CRITICAL: Cloud Run optimized Socket.IO configuration
    const socket = io(serverUrl, {
      // CRITICAL: Polling first for Cloud Run compatibility
      transports: ['polling', 'websocket'],
      timeout: adaptiveTimeout,
      forceNew: true,
      autoConnect: true,
      
      // Enhanced reconnection strategy (disabled for manual control)
      reconnection: false,
      reconnectionAttempts: 0,
      
      // Cloud Run optimized transport settings
      upgrade: true,
      rememberUpgrade: false, // Don't remember for cold starts
      
      // Enhanced timeouts for Cloud Run cold starts
      pingTimeout: 60000,
      pingInterval: 25000,
      
      // CORS and credentials for Cloud Run
      withCredentials: true,
      closeOnBeforeunload: false,
      forceBase64: false,
      
      // Enhanced error handling
      allowUpgrades: true,
      
      // CRITICAL: Extra headers for connection identification
      extraHeaders: {
        'X-Connection-Type': 'websocket-chat'
      }
    });

    socketRef.current = socket;

    // Enhanced connection event handlers with Cloud Run awareness
    socket.on('connect', () => {
      const now = Date.now();
      console.log(`🚀 [${connectionId.current}] Cloud Run connection established as:`, effectiveDisplayName);
      console.log(`   Transport: ${socket.io.engine.transport.name}, Upgraded: ${socket.io.engine.upgraded}`);
      
      setIsConnected(true);
      setIsRetrying(false);
      setRetryCount(0);
      isConnectingRef.current = false;
      roomConnectionRef.current = roomId;
      lastSuccessfulConnection.current = now;
      
      // Record successful connection
      EnhancedConnectionResilience.recordSuccess();
      
      // Start enhanced health monitoring
      startHealthMonitoring(socket);
      
      socket.emit('join-room', {
        roomId,
        peerId: myPeerId.current,
        displayName: effectiveDisplayName
      });
      
      // Enhanced message history handling with longer timeout for cold starts
      setTimeout(() => {
        const localMessages = MessagePersistence.getRoomMessages(roomId);
        if (localMessages.length > 0) {
          console.log('⏰ Cloud Run history timeout, using local fallback:', localMessages.length);
          setMessages(prev => prev.length === 0 ? localMessages : prev);
        }
      }, 5000); // Increased timeout for Cloud Run cold starts
    });

    // Enhanced disconnect handling with Cloud Run cold start detection
    socket.on('disconnect', (reason) => {
      console.log(`🔌 [${connectionId.current}] Enhanced disconnect:`, reason);
      console.log(`   Transport: ${socket.io.engine?.transport?.name || 'unknown'}`);
      
      setIsConnected(false);
      isConnectingRef.current = false;
      roomConnectionRef.current = '';
      stopHealthMonitoring();
      
      // Enhanced Cloud Run disconnect reason analysis
      const isCloudRunColdStart = reason === 'transport close' || 
                                  reason === 'ping timeout' ||
                                  reason === 'transport error';
      
      const isUnexpected = reason !== 'client namespace disconnect' && 
                          reason !== 'io client disconnect';
      
      if (isCloudRunColdStart) {
        console.log(`❄️ [${connectionId.current}] Cloud Run cold start detected - rapid reconnection`);
      } else if (isUnexpected) {
        console.log(`⚠️ [${connectionId.current}] Unexpected disconnect:`, reason);
        EnhancedConnectionResilience.recordFailure();
      }
      
      // Enhanced auto-reconnect with Cloud Run awareness
      if (shouldAutoReconnect && effectiveDisplayName && !reason.includes('server')) {
        const backoffDelay = isCloudRunColdStart ? 
          EnhancedConnectionResilience.getExponentialBackoffDelay(0, true) : // Special cold start handling
          EnhancedConnectionResilience.getExponentialBackoffDelay(); // Normal backoff
          
        console.log(`🔄 [${connectionId.current}] Cloud Run auto-reconnect in ${backoffDelay}ms...`);
        
        autoReconnectTimer.current = setTimeout(() => {
          console.log(`🔄 [${connectionId.current}] Attempting Cloud Run auto-reconnect...`);
          connectToServer();
        }, backoffDelay);
      }
    });

    // Enhanced error handling with CORS debugging
    socket.on('connect_error', (error) => {
      console.error('Enhanced connection error:', {
        message: error.message,
        type: error.type,
        description: error.description,
        context: error.context,
        transport: error.transport
      });
      
      // CRITICAL: Check for CORS errors
      if (error.message.includes('CORS') || error.message.includes('Access-Control')) {
        console.error('🚨 CORS ERROR DETECTED - Server needs CORS fix!');
      }
      
      setIsConnected(false);
      setIsRetrying(false);
      isConnectingRef.current = false;
      
      // Enhanced error categorization
      const isRetryableError = !error.message.includes('rate limit') && 
                              !error.message.includes('throttle') &&
                              !error.message.includes('forbidden') &&
                              !error.message.includes('CORS');
      
      if (isRetryableError) {
        EnhancedConnectionResilience.recordFailure();
      }
      
      // Enhanced backoff with error-specific delays
      const isRateLimit = error.message.includes('rate limit') || error.message.includes('throttle');
      const isCorsError = error.message.includes('CORS') || error.message.includes('Access-Control');
      
      let backoffDelay;
      if (isCorsError) {
        backoffDelay = 10000; // 10 second delay for CORS errors
      } else if (isRateLimit) {
        backoffDelay = Math.min(5000 + Math.random() * 3000, 10000); // 5-10s for rate limits
      } else {
        backoffDelay = EnhancedConnectionResilience.getExponentialBackoffDelay();
      }
        
      setConnectionCooldown(true);
      setRetryCount(prev => prev + 1);
      
      setTimeout(() => {
        setConnectionCooldown(false);
        console.log(`🔄 [${connectionId.current}] Enhanced cooldown ended`);
        
        if (shouldAutoReconnect && effectiveDisplayName && isRetryableError) {
          console.log(`🔄 [${connectionId.current}] Enhanced auto-retry after error...`);
          connectToServer();
        }
      }, backoffDelay);
    });

    // Enhanced health monitoring handlers
    socket.on('health-pong', (data) => {
      healthMonitor.current.recordPong();
      const metrics = healthMonitor.current.getHealthMetrics();
      setConnectionQuality(metrics.connectionQuality);
      
      if (!metrics.isHealthy && isConnected) {
        console.log('🏥 Connection health degraded, monitoring...');
      }
    });

    // Enhanced server shutdown handling
    socket.on('server-shutdown', (data) => {
      console.log('🛑 Server shutdown notification:', data);
      setShouldAutoReconnect(false);
      
      setTimeout(() => {
        setShouldAutoReconnect(true);
        console.log('🔄 Attempting reconnection after server maintenance...');
        connectToServer();
      }, data.reconnectDelay || 15000); // Longer delay for Cloud Run
    });

    // CRITICAL: Handle database wipe events
    socket.on('database-wiped', (data) => {
      console.log('🗑️ Database wiped notification received:', data);
      
      // Clear all local message state immediately
      setMessages([]);
      
      // Clear persisted messages for this room
      try {
        MessagePersistence.clearRoomMessages(roomId);
        console.log('🧹 Cleared local message persistence for room:', roomId);
      } catch (error) {
        console.warn('Failed to clear local persistence:', error);
      }
      
      // Clear all unread message counts
      try {
        unreadMessageManager.clearAll();
        console.log('🧹 Cleared all unread message counts');
      } catch (error) {
        console.warn('Failed to clear unread counts:', error);
      }
      
      // Force reload if requested
      if (data.forceReload && typeof window !== 'undefined') {
        console.log('🔄 Force reloading page after database wipe...');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    });

    // Handle force refresh events
    socket.on('force-refresh', (data) => {
      console.log('🔄 Force refresh notification:', data);
      
      // Clear all local state
      setMessages([]);
      setConnectedPeers([]);
      
      // Clear local persistence
      try {
        MessagePersistence.clearRoomMessages(roomId);
      } catch (error) {
        console.warn('Failed to clear local persistence:', error);
      }
      
      // Clear all unread message counts
      try {
        unreadMessageManager.clearAll();
        console.log('🧹 Cleared all unread message counts');
      } catch (error) {
        console.warn('Failed to clear unread counts:', error);
      }
      
      // Optionally reload page
      if (data.forceReload !== false && typeof window !== 'undefined') {
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    });

    // CRITICAL: Handle room-specific message clearing
    socket.on('room-messages-cleared', (data) => {
      console.log('🗑️ Room messages cleared notification received:', data);
      
      // Only clear if this is for the current room
      if (data.roomId === roomId) {
        console.log(`🧹 Clearing local state for room: ${data.roomId}`);
        
        // Clear messages from React state
        setMessages([]);
        
        // Clear persisted messages for this specific room
        try {
          MessagePersistence.clearRoomMessages(data.roomId);
          console.log(`🧹 Cleared local message persistence for room: ${data.roomId}`);
        } catch (error) {
          console.warn('Failed to clear local persistence for room:', error);
        }
        
        // Clear unread message counts for this specific room
        try {
          unreadMessageManager.clearRoom(data.roomId);
          console.log(`🧹 Cleared unread message counts for room: ${data.roomId}`);
        } catch (error) {
          console.warn('Failed to clear unread counts for room:', error);
        }
        
        // Show a brief notification to the user
        if (typeof window !== 'undefined' && data.message) {
          // You could show a toast notification here if available
          console.log(`📢 Admin message: ${data.message}`);
        }
      } else {
        console.log(`ℹ️ Room messages cleared for different room (${data.roomId}), ignoring`);
      }
    });

    // Standard message handling (unchanged)
    socket.on('message-history', (messageHistory: Message[]) => {
      console.log('📚 Enhanced message history received:', messageHistory.length);
      
      const localMessages = MessagePersistence.getRoomMessages(roomId);
      
      if (messageHistory.length > 0) {
        const mergedMessages = MessagePersistence.mergeMessages(roomId, messageHistory, localMessages);
        setMessages(mergedMessages);
        MessagePersistence.saveRoomMessages(roomId, mergedMessages, connectedPeers.length);
      } else {
        console.log('📂 Enhanced: No server history, using local messages:', localMessages.length);
        if (localMessages.length > 0) {
          setMessages(localMessages);
        }
      }
    });

    socket.on('chat-message', (message: any) => {
      console.log('📥 Enhanced real-time message:', message);
      
      const normalizedMessage: Message = {
        id: message.id || generateCompatibleUUID(),
        content: message.content || '',
        sender: message.sender || 'Unknown',
        timestamp: message.timestamp || Date.now(),
        type: message.type || 'chat',
        roomId: roomId,
        synced: true
      };
      
      setMessages(prev => {
        const isDuplicate = prev.some(m => m.id === normalizedMessage.id);
        if (isDuplicate) {
          console.log('⚠️ Enhanced: Duplicate message ignored:', normalizedMessage.id);
          return prev;
        }
        
        const updated = [...prev, normalizedMessage].sort((a, b) => a.timestamp - b.timestamp);
        MessagePersistence.addMessage(roomId, normalizedMessage);
        
        return updated;
      });
      
      messageHandlersRef.current.forEach(handler => {
        try {
          handler(normalizedMessage);
        } catch (e) {
          console.error('Enhanced message handler error:', e);
        }
      });
    });

    // Enhanced peer management with strict deduplication
    socket.on('room-peers', (peers: any[]) => {
      console.log('Enhanced room peers total:', peers.length);
      
      // First, filter out invalid peer data
      const validPeers = peers.filter(p => 
        p && 
        p.displayName && 
        typeof p.displayName === 'string' && 
        p.displayName.trim() && 
        p.displayName !== effectiveDisplayName
      );
      
      // Then, get unique display names (case-sensitive but trimmed)
      const uniquePeerNames = Array.from(
        new Set(validPeers.map(p => p.displayName.trim()))
      ).filter(name => name && name !== effectiveDisplayName);
      
      const namedUsers = uniquePeerNames.filter(name => !name.startsWith('User_'));
      const anonymousUsers = uniquePeerNames.filter(name => name.startsWith('User_'));
      
      console.log('Enhanced unique peers:', {
        total: uniquePeerNames.length,
        named: namedUsers.length,
        anonymous: anonymousUsers.length,
        namedUsers,
        anonymousUsers
      });
      
      setConnectedPeers(uniquePeerNames);
    });

    socket.on('peer-joined', (peer: any) => {
      if (!peer || !peer.displayName || !peer.displayName.trim()) {
        console.warn('Invalid peer data received:', peer);
        return;
      }
      
      const trimmedName = peer.displayName.trim();
      
      // Skip if it's ourselves
      if (trimmedName === effectiveDisplayName) {
        return;
      }
      
      const isAnonymous = trimmedName.startsWith('User_');
      const logMessage = isAnonymous 
        ? `📝 Anonymous user joined: ${trimmedName}`
        : `👋 User joined: ${trimmedName}`;
      
      console.log(logMessage, peer.isReconnection ? '(reconnection)' : '(new)');
      
      setConnectedPeers(prev => {
        // Ensure no duplicates by checking trimmed names
        if (prev.some(name => name.trim() === trimmedName)) {
          return prev;
        }
        return [...prev, trimmedName];
      });
    });

    socket.on('peer-left', (peer: any) => {
      if (!peer || !peer.displayName) {
        console.warn('Invalid peer data received for leave:', peer);
        return;
      }
      
      const trimmedName = peer.displayName.trim();
      
      // Skip if it's ourselves
      if (trimmedName === effectiveDisplayName) {
        return;
      }
      
      const isAnonymous = trimmedName.startsWith('User_');
      const logMessage = isAnonymous 
        ? `📝 Anonymous user left: ${trimmedName}`
        : `👋 User left: ${trimmedName}`;
      
      console.log(logMessage, 'reason:', peer.reason);
      
      setConnectedPeers(prev => 
        prev.filter(name => name.trim() !== trimmedName)
      );
    });

  }, [roomId, effectiveDisplayName, connectionCooldown, retryCount, startHealthMonitoring, stopHealthMonitoring]);

  // Enhanced initialization effect
  useEffect(() => {
    if (roomId) {
      const persistedMessages = MessagePersistence.getRoomMessages(roomId);
      if (persistedMessages.length > 0) {
        console.log(`📂 Enhanced: Loaded ${persistedMessages.length} persisted messages for room ${roomId}`);
        setMessages(persistedMessages);
      }
    }
    
    if (roomId && effectiveDisplayName && !isConnectingRef.current && 
        !(socketRef.current?.connected && roomConnectionRef.current === roomId)) {
      console.log(`🚀 [${connectionId.current}] Enhanced Cloud Run initialization for:`, effectiveDisplayName);
      connectToServer();
    }

    return () => {
      setShouldAutoReconnect(false);
      stopHealthMonitoring();
      
      if (autoReconnectTimer.current) {
        clearTimeout(autoReconnectTimer.current);
        autoReconnectTimer.current = null;
      }
      
      if (socketRef.current) {
        console.log(`🛑 [${connectionId.current}] Enhanced cleanup - disconnecting`);
        const socket = socketRef.current;
        socketRef.current = null;
        isConnectingRef.current = false;
        roomConnectionRef.current = '';
        
        if (socket.connected || socket.disconnected === false) {
          socket.disconnect();
        }
      }
    };
  }, [roomId, effectiveDisplayName, connectToServer, stopHealthMonitoring]);

  // Enhanced send message function
  const sendMessage = useCallback((messageData: Omit<Message, 'id' | 'timestamp'>) => {
    const socket = socketRef.current;
    if (!socket || !socket.connected) {
      console.log('❌ Enhanced: Cannot send message - not connected');
      return generateCompatibleUUID();
    }

    if (!effectiveDisplayName) {
      console.log('❌ Enhanced: Cannot send message - no valid display name');
      return generateCompatibleUUID();
    }

    const messageId = generateCompatibleUUID();
    
    const messagePayload = {
      roomId,
      message: {
        content: messageData.content,
        id: messageId
      }
    };
    
    console.log('📤 Enhanced: Sending message:', messageData.content);
    socket.emit('chat-message', messagePayload);
    
    return messageId;
  }, [roomId, effectiveDisplayName]);

  // Enhanced message handler registration
  const onMessage = useCallback((handler: (message: Message) => void) => {
    messageHandlersRef.current.add(handler);
    return () => {
      messageHandlersRef.current.delete(handler);
    };
  }, []);

  // Enhanced force reconnect with Cloud Run reset
  const forceReconnect = useCallback(async () => {
    console.log('🔄 Enhanced Cloud Run force reconnect with full reset...');
    
    if (autoReconnectTimer.current) {
      clearTimeout(autoReconnectTimer.current);
      autoReconnectTimer.current = null;
    }
    
    stopHealthMonitoring();
    
    // Full reset of enhanced circuit breaker
    EnhancedConnectionResilience.reset();
    
    // Reset all local state
    setRetryCount(0);
    setConnectionCooldown(false);
    setShouldAutoReconnect(true);
    setConnectionQuality('unknown');
    
    // Clean disconnect
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    
    isConnectingRef.current = false;
    roomConnectionRef.current = '';
    lastSuccessfulConnection.current = 0;
    
    // Attempt fresh connection with small delay for Cloud Run
    setTimeout(() => {
      connectToServer();
    }, 2000);
    
    return true;
  }, [connectToServer, stopHealthMonitoring]);
  
  // Enhanced connection diagnostics
  const getConnectionDiagnostics = useCallback(() => {
    return {
      enhancedCircuitBreaker: EnhancedConnectionResilience.getState(),
      healthMetrics: healthMonitor.current.getHealthMetrics(),
      connection: {
        isConnected,
        isRetrying,
        retryCount,
        connectionCooldown,
        connectionQuality,
        roomId: roomConnectionRef.current,
        peerId: myPeerId.current,
        lastSuccessfulConnection: lastSuccessfulConnection.current
      },
      socket: {
        exists: !!socketRef.current,
        connected: socketRef.current?.connected || false,
        id: socketRef.current?.id || null,
        transport: socketRef.current?.io.engine?.transport?.name || 'unknown'
      },
      timers: {
        autoReconnect: !!autoReconnectTimer.current,
        healthCheck: !!healthCheckTimer.current
      },
      cloudRun: {
        optimized: true,
        coldStartDetection: healthMonitor.current.getHealthMetrics().coldStartDetected
      }
    };
  }, [isConnected, isRetrying, retryCount, connectionCooldown, connectionQuality]);

  // Make debugging available globally
  if (typeof window !== 'undefined') {
    (window as any).EnhancedConnectionResilience = EnhancedConnectionResilience;
    (window as any).getConnectionDiagnostics = getConnectionDiagnostics;
  }

  return {
    peerId: myPeerId.current,
    status,
    isRetrying,
    retryCount,
    connectionQuality,
    messages,
    sendMessage,
    onMessage,
    forceReconnect,
    connectToPeer: async () => true,
    getConnectedPeers: () => connectedPeers,
    isSignalingConnected: isConnected,
    socket: socketRef.current, // Expose the socket instance for WebRTC
    // Enhanced debugging and resilience features
    getConnectionDiagnostics,
    circuitBreakerState: EnhancedConnectionResilience.getState(),
    healthMetrics: healthMonitor.current.getHealthMetrics()
  };
}