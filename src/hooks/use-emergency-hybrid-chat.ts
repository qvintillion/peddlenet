'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { generateCompatibleUUID } from '../utils/peer-utils';

// EMERGENCY SIMPLIFIED WebSocket-only Chat Hook
// This bypasses all complex hybrid logic and WebRTC to focus only on basic chat functionality
export function useEmergencyHybridChat(roomId: string, displayName: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [connectedPeers, setConnectedPeers] = useState<string[]>([]);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  const socketRef = useRef<Socket | null>(null);
  const messageHandlersRef = useRef<Set<(message: Message) => void>>(new Set());
  const myPeerId = useRef<string>(generateCompatibleUUID());
  
  const effectiveDisplayName = displayName && displayName.trim() ? displayName.trim() : null;

  // EMERGENCY: Ultra-simple WebSocket URL detection
  const getEmergencyWebSocketUrl = useCallback(() => {
    // STEP 1: Check environment variable first (THIS SHOULD WORK!)
    if (process.env.NEXT_PUBLIC_SIGNALING_SERVER) {
      console.log('🚨 EMERGENCY: Using env WebSocket URL:', process.env.NEXT_PUBLIC_SIGNALING_SERVER);
      return process.env.NEXT_PUBLIC_SIGNALING_SERVER;
    }
    
    if (typeof window === 'undefined') {
      return 'wss://peddlenet-websocket-server-staging-hfttiarlja-uc.a.run.app';
    }
    
    const hostname = window.location.hostname;
    console.log('🚨 EMERGENCY: Hostname detected:', hostname);
    
    // STEP 2: Simple hostname detection
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // CRITICAL FIX: In development, only use local server if it's actually running
      // Otherwise use staging server for admin dashboard compatibility
      return 'ws://localhost:3001';
    }
    
    if (hostname.includes('192.168.') || hostname.includes('10.') || hostname.includes('172.')) {
      return `ws://${hostname}:3001`;
    }
    
    if (hostname.includes('firebase') || hostname.includes('web.app')) {
      return 'wss://peddlenet-websocket-server-staging-hfttiarlja-uc.a.run.app';
    }
    
    if (hostname.includes('vercel.app') || hostname === 'peddlenet.app') {
      return 'wss://peddlenet-websocket-server-hfttiarlja-uc.a.run.app';
    }
    
    // STEP 3: Default fallback to staging
    const fallback = 'wss://peddlenet-websocket-server-staging-hfttiarlja-uc.a.run.app';
    console.log('🚨 EMERGENCY: Using fallback WebSocket URL:', fallback);
    return fallback;
  }, []);

  // EMERGENCY: Ultra-simple connection function with AGGRESSIVE debugging
  const connectToServer = useCallback(() => {
    console.log('🚨 EMERGENCY: connectToServer called', {
      roomId,
      effectiveDisplayName,
      socketConnected: socketRef.current?.connected,
      isRetrying
    });
    
    if (!roomId || !effectiveDisplayName) {
      console.error('🚨 EMERGENCY: Missing roomId or displayName', { roomId, effectiveDisplayName });
      return;
    }
    
    if (socketRef.current?.connected) {
      console.log('🚨 EMERGENCY: Already connected, skipping');
      return;
    }
    
    if (isRetrying) {
      console.log('🚨 EMERGENCY: Already retrying, skipping');
      return;
    }
    
    // Clean up existing socket
    if (socketRef.current) {
      console.log('🚨 EMERGENCY: Disconnecting existing socket');
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    
    const serverUrl = getEmergencyWebSocketUrl();
    console.log('🚨 EMERGENCY: Attempting connection to:', serverUrl);
    console.log('🚨 EMERGENCY: Environment variables:', {
      NEXT_PUBLIC_SIGNALING_SERVER: process.env.NEXT_PUBLIC_SIGNALING_SERVER,
      BUILD_TARGET: process.env.BUILD_TARGET,
      NODE_ENV: process.env.NODE_ENV
    });
    
    setIsRetrying(true);
    
    // 🔥 OPTIMIZATION: Socket.IO configuration optimized for speed
    try {
      const socket = io(serverUrl, {
        transports: ['websocket'], // Only WebSocket for speed
        timeout: 5000, // 🔥 Reduced from 15s to 5s
        forceNew: true,
        autoConnect: false, // Manual connection control
        reconnection: false, // Let our logic handle reconnection
        upgrade: false,
        rememberUpgrade: false,
        // 🔥 SPEED OPTIMIZATIONS:
        closeOnBeforeunload: false, // Prevent unnecessary closes
        withCredentials: false, // Skip credential checks
        timestampRequests: false, // Skip timestamp overhead
        timestampParam: false
      });
      
      socketRef.current = socket;
      
      // Start connection manually
      console.log('🚨 EMERGENCY: Starting manual connection...');
      socket.connect();
      
      // Connection success
      socket.on('connect', () => {
        console.log('🚨 EMERGENCY: ✅ CONNECTION SUCCESSFUL! Socket ID:', socket.id);
        console.log('🚨 EMERGENCY: Transport:', socket.io.engine.transport.name);
        
        setIsConnected(true);
        setIsRetrying(false);
        setRetryCount(0);
        
        // Join room immediately
        const joinData = {
          roomId,
          peerId: myPeerId.current,
          displayName: effectiveDisplayName
        };
        
        console.log('🚨 EMERGENCY: Joining room with data:', joinData);
        socket.emit('join-room', joinData);
      });
      
      // Connection failure
      socket.on('connect_error', (error) => {
        console.error('🚨 EMERGENCY: ❌ CONNECTION FAILED:', {
          message: error.message,
          type: error.type,
          description: error.description,
          serverUrl,
          attempt: retryCount + 1
        });
        
        setIsConnected(false);
        setIsRetrying(false);
        
        // Simple retry logic - only retry 2 times
        if (retryCount < 2) {
          const delay = 5000 * (retryCount + 1); // 5s, 10s
          console.log(`🚨 EMERGENCY: Will retry in ${delay}ms (attempt ${retryCount + 1}/2)`);
          
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            connectToServer();
          }, delay);
        } else {
          console.error('🚨 EMERGENCY: ❌ MAX RETRIES REACHED - Chat will not work!');
          console.error('🚨 EMERGENCY: Check if WebSocket server is running at:', serverUrl);
        }
      });
      
      // Disconnection
      socket.on('disconnect', (reason) => {
        console.log('🚨 EMERGENCY: Disconnected:', reason);
        setIsConnected(false);
        
        // Only auto-reconnect for unexpected disconnections (not user-initiated)
        if (reason !== 'io client disconnect' && reason !== 'io server disconnect' && retryCount < 2) {
          console.log('🚨 EMERGENCY: Unexpected disconnect, will auto-reconnect in 3s...');
          setTimeout(() => {
            console.log('🚨 EMERGENCY: Auto-reconnecting after disconnect...');
            connectToServer();
          }, 3000);
        }
      });
      
      // EMERGENCY: Log all events for debugging
      socket.onAny((eventName, ...args) => {
        console.log(`🚨 EMERGENCY: Socket event "${eventName}":`, args);
      });
      
      // Message handling
      socket.on('chat-message', (message: any) => {
        console.log('🚨 EMERGENCY: 📨 Message received:', message);
        
        const normalizedMessage: Message = {
          id: message.id || generateCompatibleUUID(),
          content: message.content || '',
          sender: message.sender || 'Unknown',
          timestamp: message.timestamp || Date.now(),
          type: message.type || 'chat',
          roomId: roomId,
          synced: true
        };
        
        setMessages(prev => {
          const isDuplicate = prev.some(m => m.id === normalizedMessage.id);
          if (isDuplicate) {
            console.log('🚨 EMERGENCY: Ignoring duplicate message:', normalizedMessage.id);
            return prev;
          }
          
          const updated = [...prev, normalizedMessage].sort((a, b) => a.timestamp - b.timestamp);
          console.log('🚨 EMERGENCY: Messages updated, total:', updated.length);
          return updated;
        });
        
        // Notify handlers
        messageHandlersRef.current.forEach(handler => {
          try {
            handler(normalizedMessage);
          } catch (e) {
            console.error('🚨 EMERGENCY: Message handler error:', e);
          }
        });
      });
      
      // Peer management
      socket.on('room-peers', (peers: any[]) => {
        console.log('🚨 EMERGENCY: 👥 Room peers received:', peers);
        
        const validPeers = peers
          .filter(p => p && p.displayName && p.displayName !== effectiveDisplayName)
          .map(p => p.displayName.trim());
        
        const uniquePeers = Array.from(new Set(validPeers));
        console.log('🚨 EMERGENCY: Valid unique peers:', uniquePeers);
        setConnectedPeers(uniquePeers);
      });
      
      socket.on('peer-joined', (peer: any) => {
        if (peer && peer.displayName && peer.displayName !== effectiveDisplayName) {
          const trimmedName = peer.displayName.trim();
          console.log('🚨 EMERGENCY: 👋 Peer joined:', trimmedName);
          
          setConnectedPeers(prev => {
            if (prev.includes(trimmedName)) return prev;
            return [...prev, trimmedName];
          });
        }
      });
      
      socket.on('peer-left', (peer: any) => {
        if (peer && peer.displayName) {
          const trimmedName = peer.displayName.trim();
          console.log('🚨 EMERGENCY: 👋 Peer left:', trimmedName);
          
          setConnectedPeers(prev => prev.filter(name => name !== trimmedName));
        }
      });
      
      // Message history
      socket.on('message-history', (messageHistory: Message[]) => {
        console.log('🚨 EMERGENCY: 📚 Message history received:', messageHistory.length);
        if (messageHistory.length > 0) {
          const sortedHistory = messageHistory.sort((a, b) => a.timestamp - b.timestamp);
          setMessages(sortedHistory);
          console.log('🚨 EMERGENCY: Message history loaded, total messages:', sortedHistory.length);
        }
      });
      
    } catch (error) {
      console.error('🚨 EMERGENCY: Failed to create socket:', error);
      setIsRetrying(false);
    }
    
  }, [roomId, effectiveDisplayName, getEmergencyWebSocketUrl, retryCount, isRetrying]);

  // Auto-connect when ready - 🔥 OPTIMIZED FOR INSTANT CONNECTION
  useEffect(() => {
    console.log('🚨 EMERGENCY: useEffect triggered', {
      roomId,
      effectiveDisplayName,
      isConnected,
      isRetrying,
      socketExists: !!socketRef.current,
      socketConnected: socketRef.current?.connected
    });
    
    if (roomId && effectiveDisplayName && !isConnected && !isRetrying && !socketRef.current?.connected) {
      console.log('🚨 EMERGENCY: ⚡ Starting INSTANT connect (no delay)...');
      // 🔥 OPTIMIZATION: Remove 2-second delay for instant connection
      connectToServer();
    }
  }, [roomId, effectiveDisplayName, isConnected, isRetrying, connectToServer]);

  // Cleanup
  useEffect(() => {
    return () => {
      console.log('🚨 EMERGENCY: 🧹 Component cleanup - disconnecting');
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  // Send message function
  const sendMessage = useCallback((messageData: Omit<Message, 'id' | 'timestamp'>) => {
    const socket = socketRef.current;
    
    console.log('🚨 EMERGENCY: 📤 Attempting to send message:', {
      content: messageData.content,
      socketExists: !!socket,
      socketConnected: socket?.connected,
      effectiveDisplayName,
      roomId
    });
    
    if (!socket || !socket.connected || !effectiveDisplayName) {
      console.error('🚨 EMERGENCY: ❌ Cannot send message - not connected or missing name');
      return generateCompatibleUUID();
    }

    const messageId = generateCompatibleUUID();
    
    const messagePayload = {
      roomId,
      message: {
        content: messageData.content,
        id: messageId
      }
    };
    
    console.log('🚨 EMERGENCY: 📤 Sending message payload:', messagePayload);
    socket.emit('chat-message', messagePayload);
    
    return messageId;
  }, [roomId, effectiveDisplayName]);

  // Message handler registration
  const onMessage = useCallback((handler: (message: Message) => void) => {
    messageHandlersRef.current.add(handler);
    return () => {
      messageHandlersRef.current.delete(handler);
    };
  }, []);

  // Force reconnect
  const forceReconnect = useCallback(async () => {
    console.log('🚨 EMERGENCY: 🔄 Force reconnect requested');
    setRetryCount(0);
    setMessages([]);
    setConnectedPeers([]);
    
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    
    setIsConnected(false);
    setIsRetrying(false);
    
    setTimeout(() => {
      console.log('🚨 EMERGENCY: 🔄 Starting force reconnect...');
      connectToServer();
    }, 1000);
    
    return true;
  }, [connectToServer]);

  const status: ConnectionStatus = {
    isConnected,
    connectedPeers: connectedPeers.length,
    networkReach: isConnected ? 'server' as const : 'isolated' as const,
    signalStrength: isConnected ? 'strong' as const : 'none' as const,
  };

  // EMERGENCY: Return simplified hybrid-compatible interface (WebSocket only, no WebRTC)
  return {
    // Core properties matching hybrid interface
    peerId: myPeerId.current,
    status,
    messages,
    
    // Core functions
    sendMessage,
    onMessage,
    forceReconnect,
    
    // Hybrid compatibility (all disabled/mocked for emergency)
    meshEnabled: false,
    setMeshEnabled: () => {},
    attemptWebRTCUpgrade: async () => {
      console.log('🚨 EMERGENCY: WebRTC upgrade disabled in emergency mode');
      return false;
    },
    
    // Route management (WebSocket only)
    preferredRoute: 'websocket' as const,
    setPreferredRoute: () => {},
    currentRoute: 'websocket' as const,
    
    // Connection info
    connectionQuality: {
      webSocket: { latency: 0, reliability: isConnected ? 100 : 0, available: isConnected },
      webrtc: { latency: 0, reliability: 0, available: false }
    },
    hybridStats: {
      webSocketMessages: messages.length,
      webrtcMessages: 0,
      duplicatesFiltered: 0,
      routingDecisions: 0
    },
    
    // Individual connection access
    webSocket: {
      status,
      connected: isConnected,
      quality: 'good' as const,
      peers: connectedPeers,
      messages: messages
    },
    p2p: {
      status: {
        isConnected: false,
        connectedPeers: 0,
        networkReach: 'isolated' as const,
        signalStrength: 'none' as const
      },
      connected: false,
      peers: [],
      queuedMessages: 0
    },
    
    // Legacy compatibility
    isRetrying,
    retryCount,
    connectionQuality: 'good' as const,
    connectToPeer: async () => {
      console.log('🚨 EMERGENCY: P2P connections disabled in emergency mode');
      return false;
    },
    getConnectedPeers: () => connectedPeers,
    isSignalingConnected: isConnected,
    
    // Debugging
    getConnectionDiagnostics: () => ({
      emergency: true,
      mode: 'WebSocket-only',
      connected: isConnected,
      serverUrl: getEmergencyWebSocketUrl(),
      retryCount,
      peers: connectedPeers.length,
      messages: messages.length,
      socketId: socketRef.current?.id || null,
      transport: socketRef.current?.io?.engine?.transport?.name || 'none'
    })
  };
}
