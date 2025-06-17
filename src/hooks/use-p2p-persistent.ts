'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Message, ConnectionStatus } from '../lib/types';
import { generateCompatibleUUID } from '../utils/peer-utils';
import { 
  connectionRetry, 
  ConnectionHealthMonitor, 
  SessionPersistence,
  type RetryConfig,
  type ConnectionMetrics
} from '../utils/connection-resilience';

declare global {
  interface Window {
    Peer: any;
    globalPeer?: any; // Store peer globally to survive React cleanup
  }
}

type DataConnection = any;

export function useP2PPersistent(roomId: string, displayName?: string) {
  const [peerId, setPeerId] = useState<string | null>(null);
  const [connections, setConnections] = useState<Map<string, DataConnection>>(new Map());
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [status, setStatus] = useState<ConnectionStatus>({
    isConnected: false,
    connectedPeers: 0,
    networkReach: 'isolated',
    signalStrength: 'none',
  });
  
  const effectiveDisplayName = displayName || 'Anonymous';
  const healthMonitor = ConnectionHealthMonitor.getInstance();
  
  // Use refs to prevent recreations
  const connectionsRef = useRef<Map<string, DataConnection>>(new Map());
  const messageHandlersRef = useRef<Set<(message: Message) => void>>(new Set());
  const isInitializedRef = useRef<boolean>(false);

  const updateStatus = useCallback(() => {
    const activeConnections = Array.from(connectionsRef.current.values())
      .filter(conn => conn.open).length;
    
    // Use the global peer ID directly to avoid null issues
    const currentPeerId = window.globalPeer?.id || peerId;
    
    console.log('📏 Status calculation:');
    console.log('  - connectionsRef.current.size:', connectionsRef.current.size);
    console.log('  - activeConnections (filtered):', activeConnections);
    console.log('  - peerId from state:', peerId);
    console.log('  - peerId from global:', window.globalPeer?.id);
    console.log('  - currentPeerId used:', currentPeerId);
    
    const newStatus = {
      isConnected: activeConnections > 0 && !!currentPeerId,
      connectedPeers: activeConnections,
      networkReach: activeConnections > 0 ? 'local' : 'isolated',
      signalStrength: activeConnections > 0 ? 'medium' : 'none',
    };
    
    console.log('  - newStatus:', newStatus);
    setStatus(newStatus);
  }, []); // Remove peerId dependency to prevent stale closures

  const setupConnection = useCallback((conn: DataConnection) => {
    const connId = conn.peer;
    console.log('🔧 Setting up connection to:', connId);
    console.log('🔍 Connection state:', conn.open ? 'OPEN' : 'CONNECTING');

    const handleData = (data: any) => {
      console.log('📨 Received data from', connId, ':', data);
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
      console.log('🎯 Connection is now ready for messaging');
      setConnections(prev => {
        const newMap = new Map(prev);
        newMap.set(connId, conn);
        connectionsRef.current = newMap; // Update ref immediately
        console.log('📊 Updated connections. Count:', newMap.size);
        console.log('📊 Ref updated. Ref count:', connectionsRef.current.size);
        return newMap;
      });
      // Force status update
      setTimeout(() => updateStatus(), 100);
    };

    const handleClose = () => {
      console.log('❌ Connection closed:', connId);
      setConnections(prev => {
        const newMap = new Map(prev);
        newMap.delete(connId);
        connectionsRef.current = newMap;
        console.log('📊 Updated connections. Count:', newMap.size);
        return newMap;
      });
      // Force status update
      setTimeout(() => updateStatus(), 100);
    };

    const handleError = (error: any) => {
      console.error('⚠️ Connection error:', connId, error.type || error);
      console.error('🔍 Full error object:', error);
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

    // Set up a timeout for stuck connections
    const connectionTimeout = setTimeout(() => {
      if (!conn.open) {
        console.warn('⏰ Connection stuck for 10 seconds, closing:', connId);
        try { conn.close(); } catch (e) { /* ignore */ }
      }
    }, 10000);

    // Clear timeout when connection opens
    const originalHandleOpen = handleOpen;
    const timeoutAwareHandleOpen = () => {
      clearTimeout(connectionTimeout);
      originalHandleOpen();
    };
    
    conn.off('open', handleOpen);
    conn.on('open', timeoutAwareHandleOpen);

    if (conn.open) {
      clearTimeout(connectionTimeout);
      timeoutAwareHandleOpen();
    }
  }, [updateStatus]);

  const connectToPeer = useCallback(async (targetPeerId: string): Promise<boolean> => {
    const peer = window.globalPeer;
    if (!peer || !targetPeerId || targetPeerId === peerId) {
      console.log('❌ Cannot connect - invalid peer or self-connection');
      return false;
    }

    if (connectionsRef.current.has(targetPeerId)) {
      console.log('❌ Already connected to:', targetPeerId);
      return true;
    }

    console.log('🚀 Attempting connection to:', targetPeerId);
    setIsRetrying(true);

    const connectFn = async (): Promise<boolean> => {
      return new Promise<boolean>((resolve, reject) => {
        try {
          const conn = peer.connect(targetPeerId, {
            reliable: true,
            serialization: 'json',
            metadata: { roomId, displayName: effectiveDisplayName }
          });

          const timeout = setTimeout(() => {
            try { conn.close(); } catch (e) { /* ignore */ }
            reject(new Error('Connection timeout'));
          }, 8000);

          conn.on('open', () => {
            clearTimeout(timeout);
            console.log('✅ Successfully connected to:', targetPeerId);
            setupConnection(conn);
            resolve(true);
          });

          conn.on('error', (error: any) => {
            clearTimeout(timeout);
            reject(new Error(error.type || 'Connection failed'));
          });
        } catch (error) {
          reject(error);
        }
      });
    };

    try {
      const result = await connectionRetry(
        connectFn,
        {
          maxAttempts: 3,
          baseDelay: 1000,
          maxDelay: 5000,
          backoffMultiplier: 2
        },
        (attempt, error) => {
          setRetryCount(attempt);
          console.log(`🔄 Connection attempt ${attempt}${error ? ` failed: ${error.message}` : ''}`);
        }
      );

      // Record metrics
      result.metrics.forEach(metric => {
        healthMonitor.recordConnectionAttempt(metric);
      });

      return result.success;
    } finally {
      setIsRetrying(false);
      setRetryCount(0);
    }
  }, [peerId, roomId, effectiveDisplayName, setupConnection, healthMonitor]);

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

  // Initialize peer ONCE and store globally
  useEffect(() => {
    if (!roomId || isInitializedRef.current) return;
    if (typeof window === 'undefined') return;

    // Check if we already have a global peer
    if (window.globalPeer && !window.globalPeer.destroyed) {
      console.log('🔄 Reusing existing global peer:', window.globalPeer.id);
      setPeerId(window.globalPeer.id);
      return;
    }

    console.log('🚀 Creating persistent P2P for room:', roomId);
    isInitializedRef.current = true;

    const initializePeer = async () => {
      // Wait for PeerJS
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
        console.log('🔧 Creating persistent PeerJS instance...');
        const initStartTime = Date.now();
        
        const peer = new window.Peer(undefined, {
          debug: 2, // Enable debug mode to see ICE candidates
          config: {
            iceServers: [
              // Multiple STUN servers for better mobile compatibility
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
              { urls: 'stun:stun.cloudflare.com:3478' },
              { urls: 'stun:stun.nextcloud.com:443' },
              // Add TURN servers for better NAT traversal
              {
                urls: 'turn:openrelay.metered.ca:80',
                username: 'openrelayproject',
                credential: 'openrelayproject'
              }
            ],
            iceCandidatePoolSize: 10
          }
        });

        // Store globally to survive React cleanup
        window.globalPeer = peer;

        const initTimeout = setTimeout(() => {
          console.error('❌ PeerJS initialization timeout');
        }, 10000);

        peer.on('open', (id: string) => {
          clearTimeout(initTimeout);
          console.log('✅ Persistent P2P ready with peer ID:', id);
          setPeerId(id);
          
          // Save session for reconnection
          SessionPersistence.saveSession(roomId, effectiveDisplayName, id);
          
          // Record successful peer creation
          healthMonitor.recordConnectionAttempt({
            timestamp: Date.now(),
            connectionTime: Date.now() - initStartTime,
            success: true,
            attemptNumber: 1
          });
        });

        peer.on('connection', (conn: DataConnection) => {
          console.log('📞 Incoming connection from:', conn.peer);
          setupConnection(conn);
        });

        peer.on('error', (error: any) => {
          clearTimeout(initTimeout);
          console.error('❌ PeerJS error:', error.type || error);
          
          // Record failed peer creation
          healthMonitor.recordConnectionAttempt({
            timestamp: Date.now(),
            connectionTime: Date.now() - initStartTime,
            success: false,
            errorType: error.type || 'peer_initialization_failed',
            attemptNumber: 1
          });
        });

        peer.on('disconnected', () => {
          console.warn('⚠️ PeerJS disconnected');
        });

        peer.on('close', () => {
          console.log('🔒 PeerJS closed');
          window.globalPeer = undefined;
          setPeerId(null);
          setConnections(new Map());
          connectionsRef.current = new Map();
        });

      } catch (error) {
        console.error('💥 PeerJS initialization error:', error);
      }
    };

    initializePeer();

    // NO CLEANUP - let the peer persist
    return () => {
      console.log('🚫 React wants to cleanup, but keeping peer alive');
    };
  }, [roomId, setupConnection]);

  // Update status when connections change
  useEffect(() => {
    console.log('🔄 Connections changed, updating status. Count:', connections.size);
    updateStatus();
  }, [connections, updateStatus]);

  return {
    peerId,
    status,
    isRetrying,
    retryCount,
    connectToPeer,
    sendMessage,
    onMessage,
    getConnectedPeers: () => Array.from(connectionsRef.current.keys()),
    forceReconnect: async () => {
      console.log('🔄 Manual reconnect triggered');
      
      // Clear current connections
      connectionsRef.current.clear();
      setConnections(new Map());
      
      // Reset health monitor
      healthMonitor.reset();
      
      // Don't try to restore old peer connections - peer IDs change after refresh
      // Instead, this just clears the current state and lets the user generate new QR codes
      console.log('📝 Connection state cleared - generate new QR code to reconnect');
      
      return true;
    },
    clearSession: () => {
      SessionPersistence.clearSession();
      console.log('🗑️ Session cleared manually');
    }
  };
}
