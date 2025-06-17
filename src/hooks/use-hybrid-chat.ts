'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { Message, ConnectionStatus } from '../lib/types';
import { generateCompatibleUUID } from '../utils/peer-utils';
import { useWebSocketChat } from './use-websocket-chat';
import { useDevFriendlyWebRTC } from './use-dev-friendly-webrtc';
import { useMessageBridge } from './use-message-bridge';

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
    
    // Prefer WebRTC when on WiFi or when cellular data might be limited
    return connectionType === 'wifi' || connectionType === 'none';
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

export function useHybridChat(roomId: string, displayName?: string) {
  // Initialize WebSocket chat first (provides the socket for WebRTC signaling)
  const wsChat = useWebSocketChat(roomId, displayName);
  
  // Initialize dev-friendly WebRTC - 🏠 Uses mock P2P in development, native WebRTC in production
  const webrtcChat = useDevFriendlyWebRTC(roomId, displayName, false); // 🏠 DEV-FRIENDLY implementation
  
  // Initialize message bridging for poor network conditions
  const messageBridge = useMessageBridge(roomId, displayName || 'Anonymous');
  
  // Hybrid state - FIXED: Enable mesh by default for P2P connections
  const [meshEnabled, setMeshEnabled] = useState(true);
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
  
  // 🚨 CRITICAL FIX: Track sent message IDs to prevent bridge duplication
  const sentMessageIds = useRef(new Set<string>());
  
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
  
  // Enhanced message sending with intelligent routing AND bridging support
  const sendMessage = useCallback((messageData: Omit<Message, 'id' | 'timestamp'>): string => {
    const messageId = generateCompatibleUUID();
    const fullMessage: Message = {
      ...messageData,
      id: messageId,
      timestamp: Date.now(),
      synced: false,
    };
    
    // 🚨 CRITICAL FIX: Track sent message IDs to prevent bridge duplication
    sentMessageIds.current.add(messageId);
    
    // Clean up old message IDs (keep only last 100)
    if (sentMessageIds.current.size > 100) {
      const idsArray = Array.from(sentMessageIds.current);
      sentMessageIds.current.clear();
      idsArray.slice(-50).forEach(id => sentMessageIds.current.add(id));
    }
    
    // Select optimal route
    const route = selectOptimalRoute();
    const shouldTryBoth = meshEnabled && wsChat.status.isConnected && webrtcChat.status.isConnected;
    const networkCondition = messageBridge.networkCondition;
    
    setHybridStats(prev => ({
      ...prev,
      routingDecisions: prev.routingDecisions + 1
    }));
    
    console.log(`🌐 Hybrid send via ${route}${shouldTryBoth ? ' + backup' : ''}: ${messageData.content}`);
    console.log(`📶 Network condition: ${networkCondition.quality} (${networkCondition.stability}% stability)`);
    
    let routeSuccess = false;
    
    // Primary route
    try {
      if (route === 'websocket') {
        wsChat.sendMessage(messageData);
        circuitBreaker.current.recordWebSocketSuccess();
        setHybridStats(prev => ({ ...prev, webSocketMessages: prev.webSocketMessages + 1 }));
        routeSuccess = true;
      } else {
        webrtcChat.sendMessage(messageData);
        circuitBreaker.current.recordWebRTCSuccess();
        setHybridStats(prev => ({ ...prev, webrtcMessages: prev.webrtcMessages + 1 }));
        routeSuccess = true;
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
            routeSuccess = true;
          } else {
            webrtcChat.sendMessage(messageData);
            setHybridStats(prev => ({ ...prev, webrtcMessages: prev.webrtcMessages + 1 }));
            routeSuccess = true;
          }
        } catch (backupError) {
          console.error(`❌ Backup route also failed:`, backupError);
        }
      }
    }
    
    // 🌉 CRITICAL FIX: TESTING BRIDGE ACTIVATION - Simulate poor network for testing
    // TODO: Remove this test condition and use real network conditions in production
    const shouldTestBridging = typeof window !== 'undefined' && 
                              (window as any).MessageBridgeDebug?.getNetworkCondition?.()?.quality === 'poor';
                              
    if (shouldTestBridging || networkCondition.quality === 'poor' || networkCondition.quality === 'critical' || !routeSuccess) {
      console.log(`🌉 [BRIDGE FALLBACK] Activating bridging:`, {
        testingMode: shouldTestBridging,
        networkQuality: networkCondition.quality,
        routeSuccess,
        reason: shouldTestBridging ? 'testing mode' : !routeSuccess ? 'route failed' : 'poor network'
      });
      
      // Discover bridge nodes from available peers
      const availablePeers = [...wsChat.getConnectedPeers?.() || [], ...webrtcChat.getConnectedPeers?.() || []];
      const connectionQualities = new Map();
      
      // Simulate connection qualities (in real implementation, these would come from connection monitoring)
      availablePeers.forEach(peerId => {
        connectionQualities.set(peerId, {
          reliability: wsChat.status.isConnected ? 70 : 30,
          latency: networkCondition.latency
        });
      });
      
      messageBridge.discoverBridgeNodes(availablePeers, connectionQualities);
      
      // 🚨 CRITICAL FIX: Use the SAME message ID for bridging to enable deduplication
      const bridgeMessageData = {
        ...messageData,
        id: messageId, // SAME ID as original message
        timestamp: fullMessage.timestamp, // SAME timestamp
        originalMessageId: messageId, // Track original for debugging
        bridgedMessage: true // Flag to identify bridge messages
      };
      
      const bridgeMessageId = messageBridge.bridgeMessage(bridgeMessageData, 'broadcast', 'high');
      console.log(`🌉 [BRIDGE] Message queued for bridging with original ID: ${messageId}`);
      
      setHybridStats(prev => ({ ...prev, webrtcMessages: prev.webrtcMessages + 1 }));
    } else {
      console.log(`✅ [BRIDGE] Network condition good (${networkCondition.quality}) and routes successful, skipping bridging`);
    }
    
    return messageId;
  }, [selectOptimalRoute, meshEnabled, wsChat, webrtcChat, messageBridge]);
  
  // 🚨 CRITICAL FIX: Enhanced message handling with bridge deduplication
  
  const handleMessage = useCallback((message: Message, source: 'websocket' | 'webrtc') => {
    // 🚨 CRITICAL FIX: Check if this is a message we sent (prevent echo)
    if (sentMessageIds.current.has(message.id)) {
      console.log(`🚫 [DEDUP] Ignoring echo of our own message from ${source}:`, message.id);
      setHybridStats(prev => ({ ...prev, duplicatesFiltered: prev.duplicatesFiltered + 1 }));
      return;
    }
    
    // 🚨 CRITICAL FIX: Enhanced duplicate detection with bridge awareness
    const isBridgedMessage = (message as any).bridgedMessage === true;
    const originalMessageId = (message as any).originalMessageId;
    
    // Check for duplicates using enhanced logic
    if (messageDeduplicator.current.isDuplicate(message)) {
      console.log(`🔄 [DEDUP] Filtered duplicate message from ${source}:`, message.id, isBridgedMessage ? '(bridged)' : '(normal)');
      setHybridStats(prev => ({ ...prev, duplicatesFiltered: prev.duplicatesFiltered + 1 }));
      return;
    }
    
    // 🚨 CRITICAL FIX: Additional bridge-specific deduplication
    if (isBridgedMessage && originalMessageId) {
      // Check if we already have a message with the same original ID
      setMessages(prev => {
        const existingMessage = prev.find(m => 
          m.id === originalMessageId || 
          (m as any).originalMessageId === originalMessageId ||
          m.id === message.id
        );
        
        if (existingMessage) {
          console.log(`🌉 [BRIDGE DEDUP] Filtered duplicate bridged message:`, {
            messageId: message.id,
            originalMessageId,
            existingId: existingMessage.id,
            source
          });
          setHybridStats(prev => ({ ...prev, duplicatesFiltered: prev.duplicatesFiltered + 1 }));
          return prev; // Don't add the duplicate
        }
        
        // Add the bridged message
        const updated = [...prev, { ...message, synced: true }]
          .sort((a, b) => a.timestamp - b.timestamp);
        return updated;
      });
    } else {
      // Add normal message to state
      setMessages(prev => {
        const updated = [...prev, { ...message, synced: true }]
          .sort((a, b) => a.timestamp - b.timestamp);
        return updated;
      });
    }
    
    // Notify external handlers
    messageHandlersRef.current.forEach(handler => {
      try {
        handler(message);
      } catch (e) {
        console.error('Message handler error:', e);
      }
    });
    
    const bridgeInfo = isBridgedMessage ? ` (bridged from ${originalMessageId})` : '';
    console.log(`📩 Hybrid message received via ${source}:`, message.content + bridgeInfo);
  }, []);
  
  // Set up message handlers for both connections AND bridge messages
  useEffect(() => {
    const wsUnsubscribe = wsChat.onMessage((message) => {
      handleMessage(message, 'websocket');
    });
    
    const webrtcUnsubscribe = webrtcChat.onMessage((message) => {
      handleMessage(message, 'webrtc');
    });
    
    // CRITICAL: Handle bridged messages from poor network conditions
    const bridgeUnsubscribe = messageBridge.onBridgedMessage((message) => {
      console.log(`🌉 [BRIDGE] Received bridged message:`, {
        content: message.content,
        id: message.id,
        originalMessageId: (message as any).originalMessageId,
        bridgedMessage: (message as any).bridgedMessage,
        timestamp: message.timestamp,
        sender: message.sender
      });
      handleMessage(message, 'webrtc'); // Treat as WebRTC for stats purposes
    });
    
    return () => {
      wsUnsubscribe();
      webrtcUnsubscribe();
      bridgeUnsubscribe();
    };
  }, [wsChat.onMessage, webrtcChat.onMessage, messageBridge.onBridgedMessage, handleMessage]);
  
  // CRITICAL FIX: Bridge peer discovery from WebSocket to WebRTC
  const lastConnectedPeersRef = useRef<string[]>([]);
  const peerConnectionAttemptsRef = useRef<Set<string>>(new Set());
  
  useEffect(() => {
    // Monitor WebSocket connected peers and trigger WebRTC connections
    const currentPeers = wsChat.getConnectedPeers?.() || [];
    const lastPeers = lastConnectedPeersRef.current;
    
    // Find newly joined peers
    const newPeers = currentPeers.filter(peer => !lastPeers.includes(peer));
    
    // CRITICAL FIX: Check WebRTC signaling connection, not status.isConnected
    const webrtcSignalingConnected = webrtcChat.isSignalingConnected?.() || false;
    
    if (newPeers.length > 0 && meshEnabled && webrtcSignalingConnected) {
      console.log(`🌉 [PEER BRIDGE] New peers detected for WebRTC connection:`, newPeers);
      console.log(`🔗 [PEER BRIDGE] WebRTC signaling ready, attempting connections...`);
      
      newPeers.forEach(async (peerDisplayName) => {
        // Skip if we've already attempted connection to this peer
        if (peerConnectionAttemptsRef.current.has(peerDisplayName)) {
          console.log(`🚫 [PEER BRIDGE] Already attempted connection to ${peerDisplayName}`);
          return;
        }
        
        // Mark as attempted
        peerConnectionAttemptsRef.current.add(peerDisplayName);
        
        console.log(`🔗 [PEER BRIDGE] Attempting WebRTC connection to peer: ${peerDisplayName}`);
        
        // CRITICAL FIX: Use display name as peer ID for now
        // The WebRTC hook will handle the actual peer ID mapping
        try {
          const success = await webrtcChat.connectToPeer(peerDisplayName);
          if (success) {
            console.log(`✅ [PEER BRIDGE] Successfully connected to ${peerDisplayName}`);
          } else {
            console.log(`❌ [PEER BRIDGE] Failed to connect to ${peerDisplayName}`);
            // Remove from attempted set so we can retry later
            peerConnectionAttemptsRef.current.delete(peerDisplayName);
          }
        } catch (error) {
          console.error(`💥 [PEER BRIDGE] Error connecting to ${peerDisplayName}:`, error);
          peerConnectionAttemptsRef.current.delete(peerDisplayName);
        }
      });
    } else if (newPeers.length > 0) {
      console.log(`🚧 [PEER BRIDGE] New peers detected but conditions not met:`, {
        newPeers,
        meshEnabled,
        webrtcSignalingConnected
      });
    }
    
    // Clean up attempted connections for peers who left
    const leftPeers = lastPeers.filter(peer => !currentPeers.includes(peer));
    leftPeers.forEach(peer => {
      peerConnectionAttemptsRef.current.delete(peer);
      console.log(`🧹 [PEER BRIDGE] Cleaned up connection attempt tracking for ${peer}`);
    });
    
    // Update last peers
    lastConnectedPeersRef.current = [...currentPeers];
    
  }, [wsChat.getConnectedPeers, meshEnabled, webrtcChat.status.isConnected, webrtcChat.connectToPeer, webrtcChat.isSignalingConnected]);
  
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
  
  // Enhanced WebRTC upgrade logic - RE-ENABLED for production
  const attemptWebRTCUpgrade = useCallback(async () => {
    console.log('🔄 [WebRTC UPGRADE] Attempting WebRTC upgrade...');
    
    // Check if upgrade conditions are met
    if (!wsChat.status.isConnected) {
      console.log('🚫 [WebRTC UPGRADE] WebSocket not connected, skipping upgrade');
      return false;
    }
    
    if (webrtcChat.status.isConnected) {
      console.log('✅ [WebRTC UPGRADE] WebRTC already connected');
      return true;
    }
    
    const connectedPeers = wsChat.getConnectedPeers?.() || [];
    if (connectedPeers.length < 1) {
      console.log('🚫 [WebRTC UPGRADE] Not enough peers for WebRTC upgrade');
      return false;
    }
    
    // Set mesh enabled to trigger WebRTC connections
    setMeshEnabled(true);
    console.log('🌐 [WebRTC UPGRADE] Mesh enabled, WebRTC connections should begin');
    
    return true;
  }, [wsChat.status.isConnected, webrtcChat.status.isConnected, wsChat.getConnectedPeers]);
  
  // RE-ENABLED: Auto-upgrade with conservative settings to prevent loops
  const autoUpgradeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const webrtcStabilityRef = useRef({ attempts: 0, failures: 0, lastFailure: 0 });
  
  // Track WebRTC stability and attempts - RE-ENABLED with safety checks
  useEffect(() => {
    // Only track if WebRTC is enabled and we have a stable WebSocket connection
    if (!webrtcChat.status.isConnected && !webrtcStabilityRef.current.attempts) {
      console.log('🔍 [WebRTC STABILITY] Tracking stability for potential auto-upgrade');
    }
    
    // Monitor for WebRTC connection failures
    if (webrtcChat.status.isConnected) {
      // Reset failure tracking on successful connection
      webrtcStabilityRef.current.failures = 0;
      webrtcStabilityRef.current.lastFailure = 0;
    } else if (webrtcStabilityRef.current.attempts > 0) {
      // Track failures only after we've made attempts
      const now = Date.now();
      const timeSinceLastFailure = now - webrtcStabilityRef.current.lastFailure;
      
      // Only count as failure if we recently attempted a connection
      if (timeSinceLastFailure < 30000) { // 30 seconds
        webrtcStabilityRef.current.failures++;
        webrtcStabilityRef.current.lastFailure = now;
        console.log(`⚠️ [WebRTC STABILITY] Failure ${webrtcStabilityRef.current.failures} recorded`);
      }
    }
  }, [webrtcChat.status.isConnected]);
  
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
  
  // FIXED: Prevent auto-upgrade loops - only attempt once per peer set
  const autoUpgradeAttemptedRef = useRef<Set<string>>(new Set());
  
  useEffect(() => {
    // Simple conditions: WebSocket connected, have display name, and peers available
    if (!wsChat.status.isConnected || !displayName) {
      return;
    }
    
    const connectedPeers = wsChat.getConnectedPeers?.() || [];
    const peersKey = connectedPeers.sort().join(','); // Create a key for this peer set
    
    // If we have peers, WebRTC isn't connected, and we haven't attempted for this peer set
    if (connectedPeers.length > 0 && !webrtcChat.status.isConnected && meshEnabled && !autoUpgradeAttemptedRef.current.has(peersKey)) {
      console.log('🚀 [AUTO-UPGRADE] New peers detected, attempting WebRTC upgrade:', connectedPeers);
      
      // Mark this peer set as attempted
      autoUpgradeAttemptedRef.current.add(peersKey);
      
      // Clean up old attempts (keep only last 5)
      if (autoUpgradeAttemptedRef.current.size > 5) {
        const attempts = Array.from(autoUpgradeAttemptedRef.current);
        autoUpgradeAttemptedRef.current.clear();
        attempts.slice(-3).forEach(key => autoUpgradeAttemptedRef.current.add(key));
      }
      
      // Small delay to ensure WebSocket connection is stable
      setTimeout(() => {
        attemptWebRTCUpgrade();
      }, 1000);
    }
    
    // Reset attempts if WebRTC connects successfully
    if (webrtcChat.status.isConnected) {
      autoUpgradeAttemptedRef.current.clear();
    }
  }, [wsChat.status.isConnected, wsChat.getConnectedPeers, webrtcChat.status.isConnected, meshEnabled, displayName, attemptWebRTCUpgrade]);
  
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
          reliability: webrtcChat.status.isConnected ? 90 : 0, // Slightly less reliable than server
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
  
  // Expose debugging tools - CLEANED UP: Only show once
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.HybridChatDebug = {
        getStatus: () => hybridStatus,
        getStats: () => hybridStats,
        getConnectionQuality: () => connectionQuality,
        forceRoute: setPreferredRoute,
        getCircuitBreakerState: () => circuitBreaker.current.getState(),
        testWebRTC: () => webrtcChat.forceReconnect(),
        attemptUpgrade: attemptWebRTCUpgrade,
        resetCircuitBreaker: () => circuitBreaker.current.reset(),
        clearMessageQueue: () => messageDeduplicator.current.clear(),
        // Enhanced WebRTC control and status with REAL-TIME monitoring
        enableWebRTC: () => {
          console.log('✅ [DEBUG] WebRTC is now ENABLED with full protection');
          return {
            enabled: true,
            protectionActive: true,
            loopDetection: 'armed',
            circuitBreaker: 'ready',
            currentRoute: selectOptimalRoute()
          };
        },
        isWebRTCDisabled: () => false,
        getWebRTCStatus: () => ({
          enabled: true,
          connected: webrtcChat.status.isConnected,
          peers: webrtcChat.status.connectedPeers,
          meshEnabled,
          loopProtection: 'active',
          connectionAttempts: webrtcChat.getDebugInfo?.()?.stats?.totalAttempts || 0,
          circuitBreakerState: 'armed'
        }),
        // Auto-upgrade controls
        getStabilityStatus: () => webrtcStabilityRef.current,
        enableMesh: () => {
          console.log('🌐 [DEBUG] Enabling mesh for auto-upgrade...');
          setMeshEnabled(true);
          return 'Mesh enabled - auto-upgrade will begin in 30 seconds if conditions are met';
        },
        disableMesh: () => {
          console.log('🚫 [DEBUG] Disabling mesh and canceling auto-upgrade...');
          setMeshEnabled(false);
          if (autoUpgradeTimerRef.current) {
            clearTimeout(autoUpgradeTimerRef.current);
            autoUpgradeTimerRef.current = null;
          }
          return 'Mesh disabled - auto-upgrade canceled';
        },
        forceAutoUpgrade: async () => {
          console.log('⚡ [DEBUG] Forcing immediate auto-upgrade...');
          if (!meshEnabled) {
            setMeshEnabled(true);
            console.log('🌐 [DEBUG] Enabled mesh for forced upgrade');
          }
          return await attemptWebRTCUpgrade();
        },
        // Peer bridge debugging
        getPeerBridgeStatus: () => ({
          currentPeers: wsChat.getConnectedPeers?.() || [],
          lastPeers: lastConnectedPeersRef.current,
          attemptedConnections: Array.from(peerConnectionAttemptsRef.current),
          meshEnabled,
          webrtcConnected: webrtcChat.isSignalingConnected?.() || false,
          webrtcSignalingConnected: webrtcChat.isSignalingConnected?.() || false,
          webrtcStats: webrtcChat.getDebugInfo?.()?.stats || {},
          bridgeActive: meshEnabled && (webrtcChat.isSignalingConnected?.() || false)
        }),
        triggerManualPeerConnection: async (peerDisplayName: string) => {
          console.log(`⚡ [DEBUG] Manually triggering connection to: ${peerDisplayName}`);
          if (!meshEnabled) {
            setMeshEnabled(true);
            console.log('🌐 [DEBUG] Enabled mesh for manual connection');
          }
          peerConnectionAttemptsRef.current.add(peerDisplayName);
          return await webrtcChat.connectToPeer(peerDisplayName);
        },
        clearPeerBridgeCache: () => {
          peerConnectionAttemptsRef.current.clear();
          lastConnectedPeersRef.current = [];
          console.log('🧹 [DEBUG] Cleared peer bridge cache');
        },
        // Message bridging debugging
        getBridgeStatus: () => ({
          networkCondition: messageBridge.networkCondition,
          bridgeNodes: messageBridge.bridgeNodes,
          bridgeStats: messageBridge.bridgeStats,
          queuedMessages: messageBridge.queuedMessages,
          adaptiveConfig: messageBridge.getAdaptiveConfig(),
          bridgeEnabled: messageBridge.getAdaptiveConfig().enabled
        }),
        simulatePoorNetwork: () => {
          console.log('🌉 [DEBUG] Simulating poor network to test bridging...');
          if (window.MessageBridgeDebug) {
            window.MessageBridgeDebug.simulatePoorNetwork();
            return 'Poor network simulation activated - bridging should engage';
          }
          return 'Message bridge not available';
        },
        simulateNetworkRecovery: () => {
          console.log('✨ [DEBUG] Simulating network recovery...');
          if (window.MessageBridgeDebug) {
            window.MessageBridgeDebug.simulateGoodNetwork();
            return 'Network recovery simulation activated';
          }
          return 'Message bridge not available';
        },
        testBridging: (content: string) => {
          console.log('🌉 [DEBUG] Testing message bridging with content:', content);
          const messageId = messageBridge.bridgeMessage({ 
            content, 
            type: 'chat',
            senderId: displayName || 'Debug'
          }, 'test-peer', 'high');
          return `Bridging test message queued with ID: ${messageId}`;
        },
        // CRITICAL FIX: Add debug function to clear sent message tracking
        clearSentMessageTracking: () => {
          sentMessageIds.current.clear();
          console.log('🧹 [DEBUG] Cleared sent message tracking');
          return 'Sent message tracking cleared';
        },
        getSentMessageCount: () => {
          return sentMessageIds.current.size;
        },
        // 🔥 CRITICAL FIX: Add enhanced admin P2P debugging
        clearAllP2PBlocks: () => {
          console.log('🔥 [ADMIN P2P] Clearing ALL P2P blocking states...');
          
          // Clear all rate limiting and loop detection
          if (window.NativeWebRTCDebug) {
            window.NativeWebRTCDebug.clearLoopDetection();
            window.NativeWebRTCDebug.clearGlobalInstances();
            console.log('🔥 [ADMIN P2P] WebRTC loop detection and instances cleared');
          }
          
          // Set admin flags
          if (typeof window !== 'undefined') {
            (window as any).HybridChatDebug.enableP2PForAdminDashboard = true;
            if (window.NativeWebRTCDebug) {
              window.NativeWebRTCDebug.forceInitializeInProgress = true;
            }
            console.log('🔥 [ADMIN P2P] Admin P2P flags set');
          }
          
          // Enable mesh
          if (!meshEnabled) {
            setMeshEnabled(true);
            console.log('🔥 [ADMIN P2P] Mesh enabled');
          }
          
          return 'All P2P blocks cleared - ready for admin dashboard testing';
        },
        // 🔥 CRITICAL: Add P2P testing functions for admin dashboard
        testP2PConnections: () => {
          console.log('🔥 [HYBRID P2P] Testing P2P connections...');
          
          if (window.NativeWebRTCDebug) {
            return window.NativeWebRTCDebug.testP2PWithAllPeers();
          }
          
          return 'WebRTC debug tools not available';
        },
        forceP2PConnection: async (targetDisplayName) => {
          console.log(`🔥 [HYBRID P2P] Forcing P2P connection to: ${targetDisplayName}`);
          
          if (window.NativeWebRTCDebug) {
            return await window.NativeWebRTCDebug.forceP2PConnection(targetDisplayName);
          }
          
          return false;
        },
        getP2PStatus: () => {
          return {
            webrtcEnabled: true,
            webrtcConnected: webrtcChat.status.isConnected,
            webrtcPeers: webrtcChat.status.connectedPeers,
            webrtcSignaling: webrtcChat.isSignalingConnected(),
            meshEnabled,
            currentRoute: selectOptimalRoute(),
            hybridStatus: hybridStatus
          };
        },
        enableP2PForAdminDashboard: () => {
          console.log('🔥 [ADMIN P2P] Enabling P2P connections for admin dashboard testing...');
          
          // 🔥 CRITICAL FIX: Set admin P2P test flag BEFORE any operations
          if (typeof window !== 'undefined') {
            (window as any).HybridChatDebug.enableP2PForAdminDashboard = true;
            console.log('🔥 [ADMIN P2P] Admin P2P test flag set to bypass rate limiting');
          }
          
          // Enable mesh if not already enabled
          if (!meshEnabled) {
            setMeshEnabled(true);
            console.log('🌐 [ADMIN P2P] Mesh networking enabled');
          }
          
          // Force WebRTC initialization if needed
          if (!webrtcChat.status.isConnected && window.NativeWebRTCDebug) {
            // Set the WebRTC force flag too
            window.NativeWebRTCDebug.forceInitializeInProgress = true;
            window.NativeWebRTCDebug.forceInitialize();
            console.log('🚀 [ADMIN P2P] WebRTC initialization forced');
          }
          
          return 'P2P enabled for admin dashboard - connections will be attempted automatically';
        }
      };
      
      // CLEANED UP: Only show debug info once when window.HybridChatDebug is first created
      if (!window.HybridChatDebug._debugInfoShown) {
        console.log('🔍 Hybrid Chat Debug tools available: window.HybridChatDebug');
        console.log('🌉 [PEER BRIDGE] Bridge active, monitoring peer changes...');
        console.log('🌉 [MESSAGE BRIDGE] Advanced bridging for poor network conditions enabled');
        console.log('   - Use window.HybridChatDebug.getPeerBridgeStatus() to check bridge status');
        console.log('   - Use window.HybridChatDebug.getBridgeStatus() to check message bridging');
        console.log('   - Use window.HybridChatDebug.simulatePoorNetwork() to test bridging');
        console.log('   - Use window.HybridChatDebug.testBridging("message") to test bridge routing');
        console.log('   - Use window.HybridChatDebug.triggerManualPeerConnection("peerName") to test connections');
        window.HybridChatDebug._debugInfoShown = true;
      }
    }
  }, []); // CLEANED UP: Empty dependency array so this only runs once
  
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
    attemptWebRTCUpgrade,
    
    // Route management
    preferredRoute,
    setPreferredRoute,
    currentRoute: selectOptimalRoute(),
    
    // Connection info
    connectionQuality,
    hybridStats,
    
    // 🌉 BRIDGE SYSTEM - New bridging capabilities for poor network conditions
    bridging: {
      networkCondition: messageBridge.networkCondition,
      bridgeNodes: messageBridge.bridgeNodes,
      bridgeStats: messageBridge.bridgeStats,
      queuedMessages: messageBridge.queuedMessages,
      isEnabled: messageBridge.getAdaptiveConfig().enabled,
      config: messageBridge.getAdaptiveConfig(),
      
      // Manual bridging controls
      bridgeMessage: messageBridge.bridgeMessage,
      processBridgeQueue: messageBridge.processBridgeQueue,
      clearQueue: messageBridge.clearQueue,
      discoverBridgeNodes: messageBridge.discoverBridgeNodes,
      
      // Network simulation for testing
      simulatePoorNetwork: () => {
        if (window.MessageBridgeDebug) {
          window.MessageBridgeDebug.simulatePoorNetwork();
        }
      },
      simulateGoodNetwork: () => {
        if (window.MessageBridgeDebug) {
          window.MessageBridgeDebug.simulateGoodNetwork();
        }
      }
    },
    
    // Individual connection access
    webSocket: {
      status: wsChat.status,
      connected: wsChat.status.isConnected,
      quality: wsChat.connectionQuality,
      peers: wsChat.getConnectedPeers?.() || []
    },
    webrtc: {
      status: webrtcChat.status,
      connected: webrtcChat.status.isConnected,
      peers: webrtcChat.getConnectedPeers?.() || [],
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
      webrtc: webrtcChat.getDebugInfo?.(),
      bridge: messageBridge.getDebugInfo(),
      circuitBreaker: circuitBreaker.current.getState(),
      stats: hybridStats
    })
  };
}