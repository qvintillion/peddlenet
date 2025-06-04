'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

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
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const healthCheckIntervalRef = useRef<NodeJS.Timeout>();

  // FIXED: Better signaling URL detection for mobile
  const getSignalingUrl = useCallback(() => {
    if (typeof window === 'undefined') return null;
    
    // Environment variable takes priority (set by mobile-dev.sh)
    const envSignalingUrl = process.env.NEXT_PUBLIC_SIGNALING_SERVER;
    if (envSignalingUrl) {
      console.log('🔌 Using configured signaling server:', envSignalingUrl);
      return envSignalingUrl;
    }
    
    // For mobile testing: detect if we're on ngrok and try to construct signaling URL
    const currentUrl = window.location.origin;
    const currentHost = window.location.hostname;
    
    if (currentHost.includes('ngrok')) {
      // We're on ngrok, but we need a separate tunnel for signaling
      // This will only work if dual tunnels are set up properly
      console.log('🔌 Detected ngrok environment, need separate signaling tunnel');
      console.log('🔌 Check mobile-dev.sh script for proper dual tunnel setup');
      return null; // Fallback to P2P-only mode
    }
    
    // Local development - check if signaling server is actually running
    if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
      // Test if signaling server is reachable before returning URL
      console.log('🔌 Testing localhost signaling server...');
      return 'http://localhost:3001';
    }
    
    // Production or unknown environment - disable signaling
    console.log('🔌 Unknown environment, disabling signaling (using direct P2P only)');
    return null;
  }, []);

  // Test signaling server connectivity
  const testSignalingConnectivity = useCallback(async (url: string): Promise<boolean> => {
    try {
      console.log('🔍 Testing signaling server connectivity:', url);
      const response = await fetch(`${url}/health`, { 
        method: 'GET',
        timeout: 5000,
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Signaling server health check passed:', data);
        return true;
      } else {
        console.warn('⚠️ Signaling server health check failed:', response.status);
        return false;
      }
    } catch (error) {
      console.warn('❌ Signaling server unreachable:', error);
      return false;
    }
  }, []);

  // Enhanced connection with mobile optimizations
  const connectToSignaling = useCallback(async () => {
    if (!myPeerId || !roomId || !isEnabled || socketRef.current?.connected) return;

    const signalingUrl = getSignalingUrl();
    if (!signalingUrl) {
      console.log('🔌 No signaling server configured - using direct P2P only');
      setIsEnabled(false);
      return;
    }

    // Test connectivity first
    const isReachable = await testSignalingConnectivity(signalingUrl);
    if (!isReachable) {
      console.log('🔌 Signaling server not reachable - falling back to direct P2P');
      setIsEnabled(false);
      return;
    }

    try {
      console.log('🔌 Connecting to signaling server:', signalingUrl);
      setConnectionAttempts(prev => prev + 1);

      const socket = io(signalingUrl, {
        transports: ['websocket', 'polling'],
        timeout: 8000, // Longer timeout for mobile networks
        forceNew: true,
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 2000,
        // Mobile-specific socket.io options
        upgrade: true,
        rememberUpgrade: true,
        pingTimeout: 60000,
        pingInterval: 25000
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
        
        // Only attempt reconnection for certain disconnect reasons
        if (reason === 'io server disconnect' || reason === 'ping timeout') {
          console.log('🔄 Will attempt to reconnect to signaling server...');
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          reconnectTimeoutRef.current = setTimeout(() => {
            if (connectionAttempts < 5) {
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
        
        if (connectionAttempts >= 3) {
          console.log('🔌 Multiple connection failures, disabling signaling for this session');
          setIsEnabled(false);
        }
      });

      // Room peer discovery events
      socket.on('room-peers', (peers: RoomPeer[]) => {
        console.log('👥 Discovered room peers:', peers.length, peers.map(p => p.displayName));
        setRoomPeers(peers);
        events.onRoomPeersUpdate(peers);
      });

      socket.on('peer-joined', (peer: RoomPeer) => {
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

    } catch (error) {
      console.error('❌ Failed to initialize signaling connection:', error);
      setIsConnected(false);
      setIsEnabled(false);
    }
  }, [myPeerId, roomId, displayName, isEnabled, getSignalingUrl, testSignalingConnectivity, events, connectionAttempts]);

  // Initialize signaling connection (with delay for P2P to initialize first)
  useEffect(() => {
    if (myPeerId && roomId && displayName && isEnabled) {
      console.log('🔌 Initializing signaling room discovery...');
      
      // Longer delay to ensure P2P is stable first
      const timeout = setTimeout(() => {
        connectToSignaling();
      }, 3000);

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
    } else {
      console.log('🔄 Cannot refresh - signaling not connected');
    }
  }, [roomId, myPeerId, displayName]);

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

  return {
    isSignalingConnected: isConnected,
    isSignalingEnabled: isEnabled,
    roomPeers,
    connectionAttempts,
    refreshRoomPeers,
    toggleSignaling,
    forceReconnect,
    signalingSocket: socketRef.current,
    // Debug info
    currentSignalingUrl: getSignalingUrl()
  };
}