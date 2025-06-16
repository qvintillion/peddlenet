'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Message, ConnectionStatus } from '@/lib/types';
import { generateCompatibleUUID, generateShortId } from '@/utils/peer-utils';

interface WebRTCConnection {
  peerId: string;
  peerConnection: RTCPeerConnection;
  dataChannel: RTCDataChannel | null;
  connectionState: RTCPeerConnectionState;
  lastSeen: number;
}

interface QueuedMessage extends Message {
  retryCount?: number;
  queuedAt: number;
}

interface WebRTCDebugInfo {
  connections: Map<string, WebRTCConnection>;
  signaling: {
    connected: boolean;
    socketId: string | null;
  };
  stats: {
    totalAttempts: number;
    successfulConnections: number;
    failedConnections: number;
    activeConnections: number;
  };
}

// CRITICAL: Global instance tracking to prevent multiple concurrent hooks
const globalWebRTCInstances = new Map<string, { hookId: string; timestamp: number }>();
const INSTANCE_TIMEOUT = 5000; // 5 seconds

// CRITICAL: Global rate limiter to prevent useEffect loops
const globalInitAttempts = new Map<string, number>();
const INIT_RATE_LIMIT = 3; // Max 3 attempts per 10 seconds
const RATE_LIMIT_WINDOW = 10000;

export function useNativeWebRTC(roomId: string, displayName?: string, disabled: boolean = false) {
  // CRITICAL DEBUG: Track hook instances to prevent multiple concurrent instances
  const hookInstanceId = useRef(`hook-${Math.random().toString(36).substr(2, 9)}`);
  
  // CRITICAL: Check for concurrent instances
  const checkConcurrentInstances = useCallback(() => {
    const instanceKey = `${roomId}-${displayName || 'anonymous'}`;
    const now = Date.now();
    
    // Clean up old instances
    for (const [key, instance] of globalWebRTCInstances.entries()) {
      if (now - instance.timestamp > INSTANCE_TIMEOUT) {
        globalWebRTCInstances.delete(key);
      }
    }
    
    // Check if another instance is active
    const existingInstance = globalWebRTCInstances.get(instanceKey);
    if (existingInstance && existingInstance.hookId !== hookInstanceId.current) {
      console.warn(`⚠️ [WebRTC Hook ${hookInstanceId.current}] Another instance active: ${existingInstance.hookId}`);
      return false; // Don't initialize
    }
    
    // Register this instance
    globalWebRTCInstances.set(instanceKey, {
      hookId: hookInstanceId.current,
      timestamp: now
    });
    
    return true; // Safe to initialize
  }, [roomId, displayName]);
  
  console.log(`🔍 [WebRTC Hook ${hookInstanceId.current}] useNativeWebRTC called with:`, {
    roomId,
    displayName,
    disabled,
    timestamp: Date.now(),
    globalInstances: globalWebRTCInstances.size
  });
  const [peerId, setPeerId] = useState<string | null>(null);
  const [connections, setConnections] = useState<Map<string, WebRTCConnection>>(() => new Map());
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
  const socketRef = useRef<Socket | null>(null);
  const connectionsRef = useRef<Map<string, WebRTCConnection>>(new Map());
  const messageHandlersRef = useRef<Set<(message: Message) => void>>(new Set());
  const messageQueueRef = useRef<QueuedMessage[]>([]);
  const initializingRef = useRef<boolean>(false);
  const debugStatsRef = useRef({
    totalAttempts: 0,
    successfulConnections: 0,
    failedConnections: 0,
    activeConnections: 0
  });

  // Enhanced ICE configuration for better NAT traversal
  const getICEConfiguration = (): RTCConfiguration => ({
    iceServers: [
      // Google STUN servers
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      
      // Cloudflare STUN servers
      { urls: 'stun:stun.cloudflare.com:3478' },
      
      // 🔥 ENHANCED TURN servers for NAT traversal
      {
        urls: ['turn:openrelay.metered.ca:80'],
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      {
        urls: ['turn:openrelay.metered.ca:443'],
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      {
        urls: ['turn:openrelay.metered.ca:443?transport=tcp'],
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      // Additional reliable TURN servers
      {
        urls: ['turn:relay1.expressturn.com:3478'],
        username: 'efH8IXQT1B7d8CAKAx',
        credential: 'k4R8GWz9w7rQgKJUMCB'
      },
      {
        urls: ['turns:relay1.expressturn.com:5349'],
        username: 'efH8IXQT1B7d8CAKAx',
        credential: 'k4R8GWz9w7rQgKJUMCB'
      }
    ],
    iceCandidatePoolSize: 10,
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require',
    iceTransportPolicy: 'all',
    // 🔥 ENHANCED: More aggressive connection settings
    rtcpReducedSize: true
  });

  // Get WebSocket server URL based on environment - FIXED for desktop compatibility
  const getWebSocketURL = useCallback(() => {
    if (typeof window === 'undefined') return '';
    
    const hostname = window.location.hostname;
    const port = window.location.port;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    
    console.log(`🔍 WebRTC WebSocket URL Detection:`, {
      hostname,
      port,
      protocol,
      userAgent: navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop'
    });
    
    // CRITICAL FIX: Proper local development detection
    const isLocalDev = hostname === 'localhost' || hostname === '127.0.0.1';
    const isPrivateIP = hostname.match(/^192\.168\.|^10\.|^172\.(1[6-9]|2[0-9]|3[01])\./); 
    
    // CRITICAL FIX: Handle local development properly for desktop
    if (isLocalDev) {
      const url = `ws://localhost:3001`;
      console.log(`🏠 Desktop local development WebRTC WebSocket: ${url}`);
      return url;
    }
    
    // CRITICAL FIX: Handle mobile accessing dev server via IP (but not when on desktop accessing localhost)
    if (isPrivateIP && port === '3000') {
      const url = `ws://${hostname}:3001`;
      console.log(`📱 Mobile development WebRTC WebSocket: ${url}`);
      return url;
    }
    
    // Use environment variable if available
    const envServerUrl = typeof window !== 'undefined' ? window.location.search.includes('NEXT_PUBLIC_SIGNALING_SERVER') ? 
      new URLSearchParams(window.location.search).get('NEXT_PUBLIC_SIGNALING_SERVER') : 
      document.querySelector('meta[name="signaling-server"]')?.getAttribute('content') : null;
      
    // Fallback to common staging server for preview deployments
    if (!envServerUrl && (hostname.includes('vercel.app') || hostname.includes('firebase'))) {
      const stagingUrl = 'wss://peddlenet-websocket-server-staging-hfttiarlja-uc.a.run.app';
      console.log(`🌐 Using staging WebSocket URL for preview: ${stagingUrl}`);
      return stagingUrl;
    }
    
    // Firebase hosting - use staging server
    if (hostname.includes('firebase') || hostname.includes('web.app')) {
      const url = 'wss://peddlenet-websocket-server-staging-hfttiarlja-uc.a.run.app';
      console.log(`🔥 Firebase WebRTC WebSocket: ${url}`);
      return url;
    }
    
    // Vercel production - use staging server for now
    if (hostname.includes('vercel.app') || hostname === 'peddlenet.app') {
      const url = 'wss://peddlenet-websocket-server-staging-hfttiarlja-uc.a.run.app';
      console.log(`▲ Vercel WebRTC WebSocket: ${url}`);
      return url;
    }
    
    // Default fallback with warning
    const fallbackUrl = 'ws://localhost:3001'; // Changed to local for development
    console.warn(`⚠️ Using fallback WebRTC WebSocket URL: ${fallbackUrl}`);
    return fallbackUrl;
  }, []);

  // Update status based on connections
  const updateStatus = useCallback(() => {
    const activeConnections = Array.from(connectionsRef.current.values())
      .filter(conn => conn.dataChannel?.readyState === 'open').length;
    
    debugStatsRef.current.activeConnections = activeConnections;
    
    setStatus({
      isConnected: activeConnections > 0 && !!peerId,
      connectedPeers: activeConnections,
      networkReach: activeConnections > 0 ? 'local' : 'isolated',
      signalStrength: activeConnections > 2 ? 'strong' : activeConnections > 0 ? 'medium' : 'none',
    });
  }, [peerId]);

  // 🔥 ENHANCED: Force complete ICE restart for all connections
  const forceICERestart = useCallback(() => {
    console.log('⚡ [ICE RESTART] Forcing ICE restart for all connections...');
    
    const currentConnections = Array.from(connectionsRef.current?.entries() || []);
    if (currentConnections.length === 0) {
      console.log('📭 No connections to restart');
      return 'No connections found';
    }
    
    currentConnections.forEach(([peerId, conn]) => {
      console.log(`⚡ [ICE RESTART] Restarting ICE for ${peerId} (current state: ${conn.peerConnection.iceConnectionState})`);
      try {
        conn.peerConnection.restartIce();
      } catch (error) {
        console.error(`❌ Failed to restart ICE for ${peerId}:`, error);
      }
    });
    
    // Check results after 5 seconds
    setTimeout(() => {
      console.log('🔍 [ICE RESTART] Results after 5 seconds:');
      currentConnections.forEach(([peerId, conn]) => {
        console.log(`   ${peerId}:`, {
          iceState: conn.peerConnection.iceConnectionState,
          connectionState: conn.connectionState,
          dataChannel: conn.dataChannel?.readyState || 'none'
        });
      });
    }, 5000);
    
    return `ICE restart initiated for ${currentConnections.length} connections`;
  }, []); // No dependencies needed since we use connectionsRef.current

  // Create RTCPeerConnection with proper event handlers
  const createPeerConnection = useCallback((targetPeerId: string): RTCPeerConnection => {
    const peerConnection = new RTCPeerConnection(getICEConfiguration());
    
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        console.log(`🧊 Sending ICE candidate to ${targetPeerId}: ${event.candidate.type} (${event.candidate.protocol})`);
        socketRef.current.emit('webrtc-ice-candidate', {
          targetPeerId,
          candidate: event.candidate,
          roomId
        });
      } else if (!event.candidate) {
        console.log(`✅ ICE candidate gathering complete for ${targetPeerId}`);
        // 🔥 CRITICAL FIX: Force connection attempt after ICE gathering
        setTimeout(() => {
          if (peerConnection.iceConnectionState === 'new') {
            console.log(`⚡ [ICE FORCE] ICE still new after gathering, forcing restart for ${targetPeerId}`);
            peerConnection.restartIce();
          }
        }, 2000);
      }
    };
    
    peerConnection.onconnectionstatechange = () => {
      const state = peerConnection.connectionState;
      console.log(`🔗 Connection state changed with ${targetPeerId}: ${state}`);
      
      // 🔥 CRITICAL: Report connection state to server for admin dashboard
      if (socketRef.current) {
        socketRef.current.emit('webrtc-connection-state', {
          targetPeerId,
          state,
          roomId,
          timestamp: Date.now(),
          peerId: peerId // Add our peer ID for tracking
        });
        console.log(`📡 [P2P TRACKING] Reported connection state to server: ${state}`);
      }
      
      if (state === 'connected') {
        debugStatsRef.current.successfulConnections++;
        console.log(`✅ [P2P SUCCESS] Connection established with ${targetPeerId}`);
      } else if (state === 'failed') {
        debugStatsRef.current.failedConnections++;
        console.log(`❌ [P2P FAILED] Connection failed with ${targetPeerId}`);
        // Clean up failed connection
        setTimeout(() => {
          setConnections(prev => {
            const newConnections = new Map(prev);
            newConnections.delete(targetPeerId);
            return newConnections;
          });
        }, 1000);
      } else if (state === 'disconnected') {
        console.log(`🔌 [P2P DISCONNECTED] Connection disconnected with ${targetPeerId}`);
        // Don't immediately clean up disconnected connections - they might reconnect
      }
      
      updateStatus();
    };
    
    // 🔥 NEW: Monitor ICE connection state separately with auto-restart
    peerConnection.oniceconnectionstatechange = () => {
      const iceState = peerConnection.iceConnectionState;
      console.log(`🧊 ICE connection state changed with ${targetPeerId}: ${iceState}`);
      
      if (iceState === 'failed') {
        console.log(`🔥 [ICE FAILED] Attempting ICE restart for ${targetPeerId}`);
        // Attempt ICE restart
        peerConnection.restartIce();
      } else if (iceState === 'connected' || iceState === 'completed') {
        console.log(`✅ [ICE SUCCESS] ICE connection established with ${targetPeerId}`);
      } else if (iceState === 'checking') {
        console.log(`🔍 [ICE CHECKING] ICE connectivity checks in progress for ${targetPeerId}`);
        // 🔥 CRITICAL FIX: Force ICE gathering completion if stuck
        setTimeout(() => {
          if (peerConnection.iceConnectionState === 'checking') {
            console.log(`⚡ [ICE FORCE] Forcing ICE completion for ${targetPeerId}`);
            peerConnection.restartIce();
          }
        }, 10000); // Wait 10 seconds for ICE to complete
      }
    };
    
    // 🔥 NEW: Monitor ICE gathering state
    peerConnection.onicegatheringstatechange = () => {
      console.log(`🔍 ICE gathering state with ${targetPeerId}: ${peerConnection.iceGatheringState}`);
    };
    
    peerConnection.ondatachannel = (event) => {
      const dataChannel = event.channel;
      console.log(`📨 Received data channel from ${targetPeerId}`);
      setupDataChannel(dataChannel, targetPeerId);
    };
    
    return peerConnection;
  }, [roomId, updateStatus]);

  // Setup data channel with message handlers
  const setupDataChannel = useCallback((dataChannel: RTCDataChannel, peerId: string) => {
    dataChannel.onopen = () => {
      console.log(`✅ Data channel opened with ${peerId}`);
      updateStatus();
      
      // Send queued messages
      const queuedMessages = [...messageQueueRef.current];
      messageQueueRef.current = [];
      
      queuedMessages.forEach(queuedMessage => {
        try {
          const { queuedAt, retryCount, ...message } = queuedMessage;
          dataChannel.send(JSON.stringify(message));
        } catch (error) {
          console.error('Failed to send queued message:', error);
        }
      });
    };
    
    dataChannel.onclose = () => {
      console.log(`❌ Data channel closed with ${peerId}`);
      updateStatus();
    };
    
    dataChannel.onerror = (error) => {
      console.error(`⚠️ Data channel error with ${peerId}:`, error);
    };
    
    dataChannel.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as Message;
        if (message?.type && message?.content && typeof message.content === 'string') {
          messageHandlersRef.current.forEach(handler => {
            try {
              handler(message);
            } catch (e) {
              console.error('Message handler error:', e);
            }
          });
        }
      } catch (e) {
        console.error('Data channel message parsing error:', e);
      }
    };
  }, [updateStatus]);

  // Connect to a specific peer - FIXED with better conflict resolution
  const connectToPeer = useCallback(async (targetPeerId: string): Promise<boolean> => {
    if (!socketRef.current || !peerId || targetPeerId === peerId) {
      return false;
    }

    // 🔥 CRITICAL FIX: Check if connection already exists and clean up
    if (connectionsRef.current.has(targetPeerId)) {
      const existingConn = connectionsRef.current.get(targetPeerId);
      if (existingConn?.peerConnection.connectionState === 'connected') {
        console.log(`✅ Already connected to ${targetPeerId}`);
        return true;
      } else {
        console.log(`🧹 Cleaning up existing connection to ${targetPeerId}`);
        existingConn?.peerConnection.close();
        connectionsRef.current.delete(targetPeerId);
        setConnections(new Map(connectionsRef.current));
      }
    }

    debugStatsRef.current.totalAttempts++;

    try {
      console.log(`🚀 Connecting to peer: ${targetPeerId}`);
      
      const peerConnection = createPeerConnection(targetPeerId);
      
      // Create data channel (we are the initiator)
      const dataChannel = peerConnection.createDataChannel('messages', {
        ordered: true,
        protocol: 'json'
      });
      
      setupDataChannel(dataChannel, targetPeerId);
      
      // Store connection BEFORE creating offer
      const connection: WebRTCConnection = {
        peerId: targetPeerId,
        peerConnection,
        dataChannel,
        connectionState: peerConnection.connectionState,
        lastSeen: Date.now()
      };
      
      connectionsRef.current.set(targetPeerId, connection);
      setConnections(new Map(connectionsRef.current));
      
      // Create and send offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      console.log(`📤 Sending offer to ${targetPeerId}`);
      socketRef.current.emit('webrtc-offer', {
        targetPeerId,
        offer,
        roomId,
        initiatorData: {
          peerId,
          displayName: effectiveDisplayName,
          timestamp: Date.now()
        }
      });
      
      return true;
    } catch (error) {
      console.error(`❌ Failed to connect to ${targetPeerId}:`, error);
      debugStatsRef.current.failedConnections++;
      return false;
    }
  }, [peerId, roomId, effectiveDisplayName, createPeerConnection, setupDataChannel]);

  // Send message via WebRTC data channels
  const sendMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>): string | null => {
    const fullMessage: Message = {
      ...message,
      id: generateCompatibleUUID(),
      timestamp: Date.now(),
      synced: false,
    };

    const activeConnections = Array.from(connectionsRef.current.values())
      .filter(conn => conn.dataChannel?.readyState === 'open');

    if (activeConnections.length === 0) {
      // Queue message for later
      messageQueueRef.current.push({
        ...fullMessage,
        queuedAt: Date.now(),
        retryCount: 0
      });
      console.log('📦 Message queued - no active WebRTC connections');
      return fullMessage.id;
    }
    
    let sentCount = 0;
    activeConnections.forEach(conn => {
      try {
        if (conn.dataChannel) {
          conn.dataChannel.send(JSON.stringify(fullMessage));
          sentCount++;
        }
      } catch (error) {
        console.error('Failed to send WebRTC message:', error);
      }
    });

    console.log(`📊 WebRTC message sent to ${sentCount}/${activeConnections.length} peers`);
    return sentCount > 0 ? fullMessage.id : null;
  }, []);

  // Message handler registration
  const onMessage = useCallback((handler: (message: Message) => void) => {
    messageHandlersRef.current.add(handler);
    return () => {
      messageHandlersRef.current.delete(handler);
    };
  }, []);

  // Mobile-optimized reconnection state with loop detection
  const reconnectionStateRef = useRef({
    attemptCount: 0,
    lastAttempt: 0,
    isReconnecting: false,
    maxAttempts: 5,
    baseDelay: 1000,
    maxDelay: 30000
  });
  
  // CRITICAL: Connection loop detection
  const loopDetectionRef = useRef({
    connectionAttempts: 0,
    startTime: Date.now(),
    isLoopDetected: false,
    cooldownUntil: 0
  });

  // Get exponential backoff delay for mobile
  const getReconnectionDelay = useCallback(() => {
    const state = reconnectionStateRef.current;
    const exponentialDelay = Math.min(
      state.baseDelay * Math.pow(2, state.attemptCount),
      state.maxDelay
    );
    
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.3 * exponentialDelay;
    return exponentialDelay + jitter;
  }, []);

  // Mobile network change detection
  const handleNetworkChange = useCallback(() => {
    console.log('📱 Network change detected, resetting reconnection state');
    reconnectionStateRef.current = {
      attemptCount: 0,
      lastAttempt: 0,
      isReconnecting: false,
      maxAttempts: 5,
      baseDelay: 1000,
      maxDelay: 30000
    };
  }, []);

  // Initialize WebSocket signaling and WebRTC - FIXED to prevent loops
  useEffect(() => {
    console.log(`🔍 [WebRTC Hook ${hookInstanceId.current}] useEffect triggered with disabled=${disabled}`);
    
    // CRITICAL FIX: Complete disable flag to prevent automatic WebRTC initialization
    if (disabled) {
      console.log(`🚫 [WebRTC Hook ${hookInstanceId.current}] WebRTC initialization DISABLED via flag - exiting useEffect`);
      return;
    }
    
    // CRITICAL: Prevent multiple initializations with stricter checks
    if (!roomId || isInitialized || initializingRef.current) {
      console.log(`🔍 [WebRTC Hook ${hookInstanceId.current}] Skipping init - roomId=${roomId}, isInitialized=${isInitialized}, initializing=${initializingRef.current}`);
      return;
    }
    
    if (typeof window === 'undefined') {
      console.log(`🔍 [WebRTC Hook ${hookInstanceId.current}] Skipping init - SSR environment`);
      return;
    }

    // CRITICAL: Check for concurrent instances before initializing
    const canInitialize = checkConcurrentInstances();
    if (!canInitialize) {
      console.log(`🚫 [WebRTC Hook ${hookInstanceId.current}] Concurrent instance detected - skipping initialization`);
      return;
    }

    // CRITICAL DEBUG: Check if we're in a loop
    const now = Date.now();
    const loopState = loopDetectionRef.current;
    if (loopState.isLoopDetected && now < loopState.cooldownUntil) {
      const remainingCooldown = Math.round((loopState.cooldownUntil - now) / 1000);
      console.log(`🚫 [WebRTC Hook ${hookInstanceId.current}] Loop detection cooldown active - ${remainingCooldown}s remaining`);
      return;
    }

    // CRITICAL: Rate limiting to prevent useEffect loops - ENHANCED for admin dashboard
    const rateKey = `${roomId}-${displayName || 'anonymous'}`;
    const currentAttempts = globalInitAttempts.get(rateKey) || 0;
    
    // Clean up old rate limit entries
    for (const [key, timestamp] of globalInitAttempts.entries()) {
      if (now - timestamp > RATE_LIMIT_WINDOW) {
        globalInitAttempts.delete(key);
      }
    }
    
    // 🔥 CRITICAL FIX: Check if this is admin dashboard P2P testing
    const isAdminP2PTest = typeof window !== 'undefined' && 
                          (window as any).HybridChatDebug?.enableP2PForAdminDashboard || 
                          (window as any).NativeWebRTCDebug?.forceInitializeInProgress;
    
    if (currentAttempts >= INIT_RATE_LIMIT && !isAdminP2PTest) {
      console.log(`🚨 [WebRTC Hook ${hookInstanceId.current}] RATE LIMITED: ${currentAttempts} attempts in 10s - preventing useEffect loop`);
      console.log(`🔥 [ADMIN P2P] Admin test mode: ${isAdminP2PTest} - ${isAdminP2PTest ? 'BYPASSING' : 'NOT BYPASSING'} rate limit`);
      return;
    }
    
    // Record this attempt (but not for admin P2P tests)
    if (!isAdminP2PTest) {
      globalInitAttempts.set(rateKey, now);
    }

    initializingRef.current = true;

    const initializeWebRTC = async () => {
      // CRITICAL FIX: Clear any stored peer IDs that might trigger connections
    if (typeof window !== 'undefined') {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('webrtc-peer-id-')) {
          localStorage.removeItem(key);
          console.log(`🧠 Cleared cached peer ID: ${key}`);
        }
      });
    }
    
    // CRITICAL FIX: Check cooldown period first
      const now = Date.now();
      const loopState = loopDetectionRef.current;
      
      if (loopState.isLoopDetected && now < loopState.cooldownUntil) {
        const remainingCooldown = Math.round((loopState.cooldownUntil - now) / 1000);
        console.log(`🗞️ Still in cooldown period, ${remainingCooldown}s remaining`);
        initializingRef.current = false;
        return;
      }
      
      try {
        const websocketUrl = getWebSocketURL();
        console.log(`🌐 Connecting to WebSocket signaling server: ${websocketUrl}`);
        
        // FIXED: Use Socket.IO's built-in reconnection to prevent loops
        const socket = io(websocketUrl, {
          transports: ['websocket', 'polling'],
          timeout: 15000,
          reconnection: true, // CRITICAL: Let Socket.IO handle reconnection
          reconnectionAttempts: 3, // Limit attempts to prevent infinite loops
          reconnectionDelay: 2000, // Start with 2s delay
          reconnectionDelayMax: 10000, // Max 10s between attempts
          forceNew: true,
          upgrade: true,
          autoConnect: false, // CRITICAL: Don't auto-connect, we'll control when
          randomizationFactor: 0.5,
          pollingTimeout: 10000,
          transportOptions: {
            polling: {
              extraHeaders: {
                'X-Mobile-Client': 'true'
              }
            }
          }
        });

        socketRef.current = socket;
        
        // CRITICAL: Register all event handlers BEFORE connecting
        console.log('📝 Registering WebRTC signaling event handlers...');
        
        socket.on('connect', () => {
          const now = Date.now();
          const loopState = loopDetectionRef.current;
          
          // CRITICAL FIX: More intelligent loop detection
          loopState.connectionAttempts++;
          const elapsed = now - loopState.startTime;
          
          // FIXED: Only detect loop for rapid successive connections from SAME tab
          // Allow force initialization and multi-tab scenarios
          const isForceInitialization = window.NativeWebRTCDebug?.forceInitializeInProgress;
          const isAdminP2PTest = (window as any).HybridChatDebug?.enableP2PForAdminDashboard;
          const isMultiTab = document.visibilityState === 'visible'; // Assume multi-tab if visible
          
          // 🔥 CRITICAL FIX: Be more lenient with admin P2P testing
          const loopThreshold = isAdminP2PTest ? 15 : 8; // Higher threshold for admin testing
          const timeWindow = isAdminP2PTest ? 3000 : 5000; // Shorter time window for admin
          
          if (loopState.connectionAttempts > loopThreshold && elapsed < timeWindow && !isForceInitialization && !isAdminP2PTest) {
            console.error('🔴 CONNECTION LOOP DETECTED! Entering cooldown period...');
            console.error('   - Attempts:', loopState.connectionAttempts, 'in', elapsed, 'ms');
            console.error('   - This suggests a real infinite loop, not normal usage');
            console.error('   - Admin P2P test mode:', isAdminP2PTest);
            loopState.isLoopDetected = true;
            loopState.cooldownUntil = now + 30000; // 30 second cooldown
            socket.disconnect();
            return;
          } else if (loopState.connectionAttempts > loopThreshold && elapsed < timeWindow && isAdminP2PTest) {
            console.log('🔥 [ADMIN P2P] High connection attempts detected but admin P2P testing active - allowing');
            console.log('   - Attempts:', loopState.connectionAttempts, 'in', elapsed, 'ms (admin mode)');
          }
          
          // FIXED: Reset loop detection more frequently for normal usage
          const resetTime = isAdminP2PTest ? 15000 : 30000; // Faster reset for admin testing
          if (elapsed > resetTime) {
            loopState.connectionAttempts = 0;
            loopState.startTime = now;
            loopState.isLoopDetected = false;
            if (isAdminP2PTest) {
              console.log('🔥 [ADMIN P2P] Loop detection reset (admin mode)');
            }
          }
          
          console.log('✅ WebSocket signaling connected');
          
          // Reset reconnection state on successful connection
          reconnectionStateRef.current.attemptCount = 0;
          reconnectionStateRef.current.isReconnecting = false;
          
          // CRITICAL: Use stable peer ID to prevent regeneration loops
          let stablePeerId = localStorage.getItem(`webrtc-peer-id-${roomId}`);
          if (!stablePeerId) {
            stablePeerId = generateShortId('webrtc');
            localStorage.setItem(`webrtc-peer-id-${roomId}`, stablePeerId);
            console.log('🏷️ Generated new stable peer ID:', stablePeerId);
          } else {
            console.log('🔄 Reusing stable peer ID:', stablePeerId);
          }
          setPeerId(stablePeerId);
          
          // Join room for signaling
          socket.emit('join-room', {
            roomId,
            peerId: stablePeerId,
            displayName: effectiveDisplayName
          });
          
          setIsInitialized(true);
          initializingRef.current = false;
        });

        socket.on('connect_error', (error) => {
          console.error('❌ WebSocket signaling connection error:', error);
          initializingRef.current = false;
          // FIXED: Let Socket.IO handle reconnection automatically
        });
        
        socket.on('reconnect', (attemptNumber) => {
          console.log(`✅ WebSocket reconnected after ${attemptNumber} attempts`);
          // Reset state on successful reconnection
          reconnectionStateRef.current.attemptCount = 0;
          reconnectionStateRef.current.isReconnecting = false;
        });
        
        socket.on('reconnect_error', (error) => {
          console.error('❌ WebSocket reconnection failed:', error);
        });
        
        socket.on('reconnect_failed', () => {
          console.error('❌ WebSocket reconnection failed permanently');
          initializingRef.current = false;
        });

        // Handle incoming WebRTC signaling
        socket.on('webrtc-offer', async ({ fromPeerId, offer, initiatorData }) => {
          try {
            console.log(`📥 Received offer from ${fromPeerId}`);
            
            // 🔥 CRITICAL FIX: Check if we already have a connection to this peer
            if (connectionsRef.current.has(fromPeerId)) {
              console.log(`⚠️ Already have connection to ${fromPeerId}, cleaning up before creating new one`);
              const existingConn = connectionsRef.current.get(fromPeerId);
              existingConn?.peerConnection.close();
              connectionsRef.current.delete(fromPeerId);
              setConnections(new Map(connectionsRef.current));
            }
            
            const peerConnection = createPeerConnection(fromPeerId);
            
            // Store connection BEFORE setting remote description
            const connection: WebRTCConnection = {
              peerId: fromPeerId,
              peerConnection,
              dataChannel: null, // Will be set when data channel is received
              connectionState: peerConnection.connectionState,
              lastSeen: Date.now()
            };
            
            connectionsRef.current.set(fromPeerId, connection);
            setConnections(new Map(connectionsRef.current));
            
            // 🔥 FIXED: Proper offer/answer flow
            await peerConnection.setRemoteDescription(offer);
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            
            console.log(`📤 Sending answer to ${fromPeerId}`);
            socket.emit('webrtc-answer', {
              targetPeerId: fromPeerId,
              answer,
              roomId,
              responderData: {
                peerId: peerId || 'unknown', // Use current peerId
                displayName: effectiveDisplayName,
                timestamp: Date.now()
              }
            });
          } catch (error) {
            console.error('❌ Error handling WebRTC offer:', error);
          }
        });

        socket.on('webrtc-answer', async ({ fromPeerId, answer }) => {
          try {
            console.log(`📥 Received answer from ${fromPeerId}`);
            
            const connection = connectionsRef.current.get(fromPeerId);
            if (connection && connection.peerConnection.signalingState === 'have-local-offer') {
              await connection.peerConnection.setRemoteDescription(answer);
              console.log(`✅ Answer processed for ${fromPeerId}, connection should be establishing...`);
            } else {
              // 🔥 CRITICAL FIX: Handle peer ID mismatch by searching all connections
              let matchingConnection = null;
              for (const [connPeerId, conn] of connectionsRef.current.entries()) {
                if (conn.peerConnection.signalingState === 'have-local-offer') {
                  matchingConnection = { peerId: connPeerId, connection: conn };
                  break;
                }
              }
              
              if (matchingConnection) {
                console.log(`🔧 Found matching connection waiting for answer: ${matchingConnection.peerId}`);
                await matchingConnection.connection.peerConnection.setRemoteDescription(answer);
                console.log(`✅ Answer processed for ${matchingConnection.peerId} (peer ID corrected)`);
              } else {
                console.warn(`⚠️ Received answer from ${fromPeerId} but no matching offer found`);
              }
            }
          } catch (error) {
            console.error('❌ Error handling WebRTC answer:', error);
          }
        });

        socket.on('webrtc-ice-candidate', async ({ fromPeerId, candidate }) => {
          try {
            const connection = connectionsRef.current.get(fromPeerId);
            if (connection && connection.peerConnection.remoteDescription) {
              await connection.peerConnection.addIceCandidate(candidate);
            } else if (connection) {
              console.warn(`⚠️ Received ICE candidate from ${fromPeerId} but no remote description set yet`);
            }
          } catch (error) {
            console.error('❌ Error handling ICE candidate:', error);
          }
        });

        socket.on('user-joined', ({ peerId: newPeerId, displayName: newDisplayName }) => {
          const currentPeerId = peerId;
          if (newPeerId !== currentPeerId) {
            console.log(`👋 New user joined: ${newDisplayName} (${newPeerId})`);
            
            // 🔥 CRITICAL FIX: Ensure both peer IDs exist and are valid before comparison
            if (!currentPeerId) {
              console.log(`⚠️ [P2P WAIT] Current peer ID not set yet, waiting for initialization`);
              return;
            }
            
            // 🔥 CRITICAL FIX: Only ONE peer should initiate connection to avoid conflicts
            // Use stable comparison to ensure only one direction
            const shouldInitiate = currentPeerId < newPeerId; // Lexicographic comparison
            
            if (shouldInitiate) {
              console.log(`🔥 [P2P INITIATE] I will initiate connection to ${newDisplayName} (${currentPeerId} < ${newPeerId})`);
              setTimeout(() => {
                connectToPeer(newPeerId);
              }, 1000);
            } else {
              console.log(`🔥 [P2P WAIT] Waiting for ${newDisplayName} to initiate connection (${currentPeerId} > ${newPeerId})`);
            }
          }
        });

        socket.on('user-left', ({ peerId: leftPeerId }) => {
          console.log(`👋 User left: ${leftPeerId}`);
          
          // 🔥 FIXED: Clean up connection by peerId, not just leftPeerId
          let connectionFound = false;
          for (const [connPeerId, connection] of connectionsRef.current.entries()) {
          if (connPeerId === leftPeerId || connection.peerId === leftPeerId) {
          console.log(`🧹 Cleaning up connection to departed user: ${connPeerId}`);
            connection.peerConnection.close();
            connectionsRef.current.delete(connPeerId);
              connectionFound = true;
                break;
              }
            }
            
            if (connectionFound) {
              setConnections(new Map(connectionsRef.current));
            }
        });

        socket.on('disconnect', (reason) => {
          console.log('❌ WebSocket signaling disconnected:', reason);
          setPeerId(null);
          setIsInitialized(false);
          
          // FIXED: Don't manually reconnect - Socket.IO will handle this automatically
          // Just clean up local state
          console.log('🧠 Cleaning up local state, Socket.IO will handle reconnection');
          initializingRef.current = false;
        });
        
        // CRITICAL: Now connect the socket AFTER all handlers are registered
        console.log('🚀 Starting WebSocket connection...');
        socket.connect();

      } catch (error) {
        console.error('❌ WebRTC initialization error:', error);
        initializingRef.current = false;
      }
    };

    // CRITICAL: Small delay to prevent race conditions
    setTimeout(initializeWebRTC, 50); // Reduced from 100ms to 50ms

    return () => {
      // Clean up event listeners
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleNetworkChange);
        window.removeEventListener('offline', handleNetworkChange);
        
        if ('connection' in navigator) {
          (navigator as any).connection.removeEventListener('change', handleNetworkChange);
        }
      }
      
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      
      // Close all peer connections
      connectionsRef.current.forEach(connection => {
        connection.peerConnection.close();
      });
      connectionsRef.current.clear();
      setConnections(new Map());
      
      initializingRef.current = false;
    };
    // Add mobile network change detection
    if (typeof window !== 'undefined') {
      // Listen for online/offline events
      window.addEventListener('online', handleNetworkChange);
      window.addEventListener('offline', handleNetworkChange);
      
      // Listen for mobile network changes (if supported)
      if ('connection' in navigator) {
        (navigator as any).connection.addEventListener('change', handleNetworkChange);
      }
      
      // Listen for visibility changes (mobile app backgrounding)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          console.log('📱 App became visible, checking connection');
          // Reset reconnection attempts when app comes back to foreground
          handleNetworkChange();
        }
      });
    }
    
  }, [roomId, disabled]); // FIXED: Minimal dependencies to prevent loop

  // Sync refs with state
  useEffect(() => {
    connectionsRef.current = connections;
    updateStatus();
  }, [connections, updateStatus]);

  // Expose debug tools
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.NativeWebRTCDebug = {
        getConnections: () => Array.from(connections.entries()),
        getStats: () => debugStatsRef.current,
        getSignalingStatus: () => ({
          connected: socketRef.current?.connected || false,
          socketId: socketRef.current?.id || null
        }),
        getReconnectionState: () => reconnectionStateRef.current,
        resetReconnectionState: () => {
          reconnectionStateRef.current = {
            attemptCount: 0,
            lastAttempt: 0,
            isReconnecting: false,
            maxAttempts: 5,
            baseDelay: 1000,
            maxDelay: 30000
          };
          console.log('🔄 Reconnection state reset');
        },
        forceReconnect: () => {
          if (socketRef.current) {
            socketRef.current.disconnect();
            setTimeout(() => {
              if (socketRef.current) {
                socketRef.current.connect();
              }
            }, 1000);
          }
        },
        connectToPeer,
        sendTestMessage: (content: string) => sendMessage({ content, type: 'chat' }),
        getQueuedMessages: () => messageQueueRef.current,
        // NEW: Debug functions for loop detection issues
        clearLoopDetection: () => {
          loopDetectionRef.current = {
            connectionAttempts: 0,
            startTime: Date.now(),
            isLoopDetected: false,
            cooldownUntil: 0
          };
          // Also clear rate limiting
          const rateKey = `${roomId}-${displayName || 'anonymous'}`;
          globalInitAttempts.delete(rateKey);
          console.log('🧹 Loop detection AND rate limiting cleared - safe to initialize again');
        },
        getLoopDetectionStatus: () => {
          const loopState = loopDetectionRef.current;
          const now = Date.now();
          return {
            ...loopState,
            inCooldown: loopState.isLoopDetected && now < loopState.cooldownUntil,
            cooldownRemaining: Math.max(0, Math.round((loopState.cooldownUntil - now) / 1000)),
            canInitialize: !loopState.isLoopDetected || now >= loopState.cooldownUntil
          };
        },
        clearGlobalInstances: () => {
          const instanceKey = `${roomId}-${displayName || 'anonymous'}`;
          globalWebRTCInstances.delete(instanceKey);
          console.log('🧹 Cleared global WebRTC instances for:', instanceKey);
          console.log('🔢 Remaining instances:', globalWebRTCInstances.size);
        },
        getGlobalInstances: () => {
          console.log('🔍 Current global instances:');
          for (const [key, instance] of globalWebRTCInstances.entries()) {
            console.log(`  - ${key}: ${instance.hookId} (${Date.now() - instance.timestamp}ms ago)`);
          }
          return globalWebRTCInstances.size;
        },
        forceInitialize: () => {
          console.log('⚡ Force initializing WebRTC (bypassing concurrent instance check)...');
          
          // CRITICAL FIX: Set flag to prevent loop detection during force init
          window.NativeWebRTCDebug.forceInitializeInProgress = true;
          
          // FORCE RESET: Clear all blocking states
          initializingRef.current = false;
          setIsInitialized(false);
          
          // Clear loop detection cooldown for force init
          loopDetectionRef.current.isLoopDetected = false;
          loopDetectionRef.current.cooldownUntil = 0;
          
          // Disconnect existing socket if any
          if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
          }
          
          // Clear global tracking
          const instanceKey = `${roomId}-${displayName || 'anonymous'}`;
          globalWebRTCInstances.delete(instanceKey);
          
          // IMMEDIATELY trigger initialization
          setTimeout(() => {
            const initializeWebRTC = async () => {
              console.log('🚀 FORCED WebRTC initialization starting...');
              
              try {
                const websocketUrl = getWebSocketURL();
                console.log(`🌐 Connecting to WebSocket signaling server: ${websocketUrl}`);
                
                const socket = io(websocketUrl, {
                  transports: ['websocket', 'polling'],
                  timeout: 15000,
                  reconnection: true,
                  reconnectionAttempts: 3,
                  reconnectionDelay: 2000,
                  reconnectionDelayMax: 10000,
                  forceNew: true,
                  upgrade: true,
                  autoConnect: true // AUTO-CONNECT for forced init
                });
                
                socketRef.current = socket;
                
                socket.on('connect', () => {
                  console.log('✅ FORCED WebSocket signaling connected');
                  
                  // Clear force init flag after successful connection
                  setTimeout(() => {
                    window.NativeWebRTCDebug.forceInitializeInProgress = false;
                  }, 2000);
                  
                  let stablePeerId = localStorage.getItem(`webrtc-peer-id-${roomId}`);
                  if (!stablePeerId) {
                    stablePeerId = generateShortId('webrtc');
                    localStorage.setItem(`webrtc-peer-id-${roomId}`, stablePeerId);
                    console.log('🏷️ Generated new stable peer ID:', stablePeerId);
                  }
                  setPeerId(stablePeerId);
                  
                  socket.emit('join-room', {
                    roomId,
                    peerId: stablePeerId,
                    displayName: effectiveDisplayName
                  });
                  
                  setIsInitialized(true);
                });
                
                socket.on('connect_error', (error) => {
                  console.error('❌ FORCED WebSocket connection error:', error);
                  window.NativeWebRTCDebug.forceInitializeInProgress = false;
                });
                
              } catch (error) {
                console.error('❌ FORCED WebRTC initialization error:', error);
                window.NativeWebRTCDebug.forceInitializeInProgress = false;
              }
            };
            
            initializeWebRTC();
          }, 100);
        },
        // 🔥 CRITICAL: Add P2P testing functions for admin dashboard
        forceP2PConnection: async (targetDisplayName) => {
          console.log(`🔥 [P2P TEST] Forcing P2P connection to: ${targetDisplayName}`);
          
          if (!socketRef.current || !peerId) {
            console.error('❌ Cannot force P2P - not connected to signaling server');
            return false;
          }
          
          // Try to connect by display name
          const success = await connectToPeer(targetDisplayName);
          console.log(`🔥 [P2P TEST] Connection attempt result: ${success}`);
          return success;
        },
        testP2PWithAllPeers: () => {
          console.log('🔥 [P2P TEST] Attempting P2P connections with all available peers...');
          
          if (!socketRef.current || !peerId) {
            console.error('❌ Cannot test P2P - not connected to signaling server');
            return 'Not connected to signaling server';
          }
          
          // 🔥 ENHANCED: Force ICE restart on all existing connections first
          const result = forceICERestart();
          console.log(`⚡ [P2P TEST] ${result}`);
          
          // Get current room peers from WebSocket events
          socketRef.current.emit('request-room-peers', { roomId });
          
          setTimeout(() => {
            // Check if we received any peer updates
            const currentConnections = Array.from(connections.keys());
            console.log(`🔥 [P2P TEST] Current WebRTC connections:`, currentConnections);
            console.log(`🔥 [P2P TEST] WebRTC status:`, {
              peerId,
              connections: connections.size,
              signaling: socketRef.current?.connected
            });
            
            // Force check connection states
            currentConnections.forEach(connPeerId => {
              const conn = connections.get(connPeerId);
              if (conn) {
                console.log(`🔍 [P2P TEST] Connection ${connPeerId}:`, {
                  state: conn.connectionState,
                  iceState: conn.peerConnection.iceConnectionState,
                  signalingState: conn.peerConnection.signalingState,
                  dataChannel: conn.dataChannel?.readyState || 'none'
                });
              }
            });
          }, 2000);
          
          return 'P2P test initiated - check console for results';
        },
        enableAutoP2P: () => {
          console.log('🔥 [P2P TEST] Auto P2P connections enabled for all new users');
          return 'Auto P2P enabled - new users will trigger automatic P2P connections';
        },
        forceICERestart
      };
      console.log('🔍 Native WebRTC Debug tools available: window.NativeWebRTCDebug');
    }
  }, [connections, connectToPeer, sendMessage]);

  return {
    peerId,
    status,
    roomPeers: Array.from(connections.keys()),
    connectToPeer,
    sendMessage,
    onMessage,
    getConnectedPeers: () => Array.from(connections.keys()).filter(peerId => {
      const conn = connections.get(peerId);
      return conn && conn.dataChannel?.readyState === 'open';
    }),
    forceReconnect: () => {
      // Attempt to reconnect to all room peers
      if (socketRef.current && roomId) {
        socketRef.current.emit('request-room-peers', { roomId });
      }
    },
    getQueuedMessages: () => messageQueueRef.current.length,
    clearMessageQueue: () => { messageQueueRef.current = []; },
    isSignalingConnected: () => socketRef.current?.connected || false,
    getDebugInfo: (): WebRTCDebugInfo => ({
      connections,
      signaling: {
        connected: socketRef.current?.connected || false,
        socketId: socketRef.current?.id || null
      },
      stats: debugStatsRef.current
    })
  };
}