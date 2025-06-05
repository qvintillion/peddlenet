'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { getSignalingConfig, testSignalingConnectivity, getSignalingDebugInfo } from '@/utils/signaling-config';

interface RoomPeer {
  peerId: string;
  displayName: string;
  socketId?: string;
  joinedAt?: number;
}

interface SignalingEvents {
  onPeerJoined: (peer: RoomPeer) => void;
  onPeerLeft: (peer: RoomPeer) => void;
  onRoomPeersUpdate: (peers: RoomPeer[]) => void;
}

export function useSignalingRoomDiscovery(
  roomId: string,
  myPeerId: string | null,
  displayName: string,
  events: SignalingEvents
) {
  const [isConnected, setIsConnected] = useState(false);
  const [roomPeers, setRoomPeers] = useState<RoomPeer[]>([]);
  const [isEnabled, setIsEnabled] = useState(true);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [currentSignalingUrl, setCurrentSignalingUrl] = useState<string | null>(null);
  
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const healthCheckIntervalRef = useRef<NodeJS.Timeout>();
  const maxReconnectAttempts = 3;

  // Enhanced connection with unified config
  const connectToSignaling = useCallback(async () => {
    if (!myPeerId || !roomId || !isEnabled || socketRef.current?.connected) return;

    const signalingConfig = getSignalingConfig();
    
    if (!signalingConfig.enabled || !signalingConfig.url) {
      console.log('🔌 Signaling disabled:', signalingConfig.reason || 'No URL configured');
      setIsEnabled(false);
      setCurrentSignalingUrl(null);
      return;
    }

    setCurrentSignalingUrl(signalingConfig.url);

    // Test connectivity first (with timeout)
    const isReachable = await testSignalingConnectivity(signalingConfig.url);
    if (!isReachable) {
      console.log('🔌 Signaling server not reachable - falling back to direct P2P');
      setIsEnabled(false);
      return;
    }

    try {
      console.log('🔌 Connecting to signaling server:', signalingConfig.url);
      setConnectionAttempts(prev => prev + 1);

      const socket = io(signalingConfig.url, {
        transports: ['websocket', 'polling'],
        timeout: 8000,
        forceNew: true,
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: maxReconnectAttempts,
        reconnectionDelay: 2000,
        // Enhanced mobile support
        upgrade: true,
        rememberUpgrade: true,
        pingTimeout: 60000,
        pingInterval: 25000,
        // Add CORS handling for different environments
        withCredentials: false,
        // Enhanced error handling
        closeOnBeforeunload: false
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('✅ Connected to signaling server for room discovery');
        setIsConnected(true);
        setConnectionAttempts(0);
        
        // Join room for peer discovery
        socket.emit('join-room', {
          roomId,
          peerId: myPeerId,
          displayName
        });

        // Set up periodic health check
        if (healthCheckIntervalRef.current) {
          clearInterval(healthCheckIntervalRef.current);
        }
        healthCheckIntervalRef.current = setInterval(() => {
          if (socket.connected) {
            socket.emit('ping');
          }
        }, 30000);
      });

      socket.on('disconnect', (reason) => {
        console.log('❌ Signaling server disconnected:', reason);
        setIsConnected(false);
        
        if (healthCheckIntervalRef.current) {
          clearInterval(healthCheckIntervalRef.current);
        }
        
        // Enhanced reconnection logic
        if (reason === 'io server disconnect' || reason === 'ping timeout' || reason === 'transport close') {
          console.log('🔄 Will attempt to reconnect to signaling server...');
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          reconnectTimeoutRef.current = setTimeout(() => {
            if (connectionAttempts < maxReconnectAttempts) {
              connectToSignaling();
            } else {
              console.log('🔌 Max reconnection attempts reached, disabling signaling');
              setIsEnabled(false);
            }
          }, 5000);
        }
      });

      socket.on('connect_error', (error) => {
        console.warn('❌ Signaling connection error:', error.message);
        setIsConnected(false);
        
        if (connectionAttempts >= maxReconnectAttempts) {
          console.log('🔌 Multiple connection failures, disabling signaling for this session');
          setIsEnabled(false);
        }
      });

      // Room peer discovery events
      socket.on('room-peers', (peers: RoomPeer[]) => {
        // Filter out ourselves
        const otherPeers = peers.filter(peer => peer.peerId !== myPeerId);
        console.log('👥 Discovered room peers:', otherPeers.length, otherPeers.map(p => p.displayName));
        setRoomPeers(otherPeers);
        events.onRoomPeersUpdate(otherPeers);
      });

      socket.on('peer-joined', (peer: RoomPeer) => {
        // Ignore ourselves
        if (peer.peerId === myPeerId) return;
        
        console.log('👋 New peer joined room:', peer.displayName, peer.peerId);
        setRoomPeers(prev => {
          const existing = prev.find(p => p.peerId === peer.peerId);
          if (existing) return prev; // Avoid duplicates
          return [...prev, peer];
        });
        events.onPeerJoined(peer);
      });

      socket.on('peer-left', (peer: RoomPeer) => {
        console.log('👋 Peer left room:', peer.displayName, peer.peerId);
        setRoomPeers(prev => prev.filter(p => p.peerId !== peer.peerId));
        events.onPeerLeft(peer);
      });

      socket.on('pong', () => {
        console.log('🏓 Signaling server pong received');
      });

      // Enhanced error handling
      socket.on('error', (error) => {
        console.error('🔌 Socket error:', error);
      });

    } catch (error) {
      console.error('❌ Failed to initialize signaling connection:', error);
      setIsConnected(false);
      setIsEnabled(false);
    }
  }, [myPeerId, roomId, displayName, isEnabled]);

  // Initialize signaling connection (with delay for P2P to initialize first)
  useEffect(() => {
    if (myPeerId && roomId && displayName && isEnabled) {
      console.log('🔌 Initializing signaling room discovery...');
      
      // Delay to ensure P2P is stable first
      const timeout = setTimeout(() => {
        connectToSignaling();
      }, 2000);

      return () => clearTimeout(timeout);
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (healthCheckIntervalRef.current) {
        clearInterval(healthCheckIntervalRef.current);
      }
      if (socketRef.current) {
        console.log('🔌 Disconnecting from signaling server');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [myPeerId, roomId, displayName, isEnabled, connectToSignaling]);

  // Manual room peer refresh
  const refreshRoomPeers = useCallback(() => {
    if (socketRef.current?.connected && myPeerId) {
      console.log('🔄 Manually refreshing room peers');
      socketRef.current.emit('join-room', {
        roomId,
        peerId: myPeerId,
        displayName
      });
    } else if (isEnabled) {
      console.log('🔄 Signaling not connected, attempting to reconnect...');
      connectToSignaling();
    } else {
      console.log('🔄 Cannot refresh - signaling disabled');
    }
  }, [roomId, myPeerId, displayName, isEnabled, connectToSignaling]);

  // Manual enable/disable toggle
  const toggleSignaling = useCallback((enabled: boolean) => {
    console.log('🔌 Manually toggling signaling:', enabled ? 'enabled' : 'disabled');
    setIsEnabled(enabled);
    setConnectionAttempts(0);
    
    if (!enabled && socketRef.current) {
      socketRef.current.disconnect();
      setIsConnected(false);
      setRoomPeers([]);
    } else if (enabled && myPeerId && roomId) {
      connectToSignaling();
    }
  }, [myPeerId, roomId, connectToSignaling]);

  // Force reconnection
  const forceReconnect = useCallback(() => {
    console.log('🔄 Force reconnecting to signaling server');
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    setIsConnected(false);
    setConnectionAttempts(0);
    setTimeout(() => {
      if (isEnabled) {
        connectToSignaling();
      }
    }, 1000);
  }, [isEnabled, connectToSignaling]);

  // Enhanced debug information
  const getExtendedDebugInfo = useCallback(() => {
    const debugInfo = getSignalingDebugInfo();
    return {
      ...debugInfo,
      isConnected,
      isEnabled,
      roomPeers: roomPeers.length,
      connectionAttempts,
      currentSignalingUrl,
      socketConnected: socketRef.current?.connected || false,
      socketId: socketRef.current?.id,
      myPeerId,
      roomId,
      displayName
    };
  }, [isConnected, isEnabled, roomPeers.length, connectionAttempts, currentSignalingUrl, myPeerId, roomId, displayName]);

  return {
    isSignalingConnected: isConnected,
    isSignalingEnabled: isEnabled,
    roomPeers,
    connectionAttempts,
    currentSignalingUrl,
    refreshRoomPeers,
    toggleSignaling,
    forceReconnect,
    signalingSocket: socketRef.current,
    // Enhanced debug info
    getDebugInfo: getExtendedDebugInfo
  };
}