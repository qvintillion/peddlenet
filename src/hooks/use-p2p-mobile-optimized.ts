'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Message, ConnectionStatus } from '@/lib/types';
import { generateCompatibleUUID } from '@/utils/peer-utils';
import { 
  connectionRetry, 
  ConnectionHealthMonitor, 
  SessionPersistence,
  type RetryConfig,
  type ConnectionMetrics
} from '@/utils/connection-resilience';
import { useSignalingRoomDiscovery } from './use-signaling-room-discovery';

declare global {
  interface Window {
    Peer: any;
    globalPeer?: any;
  }
}

type DataConnection = any;

export function useP2PMobileOptimized(roomId: string, displayName?: string) {
  const [peerId, setPeerId] = useState<string | null>(null);
  const [connections, setConnections] = useState<Map<string, DataConnection>>(new Map());
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isSignalingConnected, setIsSignalingConnected] = useState(false);
  const [status, setStatus] = useState<ConnectionStatus>({
    isConnected: false,
    connectedPeers: 0,
    networkReach: 'isolated',
    signalStrength: 'none',
  });
  
  // NEW: Room-based peer discovery (optional enhancement)
  const [discoveredPeers, setDiscoveredPeers] = useState<Set<string>>(new Set());
  const discoveredPeersRef = useRef<Set<string>>(new Set());
  const autoConnectInProgress = useRef<Set<string>>(new Set());
  
  const effectiveDisplayName = displayName || 'Anonymous';
  const healthMonitor = ConnectionHealthMonitor.getInstance();
  
  // Use refs to prevent recreations and add debouncing
  const connectionsRef = useRef<Map<string, DataConnection>>(new Map());
  const messageHandlersRef = useRef<Set<(message: Message) => void>>(new Set());
  const isInitializedRef = useRef<boolean>(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const signalingReconnectAttempts = useRef<number>(0);
  const statusUpdateTimeoutRef = useRef<NodeJS.Timeout>();

  // NEW: Auto-connect to discovered peers (room-based discovery)
  const autoConnectToPeer = useCallback(async (targetPeerId: string) => {
    if (!targetPeerId || targetPeerId === peerId || autoConnectInProgress.current.has(targetPeerId)) {
      return;
    }

    autoConnectInProgress.current.add(targetPeerId);
    console.log('🤖 Auto-connecting to discovered peer:', targetPeerId);

    try {
      const success = await connectToPeer(targetPeerId);
      if (success) {
        console.log('✅ Auto-connection successful:', targetPeerId);
      } else {
        console.log('❌ Auto-connection failed:', targetPeerId);
      }
    } catch (error) {
      console.error('❌ Auto-connection error:', targetPeerId, error);
    } finally {
      autoConnectInProgress.current.delete(targetPeerId);
    }
  }, [peerId]); // Will be updated when connectToPeer is defined

  // NEW: Signaling room discovery events
  const signalingEvents = {
    onPeerJoined: (peer: any) => {
      console.log('🔍 Discovered new peer in room:', peer.peerId);
      if (peer.peerId !== peerId && !autoConnectInProgress.current.has(peer.peerId)) {
        autoConnectToPeer(peer.peerId);
      }
    },
    onPeerLeft: (peer: any) => {
      console.log('👋 Peer left room:', peer.peerId);
      // Clean up connection if exists
      if (connectionsRef.current.has(peer.peerId)) {
        const conn = connectionsRef.current.get(peer.peerId);
        try { conn?.close(); } catch (e) { /* ignore */ }
        connectionsRef.current.delete(peer.peerId);
        setConnections(new Map(connectionsRef.current));
      }
    },
    onRoomPeersUpdate: (peers: any[]) => {
      console.log('👥 Room peers updated:', peers.length);
      const peerIds = new Set(peers.map(p => p.peerId).filter(id => id !== peerId));
      setDiscoveredPeers(peerIds);
      discoveredPeersRef.current = peerIds;
      
      // Auto-connect to discovered peers (with delay to prevent spam)
      setTimeout(() => {
        peers.forEach(peer => {
          if (peer.peerId !== peerId && 
              !connectionsRef.current.has(peer.peerId) &&
              !autoConnectInProgress.current.has(peer.peerId)) {
            autoConnectToPeer(peer.peerId);
          }
        });
      }, 1000);
    }
  };

  // NEW: Optional signaling room discovery
  const {
    isSignalingConnected: isRoomDiscoveryConnected,
    isSignalingEnabled: isRoomDiscoveryEnabled,
    roomPeers,
    refreshRoomPeers,
    toggleSignaling
  } = useSignalingRoomDiscovery(roomId, peerId, effectiveDisplayName, signalingEvents);

  // Enhanced mobile-specific configuration
  const MOBILE_CONFIG = {
    connectionTimeout: 15000, // Increased timeout for mobile networks
    maxSignalingReconnects: 5,
    signalingReconnectDelay: 3000,
    iceServers: [
      // Primary Google STUN servers (most reliable)
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      
      // Cloudflare STUN (excellent for mobile carriers)
      { urls: 'stun:stun.cloudflare.com:3478' },
      
      // Additional reliable STUN servers
      { urls: 'stun:stun.nextcloud.com:443' },
      { urls: 'stun:stun.stunprotocol.org:3478' },
      
      // FREE TURN servers for difficult networks (the key fix!)
      {
        urls: [
          'turn:openrelay.metered.ca:80',
          'turn:openrelay.metered.ca:443',
          'turns:openrelay.metered.ca:443'
        ],
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      {
        urls: [
          'turn:relay1.expressturn.com:3478'
        ],
        username: 'ef3DYNSDSJ27UVKR',
        credential: 'TJ5P4Zz6YD8dqDxw'
      }
    ],
    
    // Mobile-specific WebRTC config
    webrtcConfig: {
      iceCandidatePoolSize: 20, // More candidates for mobile
      iceTransportPolicy: 'all',
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require',
      // Faster ICE gathering for mobile
      iceConnectionPolicy: 'all',
      // Force TURN usage for difficult networks
      iceServers: 'inherited' // Use the servers defined above
    }
  };

  const isMobile = () => {
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  const updateStatus = useCallback(() => {
    const allConnections = Array.from(connectionsRef.current.values());
    const activeConnections = allConnections.filter(conn => conn.open).length;
    const currentPeerId = window.globalPeer?.id || peerId;
    const totalDiscoveredPeers = discoveredPeersRef.current.size;
    
    console.log('📊📱 Status update - Total connections:', allConnections.length);
    console.log('📊📱 Status update - activeConnections:', activeConnections, 'peerId:', currentPeerId);
    
    // Debug each connection
    allConnections.forEach((conn, index) => {
      console.log(`  Connection ${index}: peer=${conn.peer}, open=${conn.open}`);
    });
    
    setStatus(prevStatus => {
      const newStatus = {
        isConnected: activeConnections > 0 && !!currentPeerId,
        connectedPeers: activeConnections,
        networkReach: activeConnections > 0 ? 'local' as const : 'isolated' as const,
        signalStrength: isSignalingConnected ? (activeConnections > 0 ? 'strong' as const : 'medium' as const) : 'weak' as const,
        // NEW: Room discovery status (optional)
        roomDiscovery: isRoomDiscoveryEnabled ? {
          isConnected: isRoomDiscoveryConnected,
          discoveredPeers: totalDiscoveredPeers,
          connectedPeers: activeConnections
        } : undefined
      };
      
      // Only update if status actually changed
      if (JSON.stringify(prevStatus) !== JSON.stringify(newStatus)) {
        console.log('📊📱 Status changed, updating to:', newStatus);
        return newStatus;
      }
      
      return prevStatus;
    });
  }, [peerId, isSignalingConnected, isRoomDiscoveryConnected, isRoomDiscoveryEnabled]); // Add new dependencies

  const debouncedUpdateStatus = useCallback(() => {
    if (statusUpdateTimeoutRef.current) {
      clearTimeout(statusUpdateTimeoutRef.current);
    }
    
    statusUpdateTimeoutRef.current = setTimeout(() => {
      updateStatus();
    }, 100); // 100ms debounce
  }, [updateStatus]);

  const setupConnection = useCallback((conn: DataConnection) => {
    const connId = conn.peer;
    console.log('🔧📱 Setting up mobile connection to:', connId);

    const handleData = (data: any) => {
      console.log('📨📱 Mobile received data from', connId, ':', data);
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
      console.log('✅📱 Mobile connection opened:', connId);
      
      // Update both state and ref immediately
      setConnections(prev => {
        const newMap = new Map(prev);
        newMap.set(connId, conn);
        console.log('📊📱 Updated connections map, size:', newMap.size);
        console.log('📊📱 Connection object open state:', conn.open);
        
        // Update ref synchronously
        connectionsRef.current = newMap;
        console.log('📊📱 Updated connectionsRef, size:', connectionsRef.current.size);
        
        return newMap;
      });
      
      // Force immediate status update
      setTimeout(() => {
        console.log('🔄📱 Forcing status update after connection');
        const activeConns = Array.from(connectionsRef.current.values()).filter(c => c.open).length;
        console.log('📊📱 Active connections in forced update:', activeConns);
        debouncedUpdateStatus();
      }, 50);
      
      // Also update after a slight delay to ensure React state has updated
      setTimeout(() => {
        console.log('🔄📱 Second delayed status update');
        debouncedUpdateStatus();
      }, 200);
    };

    const handleClose = () => {
      console.log('❌📱 Mobile connection closed:', connId);
      setConnections(prev => {
        const newMap = new Map(prev);
        newMap.delete(connId);
        connectionsRef.current = newMap;
        return newMap;
      });
      setTimeout(() => debouncedUpdateStatus(), 100);
    };

    const handleError = (error: any) => {
      console.error('⚠️📱 Mobile connection error:', connId, error.type || error);
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

    const connectionTimeout = setTimeout(() => {
      if (!conn.open) {
        console.warn('⏰📱 Mobile connection timeout:', connId);
        try { conn.close(); } catch (e) { /* ignore */ }
      }
    }, MOBILE_CONFIG.connectionTimeout);

    if (conn.open) {
      clearTimeout(connectionTimeout);
      handleOpen();
    }
  }, [updateStatus]);

  const handleSignalingReconnect = useCallback(async () => {
    if (signalingReconnectAttempts.current >= MOBILE_CONFIG.maxSignalingReconnects) {
      console.error('📱 Max signaling reconnect attempts reached');
      return;
    }

    signalingReconnectAttempts.current++;
    console.log(`🔄📱 Signaling reconnect attempt ${signalingReconnectAttempts.current}`);

    if (window.globalPeer && !window.globalPeer.destroyed) {
      try {
        window.globalPeer.destroy();
      } catch (e) {
        console.warn('Error destroying old peer:', e);
      }
    }

    await new Promise(resolve => setTimeout(resolve, MOBILE_CONFIG.signalingReconnectDelay));
    await initializePeer();
  }, []);

  const initializePeer = useCallback(async () => {
    let attempts = 0;
    while (!window.Peer && attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    if (!window.Peer) {
      console.error('❌📱 PeerJS not loaded for mobile');
      return;
    }

    try {
      console.log('🔧📱 Creating mobile-optimized PeerJS instance...');
      const initStartTime = Date.now();
      
      const peer = new window.Peer(undefined, {
        debug: isMobile() ? 1 : 2,
        config: {
          iceServers: MOBILE_CONFIG.iceServers,
          ...MOBILE_CONFIG.webrtcConfig
        },
        pingInterval: 5000 // Increased ping interval
      });

      window.globalPeer = peer;

      const initTimeout = setTimeout(() => {
        console.error('❌📱 Mobile PeerJS initialization timeout');
        handleSignalingReconnect();
      }, 8000);

      peer.on('open', (id: string) => {
        clearTimeout(initTimeout);
        console.log('✅📱 Mobile P2P ready with peer ID:', id);
        setPeerId(id);
        setIsSignalingConnected(true);
        signalingReconnectAttempts.current = 0;
        
        // Clear any stale session data before saving new session
        SessionPersistence.clearSession();
        SessionPersistence.saveSession(roomId, effectiveDisplayName, id);
        
        console.log('🧠 Cleared stale sessions and saved new session for:', id);
        
        healthMonitor.recordConnectionAttempt({
          timestamp: Date.now(),
          connectionTime: Date.now() - initStartTime,
          success: true,
          attemptNumber: 1
        });
      });

      peer.on('connection', (conn: DataConnection) => {
        console.log('📞📱 Mobile incoming connection from:', conn.peer);
        setupConnection(conn);
      });

      peer.on('error', (error: any) => {
        clearTimeout(initTimeout);
        console.error('❌📱 Mobile PeerJS error:', error.type || error);
        setIsSignalingConnected(false);
        
        if (error.type === 'disconnected' || error.type === 'server-error') {
          console.log('📱 Signaling server issue, attempting reconnect...');
          if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = setTimeout(handleSignalingReconnect, 2000);
        }
        
        healthMonitor.recordConnectionAttempt({
          timestamp: Date.now(),
          connectionTime: Date.now() - initStartTime,
          success: false,
          errorType: error.type || 'mobile_peer_initialization_failed',
          attemptNumber: 1
        });
      });

      peer.on('disconnected', () => {
        console.warn('⚠️📱 Mobile PeerJS disconnected from signaling server');
        setIsSignalingConnected(false);
        
        console.log('📱 Attempting to reconnect to signaling server...');
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
          if (!peer.destroyed) {
            try {
              peer.reconnect();
            } catch (e) {
              console.warn('📱 Reconnect failed, creating new peer:', e);
              handleSignalingReconnect();
            }
          }
        }, 1000);
      });

      peer.on('close', () => {
        console.log('🔒📱 Mobile PeerJS closed');
        window.globalPeer = undefined;
        setPeerId(null);
        setIsSignalingConnected(false);
        setConnections(new Map());
        connectionsRef.current = new Map();
      });

    } catch (error) {
      console.error('💥📱 Mobile PeerJS initialization error:', error);
      
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = setTimeout(handleSignalingReconnect, 3000);
    }
  }, [roomId, setupConnection, handleSignalingReconnect, effectiveDisplayName]);

  const connectToPeer = useCallback(async (targetPeerId: string): Promise<boolean> => {
    const peer = window.globalPeer;
    if (!peer || !targetPeerId || targetPeerId === peerId) {
      console.log('❌📱 Cannot connect - invalid peer or self-connection');
      return false;
    }

    if (!isSignalingConnected) {
      console.log('❌📱 Cannot connect - signaling server not connected');
      return false;
    }

    if (connectionsRef.current.has(targetPeerId)) {
      console.log('❌📱 Already connected to:', targetPeerId);
      return true;
    }

    console.log('🚀📱 Attempting mobile connection to:', targetPeerId);
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
            reject(new Error('Mobile connection timeout'));
          }, MOBILE_CONFIG.connectionTimeout);

          conn.on('open', () => {
            clearTimeout(timeout);
            console.log('✅📱 Mobile connection successful to:', targetPeerId);
            setupConnection(conn);
            resolve(true);
          });

          conn.on('error', (error: any) => {
            clearTimeout(timeout);
            reject(new Error(`Mobile connection error: ${error.type || 'unknown'}`));
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
          maxAttempts: 2,
          baseDelay: 1500,
          maxDelay: 4000,
          backoffMultiplier: 2
        },
        (attempt, error) => {
          setRetryCount(attempt);
          console.log(`🔄📱 Mobile connection attempt ${attempt}${error ? ` failed: ${error.message}` : ''}`);
        }
      );

      result.metrics.forEach(metric => {
        healthMonitor.recordConnectionAttempt(metric);
      });

      return result.success;
    } finally {
      setIsRetrying(false);
      setRetryCount(0);
    }
  }, [peerId, roomId, effectiveDisplayName, setupConnection, healthMonitor, isSignalingConnected]);
  
  // Update autoConnectToPeer dependency
  const autoConnectToPeerWithDeps = useCallback(autoConnectToPeer, [peerId, connectToPeer]);

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
      console.log('📦📱 No mobile connections to send message');
      return fullMessage.id;
    }
    
    let sentCount = 0;
    activeConnections.forEach(conn => {
      try {
        conn.send(fullMessage);
        sentCount++;
      } catch (error) {
        console.error('📱 Failed to send mobile message:', error);
      }
    });

    console.log(`📊📱 Mobile message sent to ${sentCount}/${activeConnections.length} peers`);
    return fullMessage.id;
  }, []);

  const onMessage = useCallback((handler: (message: Message) => void) => {
    messageHandlersRef.current.add(handler);
    return () => {
      messageHandlersRef.current.delete(handler);
    };
  }, []);

  useEffect(() => {
    if (!roomId || isInitializedRef.current) return;
    if (typeof window === 'undefined') return;

    console.log('🚀📱 Initializing mobile P2P for room:', roomId);
    isInitializedRef.current = true;

    // Clean up any stale host peer data for this room
    const { QRPeerUtils } = require('@/utils/qr-peer-utils');
    QRPeerUtils.cleanupOldHostData(roomId);
    console.log('🧠 Cleaned up stale host peer data');

    if (window.globalPeer && !window.globalPeer.destroyed) {
      console.log('🔄📱 Reusing existing mobile peer:', window.globalPeer.id);
      setPeerId(window.globalPeer.id);
      setIsSignalingConnected(true);
      return;
    }

    initializePeer();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (statusUpdateTimeoutRef.current) {
        clearTimeout(statusUpdateTimeoutRef.current);
      }
    };
  }, [roomId, initializePeer]);

  useEffect(() => {
    debouncedUpdateStatus();
  }, [connections, debouncedUpdateStatus]);
  
  // NEW: Room-based reconnection when peer ID is established
  useEffect(() => {
    if (peerId && roomPeers.length > 0 && isRoomDiscoveryEnabled) {
      console.log('🔄 Peer ID established, checking room connections...');
      
      // If we have few connections but many room peers, try to connect
      const activeConnections = Array.from(connectionsRef.current.values()).filter(c => c.open).length;
      const potentialConnections = roomPeers.filter(peer => peer.peerId !== peerId).length;
      
      if (activeConnections < potentialConnections) {
        console.log(`🔍 Have ${activeConnections} connections but ${potentialConnections} room peers, attempting connections...`);
        setTimeout(() => {
          roomPeers.forEach(peer => {
            if (peer.peerId !== peerId && !connectionsRef.current.has(peer.peerId)) {
              autoConnectToPeerWithDeps(peer.peerId);
            }
          });
        }, 2000); // Delay to allow peer initialization
      }
    }
  }, [peerId, roomPeers, autoConnectToPeerWithDeps, isRoomDiscoveryEnabled]);

  return {
    peerId,
    status,
    isRetrying,
    retryCount,
    isSignalingConnected,
    connectToPeer,
    sendMessage,
    onMessage,
    getConnectedPeers: () => Array.from(connectionsRef.current.keys()),
    forceReconnect: async () => {
      console.log('🔄📱 Mobile manual reconnect triggered');
      
      signalingReconnectAttempts.current = 0;
      connectionsRef.current.clear();
      setConnections(new Map());
      healthMonitor.reset();
      
      await handleSignalingReconnect();
      
      // Also refresh room discovery if enabled
      if (isRoomDiscoveryEnabled) {
        setTimeout(() => {
          refreshRoomPeers();
        }, 2000);
      }
      
      return true;
    },
    clearSession: () => {
      SessionPersistence.clearSession();
      console.log('🗑️📱 Mobile session cleared manually');
    },
    
    // NEW: Room discovery features (optional)
    roomDiscovery: {
      isEnabled: isRoomDiscoveryEnabled,
      isConnected: isRoomDiscoveryConnected,
      discoveredPeers: Array.from(discoveredPeers),
      roomPeers,
      refreshRoomPeers,
      toggleSignaling // For testing/debugging
    }
  };
}
