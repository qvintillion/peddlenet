'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Message, ConnectionStatus } from '@/lib/types';
import { generateCompatibleUUID, generateShortId } from '@/utils/peer-utils';

declare global {
  interface Window {
    Peer: any;
  }
}

type DataConnection = any;

interface PeerConfig {
  host?: string;
  port?: number;
  path?: string;
  key?: string;
  secure?: boolean;
  config?: RTCConfiguration;
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
  
  // Refs for stable references
  const connectionsRef = useRef<Map<string, DataConnection>>(new Map());
  const messageHandlersRef = useRef<Set<(message: Message) => void>>(new Set());
  const peerRef = useRef<any | null>(null);
  const messageQueueRef = useRef<QueuedMessage[]>([]);
  const connectionAttempts = useRef<Map<string, number>>(new Map());
  const pendingConnections = useRef<Set<string>>(new Set());
  const initializingRef = useRef<boolean>(false);

  // Enhanced debugging for all environments (not just staging)
  const debugP2P = useCallback((stage: string, data: any) => {
    console.log(`🔍 P2P Debug [${stage}]:`, data);
    // Store debug info globally for inspection
    if (typeof window !== 'undefined') {
      if (!window.P2PDebugLog) window.P2PDebugLog = [];
      window.P2PDebugLog.push({ stage, data, timestamp: Date.now() });
      if (window.P2PDebugLog.length > 50) window.P2PDebugLog = window.P2PDebugLog.slice(-50);
    }
  }, []);

  // Enhanced STUN/TURN configuration for better NAT traversal
  const getICEConfiguration = (): RTCConfiguration => ({
    iceServers: [
      // Google STUN servers
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      
      // Cloudflare STUN servers
      { urls: 'stun:stun.cloudflare.com:3478' },
      
      // Additional public STUN servers for redundancy
      { urls: 'stun:stun.nextcloud.com:443' },
      { urls: 'stun:stun.sipgate.net:3478' },
      
      // Free TURN servers (you should replace with your own in production)
      {
        urls: ['turn:openrelay.metered.ca:80'],
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      {
        urls: ['turn:openrelay.metered.ca:443'],
        username: 'openrelayproject',
        credential: 'openrelayproject'
      }
    ],
    iceCandidatePoolSize: 10,
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require',
    iceTransportPolicy: 'all'
  });

  // Enhanced PeerJS configuration with production-ready fallbacks
  const getPeerConfigs = (): PeerConfig[] => {
    // Always try cloud first for better reliability in development
    const configs: PeerConfig[] = [];
    
    // Production: Use default PeerJS cloud with enhanced config (more reliable)
    configs.push({
      config: getICEConfiguration()
    });
    
    // Development only: Local PeerJS server as fallback
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      configs.push({
        host: 'localhost',
        port: 9000,
        path: '/peerjs',
        secure: false,
        config: getICEConfiguration()
      });
    }
    
    return configs;
  };

  const updateStatus = useCallback(() => {
    const activeConnections = Array.from(connectionsRef.current.values())
      .filter(conn => conn.open && !conn._isSettingUp).length;
    
    setStatus({
      isConnected: activeConnections > 0 && !!peerId,
      connectedPeers: activeConnections,
      networkReach: activeConnections > 0 ? 'local' : 'isolated',
      signalStrength: activeConnections > 2 ? 'strong' : activeConnections > 0 ? 'medium' : 'none',
    });
  }, [peerId]);

  const broadcastPresence = useCallback((myPeerId: string) => {
    if (typeof window === 'undefined') return;
    
    const presenceData = {
      peerId: myPeerId,
      roomId,
      timestamp: Date.now(),
      displayName: effectiveDisplayName,
      capabilities: ['webrtc', 'text'],
      lastSeen: Date.now()
    };
    
    const presenceKey = `presence_v3_${roomId}_${myPeerId}`;
    localStorage.setItem(presenceKey, JSON.stringify(presenceData));
    
    // Clean old presence data (older than 5 minutes for more stability)
    const cutoff = Date.now() - 5 * 60 * 1000;
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key?.startsWith(`presence_v3_${roomId}_`)) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          if (data.timestamp < cutoff) {
            localStorage.removeItem(key);
          }
        } catch (e) {
          localStorage.removeItem(key);
        }
      }
    }
  }, [roomId, effectiveDisplayName]);

  const discoverPeers = useCallback((): string[] => {
    if (typeof window === 'undefined') return [];
    
    const peers: string[] = [];
    const threeMinutesAgo = Date.now() - 3 * 60 * 1000; // Extended discovery window
    
    const roomPrefix = `presence_v3_${roomId}_`;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(roomPrefix) && !key.endsWith(`_${peerId}`)) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          if (data.peerId && 
              data.timestamp > threeMinutesAgo && 
              data.peerId !== peerId &&
              !peers.includes(data.peerId)) {
            peers.push(data.peerId);
          }
        } catch (e) {
          localStorage.removeItem(key);
        }
      }
    }
    
    return peers.slice(0, 5); // Limit to 5 peers max
  }, [roomId, peerId]);

  const setupConnection = useCallback((conn: DataConnection, isIncoming = false) => {
    // Validate connection object
    if (!conn || typeof conn.on !== 'function' || !conn.peer) {
      console.error('❌ Invalid connection object passed to setupConnection');
      return;
    }
    
    const connId = conn.peer;
    
    if (connectionsRef.current.has(connId) || pendingConnections.current.has(connId)) {
      console.log(`🚫 Rejecting duplicate connection from ${connId}`);
      try { conn.close?.(); } catch (e) { /* ignore */ }
      return;
    }
    
    pendingConnections.current.add(connId);
    conn._isSettingUp = true;

    const handleData = (data: any) => {
      try {
        if (data?.type && data?.content && typeof data.content === 'string') {
          messageHandlersRef.current.forEach(handler => {
            try {
              handler(data as Message);
            } catch (e) {
              console.error('Message handler error:', e);
            }
          });
        }
      } catch (e) {
        console.error('Data handling error:', e);
      }
    };

    const handleOpen = () => {
      console.log('✅ Connection opened:', connId);
      conn._isSettingUp = false;
      pendingConnections.current.delete(connId);
      
      setConnections(prev => {
        const newConnections = new Map(prev);
        newConnections.set(connId, conn);
        return newConnections;
      });
      
      // Send queued messages
      if (messageQueueRef.current.length > 0) {
        const toSend = [...messageQueueRef.current];
        messageQueueRef.current = [];
        
        toSend.forEach(queuedMessage => {
          try {
            const { queuedAt, retryCount, ...message } = queuedMessage;
            conn.send(message);
          } catch (e) {
            console.error('Failed to send queued message:', e);
          }
        });
      }
      
      updateStatus();
    };

    const handleClose = () => {
      console.log('❌ Connection closed:', connId);
      conn._isSettingUp = false;
      pendingConnections.current.delete(connId);
      
      setConnections(prev => {
        const newConnections = new Map(prev);
        newConnections.delete(connId);
        return newConnections;
      });
      
      updateStatus();
    };

    const handleError = (error: any) => {
      console.error('⚠️ Connection error:', connId, error.type || error);
      handleClose();
    };

    // Remove existing listeners and add new ones (safely)
    ['data', 'open', 'close', 'error'].forEach(event => {
      try {
        if (typeof conn.removeAllListeners === 'function') {
          conn.removeAllListeners(event);
        } else if (typeof conn.off === 'function') {
          conn.off(event);
        }
      } catch (e) {
        // Ignore cleanup errors
      }
    });

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

    // Check if peer is actually connected and ready
    if (peerRef.current.disconnected || peerRef.current.destroyed) {
      console.warn(`⚠️ Cannot connect to ${targetPeerId}: Peer is disconnected or destroyed`);
      return false;
    }

    if (connectionsRef.current.has(targetPeerId) || pendingConnections.current.has(targetPeerId)) {
      return false;
    }

    const attempts = connectionAttempts.current.get(targetPeerId) || 0;
    if (attempts >= 2) return false;
    
    connectionAttempts.current.set(targetPeerId, attempts + 1);

    try {
      console.log(`🚀 Connecting to: ${targetPeerId}`);
      
      const connectionConfig = {
        reliable: true,
        serialization: 'json',
        metadata: { 
          roomId,
          displayName: effectiveDisplayName,
          timestamp: Date.now()
        }
      };
      
      const conn = peerRef.current.connect(targetPeerId, connectionConfig);
      
      // Validate that conn is a valid connection object
      if (!conn || typeof conn.on !== 'function') {
        console.error(`❌ Invalid connection object returned for ${targetPeerId}`);
        pendingConnections.current.delete(targetPeerId);
        return false;
      }
      
      return new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => {
          console.log(`⏰ Connection timeout: ${targetPeerId}`);
          pendingConnections.current.delete(targetPeerId);
          try { conn.close?.(); } catch (e) { /* ignore */ }
          resolve(false);
        }, 10000);

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
      console.error('Connection exception:', error);
      pendingConnections.current.delete(targetPeerId);
      return false;
    }
  }, [peerId, roomId, effectiveDisplayName, setupConnection]);

  const autoConnectToRoomPeers = useCallback(async () => {
    if (!peerId || !peerRef.current) return;

    // Only attempt connections if our peer is properly connected
    if (peerRef.current.disconnected || peerRef.current.destroyed) {
      console.warn('⚠️ Auto-connect skipped: Peer is disconnected or destroyed');
      return;
    }

    const availablePeers = discoverPeers().filter(peer => {
      return !connectionsRef.current.has(peer) && 
             !pendingConnections.current.has(peer) && 
             peer !== peerId;
    }).slice(0, 3);
    
    if (availablePeers.length === 0) return;

    console.log(`🎯 Auto-connecting to ${availablePeers.length} peers`);
    
    for (const targetPeer of availablePeers) {
      // Check if peer is still connected before each attempt
      if (peerRef.current.disconnected || peerRef.current.destroyed) {
        console.warn('⚠️ Auto-connect interrupted: Peer disconnected');
        break;
      }
      
      await connectToPeer(targetPeer);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }, [peerId, discoverPeers, connectToPeer]);

  const sendMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>): string => {
    const fullMessage: Message = {
      ...message,
      id: generateCompatibleUUID(),
      timestamp: Date.now(),
      synced: false,
    };

    const activeConnections = Array.from(connectionsRef.current.values())
      .filter(conn => conn.open && !conn._isSettingUp);

    if (activeConnections.length === 0) {
      messageQueueRef.current.push({
        ...fullMessage,
        queuedAt: Date.now(),
        retryCount: 0
      });
      console.log('📦 Message queued - no active connections');
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

  // Enhanced initialization with multiple fallback strategies
  useEffect(() => {
    if (!roomId || isInitialized || initializingRef.current) return;
    if (typeof window === 'undefined') return;

    initializingRef.current = true;

    const tryInitWithConfig = async (config: PeerConfig, configIndex: number): Promise<boolean> => {
      return new Promise((resolve) => {
        try {
          console.log(`🚀 Trying PeerJS config ${configIndex + 1}:`, config.host || 'default');
          debugP2P('config-attempt', { configIndex: configIndex + 1, config: config.host || 'default' });
          
          const peerConfig: any = {
            debug: 0,
            ...config
          };

          const newPeer = new window.Peer(undefined, peerConfig);
          
          const timeout = setTimeout(() => {
            console.warn(`⏰ Config ${configIndex + 1} timeout`);
            try { newPeer.destroy(); } catch (e) { /* ignore */ }
            resolve(false);
          }, 8000);

          newPeer.on('open', (id: string) => {
            clearTimeout(timeout);
            console.log(`✅ P2P ready with config ${configIndex + 1}:`, id);
            debugP2P('peer-open', { configIndex: configIndex + 1, peerId: id, config: config.host || 'default' });
            
            // Ensure peer is properly connected before proceeding
            if (newPeer.disconnected || newPeer.destroyed) {
              console.warn('⚠️ Peer disconnected immediately after open');
              resolve(false);
              return;
            }
            
            setPeer(newPeer);
            setPeerId(id);
            peerRef.current = newPeer;
            setIsInitialized(true);
            initializingRef.current = false;
            
            broadcastPresence(id);
            
            // Auto-connect after a delay
            setTimeout(autoConnectToRoomPeers, 3000);
            
            resolve(true);
          });

          newPeer.on('connection', (conn: DataConnection) => {
            console.log('📞 Incoming connection:', conn.peer);
            setupConnection(conn, true);
          });

          newPeer.on('error', (error: any) => {
            clearTimeout(timeout);
            console.warn(`⚠️ Config ${configIndex + 1} error:`, error.type);
            debugP2P('peer-error', { configIndex: configIndex + 1, error: error.type, message: error.message, config: config.host || 'default' });
            try { newPeer.destroy(); } catch (e) { /* ignore */ }
            resolve(false);
          });

          newPeer.on('close', () => {
            console.log('🔒 Peer closed');
            debugP2P('peer-closed', { configIndex: configIndex + 1, peerId: id || 'unknown' });
            setPeer(null);
            setPeerId(null);
            setConnections(new Map());
            pendingConnections.current.clear();
            updateStatus();
          });

        } catch (error) {
          console.error(`💥 Config ${configIndex + 1} exception:`, error);
          resolve(false);
        }
      });
    };

    const initializeWithFallbacks = async () => {
      // Wait for PeerJS to load
      let attempts = 0;
      while (!window.Peer && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      
      if (!window.Peer) {
        console.error('❌ PeerJS not loaded after 5 seconds');
        // Fall back to local-only mode
        const localPeerId = generateShortId('local');
        console.log('🏠 Using local-only mode:', localPeerId);
        setPeerId(localPeerId);
        setIsInitialized(true);
        initializingRef.current = false;
        broadcastPresence(localPeerId);
        return;
      }

      const configs = getPeerConfigs();
      
      // Try each configuration in sequence
      for (let i = 0; i < configs.length; i++) {
        const success = await tryInitWithConfig(configs[i], i);
        if (success) {
          return; // Successfully connected
        }
        
        // Wait between attempts
        if (i < configs.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      // All configurations failed - use local mode
      console.warn('❌ All PeerJS configurations failed - using local mode');
      debugP2P('fallback-local', { reason: 'all-configs-failed', totalConfigs: configs.length });
      const localPeerId = generateShortId('local');
      console.log('🏠 Local mode with ID:', localPeerId);
      setPeerId(localPeerId);
      setIsInitialized(true);
      initializingRef.current = false;
      broadcastPresence(localPeerId);
    };

    initializeWithFallbacks();

    // Expose debug function globally in all environments
    if (typeof window !== 'undefined') {
      window.P2PDebug = {
        getLog: () => window.P2PDebugLog || [],
        clearLog: () => { window.P2PDebugLog = []; },
        getCurrentState: () => ({
          peerId,
          isInitialized,
          connections: Array.from(connections.keys()),
          pendingConnections: Array.from(pendingConnections.current),
          status
        })
      };
      console.log('🔍 P2P Debug tools available: window.P2PDebug.getLog(), window.P2PDebug.getCurrentState()');
    }

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
  }, [roomId, isInitialized, broadcastPresence, autoConnectToRoomPeers, setupConnection, updateStatus]);

  // Presence broadcasting
  useEffect(() => {
    if (!peerId) return;
    
    broadcastPresence(peerId);
    
    const presenceInterval = setInterval(() => {
      broadcastPresence(peerId);
    }, 30000);
    
    return () => {
      clearInterval(presenceInterval);
    };
  }, [peerId, broadcastPresence]);

  // More conservative auto-reconnect mechanism
  useEffect(() => {
    if (!peerId) return;
    
    // Only try to reconnect if we've been alone for a while
    const reconnectInterval = setInterval(() => {
      const hasConnections = connectionsRef.current.size > 0;
      const hasPendingConnections = pendingConnections.current.size > 0;
      
      // Only reconnect if truly isolated and not already trying
      if (!hasConnections && !hasPendingConnections) {
        console.log('🔄 Auto-reconnect: No connections detected, searching for peers...');
        autoConnectToRoomPeers();
      }
    }, 15000); // Extended to 15 seconds to reduce churn
    
    return () => {
      clearInterval(reconnectInterval);
    };
  }, [peerId, autoConnectToRoomPeers]);

  // Sync refs with state
  useEffect(() => {
    connectionsRef.current = connections;
  }, [connections]);

  return {
    peerId,
    status,
    roomPeers: discoverPeers(),
    connectToPeer,
    sendMessage,
    onMessage,
    getConnectedPeers: () => Array.from(connectionsRef.current.keys()).filter(peerId => {
      const conn = connectionsRef.current.get(peerId);
      return conn && conn.open && !conn._isSettingUp;
    }),
    forceReconnect: autoConnectToRoomPeers,
    getQueuedMessages: () => messageQueueRef.current.length,
    clearMessageQueue: () => { messageQueueRef.current = []; },
    getPendingConnections: () => Array.from(pendingConnections.current)
  };
}
