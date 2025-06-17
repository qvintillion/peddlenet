'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { generateCompatibleUUID } from '../utils/peer-utils';
import { useConnectionPerformance } from './use-connection-performance';

// 🔥 INSTANT CONNECTION OPTIMIZED CHAT HOOK
// Designed for sub-500ms connection times
export function useInstantChat(roomId: string, displayName: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [connectedPeers, setConnectedPeers] = useState<string[]>([]);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  const socketRef = useRef<Socket | null>(null);
  const messageHandlersRef = useRef<Set<(message: Message) => void>>(new Set());
  const myPeerId = useRef<string>(generateCompatibleUUID());
  const connectionStartTime = useRef<number>(0);
  
  // 🔥 PERFORMANCE TRACKING
  const { recordConnectionSuccess } = useConnectionPerformance();
  
  const effectiveDisplayName = displayName && displayName.trim() ? displayName.trim() : null;

  // 🔥 OPTIMIZATION: Pre-determine WebSocket URL (no runtime calculations)
  const getWebSocketUrl = useCallback(() => {
    // Priority 1: Environment variable (fastest)
    if (process.env.NEXT_PUBLIC_SIGNALING_SERVER) {
      return process.env.NEXT_PUBLIC_SIGNALING_SERVER;
    }
    
    // Priority 2: Pre-determined URLs based on simple checks
    if (typeof window === 'undefined') {
      return 'wss://peddlenet-websocket-server-staging-hfttiarlja-uc.a.run.app';
    }
    
    const hostname = window.location.hostname;
    
    // 🔥 SPEED: Use lookup table instead of multiple includes() calls
    const urlMap: Record<string, string> = {
      'localhost': 'ws://localhost:3001',
      '127.0.0.1': 'ws://localhost:3001',
      'peddlenet.app': 'wss://peddlenet-websocket-server-hfttiarlja-uc.a.run.app'
    };
    
    if (urlMap[hostname]) {
      return urlMap[hostname];
    }
    
    // Quick pattern matching
    if (hostname.startsWith('192.168.') || hostname.startsWith('10.') || hostname.startsWith('172.')) {
      return `ws://${hostname}:3001`;
    }
    
    if (hostname.includes('firebase') || hostname.includes('web.app')) {
      return 'wss://peddlenet-websocket-server-staging-hfttiarlja-uc.a.run.app';
    }
    
    if (hostname.includes('vercel.app')) {
      return 'wss://peddlenet-websocket-server-hfttiarlja-uc.a.run.app';
    }
    
    // Default fallback
    return 'wss://peddlenet-websocket-server-staging-hfttiarlja-uc.a.run.app';
  }, []);

  // 🔥 OPTIMIZATION: Streamlined connection function
  const connectToServer = useCallback(() => {
    if (!roomId || !effectiveDisplayName || socketRef.current?.connected || isRetrying) {
      return;
    }
    
    connectionStartTime.current = Date.now();
    console.log('⚡ INSTANT CHAT: Starting connection...');
    
    // Clean up existing socket quickly
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    
    const serverUrl = getWebSocketUrl();
    setIsRetrying(true);
    
    try {
      // 🔥 ULTRA-FAST Socket.IO Configuration
      const socket = io(serverUrl, {
        transports: ['websocket'], // Skip polling entirely
        timeout: 3000, // 3s timeout for instant feedback
        forceNew: true,
        autoConnect: false,
        reconnection: false, // Handle manually for speed
        upgrade: false,
        rememberUpgrade: false,
        // Speed optimizations
        closeOnBeforeunload: false,
        withCredentials: false,
        timestampRequests: false,
        timestampParam: false,
        // Additional speed tweaks
        randomizationFactor: 0, // No randomization delay
        maxReconnectionAttempts: 0 // No auto-reconnection
      });
      
      socketRef.current = socket;
      
      // Connection success - measure speed
      socket.on('connect', () => {
        const connectionTime = Date.now() - connectionStartTime.current;
        console.log(`⚡ INSTANT CHAT: Connected in ${connectionTime}ms! Socket ID: ${socket.id}`);
        
        // 🔥 PERFORMANCE: Record metrics
        recordConnectionSuccess(connectionStartTime.current);
        
        setIsConnected(true);
        setIsRetrying(false);
        setRetryCount(0);
        
        // 🔥 INSTANT ROOM JOIN - No delay
        socket.emit('join-room', {
          roomId,
          peerId: myPeerId.current,
          displayName: effectiveDisplayName
        });
      });
      
      // Quick error handling
      socket.on('connect_error', (error) => {
        const connectionTime = Date.now() - connectionStartTime.current;
        console.error(`⚡ INSTANT CHAT: Connection failed in ${connectionTime}ms:`, error.message);
        
        setIsConnected(false);
        setIsRetrying(false);
        
        // Fast retry logic - maximum 1 retry
        if (retryCount < 1) {
          console.log('⚡ INSTANT CHAT: Quick retry in 1s...');
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            connectToServer();
          }, 1000);
        }
      });
      
      // Disconnection
      socket.on('disconnect', (reason) => {
        console.log('⚡ INSTANT CHAT: Disconnected:', reason);
        setIsConnected(false);
      });
      
      // 🔥 STREAMLINED MESSAGE HANDLING
      socket.on('chat-message', (message: any) => {
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
          // Quick duplicate check
          if (prev.some(m => m.id === normalizedMessage.id)) {
            return prev;
          }
          return [...prev, normalizedMessage].sort((a, b) => a.timestamp - b.timestamp);
        });
        
        // Notify handlers
        messageHandlersRef.current.forEach(handler => {
          try {
            handler(normalizedMessage);
          } catch (e) {
            console.error('⚡ INSTANT CHAT: Handler error:', e);
          }
        });
      });
      
      // 🔥 STREAMLINED PEER MANAGEMENT
      socket.on('room-peers', (peers: any[]) => {
        const validPeers = peers
          ?.filter(p => p?.displayName && p.displayName !== effectiveDisplayName)
          ?.map(p => p.displayName.trim()) || [];
        
        setConnectedPeers(Array.from(new Set(validPeers)));
      });
      
      socket.on('peer-joined', (peer: any) => {
        if (peer?.displayName && peer.displayName !== effectiveDisplayName) {
          const trimmedName = peer.displayName.trim();
          setConnectedPeers(prev => 
            prev.includes(trimmedName) ? prev : [...prev, trimmedName]
          );
        }
      });
      
      socket.on('peer-left', (peer: any) => {
        if (peer?.displayName) {
          const trimmedName = peer.displayName.trim();
          setConnectedPeers(prev => prev.filter(name => name !== trimmedName));
        }
      });
      
      // Message history
      socket.on('message-history', (messageHistory: Message[]) => {
        if (messageHistory?.length > 0) {
          setMessages(messageHistory.sort((a, b) => a.timestamp - b.timestamp));
        }
      });
      
      // 🔥 START CONNECTION IMMEDIATELY
      socket.connect();
      
    } catch (error) {
      console.error('⚡ INSTANT CHAT: Socket creation failed:', error);
      setIsRetrying(false);
    }
    
  }, [roomId, effectiveDisplayName, getWebSocketUrl, retryCount, isRetrying]);

  // 🔥 INSTANT CONNECTION - No delays, no timers
  useEffect(() => {
    if (roomId && effectiveDisplayName && !isConnected && !isRetrying && !socketRef.current?.connected) {
      console.log('⚡ INSTANT CHAT: Connecting immediately...');
      connectToServer();
    }
  }, [roomId, effectiveDisplayName, isConnected, isRetrying, connectToServer]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  // 🔥 OPTIMIZED MESSAGE SENDING
  const sendMessage = useCallback((messageData: Omit<Message, 'id' | 'timestamp'>) => {
    const socket = socketRef.current;
    
    if (!socket?.connected || !effectiveDisplayName) {
      return generateCompatibleUUID();
    }

    const messageId = generateCompatibleUUID();
    
    // Send immediately with minimal payload
    socket.emit('chat-message', {
      roomId,
      message: {
        content: messageData.content,
        id: messageId
      }
    });
    
    return messageId;
  }, [roomId, effectiveDisplayName]);

  // Message handler registration
  const onMessage = useCallback((handler: (message: Message) => void) => {
    messageHandlersRef.current.add(handler);
    return () => messageHandlersRef.current.delete(handler);
  }, []);

  // Force reconnect
  const forceReconnect = useCallback(async () => {
    console.log('⚡ INSTANT CHAT: Force reconnect...');
    setRetryCount(0);
    setMessages([]);
    setConnectedPeers([]);
    
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    
    setIsConnected(false);
    setIsRetrying(false);
    
    // Immediate reconnect
    setTimeout(connectToServer, 100);
    return true;
  }, [connectToServer]);

  const status: ConnectionStatus = {
    isConnected,
    connectedPeers: connectedPeers.length,
    networkReach: isConnected ? 'server' as const : 'isolated' as const,
    signalStrength: isConnected ? 'strong' as const : 'none' as const,
  };

  // Return compatible interface
  return {
    // Core properties
    peerId: myPeerId.current,
    status,
    messages,
    
    // Core functions
    sendMessage,
    onMessage,
    forceReconnect,
    
    // Compatibility
    isRetrying,
    retryCount,
    getConnectedPeers: () => connectedPeers,
    
    // Debugging
    getConnectionDiagnostics: () => ({
      mode: 'instant-websocket',
      connected: isConnected,
      serverUrl: getWebSocketUrl(),
      retryCount,
      peers: connectedPeers.length,
      messages: messages.length,
      socketId: socketRef.current?.id || null,
      transport: socketRef.current?.io?.engine?.transport?.name || 'none'
    })
  };
}
