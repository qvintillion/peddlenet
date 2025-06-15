'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { Message, ConnectionStatus } from '@/lib/types';
import { generateCompatibleUUID } from '@/utils/peer-utils';
import { useWebSocketChat } from './use-websocket-chat';
import { useCustomWebRTC } from './use-custom-webrtc';
import { io } from 'socket.io-client';
import { ServerUtils } from '@/utils/server-utils';

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
      // Safety check for null/undefined messages
      if (!message || !message.id) {
        console.warn('⚠️ isDuplicate called with invalid message:', message);
        return true; // Treat invalid messages as duplicates to filter them out
      }
      
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
  // Initialize WebSocket connection
  const wsChat = useWebSocketChat(roomId, displayName);
  
  // Use the main socket for custom WebRTC to avoid duplicate connections
  const socket = wsChat.socket;
  
  useEffect(() => {
    console.log('🔌 [WEBRTC SOCKET] Setting up WebRTC to use main WebSocket connection');
    console.log('🔌 [WEBRTC SOCKET] Main socket available:', !!socket);
    console.log('🔌 [WEBRTC SOCKET] Main socket connected:', socket?.connected);
    console.log('🔌 [WEBRTC SOCKET] Main socket ID:', socket?.id);
    console.log('🔌 [WEBRTC SOCKET] WebSocket signaling connected:', wsChat.isSignalingConnected);
    
    // Only proceed if the main socket is connected
    if (!socket || !socket.connected || !wsChat.isSignalingConnected) {
      console.log('⏳ [WEBRTC SOCKET] Waiting for main socket to connect before setting up WebRTC');
      return;
    }
    
    console.log('✅ [WEBRTC SOCKET] Main socket ready, WebRTC can use it now');
  }, [socket, wsChat.isSignalingConnected]);
  
  // Initialize custom WebRTC connection
  const customWebRTC = useCustomWebRTC(socket, roomId, displayName);
  
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
    const p2pAvailable = customWebRTC.connectionStatus === 'connected' && circuitBreaker.current.shouldAllowP2P();
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
  }, [wsChat.status.isConnected, customWebRTC.connectionStatus, preferredRoute]);
  
  // Hybrid status combining both connections
  const hybridStatus: ConnectionStatus = useMemo(() => {
    const wsConnected = wsChat.status.isConnected;
    const p2pConnected = customWebRTC.connectionStatus === 'connected';
    
    // 🔧 FIX: Avoid double-counting users when both WS and P2P are active
    // Use the higher count between WebSocket and P2P, not the sum
    const wsPeers = wsChat.status.connectedPeers;
    const p2pPeers = customWebRTC.connections.size;
    const totalPeers = Math.max(wsPeers, p2pPeers); // 🔧 FIX: Use max, not sum
    
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
  }, [wsChat.status, customWebRTC.connectionStatus, customWebRTC.connections.size]);
  
  // Enhanced message sending with intelligent routing
  const sendMessage = useCallback(async (messageData: Omit<Message, 'id' | 'timestamp'>): Promise<string> => {
    const messageId = generateCompatibleUUID();
    const fullMessage: Message = {
      ...messageData,
      id: messageId,
      timestamp: Date.now(),
      synced: false,
    };
    
    // Select optimal route
    const route = selectOptimalRoute();
    const shouldTryBoth = meshEnabled && wsChat.status.isConnected && customWebRTC.connectionStatus === 'connected';
    
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
        await customWebRTC.sendMessage(fullMessage);
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
            await customWebRTC.sendMessage(fullMessage);
            setHybridStats(prev => ({ ...prev, p2pMessages: prev.p2pMessages + 1 }));
          }
        } catch (backupError) {
          console.error(`❌ Backup route also failed:`, backupError);
        }
      }
    }
    
    return messageId;
  }, [selectOptimalRoute, meshEnabled, wsChat, customWebRTC]);
  
  // Message handling with deduplication
  const handleMessage = useCallback((message: Message, source: 'websocket' | 'p2p') => {
    // Safety check for null/undefined messages
    if (!message || !message.id) {
      console.warn(`⚠️ Received invalid message from ${source}:`, message);
      return;
    }
    
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
    
    return () => {
      wsUnsubscribe();
    };
  }, [wsChat.onMessage, handleMessage]);
  
  // Set up custom WebRTC message handler
  useEffect(() => {
    if (customWebRTC.setOnMessage) {
      customWebRTC.setOnMessage((message) => {
        if (message && message.id) {
          handleMessage(message, 'p2p');
        }
      });
    }
  }, [customWebRTC.setOnMessage, handleMessage]);
  
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
    console.log('🌐 [P2P UPGRADE] P2P connected:', customWebRTC.connectionStatus === 'connected');
    console.log('🌐 [P2P UPGRADE] Mesh enabled:', meshEnabled);
    
    if (!wsChat.status.isConnected) {
      console.log('🚫 [P2P UPGRADE] WebSocket not connected - aborting');
      return false;
    }
    
    if (customWebRTC.connectionStatus === 'connected') {
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
        
        // Try to discover available peers with cooldown
        setTimeout(() => {
          try {
            customWebRTC.refreshPeers();
            console.log('🔄 [P2P UPGRADE] Triggered P2P peer discovery');
          } catch (error) {
            console.warn('⚠️ [P2P UPGRADE] P2P peer discovery failed:', error);
          }
        }, 2000);
        
        return true;
      }
      
      // Use the new connectToAllAvailablePeers function to prevent loops
      console.log('🌐 [P2P UPGRADE] Using new controlled P2P connection method');
      
      // Enable mesh networking first
      setMeshEnabled(true);
      
      // First, refresh peers to get the latest list
      customWebRTC.refreshPeers();
      
      // Wait for peer discovery, then attempt connections using the controlled method
      setTimeout(async () => {
        try {
          console.log('🚀 [P2P UPGRADE] Attempting controlled connections to all available peers');
          await customWebRTC.connectToAllAvailablePeers();
          
          // Check if any connections were successful
          const connectedCount = customWebRTC.connections.size;
          if (connectedCount > 0) {
            console.log(`✅ [P2P UPGRADE] P2P upgrade successful: ${connectedCount} connections`);
          } else {
            console.log('⚠️ [P2P UPGRADE] No P2P connections established, but mesh enabled for discovery');
          }
          
        } catch (error) {
          console.warn('💥 [P2P UPGRADE] Error during controlled P2P connections:', error);
        }
      }, 3000); // Wait 3 seconds for peer discovery
      
      return true;
    } else {
      console.log('🚫 [P2P UPGRADE] Conditions not met for P2P upgrade');
      console.log('🚫 [P2P UPGRADE] - Connected peers:', connectedPeers.length);
      console.log('🚫 [P2P UPGRADE] - Is small group:', isSmallGroup);
      console.log('🚫 [P2P UPGRADE] - Should prefer P2P:', shouldPreferP2P);
    }
    
    return false;
  }, [wsChat, customWebRTC, connectionDetector, meshEnabled]);
  
  // DISABLED: Auto-upgrade to prevent infinite loops
  // Users can manually enable P2P via debug panel
  
  // Less aggressive auto-upgrade - DISABLED for stability
  const autoUpgradeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const p2pStabilityRef = useRef({ attempts: 0, failures: 0, lastFailure: 0 });
  
  // Track P2P instability
  useEffect(() => {
    if (customWebRTC.connectionStatus === 'failed') {
      // P2P connection failed - this indicates instability
      const now = Date.now();
      p2pStabilityRef.current.failures++;
      p2pStabilityRef.current.lastFailure = now;
      
      if (p2pStabilityRef.current.failures >= 3) {
        console.log('🚫 [P2P STABILITY] P2P appears unstable, disabling auto-upgrade for 5 minutes');
      }
    }
  }, [customWebRTC.connectionStatus]);
  
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
  
  // ENABLED: Conservative automatic P2P upgrade with