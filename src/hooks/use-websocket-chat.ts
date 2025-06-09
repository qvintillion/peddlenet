'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Message, ConnectionStatus } from '@/lib/types';
import { generateCompatibleUUID } from '@/utils/peer-utils';
import { NetworkUtils } from '@/utils/network-utils';
import { MessagePersistence } from '@/utils/message-persistence';
import { ServerUtils } from '@/utils/server-utils';

export function useWebSocketChat(roomId: string, displayName?: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [connectedPeers, setConnectedPeers] = useState<string[]>([]);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [connectionCooldown, setConnectionCooldown] = useState(false);
  
  const socketRef = useRef<Socket | null>(null);
  const messageHandlersRef = useRef<Set<(message: Message) => void>>(new Set());
  // Don't allow any connection until we have a real display name
  const effectiveDisplayName = displayName && displayName.trim() && displayName !== 'Anonymous' ? displayName.trim() : null;
  const myPeerId = useRef<string>(generateCompatibleUUID());
  const connectionId = useRef<string>(Math.random().toString(36).substring(7));
  const roomConnectionRef = useRef<string>('');
  const isConnectingRef = useRef(false);

  const status: ConnectionStatus = {
    isConnected,
    connectedPeers: connectedPeers.length,
    networkReach: isConnected ? 'server' as const : 'isolated' as const,
    signalStrength: isConnected ? 'strong' as const : 'none' as const,
  };

  // Connect to server function - memoize to prevent infinite loops
  const connectToServer = useCallback(async () => {
    if (!roomId || !effectiveDisplayName || isConnectingRef.current || connectionCooldown) {
      console.log(`⏸️ [${connectionId.current}] Skipping connection - missing requirements:`, {
        roomId: !!roomId,
        effectiveDisplayName: !!effectiveDisplayName,
        isConnecting: isConnectingRef.current,
        cooldown: connectionCooldown
      });
      return;
    }
    
    if (socketRef.current?.connected && roomConnectionRef.current === roomId) {
      console.log(`🔄 [${connectionId.current}] Already connected to room:`, roomId, 'skipping duplicate');
      return;
    }
    
    if (socketRef.current?.connected && roomConnectionRef.current !== roomId) {
      console.log(`🔄 [${connectionId.current}] Switching rooms:`, roomConnectionRef.current, '→', roomId);
      socketRef.current.disconnect();
      socketRef.current = null;
      roomConnectionRef.current = '';
    }
    
    isConnectingRef.current = true;
    
    if (socketRef.current) {
      console.log('Disconnecting existing socket before new connection');
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    // Use ServerUtils for proper WebSocket URL
    const serverUrl = ServerUtils.getWebSocketServerUrl();
    const envInfo = ServerUtils.getEnvironmentInfo();
    
    console.log('🔍 Server connection details:');
    console.log('  - WebSocket URL:', serverUrl);
    console.log('  - Environment:', envInfo.environment);
    console.log('  - Protocol:', envInfo.protocol);
    console.log('  - HTTP URL:', envInfo.httpUrl);
    
    if (!serverUrl) {
      console.error('❌ No WebSocket server URL configured');
      isConnectingRef.current = false;
      return;
    }

    setIsRetrying(true);
    console.log(`🔌 [${connectionId.current}] Connecting to chat server:`, serverUrl, 'as:', effectiveDisplayName);
    console.log(`🔧 Connection attempt details:`, {
      transports: ['websocket', 'polling'],
      hostname: envInfo.hostname,
      protocol: envInfo.protocol,
      environment: envInfo.environment
    });

    const socket = io(serverUrl, {
      transports: ['polling', 'websocket'], // Try polling first, then upgrade to websocket
      timeout: 15000, // Longer timeout
      forceNew: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5, // Fewer attempts
      reconnectionDelay: 2000, // Longer delay between attempts
      reconnectionDelayMax: 10000,
      maxReconnectionAttempts: 5,
      upgrade: true,
      rememberUpgrade: true, // Remember successful upgrades
      pingTimeout: 60000,
      pingInterval: 25000,
      withCredentials: false,
      closeOnBeforeunload: false,
      forceBase64: false
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log(`🚀 [${connectionId.current}] Connected to chat server as:`, effectiveDisplayName);
      setIsConnected(true);
      setIsRetrying(false);
      setRetryCount(0);
      isConnectingRef.current = false;
      roomConnectionRef.current = roomId;
      
      socket.emit('join-room', {
        roomId,
        peerId: myPeerId.current,
        displayName: effectiveDisplayName
      });
      
      // Set timeout to check if server sends message history
      setTimeout(() => {
        // If no message-history event was received, use localStorage as fallback
        const localMessages = MessagePersistence.getRoomMessages(roomId);
        if (localMessages.length > 0) {
          console.log('⏰ Server history timeout, using local fallback:', localMessages.length);
          setMessages(prev => {
            // Only set if we haven't received any messages yet
            if (prev.length === 0) {
              return localMessages;
            }
            return prev;
          });
        }
      }, 2000); // Wait 2 seconds for server history
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔌 [${connectionId.current}] Disconnected from chat server:`, reason);
      setIsConnected(false);
      isConnectingRef.current = false;
      roomConnectionRef.current = '';
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error.message);
      console.error('Connection error details:', {
        type: error.type,
        description: error.description,
        context: error.context,
        transport: error.transport
      });
      setIsConnected(false);
      setIsRetrying(false);
      isConnectingRef.current = false;
      
      // Add cooldown to prevent immediate retry spam
      setConnectionCooldown(true);
      setTimeout(() => setConnectionCooldown(false), 5000);
    });

    // Handle message history - merge with persisted messages
    socket.on('message-history', (messageHistory: Message[]) => {
      console.log('📚 Received message history from server:', messageHistory.length);
      
      // Always merge with local storage
      const localMessages = MessagePersistence.getRoomMessages(roomId);
      
      if (messageHistory.length > 0) {
        const mergedMessages = MessagePersistence.mergeMessages(roomId, messageHistory, localMessages);
        setMessages(mergedMessages);
        MessagePersistence.saveRoomMessages(roomId, mergedMessages, connectedPeers.length);
      } else {
        // Server has no history, but we might have local messages
        console.log('📂 No server history, using local messages:', localMessages.length);
        if (localMessages.length > 0) {
          setMessages(localMessages);
        }
      }
    });

    // Handle new real-time messages
    socket.on('chat-message', (message: any) => {
      console.log('📥 Real-time message from server:', message);
      
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
          console.log('⚠️ Duplicate message ignored:', normalizedMessage.id);
          return prev;
        }
        
        const updated = [...prev, normalizedMessage].sort((a, b) => a.timestamp - b.timestamp);
        console.log(`✅ Message added, total: ${updated.length}`);
        
        // Persist to localStorage
        MessagePersistence.addMessage(roomId, normalizedMessage);
        
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
    });

    // Handle peer list updates
    socket.on('room-peers', (peers: any[]) => {
      console.log('Room peers total:', peers.length);
      const uniquePeerNames = Array.from(new Set(peers.map(p => p.displayName)))
        .filter(name => name !== effectiveDisplayName);
      console.log('Other peers (excluding self):', uniquePeerNames.length, uniquePeerNames);
      setConnectedPeers(uniquePeerNames);
    });

    socket.on('peer-joined', (peer: any) => {
      console.log('Peer joined:', peer.displayName);
      if (peer.displayName !== effectiveDisplayName) {
        setConnectedPeers(prev => {
          if (prev.includes(peer.displayName)) return prev;
          return [...prev, peer.displayName];
        });
      }
    });

    socket.on('peer-left', (peer: any) => {
      console.log('Peer left:', peer.displayName);
      if (peer.displayName !== effectiveDisplayName) {
        setConnectedPeers(prev => prev.filter(name => name !== peer.displayName));
      }
    });

  }, [roomId, effectiveDisplayName, connectionCooldown]); // Only depend on stable values and cooldown

  // Initialize connection and load persisted messages
  useEffect(() => {
    // Load persisted messages first
    if (roomId) {
      const persistedMessages = MessagePersistence.getRoomMessages(roomId);
      if (persistedMessages.length > 0) {
        console.log(`📂 Loaded ${persistedMessages.length} persisted messages for room ${roomId}`);
        setMessages(persistedMessages);
      }
    }
    
    // Only connect if we have valid requirements AND we're not already connected to this room
    if (roomId && effectiveDisplayName && !isConnectingRef.current && 
        !(socketRef.current?.connected && roomConnectionRef.current === roomId)) {
      console.log(`🚀 [${connectionId.current}] Initializing connection for:`, effectiveDisplayName);
      connectToServer();
    } else {
      console.log(`⏳ [${connectionId.current}] Skipping connection - already connected or missing requirements`);
      
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
        const socket = socketRef.current;
        socketRef.current = null;
        isConnectingRef.current = false;
        roomConnectionRef.current = '';
        
        if (socket.connected || socket.disconnected === false) {
          socket.disconnect();
        }
      }
    };
  }, [roomId, effectiveDisplayName]); // Remove connectToServer to prevent infinite reconnection loop

  // Send message function
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
    
    const messagePayload = {
      roomId,
      message: {
        content: messageData.content,
      }
    };
    
    console.log('📤 Sending message:', messageData.content, 'from:', effectiveDisplayName);
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
    console.log('Force reconnecting - reloading page...');
    window.location.reload();
    return true;
  }, []);

  return {
    peerId: myPeerId.current,
    status,
    isRetrying,
    retryCount,
    messages,
    sendMessage,
    onMessage,
    forceReconnect,
    connectToPeer: async () => true,
    getConnectedPeers: () => connectedPeers,
    isSignalingConnected: isConnected
  };
}
