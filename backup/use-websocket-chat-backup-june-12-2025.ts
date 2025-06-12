'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Message, ConnectionStatus } from '@/lib/types';
import { generateCompatibleUUID } from '@/utils/peer-utils';
import { NetworkUtils } from '@/utils/network-utils';
import { MessagePersistence } from '@/utils/message-persistence';
import { ServerUtils } from '@/utils/server-utils';

// Enhanced connection resilience with adaptive timing
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
  
  const FAILURE_THRESHOLD = 3; // Reduced from 5 for faster detection
  const RECOVERY_TIMEOUT = 10000; // Reduced from 15s for faster recovery
  const SUCCESS_THRESHOLD = 2; // Require 2 successes to close circuit
  const MAX_BACKOFF = 15000; // Max 15 seconds (reduced from 30s)
  
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
      backoffState.currentAttempt = 0; // Reset backoff on success
      
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
    
    getExponentialBackoffDelay(attempt?: number): number {
      const currentAttempt = attempt !== undefined ? attempt : backoffState.currentAttempt;
      const baseDelay = 1000; // Start with 1 second
      const jitter = Math.random() * 500;
      
      const delay = Math.min(baseDelay * Math.pow(1.8, currentAttempt) + jitter, MAX_BACKOFF);
      backoffState.currentAttempt = currentAttempt + 1;
      backoffState.lastAttemptTime = Date.now();
      
      console.log(`⏱️ Exponential backoff: attempt ${currentAttempt}, delay ${Math.round(delay)}ms`);
      return delay;
    },
    
    // Adaptive timing based on connection success rate
    getAdaptiveTimeout(): number {
      const recentFailures = circuitBreaker.failureCount;
      const baseTimeout = 8000;
      
      // Increase timeout if we've had recent failures
      if (recentFailures > 2) {
        return Math.min(baseTimeout * 1.5, 15000);
      }
      
      return baseTimeout;
    },
    
    getState() {
      return { 
        ...circuitBreaker, 
        backoff: { ...backoffState },
        thresholds: {
          failure: FAILURE_THRESHOLD,
          recovery: RECOVERY_TIMEOUT,
          success: SUCCESS_THRESHOLD
        }
      };
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
      console.log('🔄 Enhanced circuit breaker manually reset');
    }
  };
};

// Create enhanced instance
const EnhancedConnectionResilience = createEnhancedConnectionResilience();

// Global access for debugging
if (typeof window !== 'undefined') {
  setTimeout(() => {
    try {
      (window as any).EnhancedConnectionResilience = EnhancedConnectionResilience;
      console.log('🔧 Enhanced Connection Resilience v2.0 loaded - Adaptive timing and improved stability');
    } catch (error) {
      console.warn('Enhanced ConnectionResilience initialization failed:', error);
    }
  }, 0);
}

// Health monitoring for connections
const createHealthMonitor = () => {
  let healthState = {
    lastPing: 0,
    lastPong: 0,
    pingCount: 0,
    pongCount: 0,
    averageLatency: 0,
    connectionQuality: 'unknown' as 'excellent' | 'good' | 'poor' | 'unknown'
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
      
      // Calculate rolling average latency
      healthState.averageLatency = healthState.averageLatency === 0 
        ? latency 
        : (healthState.averageLatency * 0.7) + (latency * 0.3);
      
      // Update connection quality
      if (latency < 100) {
        healthState.connectionQuality = 'excellent';
      } else if (latency < 300) {
        healthState.connectionQuality = 'good';
      } else {
        healthState.connectionQuality = 'poor';
      }
      
      console.log(`🏥 Health: ${latency}ms latency, avg: ${Math.round(healthState.averageLatency)}ms, quality: ${healthState.connectionQuality}`);
    },
    
    isHealthy(): boolean {
      const now = Date.now();
      const timeSinceLastPong = now - healthState.lastPong;
      
      // Consider unhealthy if no pong in last 60 seconds
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
  
  // Connection state management
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

  // Enhanced health check system
  const startHealthMonitoring = useCallback((socket: Socket) => {
    // Clear any existing health check
    if (healthCheckTimer.current) {
      clearInterval(healthCheckTimer.current);
    }
    
    healthCheckTimer.current = setInterval(() => {
      if (socket && socket.connected) {
        healthMonitor.current.recordPing();
        socket.emit('health-ping', { timestamp: Date.now() });
      } else {
        console.log('🏥 Health check: Socket disconnected');
      }
    }, 15000); // Health check every 15 seconds
    
    console.log('🏥 Health monitoring started');
  }, []);

  const stopHealthMonitoring = useCallback(() => {
    if (healthCheckTimer.current) {
      clearInterval(healthCheckTimer.current);
      healthCheckTimer.current = null;
      console.log('🏥 Health monitoring stopped');
    }
  }, []);

  // Enhanced connect to server function
  const connectToServer = useCallback(async () => {
    // Enhanced circuit breaker check
    if (!EnhancedConnectionResilience.shouldAllowConnection()) {
      console.log(`🚫 [${connectionId.current}] Enhanced circuit breaker blocking connection attempt`);
      return;
    }
    
    if (!roomId || !effectiveDisplayName || isConnectingRef.current) {
      console.log(`⏸️ [${connectionId.current}] Skipping connection - missing requirements`);
      return;
    }
    
    // Prevent rapid reconnection attempts
    const now = Date.now();
    const timeSinceLastSuccess = now - lastSuccessfulConnection.current;
    if (timeSinceLastSuccess < 2000 && socketRef.current?.connected) {
      console.log(`⏳ [${connectionId.current}] Too soon since last connection, waiting...`);
      return;
    }
    
    if (connectionCooldown && roomConnectionRef.current === roomId) {
      console.log(`⏳ [${connectionId.current}] In enhanced cooldown, waiting...`);
      return;
    }
    
    // Handle room switching
    if (socketRef.current?.connected && roomConnectionRef.current !== roomId) {
      console.log(`🔄 [${connectionId.current}] Enhanced room switching:`, roomConnectionRef.current, '→', roomId);
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

    // Enhanced server URL detection
    const serverUrl = ServerUtils.getWebSocketServerUrl();
    const envInfo = ServerUtils.getEnvironmentInfo();
    
    console.log('🔍 Enhanced server connection details:');
    console.log('  - WebSocket URL:', serverUrl);
    console.log('  - Environment:', envInfo.environment);
    console.log('  - Adaptive timeout:', EnhancedConnectionResilience.getAdaptiveTimeout());
    
    if (!serverUrl) {
      console.error('❌ No WebSocket server URL configured');
      isConnectingRef.current = false;
      return;
    }

    setIsRetrying(true);
    console.log(`🔌 [${connectionId.current}] Enhanced connection to:`, serverUrl, 'as:', effectiveDisplayName);

    const adaptiveTimeout = EnhancedConnectionResilience.getAdaptiveTimeout();
    
    const socket = io(serverUrl, {
      // Enhanced mobile-optimized transport configuration
      transports: ['polling', 'websocket'], // Polling first for better mobile compatibility
      timeout: adaptiveTimeout,
      forceNew: true,
      autoConnect: true,
      
      // Enhanced reconnection strategy (disabled for manual control)
      reconnection: false,
      reconnectionAttempts: 0,
      
      // Enhanced transport settings
      upgrade: true,
      rememberUpgrade: false, // Don't remember upgrades for mobile network changes
      
      // Optimized timeouts to match enhanced server
      pingTimeout: 30000,
      pingInterval: 15000,
      
      // Enhanced connection efficiency
      withCredentials: false,
      closeOnBeforeunload: false,
      forceBase64: false,
      
      // Enhanced error handling
      allowUpgrades: true
    });

    socketRef.current = socket;

    // Enhanced connection event handlers
    socket.on('connect', () => {
      const now = Date.now();
      console.log(`🚀 [${connectionId.current}] Enhanced connection established as:`, effectiveDisplayName);
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
      
      // Enhanced message history handling
      setTimeout(() => {
        const localMessages = MessagePersistence.getRoomMessages(roomId);
        if (localMessages.length > 0) {
          console.log('⏰ Enhanced history timeout, using local fallback:', localMessages.length);
          setMessages(prev => prev.length === 0 ? localMessages : prev);
        }
      }, 3000); // Increased timeout for server response
    });

    // Enhanced disconnect handling with cold start detection
    socket.on('disconnect', (reason) => {
      console.log(`🔌 [${connectionId.current}] Enhanced disconnect:`, reason);
      console.log(`   Transport: ${socket.io.engine?.transport?.name || 'unknown'}`);
      
      setIsConnected(false);
      isConnectingRef.current = false;
      roomConnectionRef.current = '';
      stopHealthMonitoring();
      
      // Enhanced disconnect reason analysis with Cloud Run detection
      const isUnexpected = reason !== 'client namespace disconnect' && 
                          reason !== 'transport close' &&
                          reason !== 'io client disconnect';
      
      // Special handling for Cloud Run cold starts
      const isCloudRunColdStart = reason === 'transport close' || reason === 'ping timeout';
      
      if (isCloudRunColdStart) {
        console.log(`❄️ [${connectionId.current}] Detected Cloud Run cold start - will retry with shorter delay`);
      } else if (isUnexpected) {
        console.log(`⚠️ [${connectionId.current}] Unexpected enhanced disconnect:`, reason);
        EnhancedConnectionResilience.recordFailure();
      }
      
      // Enhanced auto-reconnect with cold start awareness
      if (shouldAutoReconnect && effectiveDisplayName && !reason.includes('server')) {
        // Use shorter delay for cold starts since server just needs to wake up
        const backoffDelay = isCloudRunColdStart ? 
          Math.min(2000 + Math.random() * 1000, 5000) : // 2-5s for cold starts
          EnhancedConnectionResilience.getExponentialBackoffDelay(); // Normal backoff
          
        console.log(`🔄 [${connectionId.current}] Enhanced auto-reconnect in ${backoffDelay}ms...`);
        
        autoReconnectTimer.current = setTimeout(() => {
          console.log(`🔄 [${connectionId.current}] Attempting enhanced auto-reconnect...`);
          connectToServer();
        }, backoffDelay);
      }
    });

    // Enhanced error handling
    socket.on('connect_error', (error) => {
      console.error('Enhanced connection error:', {
        message: error.message,
        type: error.type,
        description: error.description,
        context: error.context,
        transport: error.transport
      });
      
      setIsConnected(false);
      setIsRetrying(false);
      isConnectingRef.current = false;
      
      // Enhanced error categorization
      const isRetryableError = !error.message.includes('rate limit') && 
                              !error.message.includes('throttle') &&
                              !error.message.includes('forbidden');
      
      if (isRetryableError) {
        EnhancedConnectionResilience.recordFailure();
      } else {
        console.log('🕰️ Non-retryable error detected, not counting as circuit breaker failure');
      }
      
      // Enhanced backoff with error-specific delays
      const isRateLimit = error.message.includes('rate limit') || error.message.includes('throttle');
      const backoffDelay = isRateLimit ? 
        Math.min(3000 + Math.random() * 2000, 8000) : // 3-8s for rate limits
        EnhancedConnectionResilience.getExponentialBackoffDelay();
        
      setConnectionCooldown(true);
      setRetryCount(prev => prev + 1);
      
      setTimeout(() => {
        setConnectionCooldown(false);
        console.log(`🔄 [${connectionId.current}] Enhanced cooldown ended`);
        
        // Enhanced auto-retry logic
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
      
      // Check if connection is degrading
      if (!metrics.isHealthy && isConnected) {
        console.log('🏥 Connection health degraded, considering reconnection...');
        // Don't auto-reconnect immediately, but prepare for it
      }
    });

    // Enhanced server shutdown handling
    socket.on('server-shutdown', (data) => {
      console.log('🛑 Server shutdown notification:', data);
      setShouldAutoReconnect(false);
      
      // Attempt reconnection after suggested delay
      setTimeout(() => {
        setShouldAutoReconnect(true);
        console.log('🔄 Attempting reconnection after server maintenance...');
        connectToServer();
      }, data.reconnectDelay || 10000);
    });

    // Enhanced message handling
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
      
      // Enhanced message handler notifications (simple approach)
      messageHandlersRef.current.forEach(handler => {
        try {
          handler(normalizedMessage);
        } catch (e) {
          console.error('Enhanced message handler error:', e);
        }
      });
    });

    // Enhanced peer management with better logging for anonymous users
    socket.on('room-peers', (peers: any[]) => {
      console.log('Enhanced room peers total:', peers.length);
      const uniquePeerNames = Array.from(new Set(peers.map(p => p.displayName)))
        .filter(name => name !== effectiveDisplayName && name && name.trim());
      
      // Separate anonymous vs named users for clearer logging
      const namedUsers = uniquePeerNames.filter(name => !name.startsWith('User_'));
      const anonymousUsers = uniquePeerNames.filter(name => name.startsWith('User_'));
      
      console.log('Enhanced peers:', {
        total: uniquePeerNames.length,
        named: namedUsers.length,
        anonymous: anonymousUsers.length,
        namedUsers,
        anonymousUsers
      });
      
      setConnectedPeers(uniquePeerNames);
    });

    socket.on('peer-joined', (peer: any) => {
      // Validate peer data before processing
      if (!peer || !peer.displayName || !peer.displayName.trim()) {
        console.warn('Invalid peer data received:', peer);
        return;
      }
      
      const isAnonymous = peer.displayName.startsWith('User_');
      const logMessage = isAnonymous 
        ? `📝 Anonymous user joined: ${peer.displayName} (temporary connection)`
        : `👋 User joined: ${peer.displayName}`;
      
      console.log(logMessage, peer.isReconnection ? '(reconnection)' : '(new)');
      
      if (peer.displayName !== effectiveDisplayName) {
        setConnectedPeers(prev => {
          if (prev.includes(peer.displayName)) return prev;
          return [...prev, peer.displayName];
        });
      }
    });

    socket.on('peer-left', (peer: any) => {
      // Validate peer data before processing
      if (!peer || !peer.displayName) {
        console.warn('Invalid peer data received for leave:', peer);
        return;
      }
      
      const isAnonymous = peer.displayName.startsWith('User_');
      const logMessage = isAnonymous 
        ? `📝 Anonymous user left: ${peer.displayName} (likely setting proper name)`
        : `👋 User left: ${peer.displayName}`;
      
      console.log(logMessage, 'reason:', peer.reason);
      
      if (peer.displayName !== effectiveDisplayName) {
        setConnectedPeers(prev => prev.filter(name => name !== peer.displayName));
      }
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
      console.log(`🚀 [${connectionId.current}] Enhanced initialization for:`, effectiveDisplayName);
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

  // Enhanced force reconnect
  const forceReconnect = useCallback(async () => {
    console.log('🔄 Enhanced force reconnect with full reset...');
    
    // Clear all timers
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
    
    // Attempt fresh connection
    setTimeout(() => {
      connectToServer();
    }, 1000);
    
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
      }
    };
  }, [isConnected, isRetrying, retryCount, connectionCooldown, connectionQuality]);

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
    // Enhanced debugging and resilience features
    getConnectionDiagnostics,
    circuitBreakerState: EnhancedConnectionResilience.getState(),
    healthMetrics: healthMonitor.current.getHealthMetrics()
  };
}