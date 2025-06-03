'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface SignalingPeer {
  peerId: string;
  displayName: string;
  socketId?: string;
  joinedAt?: number;
}

export function useSignalingClient(roomId: string, peerId: string | null, displayName: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [signalingPeers, setSignalingPeers] = useState<SignalingPeer[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const socketRef = useRef<Socket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Initialize signaling connection
  useEffect(() => {
    if (!roomId || !peerId || !displayName) return;

    // Enhanced signaling server URL detection
    let SIGNALING_SERVER = process.env.NEXT_PUBLIC_SIGNALING_SERVER;
    
    // TEMPORARY: Disable signaling server for ngrok free tier testing
    if (typeof window !== 'undefined' && window.location.hostname.includes('ngrok')) {
      console.log('🔌 ngrok detected - signaling disabled (free tier limitation)');
      setError('Signaling disabled for ngrok testing');
      return;
    }
    
    if (!SIGNALING_SERVER && typeof window !== 'undefined') {
      if (window.location.hostname === 'localhost') {
        // Local development - signaling server on different port
        SIGNALING_SERVER = 'http://localhost:3001';
      } else {
        // Production - same domain, assume port 3001 or proxy
        SIGNALING_SERVER = `${window.location.protocol}//${window.location.hostname}:3001`;
      }
    }
    
    if (!SIGNALING_SERVER) {
      console.log('🔌 Signaling server disabled - using localStorage-only peer discovery');
      setError('Signaling server disabled');
      return;
    }
    
    console.log('🔌 Connecting to signaling server:', SIGNALING_SERVER);
    
    const newSocket = io(SIGNALING_SERVER, {
      transports: ['websocket', 'polling'],
      timeout: 15000, // Increased timeout for mobile/slow connections
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 2000,
      // Enhanced options for better reliability
      upgrade: true,
      rememberUpgrade: false,
      autoConnect: true
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to signaling server');
      setIsConnected(true);
      setError(null);
      reconnectAttempts.current = 0;
      
      // Join room for peer discovery
      newSocket.emit('join-room', {
        roomId,
        peerId,
        displayName
      });
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from signaling server:', reason);
      setIsConnected(false);
      setSignalingPeers([]);
    });

    newSocket.on('connect_error', (error) => {
      console.error('🔌 Signaling connection error:', error);
      setError(`Connection failed: ${error.message}`);
      setIsConnected(false);
      
      reconnectAttempts.current++;
      if (reconnectAttempts.current >= maxReconnectAttempts) {
        console.log('❌ Signaling server connection failed - falling back to localStorage-only discovery');
        setError('Signaling unavailable - using local discovery only');
        // Set peers to empty array but don't block the app
        setSignalingPeers([]);
        setIsConnected(false);
      }
    });

    // Room events
    newSocket.on('room-peers', (peers: SignalingPeer[]) => {
      console.log('👥 Signaling server found peers:', peers);
      setSignalingPeers(peers);
    });

    newSocket.on('peer-joined', (peer: SignalingPeer) => {
      console.log('👋 Peer joined via signaling:', peer.peerId);
      setSignalingPeers(prev => {
        const exists = prev.some(p => p.peerId === peer.peerId);
        if (exists) return prev;
        return [...prev, peer];
      });
    });

    newSocket.on('peer-left', (peer: SignalingPeer) => {
      console.log('👋 Peer left via signaling:', peer.peerId);
      setSignalingPeers(prev => prev.filter(p => p.peerId !== peer.peerId));
    });

    newSocket.on('room-message', (message) => {
      console.log('📢 Room announcement:', message);
    });

    // Connection health monitoring
    const healthCheck = setInterval(() => {
      if (newSocket.connected) {
        newSocket.emit('ping');
      }
    }, 30000);

    newSocket.on('pong', () => {
      console.log('🏓 Signaling server pong received');
    });

    setSocket(newSocket);
    socketRef.current = newSocket;

    return () => {
      console.log('🧹 Cleaning up signaling connection');
      clearInterval(healthCheck);
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, [roomId, peerId, displayName]);

  // Get all discovered peers (signaling + local storage)
  const getAllDiscoveredPeers = useCallback((): string[] => {
    const signalingPeerIds = signalingPeers.map(p => p.peerId);
    const localStoragePeers: string[] = [];
    
    // Also check localStorage for local peers (same device)
    if (typeof window !== 'undefined') {
      const roomPrefix = `presence_v2_${roomId}_`;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(roomPrefix) && !key.endsWith(`_${peerId}`)) {
          try {
            const data = JSON.parse(localStorage.getItem(key) || '{}');
            if (data.peerId && data.peerId !== peerId) {
              localStoragePeers.push(data.peerId);
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    }
    
    // Combine and deduplicate
    const allPeers = [...new Set([...signalingPeerIds, ...localStoragePeers])];
    console.log('🔍 All discovered peers:', {
      signaling: signalingPeerIds.length,
      localStorage: localStoragePeers.length,
      total: allPeers.length,
      peers: allPeers
    });
    
    return allPeers;
  }, [signalingPeers, roomId, peerId]);

  // Announce room message
  const announceToRoom = useCallback((message: string, type = 'announcement') => {
    if (!socketRef.current || !isConnected) return false;

    socketRef.current.emit('room-message', {
      roomId,
      message: {
        content: message,
        sender: displayName,
        peerId
      },
      type
    });
    return true;
  }, [roomId, displayName, peerId, isConnected]);

  return {
    // Connection state
    isConnected,
    error,
    
    // Peer discovery
    signalingPeers,
    getAllDiscoveredPeers,
    
    // Utilities
    announceToRoom,
    
    // Status
    getSignalingStatus: () => ({
      connected: isConnected,
      error,
      peersFromSignaling: signalingPeers.length,
      totalDiscovered: getAllDiscoveredPeers().length,
      reconnectAttempts: reconnectAttempts.current
    })
  };
}
