'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { generateCompatibleUUID } from '../utils/peer-utils';
import { useWebSocketChat } from './use-websocket-chat';
import { useNativeWebRTC } from './use-native-webrtc';

// Circuit breaker for intelligent routing
const createCircuitBreaker = () => {
  let state = {
    webSocketFailures: 0,
    webrtcFailures: 0,
    lastWebSocketFailure: 0,
    lastWebRTCFailure: 0,
    isWebSocketOpen: false,
    isWebRTCOpen: false,
  };
  
  const FAILURE_THRESHOLD = 3;
  const RECOVERY_TIMEOUT = 30000; // 30 seconds
  
  return {
    recordWebSocketFailure() {
      state.webSocketFailures++;
      state.lastWebSocketFailure = Date.now();
      
      if (state.webSocketFailures >= FAILURE_THRESHOLD) {
        state.isWebSocketOpen = true;
        console.log('🚫 WebSocket circuit breaker opened');
      }
    },
    
    recordWebRTCFailure() {
      state.webrtcFailures++;
      state.lastWebRTCFailure = Date.now();
      
      if (state.webrtcFailures >= FAILURE_THRESHOLD) {
        state.isWebRTCOpen = true;
        console.log('🚫 WebRTC circuit breaker opened');
      }
    },
    
    recordWebSocketSuccess() {
      if (state.isWebSocketOpen && state.webSocketFailures >= FAILURE_THRESHOLD) {
        console.log('✅ WebSocket circuit breaker closed');
      }
      state.webSocketFailures = 0;
      state.isWebSocketOpen = false;
    },
    
    recordWebRTCSuccess() {
      if (state.isWebRTCOpen && state.webrtcFailures >= FAILURE_THRESHOLD) {
        console.log('✅ WebRTC circuit breaker closed');
      }
      state.webrtcFailures = 0;
      state.isWebRTCOpen = false;
    },
    
    shouldAllowWebSocket(): boolean {
      if (!state.isWebSocketOpen) return true;
      
      const timeSinceLastFailure = Date.now() - state.lastWebSocketFailure;
      if (timeSinceLastFailure > RECOVERY_TIMEOUT) {
        console.log('🔄 WebSocket circuit breaker attempting recovery');
        return true;
      }
      
      return false;
    },
    
    shouldAllowWebRTC(): boolean {
      if (!state.isWebRTCOpen) return true;
      
      const timeSinceLastFailure = Date.now() - state.lastWebRTCFailure;
      if (timeSinceLastFailure > RECOVERY_TIMEOUT) {
        console.log('🔄 WebRTC circuit breaker attempting recovery');
        return true;
      }
      
      return false;
    },
    
    getState() {
      return { ...state };
    },
    
    reset() {
      state = {
        webSocketFailures: 0,
        webrtcFailures: 0,
        lastWebSocketFailure: 0,
        lastWebRTCFailure: 0,
        isWebSocketOpen: false,
        isWebRTCOpen: false,
      };
      console.log('🔄 Circuit breaker reset');
    }
  };
};

// Message deduplication with sequence tracking
const createMessageDeduplicator = () => {
  const messageIds = new Set<string>();
  const userSequences = new Map<string, number>();
  
  const cleanup = () => {
    // Keep only last 1000 message IDs and clear old sequences
    if (messageIds.size > 1000) {
      const idsArray = Array.from(messageIds);
      messageIds.clear();
      idsArray.slice(-500).forEach(id => messageIds.add(id));
    }
  };
  
  return {
    isDuplicate(message: Message): boolean {
      // Check by message ID first
      if (messageIds.has(message.id)) {
        return true;
      }
      
      // Check by sequence if available
      if (message.senderId) {
        const lastSeq = userSequences.get(message.senderId) || -1;
        const currentSeq = (message as any).sequence || message.timestamp;
        
        if (currentSeq <= lastSeq) {
          return true;
        }
        
        userSequences.set(message.senderId, currentSeq);
      }
      
      messageIds.add(message.id);
      
      // Periodic cleanup
      if (messageIds.size % 100 === 0) {
        cleanup();
      }
      
      return false;
    },
    
    clear() {
      messageIds.clear();
      userSequences.clear();
    }
  };
};

// Connection detector for desktop/mobile optimization
const createConnectionDetector = () => {
  const detectConnectionType = (): 'wifi' | 'cellular' | 'none' => {
    if (typeof window === 'undefined' || !navigator.onLine) return 'none';
    
    // Use Network Information API where available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection.type === 'wifi') return 'wifi';
      if (connection.type === 'cellular') return 'cellular';
    }
    
    // Fallback: assume WiFi for desktop, cellular for mobile
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    
    return isMobile ? 'cellular' : 'wifi';
  };
  
  const shouldPreferWebRTC = (): boolean => {
    const connectionType = detectConnectionType();
    
    // Prefer WebRTC when on WiFi (better for direct connections)
    return connectionType === 'wifi';
  };
  
  return {
    detectConnectionType,
    shouldPreferWebRTC,
    isMobileDevice: () => {
      if (typeof window === 'undefined') return false;
      return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
    }
  };
};

export function useHybridChatNative(roomId: string, displayName: string) {
  // Initialize WebSocket chat first (provides the socket for WebRTC signaling)
  const wsChat = useWebSocketChat(roomId, displayName);
  
  // Initialize native WebRTC using the WebSocket for signaling
  const webrtcChat = useNativeWebRTC(
    wsChat.isSignalingConnected ? (wsChat as any).socketRef?.current : null, 
    roomId, 
    displayName
  );
  
  // Hybrid state
  const [meshEnabled, setMeshEnabled] = useState(false);
  const [preferredRoute, setPreferredRoute] = useState<'websocket' | 'webrtc' | 'auto'>('auto');
  const [messages, setMessages] = useState<Message[]>([]);
  const [hybridStats, setHybridStats] = useState({
    webSocketMessages: 0,
    webrtcMessages: 0,
    duplicatesFiltered: 0,
    routingDecisions: 0
  });
  
  // Create stable instances
  const circuitBreaker = useRef(createCircuitBreaker());
  const messageDeduplicator = useRef(createMessageDeduplicator());
  const connectionDetector = useRef(createConnectionDetector());
  const messageHandlersRef = useRef<Set<(message: Message) => void>>(new Set());
  
  // Connection quality monitoring
  const [connectionQuality, setConnectionQuality] = useState({
    webSocket: { latency: 0, reliability: 100, available: false },
    webrtc: { latency: 0, reliability: 100, available: false }
  });
  
  // Intelligent route selection
  const selectOptimalRoute = useCallback((): 'websocket' | 'webrtc' => {
    // Manual preference override
    if (preferredRoute !== 'auto') {
      return preferredRoute;
    }
    
    const wsAvailable = wsChat.status.isConnected && circuitBreaker.current.shouldAllowWebSocket();
    const webrtcAvailable = webrtcChat.status.isConnected && circuitBreaker.current.shouldAllowWebRTC();
    const shouldPreferWebRTC = connectionDetector.current.shouldPreferWebRTC();
    
    // Decision matrix:
    // 1. If only one is available, use it
    if (wsAvailable && !webrtcAvailable) return 'websocket';
    if (webrtcAvailable && !wsAvailable) return 'webrtc';
    if (!wsAvailable && !webrtcAvailable) return 'websocket'; // Fallback
    
    // 2. Both available - use connection detector
    if (shouldPreferWebRTC && webrtcAvailable) {
      return 'webrtc';
    }
    
    // 3. Default to WebSocket for reliability
    return 'websocket';
  }, [wsChat.status.isConnected, webrtcChat.status.isConnected, preferredRoute]);
  
  // Hybrid status combining both connections
  const hybridStatus: ConnectionStatus = useMemo(() => {
    const wsConnected = wsChat.status.isConnected;
    const webrtcConnected = webrtcChat.status.isConnected;
    const totalPeers = wsChat.status.connectedPeers + webrtcChat.status.connectedPeers;
    
    // Determine overall connection state
    const isConnected = wsConnected || webrtcConnected;
    const networkReach = webrtcConnected ? 'local' : wsConnected ? 'server' : 'isolated';
    
    // Signal strength based on best available connection
    let signalStrength: 'strong' | 'medium' | 'weak' | 'none' = 'none';
    if (wsConnected && webrtcConnected) {
      signalStrength = 'strong';
    } else if (wsConnected || webrtcConnected) {
      signalStrength = 'medium';
    }
    
    return {
      isConnected,
      connectedPeers: totalPeers,
      networkReach,
      signalStrength
    };
  }, [wsChat.status, webrtcChat.status]);
  
  // Enhanced message sending with intelligent routing
  const sendMessage = useCallback((messageData: Omit<Message, 'id' | 'timestamp'>): string => {
    const messageId = generateCompatibleUUID();
    const fullMessage: Message = {
      ...messageData,
      id: messageId,
      timestamp: Date.now(),
      synced: false,
    };
    
    // Select optimal route
    const route = selectOptimalRoute();
    const shouldTryBoth = meshEnabled && wsChat.status.isConnected && webrtcChat.status.isConnected;
    
    setHybridStats(prev => ({
      ...prev,
      routingDecisions: prev.routingDecisions + 1
    }));
    
    console.log(`🌐 Hybrid send via ${route}${shouldTryBoth ? ' + backup' : ''}: ${messageData.content}`);
    
    // Primary route
    try {
      if (route === 'websocket') {
        wsChat.sendMessage(messageData);
        circuitBreaker.current.recordWebSocketSuccess();
        setHybridStats(prev => ({ ...prev, webSocketMessages: prev.webSocketMessages + 1 }));
      } else {
        webrtcChat.sendMessage(messageData);
        circuitBreaker.current.recordWebRTCSuccess();
        setHybridStats(prev => ({ ...prev, webrtcMessages: prev.webrtcMessages + 1 }));
      }
    } catch (error) {
      console.error(`❌ Primary route (${route}) failed:`, error);
      
      if (route === 'websocket') {
        circuitBreaker.current.recordWebSocketFailure();
      } else {
        circuitBreaker.current.recordWebRTCFailure();
      }
      
      // Try backup route
      if (shouldTryBoth) {
        try {
          const backupRoute = route === 'websocket' ? 'webrtc' : 'websocket';
          console.log(`🔄 Trying backup route: ${backupRoute}`);
          
          if (backupRoute === 'websocket') {
            wsChat.sendMessage(messageData);
            setHybridStats(prev => ({ ...prev, webSocketMessages: prev.webSocketMessages + 1 }));
          } else {
            webrtcChat.sendMessage(messageData);
            setHybridStats(prev => ({ ...prev, webrtcMessages: prev.webrtcMessages + 1 }));
          }
        } catch (backupError) {
          console.error(`❌ Backup route also failed:`, backupError);
        }
      }
    }
    
    return messageId;
  }, [selectOptimalRoute, meshEnabled, wsChat, webrtcChat]);
  
  // Message handling with deduplication
  const handleMessage = useCallback((message: Message, source: 'websocket' | 'webrtc') => {
    // Check for duplicates
    if (messageDeduplicator.current.isDuplicate(message)) {
      console.log(`🔄 Filtered duplicate message from ${source}:`, message.id);
      setHybridStats(prev => ({ ...prev, duplicatesFiltered: prev.duplicatesFiltered + 1 }));
      return;
    }
    
    // Add message to state
    setMessages(prev => {
      const updated = [...prev, { ...message, synced: true }]
        .sort((a, b) => a.timestamp - b.timestamp);
      return updated;
    });
    
    // Notify external handlers
    messageHandlersRef.current.forEach(handler => {
      try {
        handler(message);
      } catch (e) {
        console.error('Message handler error:', e);
      }
    });
    
    console.log(`📩 Hybrid message received via ${source}:`, message.content);
  }, []);
  
  // Set up message handlers for both connections
  useEffect(() => {
    const wsUnsubscribe = wsChat.onMessage((message) => {
      handleMessage(message, 'websocket');
    });
    
    const webrtcUnsubscribe = webrtcChat.onMessage((message) => {
      handleMessage(message, 'webrtc');
    });
    
    return () => {
      wsUnsubscribe();
      webrtcUnsubscribe();
    };
  }, [wsChat.onMessage, webrtcChat.onMessage, handleMessage]);
  
  // Merge messages from WebSocket on first load (WebRTC only forwards messages, doesn't store them)
  useEffect(() => {
    // WebRTC doesn't maintain a message array - it only forwards messages via handlers
    // Only use WebSocket messages for the initial state
    const initialMessages = [...wsChat.messages]
      .filter((message, index, array) => {
        // Remove duplicates by ID
        return array.findIndex(m => m.id === message.id) === index;
      })
      .sort((a, b) => a.timestamp - b.timestamp);
    
    if (initialMessages.length > messages.length) {
      setMessages(initialMessages);
    }
  }, [wsChat.messages, messages.length]);
  
  // Enhanced WebRTC upgrade logic with better debugging
  const attemptWebRTCUpgrade = useCallback(async () => {
    console.log('🌐 [WebRTC UPGRADE] Attempting WebRTC upgrade...');
    console.log('🌐 [WebRTC UPGRADE] WebSocket connected:', wsChat.status.isConnected);
    console.log('🌐 [WebRTC UPGRADE] WebRTC connected:', webrtcChat.status.isConnected);
    console.log('🌐 [WebRTC UPGRADE] Mesh enabled:', meshEnabled);
    
    if (!wsChat.status.isConnected) {
      console.log('🚫 [WebRTC UPGRADE] WebSocket not connected - aborting');
      return false;
    }
    
    if (webrtcChat.status.isConnected) {
      console.log('✅ [WebRTC UPGRADE] WebRTC already connected - enabling mesh');
      setMeshEnabled(true);
      return true;
    }
    
    // Check if conditions are right for WebRTC upgrade
    const connectedPeers = wsChat.getConnectedPeers();
    const isSmallGroup = connectedPeers.length <= 5; // Increase threshold
    const shouldPreferWebRTC = connectionDetector.current.shouldPreferWebRTC();
    
    console.log('🌐 [WebRTC UPGRADE] Connected peers:', connectedPeers.length);
    console.log('🌐 [WebRTC UPGRADE] Is small group (≤5):', isSmallGroup);
    console.log('🌐 [WebRTC UPGRADE] Should prefer WebRTC:', shouldPreferWebRTC);
    console.log('🌐 [WebRTC UPGRADE] Available peers:', connectedPeers);
    
    // Be more aggressive about attempting WebRTC
    const shouldAttemptUpgrade = isSmallGroup || connectedPeers.length === 0;
    
    if (shouldAttemptUpgrade) {
      console.log('🌐 [WebRTC UPGRADE] Conditions met - attempting WebRTC connections');
      
      // If no WebSocket peers yet, try direct WebRTC connection to see if anyone is available
      if (connectedPeers.length === 0) {
        console.log('🌐 [WebRTC UPGRADE] No WebSocket peers yet - enabling WebRTC discovery mode');
        setMeshEnabled(true);
        
        // Try to auto-connect to any discovered peers
        setTimeout(async () => {
          try {
            await webrtcChat.forceReconnect();
            console.log('🔄 [WebRTC UPGRADE] Triggered WebRTC auto-discovery');
          } catch (error) {
            console.warn('⚠️ [WebRTC UPGRADE] WebRTC auto-discovery failed:', error);
          }
        }, 2000);
        
        return true;
      }
      
      // Try to connect to WebSocket peers via WebRTC
      const availablePeers = connectedPeers.slice(0, 3); // Limit connections
      let successfulConnections = 0;
      
      console.log(`🌐 [WebRTC UPGRADE] Attempting connections to ${availablePeers.length} peers`);
      
      for (const peer of availablePeers) {
        try {
          console.log(`🚀 [WebRTC UPGRADE] Connecting to peer: ${peer}`);
          const connected = await webrtcChat.connectToPeer(peer);
          if (connected) {
            successfulConnections++;
            console.log(`✅ [WebRTC UPGRADE] Successfully connected to: ${peer}`);
          } else {
            console.log(`❌ [WebRTC UPGRADE] Failed to connect to: ${peer}`);
          }
        } catch (error) {
          console.warn(`💥 [WebRTC UPGRADE] Error connecting to peer ${peer}:`, error);
        }
      }
      
      if (successfulConnections > 0 || availablePeers.length === 0) {
        setMeshEnabled(true);
        console.log(`✅ [WebRTC UPGRADE] WebRTC upgrade successful: ${successfulConnections} connections (mesh enabled)`);
        return true;
      } else {
        console.log(`⚠️ [WebRTC UPGRADE] No successful WebRTC connections, but enabling mesh for discovery`);
        setMeshEnabled(true); // Enable mesh anyway for future discovery
        return false;
      }
    } else {
      console.log('🚫 [WebRTC UPGRADE] Conditions not met for WebRTC upgrade');
      console.log('🚫 [WebRTC UPGRADE] - Connected peers:', connectedPeers.length);
      console.log('🚫 [WebRTC UPGRADE] - Is small group:', isSmallGroup);
      console.log('🚫 [WebRTC UPGRADE] - Should prefer WebRTC:', shouldPreferWebRTC);
    }
    
    return false;
  }, [wsChat, webrtcChat, connectionDetector, meshEnabled]);
  
  // Auto-upgrade timer for WebRTC
  const autoUpgradeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const webrtcStabilityRef = useRef({ attempts: 0, failures: 0, lastFailure: 0 });
  
  // Track WebRTC instability
  useEffect(() => {
    if (webrtcChat.peerId && !webrtcChat.status.isConnected) {
      // WebRTC opened but then closed - this indicates instability
      const now = Date.now();
      webrtcStabilityRef.current.failures++;
      webrtcStabilityRef.current.lastFailure = now;
      
      if (webrtcStabilityRef.current.failures >= 3) {
        console.log('🚫 [WebRTC STABILITY] WebRTC appears unstable, disabling auto-upgrade for 5 minutes');
      }
    }
  }, [webrtcChat.peerId, webrtcChat.status.isConnected]);
  
  // Check if WebRTC is stable enough for auto-upgrade
  const isWebRTCStable = useCallback(() => {
    const stability = webrtcStabilityRef.current;
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    
    // If we've had 3+ failures in the last 5 minutes, consider WebRTC unstable
    if (stability.failures >= 3 && stability.lastFailure > fiveMinutesAgo) {
      return false;
    }
    
    // Reset failure count if it's been long enough
    if (stability.lastFailure < fiveMinutesAgo) {
      stability.failures = 0;
    }
    
    return true;
  }, []);
  
  useEffect(() => {
    // Only auto-upgrade if:
    // 1. WebSocket is connected AND
    // 2. WebRTC isn't already enabled AND  
    // 3. We haven't tried recently
    if (wsChat.status.isConnected && !meshEnabled && !autoUpgradeTimerRef.current && isWebRTCStable()) {
      console.log('🔄 [AUTO-UPGRADE] WebSocket connected, WebRTC stable, setting up upgrade timer');
      
      // Wait longer to see if WebRTC is actually needed
      autoUpgradeTimerRef.current = setTimeout(() => {
        console.log('⏰ [AUTO-UPGRADE] Timer triggered - checking if WebRTC upgrade is beneficial');
        
        // Only upgrade if there are multiple users (makes WebRTC worthwhile)
        const connectedPeers = wsChat.getConnectedPeers();
        if (connectedPeers.length >= 2 && isWebRTCStable()) {
          console.log('🎯 [AUTO-UPGRADE] Multiple users detected and WebRTC stable, attempting upgrade');
          attemptWebRTCUpgrade();
        } else if (!isWebRTCStable()) {
          console.log('🚫 [AUTO-UPGRADE] WebRTC unstable, skipping upgrade attempt');
        } else {
          console.log('🚫 [AUTO-UPGRADE] Not enough users for WebRTC upgrade, staying WebSocket-only');
        }
        
        autoUpgradeTimerRef.current = null;
      }, 15000); // 15 seconds to be less aggressive
      
      return () => {
        if (autoUpgradeTimerRef.current) {
          console.log('🛑 [AUTO-UPGRADE] Clearing upgrade timer');
          clearTimeout(autoUpgradeTimerRef.current);
          autoUpgradeTimerRef.current = null;
        }
      };
    }
  }, [wsChat.status.isConnected, meshEnabled, attemptWebRTCUpgrade, wsChat.getConnectedPeers, isWebRTCStable]);
  
  // Connection quality monitoring
  useEffect(() => {
    const monitoringInterval = setInterval(() => {
      setConnectionQuality({
        webSocket: {
          latency: wsChat.connectionQuality === 'excellent' ? 50 : 
                   wsChat.connectionQuality === 'good' ? 150 : 300,
          reliability: wsChat.status.isConnected ? 100 : 0,
          available: wsChat.status.isConnected
        },
        webrtc: {
          latency: webrtcChat.status.isConnected ? 25 : 0, // WebRTC typically lower latency
          reliability: webrtcChat.status.isConnected ? 95 : 0, // Slightly less reliable than server
          available: webrtcChat.status.isConnected
        }
      });
    }, 5000);
    
    return () => clearInterval(monitoringInterval);
  }, [wsChat.status.isConnected, wsChat.connectionQuality, webrtcChat.status.isConnected]);
  
  // External message handler registration
  const onMessage = useCallback((handler: (message: Message) => void) => {
    messageHandlersRef.current.add(handler);
    return () => {
      messageHandlersRef.current.delete(handler);
    };
  }, []);
  
  // Force reconnect for both connections
  const forceReconnect = useCallback(async () => {
    console.log('🔄 Hybrid force reconnect - resetting both connections');
    
    // Reset circuit breaker
    circuitBreaker.current.reset();
    
    // Clear message deduplicator
    messageDeduplicator.current.clear();
    
    // Reset mesh state
    setMeshEnabled(false);
    setMessages([]);
    
    // Force reconnect both connections
    const [wsResult, webrtcResult] = await Promise.allSettled([
      wsChat.forceReconnect(),
      webrtcChat.forceReconnect()
    ]);
    
    console.log('🔄 Reconnect results:', { 
      websocket: wsResult.status,
      webrtc: webrtcResult.status 
    });
    
    return wsResult.status === 'fulfilled' || webrtcResult.status === 'fulfilled';
  }, [wsChat.forceReconnect, webrtcChat.forceReconnect]);
  
  return {
    // Core properties
    peerId: wsChat.peerId || webrtcChat.peerId,
    status: hybridStatus,
    messages,
    
    // Hybrid functionality
    sendMessage,
    onMessage,
    forceReconnect,
    
    // Mesh networking
    meshEnabled,
    setMeshEnabled,
    attemptP2PUpgrade: attemptWebRTCUpgrade, // Renamed for compatibility
    
    // Route management
    preferredRoute,
    setPreferredRoute,
    currentRoute: selectOptimalRoute(),
    
    // Connection info
    connectionQuality,
    hybridStats,
    
    // Individual connection access
    webSocket: {
      status: wsChat.status,
      connected: wsChat.status.isConnected,
      quality: wsChat.connectionQuality,
      peers: wsChat.getConnectedPeers()
    },
    p2p: {
      status: webrtcChat.status,
      connected: webrtcChat.status.isConnected,
      peers: webrtcChat.getConnectedPeers(),
      queuedMessages: webrtcChat.getQueuedMessages?.() || 0
    },
    
    // Debugging
    getCircuitBreakerState: () => circuitBreaker.current.getState(),
    getConnectionDiagnostics: () => ({
      detector: {
        connectionType: connectionDetector.current.detectConnectionType(),
        shouldPreferWebRTC: connectionDetector.current.shouldPreferWebRTC(),
        isMobile: connectionDetector.current.isMobileDevice()
      },
      websocket: wsChat.getConnectionDiagnostics?.(),
      webrtc: webrtcChat.getConnectionStats?.(),
      circuitBreaker: circuitBreaker.current.getState(),
      stats: hybridStats
    })
  };
}
