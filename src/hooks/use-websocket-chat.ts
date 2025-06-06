'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Message, ConnectionStatus } from '@/lib/types';
import { generateCompatibleUUID } from '@/utils/peer-utils';
import { NetworkUtils } from '@/utils/network-utils';
import { MobileNetworkDebug } from '@/utils/mobile-network-debug';

export function useWebSocketChat(roomId: string, displayName?: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [connectedPeers, setConnectedPeers] = useState<string[]>([]);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  const socketRef = useRef<Socket | null>(null);
  const messageHandlersRef = useRef<Set<(message: Message) => void>>(new Set());
  // Don't allow any connection until we have a real display name
  const effectiveDisplayName = displayName && displayName.trim() && displayName !== 'Anonymous' ? displayName.trim() : null;
  const myPeerId = useRef<string>(generateCompatibleUUID());
  const connectionId = useRef<string>(Math.random().toString(36).substring(7)); // Unique ID for debugging
  const roomConnectionRef = useRef<string>(''); // Track which room we're connected to
  const isConnectingRef = useRef(false); // Prevent multiple connections

  const status: ConnectionStatus = {
    isConnected,
    connectedPeers: connectedPeers.length,
    networkReach: isConnected ? 'server' as const : 'isolated' as const,
    signalStrength: isConnected ? 'strong' as const : 'none' as const,
  };

  // Get server URL with IP detection (stable function)
  const getServerUrl = useCallback(async () => {
    if (typeof window === 'undefined') return null;
    
    // Use environment variable if set
    const envUrl = process.env.NEXT_PUBLIC_SIGNALING_SERVER;
    if (envUrl) {
      console.log('Using configured server URL:', envUrl);
      return envUrl;
    }
    
    // For development, try to use detected IP
    if (window.location.hostname === 'localhost') {
      // Try multiple ports since server might be on different port
      const detectedIP = await NetworkUtils.getLocalNetworkIP();
      if (detectedIP !== 'localhost') {
        // Try different ports that server might be running on
        const ports = [3001, 3002, 3003, 3004, 3005];
        for (const port of ports) {
          const testUrl = `http://${detectedIP}:${port}`;
          try {
            // Quick connectivity test
            const response = await fetch(`${testUrl}/health`, { 
              method: 'HEAD',
              signal: AbortSignal.timeout(2000)
            });
            if (response.ok) {
              console.log('Found server at:', testUrl);
              return testUrl;
            }
          } catch (e) {
            // Try next port
          }
        }
        // Fallback to port 3001 even if health check failed
        const fallbackUrl = `http://${detectedIP}:3001`;
        console.log('Using fallback URL (server might not be ready):', fallbackUrl);
        return fallbackUrl;
      }
      console.log('Using localhost fallback');
      return 'http://localhost:3001';
    }
    
    // Production or other environments
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}`;
  }, []); // No dependencies - stable function

  // Connect to server (stable function that doesn't recreate)
  const connectToServer = useCallback(async () => {
    if (!roomId || !effectiveDisplayName || isConnectingRef.current) return;
    
    // Check if already connected to the same room
    if (socketRef.current?.connected && roomConnectionRef.current === roomId) {
      console.log(`🔄 [${connectionId.current}] Already connected to room:`, roomId, 'skipping duplicate');
      return;
    }
    
    // Check for different room - need to disconnect first
    if (socketRef.current?.connected && roomConnectionRef.current !== roomId) {
      console.log(`🔄 [${connectionId.current}] Switching rooms:`, roomConnectionRef.current, '→', roomId);
      socketRef.current.disconnect();
      socketRef.current = null;
      roomConnectionRef.current = '';
    }
    
    isConnectingRef.current = true;
    
    // Disconnect any existing socket first
    if (socketRef.current) {
      console.log('Disconnecting existing socket before new connection');
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    // Get server URL inline to avoid dependency issues
    let serverUrl = null;
    if (typeof window !== 'undefined') {
      const envUrl = process.env.NEXT_PUBLIC_SIGNALING_SERVER;
      if (envUrl) {
        console.log('Using configured server URL:', envUrl);
        serverUrl = envUrl;
      } else if (window.location.hostname === 'localhost') {
        console.log('Using localhost fallback');
        serverUrl = 'http://localhost:3001';
      } else {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        serverUrl = `${protocol}//${window.location.host}`;
      }
    }
    
    if (!serverUrl) {
      console.error('No server URL configured');
      isConnectingRef.current = false;
      return;
    }

    setIsRetrying(true);
    console.log(`🔌 [${connectionId.current}] Connecting to chat server:`, serverUrl, 'as:', effectiveDisplayName);

    const socket = io(serverUrl, {
      transports: ['websocket', 'polling'], // Try websocket first, fallback to polling
      timeout: 10000, // Increased timeout for mobile
      forceNew: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10, // More attempts for mobile
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      maxReconnectionAttempts: 10,
      // Enhanced mobile support
      upgrade: true,
      rememberUpgrade: false, // Don't remember upgrade on mobile
      pingTimeout: 60000,
      pingInterval: 25000,
      // CORS handling
      withCredentials: false,
      // Enhanced error handling
      closeOnBeforeunload: false,
      // Force polling first on mobile (more reliable)
      forceBase64: false
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log(`🚀 [${connectionId.current}] Connected to chat server as:`, effectiveDisplayName);
      setIsConnected(true);
      setIsRetrying(false);
      setRetryCount(0);
      isConnectingRef.current = false;
      roomConnectionRef.current = roomId; // Track connected room
      
      // Join the room
      socket.emit('join-room', {
        roomId,
        peerId: myPeerId.current,
        displayName: effectiveDisplayName
      });
      console.log(`🏠 [${connectionId.current}] Joining room:`, roomId, 'as:', effectiveDisplayName);
      console.log(`🏠 [${connectionId.current}] Server will store displayName:`, effectiveDisplayName, 'in socket.userData');
      console.log(`🏠 [${connectionId.current}] This will be used for message.sender when we send messages`);
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔌 [${connectionId.current}] Disconnected from chat server:`, reason);
      setIsConnected(false);
      isConnectingRef.current = false;
      roomConnectionRef.current = ''; // Clear room tracking
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error.message);
      setIsConnected(false);
      setIsRetrying(false);
      isConnectingRef.current = false;
    });

    // Handle message history
    socket.on('message-history', (messageHistory: Message[]) => {
      console.log('Received message history:', messageHistory.length);
      setMessages(messageHistory);
    });

    // Handle new messages - simplified to match server exactly
    socket.on('chat-message', (message: any) => {
      console.log('📥 RAW message from server:', message);
      console.log('📥 Message type:', typeof message);
      console.log('📥 Message keys:', Object.keys(message || {}));
      console.log('📥 Current effectiveDisplayName:', effectiveDisplayName);
      addMessageToState(message);
    });

    // Helper function to add messages to state
    const addMessageToState = (message: any) => {
      // Normalize message format to match server response
      const normalizedMessage: Message = {
        id: message.id || generateCompatibleUUID(),
        content: message.content || '',
        sender: message.sender || 'Unknown',
        timestamp: message.timestamp || Date.now(),
        type: message.type || 'chat',
        roomId: roomId,
        synced: true
      };
      
      console.log('🔄 Processing message:', {
        original: message,
        normalized: normalizedMessage,
        currentSender: effectiveDisplayName
      });
      
      setMessages(prev => {
        // Check for duplicates by ID or content+timestamp combo
        const isDuplicateById = prev.some(m => m.id === normalizedMessage.id);
        const isDuplicateByContent = prev.some(m => 
          m.content === normalizedMessage.content && 
          m.sender === normalizedMessage.sender &&
          Math.abs(m.timestamp - normalizedMessage.timestamp) < 1000 // Within 1 second
        );
        
        if (isDuplicateById || isDuplicateByContent) {
          console.log('⚠️ Duplicate message ignored:', normalizedMessage.id, {
            byId: isDuplicateById,
            byContent: isDuplicateByContent
          });
          return prev;
        }
        
        console.log('✅ Adding message to state:', normalizedMessage);
        const updated = [...prev, normalizedMessage].sort((a, b) => a.timestamp - b.timestamp);
        console.log('📋 Total messages now:', updated.length);
        return updated;
      });
      
      // Notify message handlers
      messageHandlersRef.current.forEach(handler => {
        try {
          handler(normalizedMessage);
        } catch (e) {
          console.error('Message handler error:', e);
        }
      });
    };

    // Listen for server errors
    socket.on('error', (error) => {
      console.error('🚨 Server error:', error);
    });

    // Listen for any message-related errors
    socket.on('message-error', (error) => {
      console.error('🚨 Message error:', error);
    });

    // Listen for generic server responses
    socket.on('server-response', (response) => {
      console.log('🔔 Server response:', response);
    });

    // Handle peer list updates
    socket.on('room-peers', (peers: any[]) => {
      console.log('Room peers total:', peers.length);
      // Remove duplicates by displayName and exclude self
      const uniquePeerNames = Array.from(new Set(peers.map(p => p.displayName)))
        .filter(name => name !== effectiveDisplayName);
      console.log('Other peers (excluding self):', uniquePeerNames.length, uniquePeerNames);
      setConnectedPeers(uniquePeerNames);
    });

    socket.on('peer-joined', (peer: any) => {
      console.log('Peer joined:', peer.displayName);
      // Only add if it's not ourselves
      if (peer.displayName !== effectiveDisplayName) {
        setConnectedPeers(prev => {
          // Avoid duplicates
          if (prev.includes(peer.displayName)) return prev;
          return [...prev, peer.displayName];
        });
      }
    });

    socket.on('peer-left', (peer: any) => {
      console.log('Peer left:', peer.displayName);
      // Only remove if it's not ourselves (shouldn't happen, but just in case)
      if (peer.displayName !== effectiveDisplayName) {
        setConnectedPeers(prev => prev.filter(name => name !== peer.displayName));
      }
    });

  }, [roomId, effectiveDisplayName]); // Only stable dependencies

  // Initialize connection only after display name is set
  useEffect(() => {
    if (roomId && effectiveDisplayName) {
      console.log(`🚀 [${connectionId.current}] Initializing connection for:`, effectiveDisplayName);
      connectToServer();
    } else {
      console.log(`⏳ [${connectionId.current}] Waiting for valid display name... current:`, displayName, '→', effectiveDisplayName);
      
      // Disconnect if we lose the display name to prevent stale connections
      if (socketRef.current && socketRef.current.connected && !effectiveDisplayName) {
        console.log(`🔌 [${connectionId.current}] Disconnecting due to invalid display name`);
        socketRef.current.disconnect();
        socketRef.current = null;
        roomConnectionRef.current = '';
      }
    }

    return () => {
      if (socketRef.current) {
        console.log(`🛑 [${connectionId.current}] Disconnecting from chat server - cleanup`);
        // More graceful cleanup to avoid "closed before established" errors
        const socket = socketRef.current;
        socketRef.current = null;
        isConnectingRef.current = false;
        roomConnectionRef.current = '';
        
        // Only disconnect if actually connected or connecting
        if (socket.connected || socket.disconnected === false) {
          socket.disconnect();
        }
      }
    };
  }, [roomId, effectiveDisplayName, connectToServer]); // Include connectToServer but it's stable

  // Send message function - simplified to match server exactly
  const sendMessage = useCallback((messageData: Omit<Message, 'id' | 'timestamp'>) => {
    const socket = socketRef.current;
    if (!socket || !socket.connected) {
      console.log('❌ Cannot send message - not connected');
      return generateCompatibleUUID();
    }

    if (!effectiveDisplayName) {
      console.log('❌ Cannot send message - no valid display name');
      return generateCompatibleUUID();
    }

    const messageId = generateCompatibleUUID();
    
    // Use the EXACT format the server expects: { roomId, message: { content } }
    const messagePayload = {
      roomId,
      message: {
        content: messageData.content,
        // Server will override id, sender, timestamp anyway, so don't include them
      }
    };
    
    console.log('📤 Sending message:', messageData.content, 'from:', effectiveDisplayName);
    console.log('📤 Server will use sender:', effectiveDisplayName, '(from socket.userData.displayName)');
    console.log('📤 Message payload:', JSON.stringify(messagePayload, null, 2));
    
    // Send using the exact event name the server listens for
    socket.emit('chat-message', messagePayload);
    
    console.log('✅ Message sent to server - server will broadcast back with own format');
    return messageId;
  }, [roomId, effectiveDisplayName]);

  // Message handler registration
  const onMessage = useCallback((handler: (message: Message) => void) => {
    messageHandlersRef.current.add(handler);
    return () => {
      messageHandlersRef.current.delete(handler);
    };
  }, []);

  // Force reconnect (simple page reload to avoid infinite loops)
  const forceReconnect = useCallback(async () => {
    console.log('Force reconnecting - reloading page...');
    window.location.reload();
    return true;
  }, []); // No dependencies

  return {
    // Core functionality
    peerId: myPeerId.current,
    status,
    isRetrying,
    retryCount,
    messages,
    
    // Actions  
    sendMessage,
    onMessage,
    forceReconnect,
    
    // Server-based equivalents for compatibility
    connectToPeer: async () => true, // Not needed with server
    getConnectedPeers: () => connectedPeers,
    isSignalingConnected: isConnected
  };
}
