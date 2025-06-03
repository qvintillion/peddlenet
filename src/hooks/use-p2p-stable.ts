'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Message, ConnectionStatus } from '@/lib/types';
import { generateCompatibleUUID } from '@/utils/peer-utils';

declare global {
  interface Window {
    Peer: any;
  }
}

type DataConnection = any;

export function useP2PStable(roomId: string, displayName?: string) {
  const [peerId, setPeerId] = useState<string | null>(null);
  const [connections, setConnections] = useState<Map<string, DataConnection>>(new Map());
  const [status, setStatus] = useState<ConnectionStatus>({
    isConnected: false,
    connectedPeers: 0,
    networkReach: 'isolated',
    signalStrength: 'none',
  });
  
  const effectiveDisplayName = displayName || 'Anonymous';
  
  // Stable refs - won't cause re-renders
  const peerRef = useRef<any | null>(null);
  const connectionsRef = useRef<Map<string, DataConnection>>(new Map());
  const messageHandlersRef = useRef<Set<(message: Message) => void>>(new Set());
  const isInitializedRef = useRef<boolean>(false);

  // Simple ICE configuration - fewer servers, more reliable
  const getICEConfig = () => ({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  });

  const updateStatus = useCallback(() => {
    const activeConnections = Array.from(connectionsRef.current.values())
      .filter(conn => conn.open).length;
    
    setStatus({
      isConnected: activeConnections > 0 && !!peerId,
      connectedPeers: activeConnections,
      networkReach: activeConnections > 0 ? 'local' : 'isolated',
      signalStrength: activeConnections > 0 ? 'medium' : 'none',
    });
  }, [peerId]);

  const setupConnection = useCallback((conn: DataConnection) => {
    const connId = conn.peer;
    console.log('🔧 Setting up connection to:', connId);

    const handleData = (data: any) => {
      if (data?.type === 'chat' && data?.content) {
        messageHandlersRef.current.forEach(handler => {
          try {
            handler(data as Message);
          } catch (e) {
            console.error('Message handler error:', e);
          }
        });
      }
    };

    const handleOpen = () => {
      console.log('✅ Connection opened:', connId);
      setConnections(prev => {
        const newMap = new Map(prev);
        newMap.set(connId, conn);
        connectionsRef.current = newMap;
        return newMap;
      });
      updateStatus();
    };

    const handleClose = () => {
      console.log('❌ Connection closed:', connId);
      setConnections(prev => {
        const newMap = new Map(prev);
        newMap.delete(connId);
        connectionsRef.current = newMap;
        return newMap;
      });
      updateStatus();
    };

    const handleError = (error: any) => {
      console.error('⚠️ Connection error:', connId, error.type || error);
      handleClose();
    };

    // Clean up existing listeners
    conn.removeAllListeners?.('data');
    conn.removeAllListeners?.('open');
    conn.removeAllListeners?.('close');
    conn.removeAllListeners?.('error');

    // Add new listeners
    conn.on('data', handleData);
    conn.on('open', handleOpen);
    conn.on('close', handleClose);
    conn.on('error', handleError);

    // If already open, trigger handler
    if (conn.open) {
      handleOpen();
    }
  }, [updateStatus]);

  const connectToPeer = useCallback(async (targetPeerId: string): Promise<boolean> => {
    if (!peerRef.current || !targetPeerId || targetPeerId === peerId) {
      console.log('❌ Cannot connect - invalid peer or self-connection');
      return false;
    }

    if (connectionsRef.current.has(targetPeerId)) {
      console.log('❌ Already connected to:', targetPeerId);
      return true;
    }

    console.log('🚀 Attempting connection to:', targetPeerId);

    try {
      const conn = peerRef.current.connect(targetPeerId, {
        reliable: true,
        serialization: 'json',
        metadata: { roomId, displayName: effectiveDisplayName }
      });

      return new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => {
          console.log('⏰ Connection timeout:', targetPeerId);
          try { conn.close(); } catch (e) { /* ignore */ }
          resolve(false);
        }, 15000); // Longer timeout for mobile

        conn.on('open', () => {
          clearTimeout(timeout);
          console.log('✅ Successfully connected to:', targetPeerId);
          setupConnection(conn);
          resolve(true);
        });

        conn.on('error', (error: any) => {
          clearTimeout(timeout);
          console.error('❌ Connection failed:', targetPeerId, error.type || error);
          resolve(false);
        });
      });
    } catch (error) {
      console.error('💥 Connection exception:', error);
      return false;
    }
  }, [peerId, roomId, effectiveDisplayName, setupConnection]);

  const sendMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>): string => {
    const fullMessage: Message = {
      ...message,
      id: generateCompatibleUUID(),
      timestamp: Date.now(),
      synced: false,
    };

    const activeConnections = Array.from(connectionsRef.current.values())
      .filter(conn => conn.open);

    if (activeConnections.length === 0) {
      console.log('📦 No connections to send message');
      return fullMessage.id;
    }
    
    let sentCount = 0;
    activeConnections.forEach(conn => {
      try {
        conn.send(fullMessage);
        sentCount++;
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    });

    console.log(`📊 Message sent to ${sentCount}/${activeConnections.length} peers`);
    return fullMessage.id;
  }, []);

  const onMessage = useCallback((handler: (message: Message) => void) => {
    messageHandlersRef.current.add(handler);
    return () => {
      messageHandlersRef.current.delete(handler);
    };
  }, []);

  // Simplified initialization - only run once
  useEffect(() => {
    if (!roomId || isInitializedRef.current) return;
    if (typeof window === 'undefined') return;

    console.log('🚀 Initializing P2P for room:', roomId);
    isInitializedRef.current = true;

    // Wait for PeerJS to load
    const waitForPeerJS = async () => {
      let attempts = 0;
      while (!window.Peer && attempts < 30) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      
      if (!window.Peer) {
        console.error('❌ PeerJS not loaded');
        return;
      }

      try {
        console.log('🔧 Creating PeerJS instance...');
        const peer = new window.Peer(undefined, {
          debug: 0,
          config: getICEConfig()
        });

        const initTimeout = setTimeout(() => {
          console.error('❌ PeerJS initialization timeout');
          try { peer.destroy(); } catch (e) { /* ignore */ }
        }, 10000);

        peer.on('open', (id: string) => {
          clearTimeout(initTimeout);
          console.log('✅ P2P ready with peer ID:', id);
          setPeerId(id);
          peerRef.current = peer;
        });

        peer.on('connection', (conn: DataConnection) => {
          console.log('📞 Incoming connection from:', conn.peer);
          setupConnection(conn);
        });

        peer.on('error', (error: any) => {
          clearTimeout(initTimeout);
          console.error('❌ PeerJS error:', error.type || error);
          
          // Don't retry on certain errors
          if (error.type === 'browser-incompatible' || error.type === 'ssl-unavailable') {
            console.error('❌ Fatal PeerJS error - not retrying');
            return;
          }
        });

        peer.on('disconnected', () => {
          console.warn('⚠️ PeerJS disconnected');
        });

        peer.on('close', () => {
          console.log('🔒 PeerJS closed');
          setPeerId(null);
          setConnections(new Map());
          connectionsRef.current = new Map();
          updateStatus();
        });

      } catch (error) {
        console.error('💥 PeerJS initialization error:', error);
      }
    };

    waitForPeerJS();

    // Cleanup
    return () => {
      if (peerRef.current && !peerRef.current.destroyed) {
        try {
          console.log('🧹 Cleaning up PeerJS');
          peerRef.current.destroy();
        } catch (e) {
          console.error('Cleanup error:', e);
        }
      }
    };
  }, [roomId, setupConnection, updateStatus]);

  // Update status when connections change
  useEffect(() => {
    updateStatus();
  }, [connections, updateStatus]);

  return {
    peerId,
    status,
    connectToPeer,
    sendMessage,
    onMessage,
    getConnectedPeers: () => Array.from(connectionsRef.current.keys()),
    forceReconnect: () => {
      console.log('🔄 Manual reconnect triggered');
      // Could implement peer discovery here if needed
    },
  };
}
