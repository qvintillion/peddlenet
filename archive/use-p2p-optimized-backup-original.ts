'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Message, ConnectionStatus } from '@/lib/types';
import { APP_CONFIG } from '@/lib/constants';
import { useSignalingClient } from './use-signaling-client';

// 🚨 EMERGENCY CLEANUP VERSION - Fixes infinite loops and stale data
declare global {
  interface Window {
    Peer: any;
  }
}

type DataConnection = any;

interface PeerData {
  peerId: string;
  roomId: string;
  timestamp: number;
  version: number;
  capabilities: string[];
  lastSeen: number;
  connectionQuality: number;
}

interface QueuedMessage extends Message {
  retryCount?: number;
  queuedAt: number;
}

export function useP2POptimized(roomId: string, displayName?: string) {
  const [peer, setPeer] = useState<any | null>(null);
  const [peerId, setPeerId] = useState<string | null>(null);
  const [connections, setConnections] = useState<Map<string, DataConnection>>(new Map());
  const [status, setStatus] = useState<ConnectionStatus>({
    isConnected: false,
    connectedPeers: 0,
    networkReach: 'isolated',
    signalStrength: 'none',
  });
  const [isInitialized, setIsInitialized] = useState(false);
  
  const effectiveDisplayName = displayName || 
    (typeof window !== 'undefined' ? localStorage.getItem('displayName') || 'Anonymous' : 'Anonymous');
  
  const signaling = useSignalingClient(roomId, peerId, effectiveDisplayName);
  
  // Refs for stable references
  const connectionsRef = useRef<Map<string, DataConnection>>(new Map());
  const messageHandlersRef = useRef<Set<(message: Message) => void>>(new Set());
  const peerRef = useRef<any | null>(null);
  const roomIdRef = useRef<string>(roomId);
  const messageQueueRef = useRef<QueuedMessage[]>([]);
  const connectionAttempts = useRef<Map<string, number>>(new Map());
  const pendingConnections = useRef<Set<string>>(new Set());
  const connectionTimestamps = useRef<Map<string, number>>(new Map());
  const initializingRef = useRef<boolean>(false);
  const cleanupExecutedRef = useRef<boolean>(false);

  // 🚨 EMERGENCY: Clean up stale localStorage data immediately
  useEffect(() => {
    if (cleanupExecutedRef.current) return;
    cleanupExecutedRef.current = true;

    console.log('🚨 EMERGENCY: Cleaning up stale localStorage data');
    
    if (typeof window !== 'undefined') {
      const now = Date.now();
      const fiveMinutesAgo = now - 5 * 60 * 1000;
      let totalCleaned = 0;
      
      // Clean ALL presence data older than 5 minutes
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key?.startsWith('presence_v2_')) {
          try {
            const data = JSON.parse(localStorage.getItem(key) || '{}');
            if (data.timestamp < fiveMinutesAgo) {
              localStorage.removeItem(key);
              totalCleaned++;
            }
          } catch (e) {
            localStorage.removeItem(key);
            totalCleaned++;
          }
        }
      }
      
      console.log(`🧹 Emergency cleanup: removed ${totalCleaned} stale entries`);
    }
  }, []); // Run once only

  useEffect(() => {
    connectionsRef.current = connections;
    roomIdRef.current = roomId;
  }, [connections, roomId]);

  useEffect(() => {
    peerRef.current = peer;
  }, [peer]);

  const calculateAverageConnectionQuality = (): number => {
    if (connectionsRef.current.size === 0) return 0;
    
    let totalQuality = 0;
    connectionsRef.current.forEach((conn) => {
      totalQuality += (conn._connectionQuality || 50);
    });
    
    return totalQuality / connectionsRef.current.size;
  };

  const getSignalStrength = (quality: number, peerCount: number): 'none' | 'weak' | 'medium' | 'strong' => {
    if (peerCount === 0) return 'none';
    if (quality < 30 || peerCount === 1) return 'weak';
    if (quality < 70 || peerCount < 3) return 'medium';
    return 'strong';
  };

  const updateStatus = useCallback(() => {
    const activeConnections = Array.from(connectionsRef.current.values())
      .filter(conn => conn.open && !conn._isSettingUp).length;
    const avgQuality = calculateAverageConnectionQuality();
    
    setStatus({
      isConnected: activeConnections > 0 && !!peerId,
      connectedPeers: activeConnections,
      networkReach: activeConnections > 0 ? 'local' : 'isolated',
      signalStrength: getSignalStrength(avgQuality, activeConnections),
    });
  }, [peerId]);

  const broadcastPresence = useCallback((myPeerId: string) => {
    if (typeof window === 'undefined') return;
    
    const presenceData: PeerData = {
      peerId: myPeerId,
      roomId: roomIdRef.current,
      timestamp: Date.now(),
      version: Date.now(),
      capabilities: ['webrtc', 'text', 'heartbeat'],
      lastSeen: Date.now(),
      connectionQuality: calculateAverageConnectionQuality()
    };
    
    const presenceKey = `presence_v2_${roomIdRef.current}_${myPeerId}`;
    localStorage.setItem(presenceKey, JSON.stringify(presenceData));
  }, []);

  // 🚨 FIXED: Conservative peer discovery with strict filtering
  const discoverPeers = useCallback((): Array<{peerId: string, quality: number, lastSeen: number}> => {
    if (typeof window === 'undefined') return [];
    
    const peers: Array<{peerId: string, quality: number, lastSeen: number}> = [];
    const oneMinuteAgo = Date.now() - 60 * 1000; // Only very recent peers (1 minute)
    
    // Signaling server peers (highest priority)
    const signalingPeerIds = signaling.getAllDiscoveredPeers();
    signalingPeerIds.forEach(signalingPeerId => {
      if (signalingPeerId !== peerId) {
        peers.push({
          peerId: signalingPeerId,
          quality: 95,
          lastSeen: Date.now()
        });
      }
    });
    
    // Local storage peers - STRICT filtering
    const roomPrefix = `presence_v2_${roomIdRef.current}_`;
    for (let i = 0; i < localStorage.length && peers.length < 5; i++) { // Max 5 peers
      const key = localStorage.key(i);
      if (key?.startsWith(roomPrefix) && !key.endsWith(`_${peerId}`)) {
        try {
          const data: PeerData = JSON.parse(localStorage.getItem(key) || '{}');
          if (data.peerId && 
              data.timestamp > oneMinuteAgo && 
              data.peerId !== peerId &&
              data.peerId.length > 5) { // Basic validation
            const exists = peers.some(p => p.peerId === data.peerId);
            if (!exists) {
              peers.push({
                peerId: data.peerId,
                quality: data.connectionQuality || 75,
                lastSeen: data.lastSeen || data.timestamp
              });
            }
          }
        } catch (e) {
          localStorage.removeItem(key);
        }
      }
    }
    
    const sortedPeers = peers.sort((a, b) => b.quality - a.quality);
    
    if (sortedPeers.length > 0) {
      console.log(`🔍 Conservative discovery: Found ${sortedPeers.length} recent peers`);
    }
    
    return sortedPeers.slice(0, 3); // Max 3 peers to prevent overwhelm
  }, [peerId, signaling]);

  const setupConnection = useCallback((conn: DataConnection, isIncoming = false) => {
    const connId = conn.peer;
    
    const existingConn = connectionsRef.current.get(connId);
    const isPending = pendingConnections.current.has(connId);
    
    if (existingConn || isPending) {
      console.log(`🚫 Rejecting duplicate connection from ${connId}`);
      try {
        conn.close();
      } catch (e) {
        // Ignore close errors
      }
      return;
    }
    
    pendingConnections.current.add(connId);
    connectionTimestamps.current.set(connId, Date.now());
    
    console.log(`🔗 Setting up connection with:`, conn.peer);

    conn._isSettingUp = true;
    conn._connectionQuality = 80;

    const handleData = (data: any) => {
      try {
        if (data?.type && data?.content && typeof data.content === 'string') {
          const message = data as Message;
          messageHandlersRef.current.forEach(handler => {
            try {
              handler(message);
            } catch (e) {
              console.error('Error in message handler:', e);
            }
          });
        }
      } catch (e) {
        console.error('Error handling data from', conn.peer, ':', e);
      }
    };

    const handleOpen = () => {
      console.log('✅ Connection opened:', conn.peer);
      conn._isSettingUp = false;
      
      pendingConnections.current.delete(connId);
      
      setConnections(prev => {
        const newConnections = new Map(prev);
        newConnections.set(conn.peer, conn);
        return newConnections;
      });
      
      // Process any queued messages immediately
      const toSend = [...messageQueueRef.current];
      messageQueueRef.current = [];
      
      toSend.forEach(queuedMessage => {
        try {
          const { queuedAt, retryCount, ...message } = queuedMessage;
          conn.send(message);
          console.log('📤 Queued message sent to', conn.peer);
        } catch (e) {
          console.error('Failed to send queued message:', e);
        }
      });
      
      connectionAttempts.current.delete(conn.peer);
      updateStatus();
    };

    const handleClose = () => {
      console.log('❌ Connection closed:', conn.peer);
      conn._isSettingUp = false;
      
      pendingConnections.current.delete(connId);
      connectionTimestamps.current.delete(connId);
      
      setConnections(prev => {
        const newConnections = new Map(prev);
        newConnections.delete(conn.peer);
        return newConnections;
      });
      
      updateStatus();
    };

    const handleError = (error: any) => {
      console.error('⚠️ Connection error:', conn.peer, error.type || error);
      pendingConnections.current.delete(connId);
      connectionTimestamps.current.delete(connId);
      handleClose();
    };

    conn.removeAllListeners?.('data');
    conn.removeAllListeners?.('open');
    conn.removeAllListeners?.('close');
    conn.removeAllListeners?.('error');

    conn.on('data', handleData);
    conn.on('open', handleOpen);
    conn.on('close', handleClose);
    conn.on('error', handleError);

    if (conn.open) {
      handleOpen();
    }
  }, [updateStatus]);

  const connectToPeer = useCallback(async (targetPeerId: string): Promise<boolean> => {
    if (!peerRef.current || !targetPeerId || targetPeerId === peerId) {
      return false;
    }

    const existingConn = connectionsRef.current.get(targetPeerId);
    const isPending = pendingConnections.current.has(targetPeerId);
    
    if (existingConn?.open || isPending) {
      return false;
    }

    const attempts = connectionAttempts.current.get(targetPeerId) || 0;
    if (attempts >= 1) { // Only 1 attempt per peer
      return false;
    }
    
    connectionAttempts.current.set(targetPeerId, attempts + 1);

    try {
      console.log(`🚀 Connecting to: ${targetPeerId}`);
      
      const connectionConfig = {
        reliable: true,
        serialization: 'json',
        metadata: { 
          roomId: roomIdRef.current,
          version: '3.1.0-emergency',
          capabilities: ['text'],
          timestamp: Date.now()
        }
      };
      
      const conn = peerRef.current.connect(targetPeerId, connectionConfig);
      
      return new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => {
          console.log(`⏰ Connection timeout: ${targetPeerId}`);
          pendingConnections.current.delete(targetPeerId);
          try {
            conn.close();
          } catch (e) {
            // Ignore close errors
          }
          resolve(false);
        }, 8000); // 8 second timeout

        conn.on('open', () => {
          clearTimeout(timeout);
          console.log('✅ Successfully connected to:', targetPeerId);
          setupConnection(conn, false);
          resolve(true);
        });

        conn.on('error', (error: any) => {
          clearTimeout(timeout);
          console.error(`❌ Connection error to ${targetPeerId}:`, error.type || error);
          pendingConnections.current.delete(targetPeerId);
          resolve(false);
        });
      });
    } catch (error) {
      console.error('💥 Exception connecting to peer:', targetPeerId, error);
      pendingConnections.current.delete(targetPeerId);
      return false;
    }
  }, [peerId, setupConnection]);

  // 🚨 FIXED: Conservative auto-connect
  const autoConnectToRoomPeers = useCallback(async () => {
    if (!peerId) return;

    const discoveredPeers = discoverPeers();
    
    const availablePeers = discoveredPeers.filter(peer => {
      const isConnected = connectionsRef.current.has(peer.peerId);
      const isPending = pendingConnections.current.has(peer.peerId);
      const isOwnPeer = peer.peerId === peerId;
      return !isConnected && !isPending && !isOwnPeer;
    }).slice(0, 2); // Max 2 connections
    
    if (availablePeers.length === 0) return;

    console.log(`🎯 Connecting to ${availablePeers.length} peers`);
    
    // Connect to peers one by one with delay
    for (const targetPeer of availablePeers) {
      await connectToPeer(targetPeer.peerId);
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
    }
  }, [peerId, discoverPeers, connectToPeer]);

  const sendMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>): string => {
    const fullMessage: Message = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      synced: false,
    };

    const totalConnections = connectionsRef.current.size;
    let sentCount = 0;

    if (totalConnections === 0) {
      messageQueueRef.current.push({
        ...fullMessage,
        queuedAt: Date.now(),
        retryCount: 0
      });
      console.log('📦 Message queued - no connections');
      return fullMessage.id;
    }
    
    connectionsRef.current.forEach((conn, peerId) => {
      if (conn.open && !conn._isSettingUp) {
        try {
          conn.send(fullMessage);
          sentCount++;
        } catch (error) {
          console.error('❌ Failed to send to', peerId, ':', error);
        }
      }
    });

    console.log(`📊 Message sent to ${sentCount}/${totalConnections} peers`);
    return fullMessage.id;
  }, []);

  const onMessage = useCallback((handler: (message: Message) => void) => {
    messageHandlersRef.current.add(handler);
    return () => {
      messageHandlersRef.current.delete(handler);
    };
  }, []);

  // 🚨 FIXED: Simple initialization without loops
  useEffect(() => {
    if (!roomId || isInitialized || initializingRef.current) return;
    if (typeof window === 'undefined') return;

    initializingRef.current = true;

    const initializePeer = async (): Promise<void> => {
      try {
        console.log('🚀 Initializing P2P for:', roomId);
        
        // Quick PeerJS check
        let attempts = 0;
        while (!window.Peer && attempts < 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
        
        if (!window.Peer) {
          console.error('❌ PeerJS not loaded');
          setIsInitialized(true);
          initializingRef.current = false;
          return;
        }
        
        // Simple config
        const config = {
          debug: 0,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' }
            ]
          }
        };
        
        const newPeer = new window.Peer(undefined, config);
        setPeer(newPeer); // Set immediately
        
        const timeout = setTimeout(() => {
          console.warn('⏰ PeerJS server timeout - using local mode');
          const localPeerId = 'local-' + crypto.randomUUID().substring(0, 8);
          console.log('🏠 Local mode with ID:', localPeerId);
          setPeerId(localPeerId);
          setIsInitialized(true);
          initializingRef.current = false;
          broadcastPresence(localPeerId);
        }, 5000);

        newPeer.on('open', (id: string) => {
          clearTimeout(timeout);
          console.log('✅ P2P ready:', id);
          setPeerId(id);
          setIsInitialized(true);
          initializingRef.current = false;
          
          broadcastPresence(id);
          
          // Delayed connection attempt
          setTimeout(autoConnectToRoomPeers, 2000);
        });

        newPeer.on('connection', (conn: DataConnection) => {
          console.log('📞 Incoming connection:', conn.peer);
          setupConnection(conn, true);
        });

        newPeer.on('error', (error: any) => {
          clearTimeout(timeout);
          console.warn('⚠️ PeerJS error:', error.type);
          
          // Use local mode on network errors
          const localPeerId = 'local-' + crypto.randomUUID().substring(0, 8);
          console.log('🏠 Local mode with ID:', localPeerId);
          setPeerId(localPeerId);
          setIsInitialized(true);
          initializingRef.current = false;
          broadcastPresence(localPeerId);
        });

        newPeer.on('close', () => {
          console.log('🔒 Peer closed');
          setPeer(null);
          setPeerId(null);
          setConnections(new Map());
          pendingConnections.current.clear();
          connectionTimestamps.current.clear();
          updateStatus();
          initializingRef.current = false;
        });

      } catch (error) {
        console.error('💥 Init error:', error);
        setIsInitialized(true);
        initializingRef.current = false;
      }
    };

    initializePeer();

    return () => {
      if (peerRef.current && !peerRef.current.destroyed) {
        try {
          peerRef.current.destroy();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
      initializingRef.current = false;
    };
  }, [roomId, isInitialized]); // Removed other dependencies to prevent loops

  // Simple presence broadcasting
  useEffect(() => {
    if (!peerId) return;
    
    const presenceInterval = setInterval(() => {
      broadcastPresence(peerId);
    }, 30000); // 30 seconds
    
    return () => {
      clearInterval(presenceInterval);
    };
  }, [peerId, broadcastPresence]);

  return {
    peerId,
    status,
    roomPeers: discoverPeers().map(p => p.peerId),
    connectToPeer,
    sendMessage,
    onMessage,
    getConnectedPeers: () => Array.from(connectionsRef.current.keys()).filter(peerId => {
      const conn = connectionsRef.current.get(peerId);
      return conn && conn.open && !conn._isSettingUp;
    }),
    forceReconnect: () => {
      autoConnectToRoomPeers();
    },
    
    // Emergency utilities
    emergencyCleanup: () => {
      if (typeof window !== 'undefined') {
        let cleared = 0;
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key?.startsWith('presence_v2_')) {
            localStorage.removeItem(key);
            cleared++;
          }
        }
        connectionAttempts.current.clear();
        pendingConnections.current.clear();
        console.log(`🚨 Emergency cleanup: ${cleared} entries removed`);
        updateStatus();
      }
    },
    
    getQueuedMessages: () => messageQueueRef.current.length,
    clearMessageQueue: () => { messageQueueRef.current = []; },
    getConnectionQuality: calculateAverageConnectionQuality,
    getPendingConnections: () => Array.from(pendingConnections.current)
  };
}