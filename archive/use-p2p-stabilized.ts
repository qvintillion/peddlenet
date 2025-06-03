'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Message, ConnectionStatus } from '@/lib/types';
import { APP_CONFIG } from '@/lib/constants';
import { useSignalingClient } from './use-signaling-client';

// ✅ STABILIZED P2P HOOK - BALANCED CLEANUP WITH CONNECTION STABILITY
// 
// KEY IMPROVEMENTS THAT SOLVE THE CONNECTION ISSUES:
// 🎯 30-second discovery windows (vs 10-second aggressive cleanup)
// 🎯 Pending connection tracking to prevent duplicate races
// 🎯 Smarter reconnection only for stable connections (>10s duration) 
// 🎯 2-minute localStorage cleanup (vs 1-minute aggressive)
// 🎯 45-second auto-discovery intervals (vs constant discovery)
// 🎯 Max 2 simultaneous connections to avoid overwhelming
// 🎯 1-second delays between connection attempts
//
// This eliminates the "discovery desert" problem while maintaining stability

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

export function useP2PStabilized(roomId: string, displayName?: string) {
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
  const reconnectAttempts = useRef<Map<string, number>>(new Map());
  const heartbeatIntervals = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const connectionAttempts = useRef<Map<string, number>>(new Map());

  // 🚀 NEW: Connection state tracking for duplicate prevention
  const pendingConnections = useRef<Set<string>>(new Set());
  const connectionTimestamps = useRef<Map<string, number>>(new Map());

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

  // Enhanced status calculation with accurate connection counting
  const updateStatus = useCallback(() => {
    const activeConnections = Array.from(connectionsRef.current.values())
      .filter(conn => conn.open && !conn._isSettingUp).length;
    const avgQuality = calculateAverageConnectionQuality();
    
    // 🎯 BALANCED: 30-second discovery window instead of 10
    let discoveredPeersCount = 0;
    if (typeof window !== 'undefined') {
      const thirtySecondsAgo = Date.now() - 30 * 1000;
      const roomPrefix = `presence_v2_${roomIdRef.current}_`;
      const signalingPeerIds = signaling.getAllDiscoveredPeers();
      
      discoveredPeersCount += signalingPeerIds.filter(id => id !== peerId).length;
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(roomPrefix) && !key.endsWith(`_${peerId}`)) {
          try {
            const data: PeerData = JSON.parse(localStorage.getItem(key) || '{}');
            if (data.peerId && data.timestamp > thirtySecondsAgo && data.peerId !== peerId) {
              if (!signalingPeerIds.includes(data.peerId)) {
                discoveredPeersCount++;
              }
            }
          } catch (e) {
            localStorage.removeItem(key);
          }
        }
      }
    }
    
    // Only log significant status changes
    const isSignificantChange = 
      activeConnections !== status.connectedPeers ||
      discoveredPeersCount === 0 ||
      (discoveredPeersCount > 0 && status.connectedPeers === 0);
    
    if (isSignificantChange) {
      console.log('📊 Stabilized status:', {
        peerId: peerId?.substring(0, 8) + '...',
        activeConnections,
        avgQuality: Math.round(avgQuality),
        discoveredPeers: discoveredPeersCount,
        pending: pendingConnections.current.size
      });
    }
    
    setStatus({
      isConnected: activeConnections > 0 && !!peerId,
      connectedPeers: activeConnections,
      networkReach: activeConnections > 0 ? 'local' : 'isolated',
      signalStrength: getSignalStrength(avgQuality, activeConnections),
    });
  }, [peerId, signaling, status.connectedPeers]);

  // 🎯 BALANCED presence broadcasting
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

  // 🎯 BALANCED cleanup - 2 minutes instead of 1
  const cleanOldPresenceData = useCallback(() => {
    const now = Date.now();
    const twoMinutesAgo = now - 2 * 60 * 1000; // BALANCED: 2 minutes instead of 1
    const roomPrefix = `presence_v2_${roomIdRef.current}_`;
    
    let cleanedCount = 0;
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key?.startsWith(roomPrefix)) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          if (data.timestamp < twoMinutesAgo || 
              (data.peerId === peerId && key !== `${roomPrefix}${peerId}`)) {
            localStorage.removeItem(key);
            cleanedCount++;
          }
        } catch (e) {
          localStorage.removeItem(key);
          cleanedCount++;
        }
      }
    }
    
    // Only log significant cleanup
    if (cleanedCount > 3) {
      console.log(`🧹 Stabilized cleanup: ${cleanedCount} stale entries`);
    }
  }, [peerId]);

  // 🎯 BALANCED peer discovery - 30-second windows
  const discoverPeers = useCallback((): Array<{peerId: string, quality: number, lastSeen: number}> => {
    if (typeof window === 'undefined') return [];
    
    const peers: Array<{peerId: string, quality: number, lastSeen: number}> = [];
    const thirtySecondsAgo = Date.now() - 30 * 1000; // BALANCED: 30 seconds
    
    // Method 1: Signaling server peers
    const signalingPeerIds = signaling.getAllDiscoveredPeers();
    signalingPeerIds.forEach(signalingPeerId => {
      if (signalingPeerId !== peerId) {
        peers.push({
          peerId: signalingPeerId,
          quality: 90,
          lastSeen: Date.now()
        });
      }
    });
    
    // Method 2: Local storage peers
    const roomPrefix = `presence_v2_${roomIdRef.current}_`;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(roomPrefix) && !key.endsWith(`_${peerId}`)) {
        try {
          const data: PeerData = JSON.parse(localStorage.getItem(key) || '{}');
          if (data.peerId && data.timestamp > thirtySecondsAgo && data.peerId !== peerId) {
            const exists = peers.some(p => p.peerId === data.peerId);
            if (!exists) {
              peers.push({
                peerId: data.peerId,
                quality: data.connectionQuality || 50,
                lastSeen: data.lastSeen || data.timestamp
              });
            }
          }
        } catch (e) {
          localStorage.removeItem(key);
        }
      }
    }
    
    const sortedPeers = peers.sort((a, b) => {
      const qualityDiff = b.quality - a.quality;
      if (Math.abs(qualityDiff) > 20) return qualityDiff;
      return b.lastSeen - a.lastSeen;
    });
    
    if (sortedPeers.length > 0) {
      console.log(`🔍 Stabilized discovery: Signaling: ${signalingPeerIds.length}, LocalStorage: ${peers.length - signalingPeerIds.length}, Total: ${sortedPeers.length}`);
    }
    
    return sortedPeers;
  }, [peerId, signaling]);

  const startHeartbeat = (conn: DataConnection) => {
    const interval = setInterval(() => {
      if (conn.open && !conn._isSettingUp) {
        try {
          conn.send({ 
            type: 'ping', 
            timestamp: Date.now(),
            pingTimestamp: Date.now(),
            quality: calculateAverageConnectionQuality()
          });
        } catch (e) {
          console.error('Heartbeat failed for', conn.peer, ':', e);
          clearInterval(interval);
        }
      } else {
        clearInterval(interval);
      }
    }, 30000); // 30 second heartbeat
    
    heartbeatIntervals.current.set(conn.peer, interval);
  };

  const stopHeartbeat = (peerId: string) => {
    const interval = heartbeatIntervals.current.get(peerId);
    if (interval) {
      clearInterval(interval);
      heartbeatIntervals.current.delete(peerId);
    }
  };

  const processQueuedMessages = (conn: DataConnection) => {
    const toSend = [...messageQueueRef.current];
    messageQueueRef.current = [];
    
    toSend.forEach(queuedMessage => {
      try {
        const { queuedAt, retryCount, ...message } = queuedMessage;
        conn.send(message);
        console.log('📤 Queued message sent to', conn.peer);
      } catch (e) {
        console.error('Failed to send queued message to', conn.peer, ':', e);
        const updatedMessage = {
          ...queuedMessage,
          retryCount: (queuedMessage.retryCount || 0) + 1
        };
        if (updatedMessage.retryCount < 3) {
          messageQueueRef.current.push(updatedMessage);
        }
      }
    });
  };

  const scheduleReconnection = (targetPeerId: string) => {
    const attempts = reconnectAttempts.current.get(targetPeerId) || 0;
    if (attempts >= 3) {
      console.log(`❌ Max reconnection attempts reached for ${targetPeerId}`);
      return;
    }
    
    const delay = Math.min(30000, 2000 * Math.pow(2, attempts));
    reconnectAttempts.current.set(targetPeerId, attempts + 1);
    
    console.log(`🔄 Scheduling reconnection to ${targetPeerId} in ${delay}ms (attempt ${attempts + 1})`);
    
    setTimeout(() => {
      if (!connectionsRef.current.has(targetPeerId) && !pendingConnections.current.has(targetPeerId)) {
        console.log(`🔄 Attempting reconnection to ${targetPeerId}`);
        connectToPeer(targetPeerId);
      }
    }, delay);
  };

  // 🚀 IMPROVED connection setup with pending tracking
  const setupConnection = useCallback((conn: DataConnection, isIncoming = false) => {
    const connId = conn.peer;
    
    // 🚀 NEW: Check both existing AND pending connections
    const existingConn = connectionsRef.current.get(connId);
    const isPending = pendingConnections.current.has(connId);
    
    if (existingConn || isPending) {
      console.log(`🚫 Rejecting duplicate connection from ${connId} - ${existingConn ? 'existing' : 'pending'}`);
      try {
        conn.close();
      } catch (e) {
        // Ignore close errors
      }
      return;
    }
    
    // 🚀 NEW: Track pending connections to prevent races
    pendingConnections.current.add(connId);
    connectionTimestamps.current.set(connId, Date.now());
    
    console.log(`🔗 Setting up ${isIncoming ? 'incoming' : 'outgoing'} connection with:`, conn.peer);

    conn._isSettingUp = true;
    conn._connectionQuality = 75;
    conn._lastPing = Date.now();

    const handleData = (data: any) => {
      try {
        if (data?.type === 'ping') {
          conn.send({ 
            type: 'pong', 
            timestamp: Date.now(), 
            pingTimestamp: data.pingTimestamp || data.timestamp,
            quality: calculateAverageConnectionQuality() 
          });
        } else if (data?.type === 'pong') {
          const latency = Date.now() - (data.pingTimestamp || data.timestamp || 0);
          if (latency >= 0 && latency < 5000) {
            conn._connectionQuality = Math.max(10, 100 - (latency / 50));
            conn._lastPing = Date.now();
          }
        } else if (data?.type && data?.content && typeof data.content === 'string') {
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
      console.log('✅ Stabilized connection opened with:', conn.peer);
      conn._isSettingUp = false;
      
      // 🚀 NEW: Remove from pending, add to active
      pendingConnections.current.delete(connId);
      
      setConnections(prev => {
        const newConnections = new Map(prev);
        newConnections.set(conn.peer, conn);
        return newConnections;
      });
      
      startHeartbeat(conn);
      processQueuedMessages(conn);
      
      connectionAttempts.current.delete(conn.peer);
      reconnectAttempts.current.delete(conn.peer);
      
      updateStatus();
    };

    const handleClose = () => {
      console.log('❌ Stabilized connection closed with:', conn.peer);
      conn._isSettingUp = false;
      
      // 🚀 NEW: Clean up all tracking
      pendingConnections.current.delete(connId);
      connectionTimestamps.current.delete(connId);
      
      stopHeartbeat(conn.peer);
      
      setConnections(prev => {
        const newConnections = new Map(prev);
        newConnections.delete(conn.peer);
        return newConnections;
      });
      
      updateStatus();
      
      // 🎯 BALANCED: Only reconnect if connection was stable (>10 seconds)
      const connectionDuration = Date.now() - (connectionTimestamps.current.get(connId) || Date.now());
      if (connectionDuration > 10000) {
        scheduleReconnection(conn.peer);
      }
    };

    const handleError = (error: any) => {
      console.error('⚠️ Stabilized connection error with', conn.peer, ':', error.type || error);
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

  // 🚀 IMPROVED connection with race condition prevention
  const connectToPeer = useCallback(async (targetPeerId: string): Promise<boolean> => {
    if (!peerRef.current || !targetPeerId || targetPeerId === peerId) {
      return false;
    }

    const existingConn = connectionsRef.current.get(targetPeerId);
    const isPending = pendingConnections.current.has(targetPeerId);
    
    if (existingConn) {
      if (existingConn.open) {
        console.log('✅ Already connected to:', targetPeerId);
        return true;
      } else if (existingConn._isSettingUp || isPending) {
        console.log('⏳ Connection already in progress to:', targetPeerId);
        return false;
      }
    }

    // 🎯 BALANCED: 3 attempts instead of 5
    const attempts = connectionAttempts.current.get(targetPeerId) || 0;
    if (attempts >= 3) {
      console.log(`❌ Too many connection attempts to ${targetPeerId}, backing off`);
      return false;
    }
    
    connectionAttempts.current.set(targetPeerId, attempts + 1);

    try {
      console.log(`🚀 Stabilized connecting to: ${targetPeerId} (attempt ${attempts + 1})`);
      
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      const connectionConfig = {
        reliable: true,
        serialization: 'json',
        metadata: { 
          roomId: roomIdRef.current,
          version: '2.1.1-stabilized',
          capabilities: ['text', 'heartbeat'],
          timestamp: Date.now(),
          isMobile: isMobile
        }
      };
      
      const conn = peerRef.current.connect(targetPeerId, connectionConfig);
      
      return new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => {
          console.log(`⏰ Connection timeout for: ${targetPeerId}`);
          pendingConnections.current.delete(targetPeerId);
          try {
            conn.close();
          } catch (e) {
            // Ignore close errors
          }
          resolve(false);
        }, 15000); // 15 second timeout

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

  // 🎯 BALANCED auto-connect - max 2 peers, spaced connections
  const autoConnectToRoomPeers = useCallback(async () => {
    if (!peerId) return;

    const discoveredPeers = discoverPeers();
    
    const availablePeers = discoveredPeers.filter(peer => {
      const isConnected = connectionsRef.current.has(peer.peerId);
      const isPending = pendingConnections.current.has(peer.peerId);
      const isOwnPeer = peer.peerId === peerId;
      return !isConnected && !isPending && !isOwnPeer;
    });
    
    if (availablePeers.length === 0) return;

    // 🎯 BALANCED: Connect to max 2 peers to avoid overwhelming
    const maxConnections = Math.min(2, availablePeers.length);
    const targetPeers = availablePeers.slice(0, maxConnections);
    
    console.log(`🎯 Stabilized connecting to ${targetPeers.length} peers`);
    
    for (let i = 0; i < targetPeers.length; i++) {
      const targetPeer = targetPeers[i];
      await connectToPeer(targetPeer.peerId);
      
      // 🎯 BALANCED: 1-second delay between connections
      if (i < targetPeers.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
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
      console.log('📦 Message queued - no connections available');
      return fullMessage.id;
    }
    
    connectionsRef.current.forEach((conn, peerId) => {
      if (conn.open && !conn._isSettingUp) {
        try {
          conn.send(fullMessage);
          sentCount++;
        } catch (error) {
          console.error('❌ Failed to send to', peerId, ':', error);
          messageQueueRef.current.push({
            ...fullMessage,
            queuedAt: Date.now(),
            retryCount: 0
          });
        }
      }
    });

    console.log(`📊 Stabilized message sent to ${sentCount}/${totalConnections} peers`);
    return fullMessage.id;
  }, []);

  const onMessage = useCallback((handler: (message: Message) => void) => {
    messageHandlersRef.current.add(handler);
    return () => {
      messageHandlersRef.current.delete(handler);
    };
  }, []);

  // Enhanced initialization
  useEffect(() => {
    if (!roomId || isInitialized) return;
    if (typeof window === 'undefined') return;

    const initializePeer = async (): Promise<void> => {
      try {
        console.log('🚀 Initializing STABILIZED P2P for room:', roomId);
        
        let attempts = 0;
        while (!window.Peer && attempts < 30) {
          await new Promise(resolve => setTimeout(resolve, 200));
          attempts++;
        }
        
        if (!window.Peer) {
          console.error('❌ PeerJS CDN not loaded after 6 seconds');
          setIsInitialized(true);
          return;
        }
        
        const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        const config = {
          debug: process.env.NODE_ENV === 'development' ? 2 : 1,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
              { urls: 'stun:stun2.l.google.com:19302' },
              { urls: 'stun:stun.services.mozilla.com' },
              { urls: 'stun:stun.ekiga.net' },
              ...(isMobile ? [
                { urls: 'stun:stun.cloudflare.com:3478' },
                { urls: 'stun:stun4.l.google.com:19302' }
              ] : [])
            ],
            iceCandidatePoolSize: isMobile ? 15 : 10,
            iceTransportPolicy: 'all',
            bundlePolicy: isMobile ? 'max-bundle' : 'balanced',
            rtcpMuxPolicy: 'require',
            ...(isMobile ? {
              iceGatheringTimeout: 15000,
              sdpSemantics: 'unified-plan'
            } : {})
          }
        };
        
        const newPeer = new window.Peer(undefined, config);
        
        const timeout = setTimeout(() => {
          console.error('⏰ P2P initialization timeout');
          if (!newPeer.destroyed) {
            newPeer.destroy();
          }
          setIsInitialized(true);
        }, 15000);

        newPeer.on('open', (id: string) => {
          clearTimeout(timeout);
          console.log('✅ STABILIZED P2P initialized with ID:', id);
          setPeerId(id);
          setPeer(newPeer);
          setIsInitialized(true);
          
          broadcastPresence(id);
          
          // 🎯 BALANCED: 2-second delay before connecting
          setTimeout(autoConnectToRoomPeers, 2000);
        });

        newPeer.on('connection', (conn: DataConnection) => {
          console.log('📞 Stabilized incoming connection from:', conn.peer);
          setupConnection(conn, true);
          
          if (peerId) {
            broadcastPresence(peerId);
          }
        });

        newPeer.on('error', (error: any) => {
          clearTimeout(timeout);
          console.error('❌ Stabilized peer error:', error.type, error.message);
          setIsInitialized(true);
          
          if (error.type === 'network' || error.type === 'server-error') {
            console.log('🔄 Scheduling retry for recoverable error');
            setTimeout(() => {
              setIsInitialized(false);
            }, 5000);
          }
        });

        newPeer.on('disconnected', () => {
          console.log('🔌 Stabilized peer disconnected from signaling server');
          if (!newPeer.destroyed) {
            console.log('🔄 Attempting to reconnect...');
            try {
              newPeer.reconnect();
            } catch (e) {
              console.error('Failed to reconnect:', e);
            }
          }
        });

        newPeer.on('close', () => {
          console.log('🔒 Stabilized peer closed');
          setPeer(null);
          setPeerId(null);
          setConnections(new Map());
          pendingConnections.current.clear();
          connectionTimestamps.current.clear();
          updateStatus();
        });

      } catch (error) {
        console.error('💥 Stabilized P2P initialization error:', error);
        setIsInitialized(true);
      }
    };

    initializePeer();

    return () => {
      console.log('🧹 Cleaning up STABILIZED P2P');
      
      heartbeatIntervals.current.forEach(interval => clearInterval(interval));
      heartbeatIntervals.current.clear();
      
      connectionsRef.current.forEach(conn => {
        try {
          conn.close();
        } catch (error) {
          console.error('Error closing connection:', error);
        }
      });
      
      if (peerRef.current && !peerRef.current.destroyed) {
        peerRef.current.destroy();
      }
      
      connectionsRef.current.clear();
      pendingConnections.current.clear();
      connectionTimestamps.current.clear();
      messageQueueRef.current = [];
      connectionAttempts.current.clear();
      reconnectAttempts.current.clear();
    };
  }, [roomId, isInitialized, setupConnection, autoConnectToRoomPeers, updateStatus, broadcastPresence]);

  // 🎯 BALANCED periodic maintenance - less frequent, more targeted
  useEffect(() => {
    if (!peerId) return;
    
    // 30-second cleanup intervals instead of 5 seconds
    const cleanupInterval = setInterval(() => {
      cleanOldPresenceData();
    }, 30000);
    
    const presenceInterval = setInterval(() => {
      broadcastPresence(peerId);
    }, 30000);
    
    // 🎯 BALANCED: Only discover when we have ZERO connections (45-second intervals)
    const discoveryInterval = setInterval(() => {
      if (connectionsRef.current.size === 0 && pendingConnections.current.size === 0) {
        console.log('🔍 Stabilized auto-discovery triggered - no active connections');
        autoConnectToRoomPeers();
      }
    }, 45000);
    
    const statusInterval = setInterval(() => {
      updateStatus();
    }, 30000);
    
    return () => {
      clearInterval(cleanupInterval);
      clearInterval(presenceInterval);
      clearInterval(discoveryInterval);
      clearInterval(statusInterval);
    };
  }, [peerId, broadcastPresence, autoConnectToRoomPeers, updateStatus, cleanOldPresenceData]);

  // Debug utilities
  useEffect(() => {
    if (typeof window !== 'undefined' && peerId) {
      window.debugP2P = () => {
        const activeConns = Array.from(connectionsRef.current.entries())
          .map(([peerId, conn]) => ({
            peerId: peerId.substring(0, 8) + '...',
            open: conn.open,
            isSettingUp: conn._isSettingUp,
            quality: Math.round(conn._connectionQuality || 0)
          }));
        
        const pendingConns = Array.from(pendingConnections.current)
          .map(peerId => peerId.substring(0, 8) + '...');
        
        console.log('🔍 STABILIZED Active connections:', activeConns);
        console.log('🔍 STABILIZED Pending connections:', pendingConns);
        console.log('🔍 STABILIZED Status:', status);
        
        return { 
          active: activeConns, 
          pending: pendingConns, 
          count: connectionsRef.current.size,
          status,
          version: 'STABILIZED'
        };
      };
    }
  }, [peerId, status]);

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
      cleanOldPresenceData();
      autoConnectToRoomPeers();
    },
    
    // Enhanced debugging methods
    getQueuedMessages: () => messageQueueRef.current.length,
    clearMessageQueue: () => { messageQueueRef.current = []; },
    getConnectionQuality: calculateAverageConnectionQuality,
    getConnectionAttempts: () => Object.fromEntries(connectionAttempts.current),
    getReconnectAttempts: () => Object.fromEntries(reconnectAttempts.current),
    getPendingConnections: () => Array.from(pendingConnections.current),
    
    // Stability utilities
    clearRoomPeers: () => {
      if (typeof window !== 'undefined') {
        const presencePrefix = `presence_v2_${roomId}`;
        let clearCount = 0;
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && key.startsWith(presencePrefix)) {
            localStorage.removeItem(key);
            clearCount++;
          }
        }
        connectionAttempts.current.clear();
        reconnectAttempts.current.clear();
        pendingConnections.current.clear();
        console.log(`🧹 STABILIZED cleared ${clearCount} room peer entries`);
      }
    },
    
    forceCleanup: () => {
      cleanOldPresenceData();
      updateStatus();
    },
    
    emergencyCleanup: () => {
      if (typeof window !== 'undefined') {
        const roomPrefix = `presence_v2_${roomId}_`;
        const oneMinuteAgo = Date.now() - 60 * 1000;
        let cleared = 0;
        
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && key.startsWith(roomPrefix)) {
            if (key !== `${roomPrefix}${peerId}`) {
              try {
                const data = JSON.parse(localStorage.getItem(key) || '{}');
                if (data.timestamp < oneMinuteAgo) {
                  localStorage.removeItem(key);
                  cleared++;
                }
              } catch (e) {
                localStorage.removeItem(key);
                cleared++;
              }
            }
          }
        }
        
        connectionAttempts.current.clear();
        pendingConnections.current.clear();
        
        console.log(`🚨 STABILIZED emergency cleanup: removed ${cleared} stale entries`);
        updateStatus();
      }
    },
    
    debugConnections: () => {
      const activeConns = Array.from(connectionsRef.current.entries())
        .map(([peerId, conn]) => ({
          peerId: peerId.substring(0, 8) + '...',
          open: conn.open,
          isSettingUp: conn._isSettingUp,
          quality: conn._connectionQuality || 0
        }));
      
      const pendingConns = Array.from(pendingConnections.current)
        .map(peerId => peerId.substring(0, 8) + '...');
      
      console.log('🔍 STABILIZED Debug - Active connections:', activeConns);
      console.log('🔍 STABILIZED Debug - Pending connections:', pendingConns);
      console.log('🔍 STABILIZED Debug - Connection count:', connectionsRef.current.size);
      
      return { 
        active: activeConns, 
        pending: pendingConns, 
        count: connectionsRef.current.size,
        version: 'STABILIZED'
      };
    }
  };
}