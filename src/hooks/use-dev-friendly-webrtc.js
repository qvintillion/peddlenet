// src/hooks/use-dev-friendly-webrtc.js
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Message, ConnectionStatus } from '../lib/types';
import { generateCompatibleUUID } from '../utils/peer-utils';

// Development environment detection
const isDevelopment = () => {
  if (typeof window === 'undefined') return false;
  return window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1' ||
         window.location.hostname.includes('192.168.');
};

// Mock P2P for development
const createMockP2P = (roomId: string, displayName: string) => {
  console.log('🏠 [DEV P2P] Creating mock P2P for development environment');
  console.log('🏠 [DEV P2P] This simulates P2P connections for local testing');
  
  const mockPeers = new Set<string>();
  const messageHandlers = new Set<(message: Message) => void>();
  let mockStats = {
    totalAttempts: 0,
    successfulConnections: 0,
    failedConnections: 0,
    activeConnections: 0
  };

  // Simulate finding peers after a delay
  setTimeout(() => {
    mockPeers.add('dev-user-alice');
    mockPeers.add('dev-user-bob');
    mockStats.totalAttempts = 2;
    mockStats.successfulConnections = 2;
    mockStats.activeConnections = 2;
    console.log('🏠 [DEV P2P] Mock peers connected:', Array.from(mockPeers));
    console.log('🏠 [DEV P2P] Admin dashboard should now show P2P connections!');
  }, 3000);

  return {
    peerId: `dev-${displayName}-${Date.now()}`,
    status: {
      isConnected: mockPeers.size > 0,
      connectedPeers: mockPeers.size,
      networkReach: 'local' as const,
      signalStrength: mockPeers.size > 0 ? 'strong' as const : 'none' as const,
    },
    roomPeers: Array.from(mockPeers),
    
    connectToPeer: async (targetPeerId: string) => {
      console.log(`🏠 [DEV P2P] Mock connecting to: ${targetPeerId}`);
      mockPeers.add(targetPeerId);
      mockStats.totalAttempts++;
      mockStats.successfulConnections++;
      mockStats.activeConnections = mockPeers.size;
      console.log(`✅ [DEV P2P] Mock connection successful! Total: ${mockStats.activeConnections}`);
      return true;
    },
    
    sendMessage: (message: Omit<Message, 'id' | 'timestamp'>) => {
      const fullMessage: Message = {
        ...message,
        id: generateCompatibleUUID(),
        timestamp: Date.now(),
        synced: false,
      };
      
      console.log(`🏠 [DEV P2P] Mock sending message: ${fullMessage.content}`);
      
      // Echo back the message after a short delay to simulate P2P
      setTimeout(() => {
        const echoMessage: Message = {
          ...fullMessage,
          id: generateCompatibleUUID(),
          sender: `DevBot`,
          content: `🤖 [DEV ECHO] ${fullMessage.content}`,
          timestamp: Date.now(),
        };
        
        messageHandlers.forEach(handler => {
          handler(echoMessage);
        });
      }, 500);
      
      return fullMessage.id;
    },
    
    onMessage: (handler: (message: Message) => void) => {
      messageHandlers.add(handler);
      return () => messageHandlers.delete(handler);
    },
    
    getConnectedPeers: () => Array.from(mockPeers),
    
    forceReconnect: () => {
      console.log('🏠 [DEV P2P] Mock force reconnect');
      return Promise.resolve();
    },
    
    getQueuedMessages: () => 0,
    clearMessageQueue: () => {},
    isSignalingConnected: () => true,
    
    getDebugInfo: () => ({
      connections: new Map(),
      signaling: { connected: true, socketId: 'dev-mock' },
      stats: mockStats
    })
  };
};

// Enhanced development-friendly WebRTC hook
export function useDevFriendlyWebRTC(roomId: string, displayName?: string, disabled: boolean = false) {
  const [isDevMode] = useState(isDevelopment);
  const effectiveDisplayName = displayName || 'DevUser';
  
  // Development mode: Use mock P2P
  const mockP2PRef = useRef<ReturnType<typeof createMockP2P> | null>(null);
  
  // Production mode: Import and use native WebRTC
  const [nativeWebRTC, setNativeWebRTC] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(!isDevMode);
  
  useEffect(() => {
    if (isDevMode) {
      console.log('🏠 [DEV-FRIENDLY] Development mode detected - using mock P2P');
      console.log('🏠 [DEV-FRIENDLY] Mock P2P will simulate connections for admin dashboard testing');
      if (!mockP2PRef.current && !disabled) {
        mockP2PRef.current = createMockP2P(roomId, effectiveDisplayName);
      }
    } else {
      console.log('🌐 [DEV-FRIENDLY] Production mode detected - loading native WebRTC');
      setIsLoading(true);
      
      // Dynamically import the native WebRTC hook for production
      import('./use-native-webrtc').then(module => {
        console.log('✅ [DEV-FRIENDLY] Native WebRTC loaded for production');
        setNativeWebRTC(() => module.useNativeWebRTC);
        setIsLoading(false);
      }).catch(error => {
        console.error('❌ [DEV-FRIENDLY] Failed to load native WebRTC:', error);
        setIsLoading(false);
      });
    }
  }, [isDevMode, roomId, effectiveDisplayName, disabled]);
  
  // Use production WebRTC hook when available
  const productionWebRTC = nativeWebRTC ? nativeWebRTC(roomId, displayName, disabled) : null;
  
  // Return appropriate implementation
  if (isDevMode) {
    const mock = mockP2PRef.current;
    if (!mock || disabled) {
      // Return fallback while mock is initializing or when disabled
      return {
        peerId: null,
        status: {
          isConnected: false,
          connectedPeers: 0,
          networkReach: 'isolated' as const,
          signalStrength: 'none' as const,
        },
        roomPeers: [],
        connectToPeer: async () => false,
        sendMessage: () => null,
        onMessage: () => () => {},
        getConnectedPeers: () => [],
        forceReconnect: () => Promise.resolve(),
        getQueuedMessages: () => 0,
        clearMessageQueue: () => {},
        isSignalingConnected: () => false,
        getDebugInfo: () => ({
          connections: new Map(),
          signaling: { connected: false, socketId: null },
          stats: { totalAttempts: 0, successfulConnections: 0, failedConnections: 0, activeConnections: 0 }
        })
      };
    }
    
    return mock;
  }
  
  // Production mode - return native WebRTC or loading state
  if (isLoading || !productionWebRTC) {
    return {
      peerId: null,
      status: {
        isConnected: false,
        connectedPeers: 0,
        networkReach: 'isolated' as const,
        signalStrength: 'none' as const,
      },
      roomPeers: [],
      connectToPeer: async () => false,
      sendMessage: () => null,
      onMessage: () => () => {},
      getConnectedPeers: () => [],
      forceReconnect: () => Promise.resolve(),
      getQueuedMessages: () => 0,
      clearMessageQueue: () => {},
      isSignalingConnected: () => false,
      getDebugInfo: () => ({
        connections: new Map(),
        signaling: { connected: false, socketId: null },
        stats: { totalAttempts: 0, successfulConnections: 0, failedConnections: 0, activeConnections: 0 }
      })
    };
  }
  
  return productionWebRTC;
}