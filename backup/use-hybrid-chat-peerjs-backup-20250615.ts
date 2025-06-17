'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { Message, ConnectionStatus } from '@/lib/types';
import { generateCompatibleUUID } from '@/utils/peer-utils';
import { useWebSocketChat } from './use-websocket-chat';
import { useP2POptimized } from './use-p2p-optimized';

// Circuit breaker for intelligent routing
const createCircuitBreaker = () => {
  let state = {
    webSocketFailures: 0,
    p2pFailures: 0,
    lastWebSocketFailure: 0,
    lastP2PFailure: 0,
    isWebSocketOpen: false,
    isP2POpen: false,
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
    
    recordP2PFailure() {
      state.p2pFailures++;
      state.lastP2PFailure = Date.now();
      
      if (state.p2pFailures >= FAILURE_THRESHOLD) {
        state.isP2POpen = true;
        console.log('🚫 P2P circuit breaker opened');
      }
    },
    
    recordWebSocketSuccess() {
      if (state.isWebSocketOpen && state.webSocketFailures >= FAILURE_THRESHOLD) {
        console.log('✅ WebSocket circuit breaker closed');
      }
      state.webSocketFailures = 0;
      state.isWebSocketOpen = false;
    },
    
    recordP2PSuccess() {
      if (state.isP2POpen && state.p2pFailures >= FAILURE_THRESHOLD) {
        console.log('✅ P2P circuit breaker closed');
      }
      state.p2pFailures = 0;
      state.isP2POpen = false;
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
    
    shouldAllowP2P(): boolean {
      if (!state.isP2POpen) return true;
      
      const timeSinceLastFailure = Date.now() - state.lastP2PFailure;
      if (timeSinceLastFailure > RECOVERY_TIMEOUT) {
        console.log('🔄 P2P circuit breaker attempting recovery');
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
        p2pFailures: 0,
        lastWebSocketFailure: 0,
        lastP2PFailure: 0,
        isWebSocketOpen: false,
        isP2POpen: false,
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
  
  const shouldPreferP2P = (): boolean => {
    const connectionType = detectConnectionType();
    
    // Prefer P2P when on WiFi or when cellular data might be limited
    return connectionType === 'wifi' || connectionType === 'none';
  };
  
  return {
    detectConnectionType,
    shouldPreferP2P,
    isMobileDevice: () => {
      if (typeof window === 'undefined') return false;
      return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
    }
  };
};

export function useHybridChat(roomId: string, displayName?: string) {
  // Initialize both WebSocket and P2P connections
  const wsChat = useWebSocketChat(roomId, displayName);
  const p2pChat = useP2POptimized(roomId, displayName);
  
  // Hybrid state
  const [meshEnabled, setMeshEnabled] = useState(false);
  const [preferredRoute, setPreferredRoute] = useState<'websocket' | 'p2p' | 'auto'>('auto');
  const [messages, setMessages] = useState<Message[]>([]);
  const [hybridStats, setHybridStats] = useState({
    webSocketMessages: 0,
    p2pMessages: 0,
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
    p2p: { latency: 0, reliability: 100, available: false }
  });
  
  // Intelligent route selection
  const selectOptimalRoute = useCallback((): 'websocket' | 'p2p' => {
    // Manual preference override
    if (preferredRoute !== 'auto') {
      return preferredRoute;
    }
    
    const wsAvailable = wsChat.status.isConnected && circuitBreaker.current.shouldAllowWebSocket();
    const p2pAvailable = p2pChat.status.isConnected && circuitBreaker.current.shouldAllowP2P();
    const shouldPreferP2P = connectionDetector.current.shouldPreferP2P();
    
    // Decision matrix:
    // 1. If only one is available, use it
    if (wsAvailable && !p2pAvailable) return 'websocket';
    if (p2pAvailable && !wsAvailable) return 'p2p';
    if (!wsAvailable && !p2pAvailable) return 'websocket'; // Fallback
    
    // 2. Both available - use connection detector
    if (shouldPreferP2P && p2pAvailable) {
      return 'p2p';
    }
    
    // 3. Default to WebSocket for reliability
    return 'websocket';
  }, [wsChat.status.isConnected, p2pChat.status.isConnected, preferredRoute]);
  
  // Hybrid status combining both connections
  const hybridStatus: ConnectionStatus = useMemo(() => {
    const wsConnected = wsChat.status.isConnected;
    const p2pConnected = p2pChat.status.isConnected;
    const totalPeers = wsChat.status.connectedPeers + p2pChat.status.connectedPeers;
    
    // Determine overall connection state
    const isConnected = wsConnected || p2pConnected;
    const networkReach = p2pConnected ? 'local' : wsConnected ? 'server' : 'isolated';
    
    // Signal strength based on best available connection
    let signalStrength: 'strong' | 'medium' | 'weak' | 'none' = 'none';
    if (wsConnected && p2pConnected) {
      signalStrength = 'strong';
    } else if (wsConnected || p2pConnected) {
      signalStrength = 'medium';
    }
    
    return {
      isConnected,
      connectedPeers: totalPeers,
      networkReach,
      signalStrength
    };
  }, [wsChat.status, p2pChat.status]);
  
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
    const shouldTryBoth = meshEnabled && wsChat.status.isConnected && p2pChat.status.isConnected;
    
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
        p2pChat.sendMessage(messageData);
        circuitBreaker.current.recordP2PSuccess();
        setHybridStats(prev => ({ ...prev, p2pMessages: prev.p2pMessages + 1 }));
      }
    } catch (error) {
      console.error(`❌ Primary route (${route}) failed:`, error);
      
      if (route === 'websocket') {
        circuitBreaker.current.recordWebSocketFailure();
      } else {
        circuitBreaker.current.recordP2PFailure();
      }
      
      // Try backup route
      if (shouldTryBoth) {
        try {
          const backupRoute = route === 'websocket' ? 'p2p' : 'websocket';
          console.log(`🔄 Trying backup route: ${backupRoute}`);
          
          if (backupRoute === 'websocket') {
            wsChat.sendMessage(messageData);
            setHybridStats(prev => ({ ...prev, webSocketMessages: prev.webSocketMessages + 1 }));
          } else {
            p2pChat.sendMessage(messageData);
            setHybridStats(prev => ({ ...prev, p2pMessages: prev.p2pMessages + 1 }));
          }
        } catch (backupError) {
          console.error(`❌ Backup route also failed:`, backupError);
        }
      }
    }
    
    return messageId;
  }, [selectOptimalRoute, meshEnabled, wsChat, p2pChat]);
  
  // Message handling with deduplication
  const handleMessage = useCallback((message: Message, source: 'websocket' | 'p2p') => {
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
    
    const p2pUnsubscribe = p2pChat.onMessage((message) => {
      handleMessage(message, 'p2p');
    });
    
    return () => {
      wsUnsubscribe();
      p2pUnsubscribe();
    };
  }, [wsChat.onMessage, p2pChat.onMessage, handleMessage]);
  
  // Merge messages from WebSocket on first load (P2P only forwards messages, doesn't store them)
  useEffect(() => {
    // P2P doesn't maintain a message array - it only forwards messages via handlers
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
  
  // Enhanced P2P upgrade logic with better debugging
  const attemptP2PUpgrade = useCallback(async () => {
    console.log('🌐 [P2P UPGRADE] Attempting P2P upgrade...');
    console.log('🌐 [P2P UPGRADE] WebSocket connected:', wsChat.status.isConnected);
    console.log('🌐 [P2P UPGRADE] P2P connected:', p2pChat.status.isConnected);
    console.log('🌐 [P2P UPGRADE] Mesh enabled:', meshEnabled);
    
    if (!wsChat.status.isConnected) {
      console.log('🚫 [P2P UPGRADE] WebSocket not connected - aborting');
      return false;
    }
    
    if (p2pChat.status.isConnected) {
      console.log('✅ [P2P UPGRADE] P2P already connected - enabling mesh');
      setMeshEnabled(true);
      return true;
    }
    
    // Check if conditions are right for P2P upgrade
    const connectedPeers = wsChat.getConnectedPeers();
    const isSmallGroup = connectedPeers.length <= 5; // Increase threshold
    const shouldPreferP2P = connectionDetector.current.shouldPreferP2P();
    
    console.log('🌐 [P2P UPGRADE] Connected peers:', connectedPeers.length);
    console.log('🌐 [P2P UPGRADE] Is small group (≤5):', isSmallGroup);
    console.log('🌐 [P2P UPGRADE] Should prefer P2P:', shouldPreferP2P);
    console.log('🌐 [P2P UPGRADE] Available peers:', connectedPeers);
    
    // Be more aggressive about attempting P2P
    const shouldAttemptUpgrade = isSmallGroup || connectedPeers.length === 0;
    
    if (shouldAttemptUpgrade) {
      console.log('🌐 [P2P UPGRADE] Conditions met - attempting P2P connections');
      
      // If no WebSocket peers yet, try direct P2P connection to see if anyone is available
      if (connectedPeers.length === 0) {
        console.log('🌐 [P2P UPGRADE] No WebSocket peers yet - enabling P2P discovery mode');
        setMeshEnabled(true);
        
        // Try to auto-connect to any discovered peers
        setTimeout(async () => {
          try {
            await p2pChat.forceReconnect();
            console.log('🔄 [P2P UPGRADE] Triggered P2P auto-discovery');
          } catch (error) {
            console.warn('⚠️ [P2P UPGRADE] P2P auto-discovery failed:', error);
          }
        }, 2000);
        
        return true;
      }
      
      // Try to connect to WebSocket peers via P2P
      const availablePeers = connectedPeers.slice(0, 3); // Limit connections
      let successfulConnections = 0;
      
      console.log(`🌐 [P2P UPGRADE] Attempting connections to ${availablePeers.length} peers`);
      
      for (const peer of availablePeers) {
        try {
          console.log(`🚀 [P2P UPGRADE] Connecting to peer: ${peer}`);
          const connected = await p2pChat.connectToPeer(peer);
          if (connected) {
            successfulConnections++;
            console.log(`✅ [P2P UPGRADE] Successfully connected to: ${peer}`);
          } else {
            console.log(`❌ [P2P UPGRADE] Failed to connect to: ${peer}`);
          }
        } catch (error) {
          console.warn(`💥 [P2P UPGRADE] Error connecting to peer ${peer}:`, error);
        }
      }
      
      if (successfulConnections > 0 || availablePeers.length === 0) {
        setMeshEnabled(true);
        console.log(`✅ [P2P UPGRADE] P2P upgrade successful: ${successfulConnections} connections (mesh enabled)`);
        return true;
      } else {
        console.log(`⚠️ [P2P UPGRADE] No successful P2P connections, but enabling mesh for discovery`);
        setMeshEnabled(true); // Enable mesh anyway for future discovery
        return false;
      }
    } else {
      console.log('🚫 [P2P UPGRADE] Conditions not met for P2P upgrade');
      console.log('🚫 [P2P UPGRADE] - Connected peers:', connectedPeers.length);
      console.log('🚫 [P2P UPGRADE] - Is small group:', isSmallGroup);
      console.log('🚫 [P2P UPGRADE] - Should prefer P2P:', shouldPreferP2P);
    }
    
    return false;
  }, [wsChat, p2pChat, connectionDetector, meshEnabled]);
  
  // Less aggressive auto-upgrade - only when beneficial and P2P is stable
  const autoUpgradeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const p2pStabilityRef = useRef({ attempts: 0, failures: 0, lastFailure: 0 });
  
  // Track P2P instability
  useEffect(() => {
    if (p2pChat.peerId && !p2pChat.status.isConnected) {
      // P2P opened but then closed - this indicates instability
      const now = Date.now();
      p2pStabilityRef.current.failures++;
      p2pStabilityRef.current.lastFailure = now;
      
      if (p2pStabilityRef.current.failures >= 3) {
        console.log('🚫 [P2P STABILITY] P2P appears unstable, disabling auto-upgrade for 5 minutes');
      }
    }
  }, [p2pChat.peerId, p2pChat.status.isConnected]);
  
  // Check if P2P is stable enough for auto-upgrade
  const isP2PStable = useCallback(() => {
    const stability = p2pStabilityRef.current;
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    
    // If we've had 3+ failures in the last 5 minutes, consider P2P unstable
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
    // 2. P2P isn't already enabled AND  
    // 3. We haven't tried recently
    if (wsChat.status.isConnected && !meshEnabled && !autoUpgradeTimerRef.current && isP2PStable()) {
      console.log('🔄 [AUTO-UPGRADE] WebSocket connected, P2P stable, setting up P2P upgrade timer');
      
      // Wait longer to see if P2P is actually needed
      autoUpgradeTimerRef.current = setTimeout(() => {
        console.log('⏰ [AUTO-UPGRADE] Timer triggered - checking if P2P upgrade is beneficial');
        
        // Only upgrade if there are multiple users (makes P2P worthwhile)
        const connectedPeers = wsChat.getConnectedPeers();
        if (connectedPeers.length >= 2 && isP2PStable()) {
          console.log('🎯 [AUTO-UPGRADE] Multiple users detected and P2P stable, attempting P2P upgrade');
          attemptP2PUpgrade();
        } else if (!isP2PStable()) {
          console.log('🚫 [AUTO-UPGRADE] P2P unstable, skipping upgrade attempt');
        } else {
          console.log('🚫 [AUTO-UPGRADE] Not enough users for P2P upgrade, staying WebSocket-only');
        }
        
        autoUpgradeTimerRef.current = null;
      }, 15000); // Increased to 15 seconds to be less aggressive
      
      return () => {
        if (autoUpgradeTimerRef.current) {
          console.log('🛑 [AUTO-UPGRADE] Clearing upgrade timer');
          clearTimeout(autoUpgradeTimerRef.current);
          autoUpgradeTimerRef.current = null;
        }
      };
    }
  }, [wsChat.status.isConnected, meshEnabled, attemptP2PUpgrade, wsChat.getConnectedPeers, isP2PStable]);
  
  // Remove the aggressive P2P-ready auto-upgrade
  // Users can manually enable P2P via the debug panel when needed
  
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
        p2p: {
          latency: p2pChat.status.isConnected ? 25 : 0, // P2P typically lower latency
          reliability: p2pChat.status.isConnected ? 90 : 0, // Slightly less reliable than server
          available: p2pChat.status.isConnected
        }
      });
    }, 5000);
    
    return () => clearInterval(monitoringInterval);
  }, [wsChat.status.isConnected, wsChat.connectionQuality, p2pChat.status.isConnected]);
  
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
    const [wsResult, p2pResult] = await Promise.allSettled([
      wsChat.forceReconnect(),
      p2pChat.forceReconnect()
    ]);
    
    console.log('🔄 Reconnect results:', { 
      websocket: wsResult.status,
      p2p: p2pResult.status 
    });
    
    return wsResult.status === 'fulfilled' || p2pResult.status === 'fulfilled';
  }, [wsChat.forceReconnect, p2pChat.forceReconnect]);
  
  return {
    // Core properties
    peerId: wsChat.peerId || p2pChat.peerId,
    status: hybridStatus,
    messages,
    
    // Hybrid functionality
    sendMessage,
    onMessage,
    forceReconnect,
    
    // Mesh networking
    meshEnabled,
    setMeshEnabled,
    attemptP2PUpgrade,
    
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
      status: p2pChat.status,
      connected: p2pChat.status.isConnected,
      peers: p2pChat.getConnectedPeers(),
      queuedMessages: p2pChat.getQueuedMessages?.() || 0
    },
    
    // Debugging
    getCircuitBreakerState: () => circuitBreaker.current.getState(),
    getConnectionDiagnostics: () => ({
      detector: {
        connectionType: connectionDetector.current.detectConnectionType(),
        shouldPreferP2P: connectionDetector.current.shouldPreferP2P(),
        isMobile: connectionDetector.current.isMobileDevice()
      },
      websocket: wsChat.getConnectionDiagnostics?.(),
      circuitBreaker: circuitBreaker.current.getState(),
      stats: hybridStats
    })
  };
}
