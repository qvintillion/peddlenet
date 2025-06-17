'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Message, ConnectionStatus } from '../lib/types';
import { useWebSocketChat } from './use-websocket-chat';
import { useNativeWebRTC } from './use-native-webrtc';
import { generateCompatibleUUID } from '../utils/peer-utils';

interface HybridChatOptions {
  preferWebRTC?: boolean;
  webrtcTimeout?: number;
  fallbackDelay?: number;
  maxRetries?: number;
}

interface HybridStatus extends ConnectionStatus {
  webrtcStatus: 'connecting' | 'connected' | 'failed' | 'disabled';
  webSocketStatus: 'connecting' | 'connected' | 'disconnected';
  currentRoute: 'webrtc' | 'websocket' | 'both';
  webrtcPeers: number;
  messagesSentViaWebRTC: number;
  messagesSentViaWebSocket: number;
  webrtcStabilityScore: number;
}

export function useHybridChatWebRTC(
  roomId: string, 
  displayName?: string,
  options: HybridChatOptions = {}
) {
  const {
    preferWebRTC = true,
    webrtcTimeout = 15000,
    fallbackDelay = 5000,
    maxRetries = 3
  } = options;

  const effectiveDisplayName = displayName || 
    (typeof window !== 'undefined' ? localStorage.getItem('displayName') || 'Anonymous' : 'Anonymous');

  // Initialize both communication methods
  // ✅ FIXED: WebRTC re-enabled for P2P connections and admin dashboard
  const webrtcChat = useNativeWebRTC(roomId, effectiveDisplayName, false); // disabled=false
  const wsChat = useWebSocketChat(roomId, effectiveDisplayName);

  // Hybrid state management
  const [hybridStatus, setHybridStatus] = useState<HybridStatus>({
    isConnected: false,
    connectedPeers: 0,
    networkReach: 'isolated',
    signalStrength: 'none',
    webrtcStatus: 'connecting',
    webSocketStatus: 'connecting',
    currentRoute: 'websocket',
    webrtcPeers: 0,
    messagesSentViaWebRTC: 0,
    messagesSentViaWebSocket: 0,
    webrtcStabilityScore: 0
  });

  // Message routing state
  const [preferredRoute, setPreferredRoute] = useState<'webrtc' | 'websocket'>(
    preferWebRTC ? 'webrtc' : 'websocket'
  );

  // Refs for stability tracking
  const messageCountersRef = useRef({ webrtc: 0, websocket: 0 });
  const webrtcStabilityRef = useRef({ successes: 0, failures: 0, score: 0 });
  const routingHistoryRef = useRef<Array<{ route: string; success: boolean; timestamp: number }>>([]);

  // Message handlers management
  const messageHandlersRef = useRef<Set<(message: Message) => void>>(new Set());

  // Update hybrid status based on individual statuses
  const updateHybridStatus = useCallback(() => {
    const webrtcConnected = webrtcChat.status.isConnected;
    const wsConnected = wsChat.status.isConnected;
    const webrtcPeerCount = webrtcChat.status.connectedPeers;

    // Calculate WebRTC stability score (0-100)
    const { successes, failures } = webrtcStabilityRef.current;
    const totalAttempts = successes + failures;
    const stabilityScore = totalAttempts > 0 ? Math.round((successes / totalAttempts) * 100) : 0;
    webrtcStabilityRef.current.score = stabilityScore;

    // Determine current route
    let currentRoute: 'webrtc' | 'websocket' | 'both' = 'websocket';
    if (webrtcConnected && wsConnected) {
      currentRoute = 'both';
    } else if (webrtcConnected) {
      currentRoute = 'webrtc';
    } else {
      currentRoute = 'websocket';
    }

    // Determine overall connection status
    const isConnected = webrtcConnected || wsConnected;
    const totalPeers = Math.max(webrtcPeerCount, wsChat.status.connectedPeers);

    // Calculate signal strength based on routes available
    let signalStrength: 'none' | 'weak' | 'medium' | 'strong' = 'none';
    if (webrtcConnected && wsConnected) {
      signalStrength = 'strong';
    } else if (webrtcConnected || (wsConnected && totalPeers > 0)) {
      signalStrength = 'medium';
    } else if (wsConnected) {
      signalStrength = 'weak';
    }

    // Determine network reach
    let networkReach: 'isolated' | 'local' | 'internet' = 'isolated';
    if (webrtcConnected) {
      networkReach = 'local'; // WebRTC typically works locally/regionally
    } else if (wsConnected) {
      networkReach = 'internet'; // WebSocket works over internet
    }

    setHybridStatus({
      isConnected,
      connectedPeers: totalPeers,
      networkReach,
      signalStrength,
      webrtcStatus: webrtcConnected ? 'connected' : 
                   webrtcChat.status.connectedPeers === 0 && totalAttempts > 0 ? 'failed' : 'connecting',
      webSocketStatus: wsConnected ? 'connected' : 'disconnected',
      currentRoute,
      webrtcPeers: webrtcPeerCount,
      messagesSentViaWebRTC: messageCountersRef.current.webrtc,
      messagesSentViaWebSocket: messageCountersRef.current.websocket,
      webrtcStabilityScore: stabilityScore
    });
  }, [webrtcChat.status, wsChat.status]);

  // Route selection logic
  const selectOptimalRoute = useCallback((): 'webrtc' | 'websocket' => {
    const webrtcAvailable = webrtcChat.status.isConnected;
    const webSocketAvailable = wsChat.status.isConnected;
    const stabilityScore = webrtcStabilityRef.current.score;

    // If WebRTC is preferred and available with good stability, use it
    if (preferredRoute === 'webrtc' && webrtcAvailable && stabilityScore >= 70) {
      return 'webrtc';
    }

    // If WebRTC is available but WebSocket is not, use WebRTC regardless of stability
    if (webrtcAvailable && !webSocketAvailable) {
      return 'webrtc';
    }

    // Default to WebSocket for reliability
    if (webSocketAvailable) {
      return 'websocket';
    }

    // Last resort: try WebRTC even if stability is poor
    if (webrtcAvailable) {
      return 'webrtc';
    }

    // No routes available - return preferred
    return preferredRoute;
  }, [webrtcChat.status.isConnected, wsChat.status.isConnected, preferredRoute]);

  // Enhanced message sending with intelligent routing
  const sendMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>): string => {
    const fullMessage: Message = {
      ...message,
      id: generateCompatibleUUID(),
      timestamp: Date.now(),
      synced: false,
    };

    const optimalRoute = selectOptimalRoute();
    let primarySuccess = false;
    let backupUsed = false;

    console.log(`📨 Sending message via ${optimalRoute} route`);

    // Try primary route
    try {
      if (optimalRoute === 'webrtc' && webrtcChat.status.isConnected) {
        primarySuccess = webrtcChat.sendMessage(message) !== null;
        if (primarySuccess) {
          messageCountersRef.current.webrtc++;
          webrtcStabilityRef.current.successes++;
        } else {
          webrtcStabilityRef.current.failures++;
        }
      } else if (optimalRoute === 'websocket' && wsChat.status.isConnected) {
        primarySuccess = wsChat.sendMessage(message) !== null;
        if (primarySuccess) {
          messageCountersRef.current.websocket++;
        }
      }
    } catch (error) {
      console.error(`❌ ${optimalRoute} send failed:`, error);
      if (optimalRoute === 'webrtc') {
        webrtcStabilityRef.current.failures++;
      }
    }

    // Backup route if primary failed
    if (!primarySuccess) {
      console.log(`🔄 Primary route failed, trying backup...`);
      try {
        if (optimalRoute === 'webrtc' && wsChat.status.isConnected) {
          // WebRTC failed, use WebSocket backup
          backupUsed = wsChat.sendMessage(message) !== null;
          if (backupUsed) {
            messageCountersRef.current.websocket++;
          }
        } else if (optimalRoute === 'websocket' && webrtcChat.status.isConnected) {
          // WebSocket failed, use WebRTC backup
          backupUsed = webrtcChat.sendMessage(message) !== null;
          if (backupUsed) {
            messageCountersRef.current.webrtc++;
            webrtcStabilityRef.current.successes++;
          }
        }
      } catch (error) {
        console.error(`❌ Backup route also failed:`, error);
      }
    }

    // Log routing history
    routingHistoryRef.current.push({
      route: optimalRoute,
      success: primarySuccess || backupUsed,
      timestamp: Date.now()
    });

    // Keep only last 50 entries
    if (routingHistoryRef.current.length > 50) {
      routingHistoryRef.current = routingHistoryRef.current.slice(-50);
    }

    // Update status after routing
    updateHybridStatus();

    if (primarySuccess || backupUsed) {
      console.log(`✅ Message sent via ${primarySuccess ? optimalRoute : 'backup'} route`);
    } else {
      console.error(`❌ Message failed on all routes`);
    }

    return fullMessage.id;
  }, [webrtcChat, wsChat, selectOptimalRoute, updateHybridStatus]);

  // Message handler registration
  const onMessage = useCallback((handler: (message: Message) => void) => {
    messageHandlersRef.current.add(handler);

    // Register with both underlying systems
    const webrtcUnsubscribe = webrtcChat.onMessage(handler);
    const wsUnsubscribe = wsChat.onMessage(handler);

    return () => {
      messageHandlersRef.current.delete(handler);
      webrtcUnsubscribe();
      wsUnsubscribe();
    };
  }, [webrtcChat, wsChat]);

  // WebRTC connection management
  const connectToWebRTCPeer = useCallback(async (targetPeerId: string): Promise<boolean> => {
    try {
      const success = await webrtcChat.connectToPeer(targetPeerId);
      if (success) {
        webrtcStabilityRef.current.successes++;
      } else {
        webrtcStabilityRef.current.failures++;
      }
      updateHybridStatus();
      return success;
    } catch (error) {
      console.error('❌ WebRTC connection error:', error);
      webrtcStabilityRef.current.failures++;
      updateHybridStatus();
      return false;
    }
  }, [webrtcChat, updateHybridStatus]);

  // Force route preference
  const setRoutePreference = useCallback((route: 'webrtc' | 'websocket') => {
    console.log(`🔄 Route preference changed: ${preferredRoute} -> ${route}`);
    setPreferredRoute(route);
    updateHybridStatus();
  }, [preferredRoute, updateHybridStatus]);

  // Auto-upgrade to WebRTC when conditions are favorable
  useEffect(() => {
    // ✅ FIXED: Re-enabled auto-upgrade for better P2P performance
    if (!preferWebRTC) return;

    const upgradeInterval = setInterval(() => {
      const wsOnly = wsChat.status.isConnected && !webrtcChat.status.isConnected;
      const hasPeers = wsChat.status.connectedPeers > 0;
      const lowFailureRate = webrtcStabilityRef.current.score >= 50 || webrtcStabilityRef.current.failures < 3;

      if (wsOnly && hasPeers && lowFailureRate && preferredRoute === 'websocket') {
        console.log('🔄 Auto-upgrading to WebRTC - conditions favorable');
        setPreferredRoute('webrtc');
        // Trigger WebRTC connection attempts
        webrtcChat.forceReconnect?.();
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(upgradeInterval);
  }, [preferWebRTC, wsChat.status, webrtcChat.status, preferredRoute, webrtcChat.forceReconnect]);

  // Status synchronization
  useEffect(() => {
    updateHybridStatus();
  }, [updateHybridStatus]);

  // Expose debug information
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.HybridChatDebug = {
        getStatus: () => hybridStatus,
        getRoutingHistory: () => routingHistoryRef.current,
        getStabilityData: () => webrtcStabilityRef.current,
        forceRoute: setRoutePreference,
        getMessageCounters: () => messageCountersRef.current,
        testWebRTC: () => webrtcChat.forceReconnect?.(),
        getCurrentRoute: selectOptimalRoute
      };
    }
  }, [hybridStatus, setRoutePreference, webrtcChat.forceReconnect, selectOptimalRoute]);

  return {
    // Core messaging interface
    sendMessage,
    onMessage,
    
    // Status information
    status: hybridStatus,
    
    // WebRTC specific methods
    connectToWebRTCPeer,
    getConnectedWebRTCPeers: () => webrtcChat.getConnectedPeers?.() || [],
    
    // WebSocket specific methods  
    getConnectedWebSocketPeers: () => wsChat.status.connectedPeers,
    
    // Route management
    setRoutePreference,
    getCurrentRoute: selectOptimalRoute,
    getOptimalRoute: selectOptimalRoute,
    
    // Debugging and monitoring
    getRoutingHistory: () => routingHistoryRef.current,
    getStabilityScore: () => webrtcStabilityRef.current.score,
    getMessageCounters: () => ({ ...messageCountersRef.current }),
    
    // Force reconnection
    forceReconnect: () => {
      webrtcChat.forceReconnect?.();
      // WebSocket reconnection is usually handled automatically
    },
    
    // Legacy compatibility
    peerId: webrtcChat.peerId || wsChat.peerId,
    roomPeers: [...(webrtcChat.roomPeers || []), ...(wsChat.roomPeers || [])],
    getQueuedMessages: () => (webrtcChat.getQueuedMessages?.() || 0) + (wsChat.getQueuedMessages?.() || 0),
    clearMessageQueue: () => {
      webrtcChat.clearMessageQueue?.();
      wsChat.clearMessageQueue?.();
    }
  };
}