
// 🚀 CUSTOM WEBRTC: Direct WebRTC using our WebSocket server for signaling
// Replaces unreliable PeerJS cloud service with rock-solid custom implementation
// Uses our WebSocket server for offer/answer/ICE exchange

import { useState, useEffect, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';

interface Message {
  id: string;
  content: string;
  sender: string;
  senderId: string;
  timestamp: number;
  type?: string;
}

interface Peer {
  socketId: string;
  peerId: string;
  displayName: string;
  joinedAt: number;
}

interface WebRTCConnection {
  peerId: string;
  peerConnection: RTCPeerConnection;
  dataChannel: RTCDataChannel | null;
  status: 'connecting' | 'connected' | 'failed' | 'closed';
  lastActivity: number;
}

interface CustomWebRTCHookReturn {
  connections: Map<string, WebRTCConnection>;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'failed';
  sendMessage: (message: Message) => Promise<boolean>;
  onMessage: ((message: Message) => void) | null;
  setOnMessage: (callback: (message: Message) => void) => void;
  connectToPeer: (peer: Peer) => Promise<boolean>;
  connectToAllAvailablePeers: () => Promise<void>;
  disconnectFromPeer: (peerId: string) => void;
  availablePeers: Peer[];
  refreshPeers: () => void;
  debugInfo: {
    totalConnections: number;
    successfulSends: number;
    failedSends: number;
    connectionHistory: Array<{ peer: string; status: string; timestamp: number }>;
  };
}

// WebRTC configuration with reliable STUN servers
const RTC_CONFIGURATION: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' }
  ],
  iceCandidatePoolSize: 10
};

export function useCustomWebRTC(
  socket: Socket | null,
  roomId: string,
  displayName?: string
): CustomWebRTCHookReturn {
  
  const [connections, setConnections] = useState<Map<string, WebRTCConnection>>(new Map());
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'failed'>('disconnected');
  const [availablePeers, setAvailablePeers] = useState<Peer[]>([]);
  
  // 🔧 CRITICAL FIX: Always provide onMessage state and setter
  const [onMessage, setOnMessage] = useState<((message: Message) => void) | null>(null);
  
  // Use refs to access current state without causing re-renders
  const connectionsRef = useRef<Map<string, WebRTCConnection>>(new Map());
  const availablePeersRef = useRef<Peer[]>([]);
  const onMessageRef = useRef<((message: Message) => void) | null>(null);
  
  // Add cooldown mechanism to prevent rapid peer discovery
  const lastPeerDiscoveryRef = useRef<number>(0);
  const lastConnectionAttemptsRef = useRef<Map<string, number>>(new Map());
  const PEER_DISCOVERY_COOLDOWN = 2000; // 2 seconds
  const CONNECTION_ATTEMPT_COOLDOWN = 5000; // 5 seconds per peer
  
  // Keep refs in sync with state
  useEffect(() => {
    connectionsRef.current = connections;
  }, [connections]);
  
  useEffect(() => {
    availablePeersRef.current = availablePeers;
  }, [availablePeers]);
  
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);
  
  // Debug tracking
  const debugInfo = useRef({
    totalConnections: 0,
    successfulSends: 0,
    failedSends: 0,
    connectionHistory: [] as Array<{ peer: string; status: string; timestamp: number }>
  });

  // Enhanced setOnMessage with debugging
  const setOnMessageHandler = useCallback((handler: (message: Message) => void) => {
    console.log('📨 [SET ON MESSAGE] Setting P2P message handler:', !!handler);
    setOnMessage(() => handler); // Wrap in function to prevent stale closure
    onMessageRef.current = handler;
    console.log('✅ [SET ON MESSAGE] P2P message handler set successfully');
  }, []);

  // Cleanup function using ref to avoid dependency issues
  const cleanup = useCallback(() => {
    console.log('🧹 Custom WebRTC cleanup - closing all connections');
    
    // Get current connections from ref to avoid stale closure
    const currentConnections = connectionsRef.current;
    
    currentConnections.forEach((connection, peerId) => {
      try {
        if (connection.dataChannel) {
          connection.dataChannel.close();
        }
        connection.peerConnection.close();
        console.log(`🚫 Closed WebRTC connection to ${peerId}`);
      } catch (error) {
        console.warn(`⚠️ Error closing connection to ${peerId}:`, error);
      }
    });
    
    // Only update state if we actually have connections to clear
    if (currentConnections.size > 0) {
      setConnections(new Map());
      setConnectionStatus('disconnected');
    }
  }, []); // No dependencies needed since using ref to prevent infinite loop

  // Create WebRTC connection for a peer
  const createPeerConnection = useCallback(async (targetPeer: Peer): Promise<WebRTCConnection | null> => {
    if (!socket) {
      console.error('❌ No socket available for WebRTC signaling');
      return null;
    }

    try {
      console.log(`🔗 Creating WebRTC connection to ${targetPeer.displayName} (${targetPeer.peerId})`);
      
      const peerConnection = new RTCPeerConnection(RTC_CONFIGURATION);
      let dataChannel: RTCDataChannel | null = null;
      
      const connection: WebRTCConnection = {
        peerId: targetPeer.peerId,
        peerConnection,
        dataChannel,
        status: 'connecting',
        lastActivity: Date.now()
      };

      // Create data channel for messaging
      dataChannel = peerConnection.createDataChannel('messages', {
        ordered: true,
        maxRetransmits: 3
      });
      
      connection.dataChannel = dataChannel;

      // Set up data channel event handlers
      dataChannel.onopen = () => {
        console.log(`✅ Data channel opened to ${targetPeer.displayName}`);
        connection.status = 'connected';
        connection.lastActivity = Date.now();
        
        // Update debug info
        debugInfo.current.connectionHistory.push({
          peer: targetPeer.peerId,
          status: 'connected',
          timestamp: Date.now()
        });
        
        setConnections(prev => new Map(prev.set(targetPeer.peerId, connection)));
        
        // 🚀 REPORT P2P STATUS: Notify socket server of successful connection
        socket.emit('webrtc-connection-established', {
          to: targetPeer.socketId,
          fromPeerId: displayName || 'Anonymous',
          roomId
        });
        
        // 🚀 REPORT P2P STATUS: Report P2P connection to server for dashboard tracking
        socket.emit('p2p-connection-established', {
          targetSocketId: targetPeer.socketId,
          roomId,
          peerDisplayName: targetPeer.displayName,
          timestamp: Date.now()
        });
      };

      dataChannel.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as Message;
          
          // Safety check for valid message
          if (!message || !message.id) {
            console.warn('⚠️ P2P received invalid message:', message);
            return;
          }
          
          connection.lastActivity = Date.now();
          
          console.log(`📥 P2P message from ${targetPeer.displayName}:`, message.content.substring(0, 50));
          
          // 🔧 P2P MOBILE FIX: Always trigger message handler for P2P messages
          // Don't rely on deduplication here - let the hybrid handler deal with it
          if (onMessageRef.current) {
            console.log(`📨 P2P: Forwarding message to handler:`, message.content);
            onMessageRef.current(message);
          } else {
            console.warn('⚠️ P2P: No message handler available');
          }
        } catch (error) {
          console.error('❌ Error parsing P2P message:', error);
        }
      };

      dataChannel.onerror = (error) => {
        console.error(`❌ Data channel error with ${targetPeer.displayName}:`, error);
        connection.status = 'failed';
        debugInfo.current.connectionHistory.push({
          peer: targetPeer.peerId,
          status: 'failed',
          timestamp: Date.now()
        });
      };

      dataChannel.onclose = () => {
        console.log(`🚫 Data channel closed to ${targetPeer.displayName}`);
        connection.status = 'closed';
        debugInfo.current.connectionHistory.push({
          peer: targetPeer.peerId,
          status: 'closed',
          timestamp: Date.now()
        });
        
        // 🚀 REPORT P2P STATUS: Report P2P disconnection to server
        socket.emit('p2p-connection-failed', {
          targetSocketId: targetPeer.socketId,
          roomId,
          error: 'Data channel closed',
          timestamp: Date.now()
        });
        
        // Clean up connection
        setConnections(prev => {
          const updated = new Map(prev);
          updated.delete(targetPeer.peerId);
          return updated;
        });
      };

      // Handle incoming data channels (for incoming connections)
      peerConnection.ondatachannel = (event) => {
        const channel = event.channel;
        connection.dataChannel = channel;
        
        // Set up the same event handlers
        channel.onopen = dataChannel.onopen;
        channel.onmessage = dataChannel.onmessage;
        channel.onerror = dataChannel.onerror;
        channel.onclose = dataChannel.onclose;
      };

      // ICE candidate handling
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log(`❄️ Sending ICE candidate to ${targetPeer.displayName}`);
          socket.emit('webrtc-ice-candidate', {
            to: targetPeer.socketId,
            candidate: event.candidate,
            fromPeerId: displayName || 'Anonymous',
            roomId
          });
        }
      };

      // Connection state monitoring
      peerConnection.onconnectionstatechange = () => {
        const state = peerConnection.connectionState;
        console.log(`🔄 WebRTC connection state to ${targetPeer.displayName}: ${state}`);
        
        if (state === 'connected') {
          connection.status = 'connected';
          setConnectionStatus('connected');
        } else if (state === 'failed' || state === 'disconnected') {
          connection.status = 'failed';
          debugInfo.current.connectionHistory.push({
            peer: targetPeer.peerId,
            status: 'failed',
            timestamp: Date.now()
          });
          
          // 🚀 REPORT P2P STATUS: Notify socket server of failed connection
          socket.emit('webrtc-connection-failed', {
            to: targetPeer.socketId,
            error: `Connection state: ${state}`,
            fromPeerId: displayName || 'Anonymous',
            roomId
          });
          
          // 🚀 REPORT P2P STATUS: Report P2P failure to server for dashboard tracking
          socket.emit('p2p-connection-failed', {
            targetSocketId: targetPeer.socketId,
            roomId,
            error: `Connection state: ${state}`,
            timestamp: Date.now()
          });
        }
      };

      // Track this connection
      debugInfo.current.totalConnections++;
      
      return connection;
      
    } catch (error) {
      console.error(`❌ Error creating WebRTC connection to ${targetPeer.displayName}:`, error);
      
      debugInfo.current.connectionHistory.push({
        peer: targetPeer.peerId,
        status: 'error',
        timestamp: Date.now()
      });
      
      return null;
    }
  }, [socket, roomId, displayName]);

  // Connect to a peer with cooldown
  const connectToPeer = useCallback(async (targetPeer: Peer): Promise<boolean> => {
    if (!socket) {
      console.error('❌ No socket available for peer connection');
      return false;
    }

    // Don't connect to ourselves
    if (targetPeer.peerId === displayName) {
      console.warn('⚠️ Attempting to connect to self, skipping');
      return false;
    }

    // Check cooldown for this specific peer
    const now = Date.now();
    const lastAttempt = lastConnectionAttemptsRef.current.get(targetPeer.peerId) || 0;
    if (now - lastAttempt < CONNECTION_ATTEMPT_COOLDOWN) {
      console.log(`⏰ Connection attempt to ${targetPeer.displayName} is on cooldown (${Math.ceil((CONNECTION_ATTEMPT_COOLDOWN - (now - lastAttempt)) / 1000)}s remaining)`);
      return false;
    }

    // Check if already connected using ref
    if (connectionsRef.current.has(targetPeer.peerId)) {
      const existing = connectionsRef.current.get(targetPeer.peerId);
      if (existing?.status === 'connected') {
        console.log(`✅ Already connected to ${targetPeer.displayName}`);
        return true;
      }
    }

    try {
      console.log(`🚀 Initiating WebRTC connection to ${targetPeer.displayName}`);
      
      // Record this attempt to prevent rapid retries
      lastConnectionAttemptsRef.current.set(targetPeer.peerId, now);
      
      setConnectionStatus('connecting');
      
      const connection = await createPeerConnection(targetPeer);
      if (!connection) {
        return false;
      }

      // Store connection immediately
      setConnections(prev => new Map(prev.set(targetPeer.peerId, connection)));

      // Create and send offer
      const offer = await connection.peerConnection.createOffer({
        offerToReceiveAudio: false,
        offerToReceiveVideo: false
      });
      
      await connection.peerConnection.setLocalDescription(offer);
      
      console.log(`📤 Sending WebRTC offer to ${targetPeer.displayName}`);
      
      socket.emit('webrtc-offer', {
        to: targetPeer.socketId,
        offer: offer,
        fromPeerId: displayName || 'Anonymous',
        roomId
      });

      return true;
      
    } catch (error) {
      console.error(`❌ Failed to connect to ${targetPeer.displayName}:`, error);
      setConnectionStatus('failed');
      return false;
    }
  }, [socket, roomId, displayName, createPeerConnection]);

  // Disconnect from a peer
  const disconnectFromPeer = useCallback((peerId: string) => {
    setConnections(prev => {
      const connection = prev.get(peerId);
      if (!connection) {
        console.warn(`⚠️ No connection found for peer ${peerId}`);
        return prev;
      }

      try {
        console.log(`🚫 Disconnecting from peer ${peerId}`);
        
        // Notify the peer we're disconnecting
        if (socket) {
          const targetPeer = availablePeersRef.current.find(p => p.peerId === peerId);
          if (targetPeer) {
            socket.emit('webrtc-peer-disconnected', {
              to: targetPeer.socketId,
              fromPeerId: displayName || 'Anonymous',
              roomId
            });
            
            // 🚀 REPORT P2P STATUS: Report P2P disconnection to server
            socket.emit('p2p-connection-failed', {
              targetSocketId: targetPeer.socketId,
              roomId,
              error: 'Manual disconnection',
              timestamp: Date.now()
            });
          }
        }
        
        // Close the connection
        if (connection.dataChannel) {
          connection.dataChannel.close();
        }
        connection.peerConnection.close();
        
        debugInfo.current.connectionHistory.push({
          peer: peerId,
          status: 'disconnected',
          timestamp: Date.now()
        });
        
        // Remove from connections
        const updated = new Map(prev);
        updated.delete(peerId);
        return updated;
        
      } catch (error) {
        console.error(`❌ Error disconnecting from peer ${peerId}:`, error);
        return prev;
      }
    });
  }, [socket, displayName, roomId]);

  // Send message via P2P
  const sendMessage = useCallback(async (message: Message): Promise<boolean> => {
    const activeConnections = Array.from(connectionsRef.current.values()).filter(
      conn => conn.status === 'connected' && conn.dataChannel?.readyState === 'open'
    );

    if (activeConnections.length === 0) {
      console.log('📡 No P2P connections available for message sending');
      return false;
    }

    try {
      // 🔧 P2P MOBILE FIX: Ensure message has proper sender info before sending
      const enhancedMessage = {
        ...message,
        sender: displayName || message.sender,
        senderId: displayName || message.senderId || message.sender
      };
      
      const messageData = JSON.stringify(enhancedMessage);
      let successCount = 0;

      console.log(`📤 P2P: Sending message to ${activeConnections.length} peers:`, enhancedMessage.content);
      console.log(`📤 P2P: Sender info - sender: ${enhancedMessage.sender}, senderId: ${enhancedMessage.senderId}`);

      for (const connection of activeConnections) {
        try {
          connection.dataChannel!.send(messageData);
          connection.lastActivity = Date.now();
          successCount++;
          console.log(`✅ P2P: Sent to ${connection.peerId}`);
        } catch (error) {
          console.error(`❌ Failed to send P2P message to ${connection.peerId}:`, error);
          debugInfo.current.failedSends++;
        }
      }

      if (successCount > 0) {
        console.log(`✅ Sent P2P message to ${successCount}/${activeConnections.length} peers`);
        debugInfo.current.successfulSends++;
        
        // 🆕 P2P MESSAGE PERSISTENCE: Store P2P message on server for persistence
        if (socket && roomId) {
          try {
            console.log(`📦 P2P: Storing message on server for persistence`);
            socket.emit('p2p-message-store', {
              roomId,
              message: enhancedMessage
            });
          } catch (error) {
            console.warn('⚠️ Failed to store P2P message on server:', error);
          }
        }
        
        // 🔧 P2P MOBILE FIX: Also trigger our own message handler so sender sees the message
        if (onMessageRef.current && displayName) {
          console.log(`📨 P2P: Triggering own message handler for sender feedback`);
          setTimeout(() => {
            if (onMessageRef.current) {
              onMessageRef.current(enhancedMessage);
            }
          }, 50); // Small delay to ensure it doesn't conflict with WebSocket
        }
        
        return true;
      } else {
        debugInfo.current.failedSends++;
        return false;
      }
      
    } catch (error) {
      console.error('❌ Error sending P2P message:', error);
      debugInfo.current.failedSends++;
      return false;
    }
  }, [connections, displayName, socket, roomId]);

  // Refresh available peers with cooldown
  const refreshPeers = useCallback(() => {
    if (!socket || !roomId) return;
    
    const now = Date.now();
    if (now - lastPeerDiscoveryRef.current < PEER_DISCOVERY_COOLDOWN) {
      console.log(`⏰ Peer discovery on cooldown (${Math.ceil((PEER_DISCOVERY_COOLDOWN - (now - lastPeerDiscoveryRef.current)) / 1000)}s remaining)`);
      return;
    }
    
    console.log('🔍 Discovering WebRTC peers in room');
    lastPeerDiscoveryRef.current = now;
    socket.emit('webrtc-discover-peers', { roomId });
  }, [socket, roomId]);

  // Manual function to connect to all available peers (call this when needed)
  const connectToAllAvailablePeers = useCallback(async () => {
    console.log('🔍 [CONNECT ALL] Starting connection to all available peers...');
    console.log('🔍 [CONNECT ALL] Current available peers:', availablePeersRef.current.length);
    console.log('🔍 [CONNECT ALL] Peer details:', availablePeersRef.current);
    
    const peers = availablePeersRef.current;
    if (peers.length === 0) {
      console.log('🔍 [CONNECT ALL] No peers available for connection');
      return;
    }
    
    console.log(`🚀 [CONNECT ALL] Attempting to connect to ${peers.length} available peers`);
    
    const connectionPromises = peers.map((peer, index) => {
      console.log(`🔗 [CONNECT ALL] Starting connection ${index + 1}/${peers.length} to: ${peer.displayName} (${peer.peerId})`);
      return connectToPeer(peer);
    });
    
    const results = await Promise.allSettled(connectionPromises);
    
    const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
    const failed = results.length - successful;
    
    console.log(`✅ [CONNECT ALL] Connection results: ${successful}/${peers.length} successful, ${failed} failed`);
    
    // Log detailed results
    results.forEach((result, index) => {
      const peer = peers[index];
      if (result.status === 'fulfilled') {
        console.log(`✅ [CONNECT ALL] Peer ${index + 1} (${peer.displayName}): ${result.value ? 'SUCCESS' : 'FAILED'}`);
      } else {
        console.log(`❌ [CONNECT ALL] Peer ${index + 1} (${peer.displayName}): ERROR - ${result.reason}`);
      }
    });
    
  }, [connectToPeer]);

  // Set up socket event handlers
  useEffect(() => {
    if (!socket) {
      console.log('⚠️ [SOCKET] No socket available for WebRTC handlers');
      return;
    }
    
    if (!socket.connected) {
      console.log('⏳ [SOCKET] Socket not connected yet, waiting...');
      return;
    }

    console.log('🔌 [SOCKET] Setting up Custom WebRTC socket handlers');
    console.log('🔌 [SOCKET] Socket connected:', socket.connected);
    console.log('🔌 [SOCKET] Socket ID:', socket.id);

    // Handle incoming offers
    const handleOffer = async (data: any) => {
      try {
        console.log(`📥 Received WebRTC offer from ${data.fromPeerId} (socket: ${data.from})`);
        
        // 🔧 FIX: Find the peer in available peers OR use socket info to create peer data
        let targetPeer = availablePeersRef.current.find(p => p.socketId === data.from);
        
        if (!targetPeer) {
          console.log(`⚠️ Peer not in availablePeers list, creating from offer data`);
          // Create temporary peer data from offer
          targetPeer = {
            socketId: data.from,
            peerId: data.fromPeerId,
            displayName: data.fromPeerId, // Use peerId as fallback display name
            joinedAt: Date.now()
          };
          
          // Add to available peers for future reference
          setAvailablePeers(prev => {
            const updated = [...prev, targetPeer!];
            console.log(`📝 Added peer from offer to availablePeers:`, targetPeer!);
            return updated;
          });
        }

        const connection = await createPeerConnection(targetPeer);
        if (!connection) {
          console.error('❌ Failed to create connection for incoming offer');
          return;
        }

        // Store connection
        setConnections(prev => new Map(prev.set(targetPeer!.peerId, connection)));

        // Set remote description and create answer
        await connection.peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
        
        const answer = await connection.peerConnection.createAnswer();
        await connection.peerConnection.setLocalDescription(answer);

        console.log(`📤 Sending WebRTC answer to ${data.fromPeerId}`);
        
        socket.emit('webrtc-answer', {
          to: data.from,
          answer: answer,
          fromPeerId: displayName || 'Anonymous',
          roomId
        });
        
        // 🚀 REPORT P2P STATUS: Report P2P attempt to server for dashboard tracking
        socket.emit('request-p2p-upgrade', {
          roomId,
          peers: [data.fromPeerId],
          maxPeers: 5
        });
        
      } catch (error) {
        console.error('❌ Error handling WebRTC offer:', error);
        
        socket.emit('webrtc-connection-failed', {
          to: data.from,
          error: error instanceof Error ? error.message : 'Unknown error',
          fromPeerId: displayName || 'Anonymous',
          roomId
        });
      }
    };

    // Handle incoming answers
    const handleAnswer = async (data: any) => {
      try {
        console.log(`📥 Received WebRTC answer from ${data.fromPeerId}`);
        
        const targetPeer = availablePeersRef.current.find(p => p.socketId === data.from);
        if (!targetPeer) {
          console.warn('⚠️ Received answer from unknown peer');
          return;
        }

        const connection = connectionsRef.current.get(targetPeer.peerId);
        if (!connection) {
          console.warn(`⚠️ No connection found for answer from ${data.fromPeerId}`);
          return;
        }

        await connection.peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
        console.log(`✅ Set remote description for ${data.fromPeerId}`);
        
      } catch (error) {
        console.error('❌ Error handling WebRTC answer:', error);
      }
    };

    // Handle ICE candidates
    const handleIceCandidate = async (data: any) => {
      try {
        console.log(`❄️ Received ICE candidate from ${data.fromPeerId} (socket: ${data.from})`);
        
        // 🔧 FIX: Find the peer in available peers OR use socket info
        let targetPeer = availablePeersRef.current.find(p => p.socketId === data.from);
        
        if (!targetPeer) {
          console.log(`⚠️ ICE: Peer not in availablePeers, creating temporary peer data`);
          // Create temporary peer data
          targetPeer = {
            socketId: data.from,
            peerId: data.fromPeerId,
            displayName: data.fromPeerId,
            joinedAt: Date.now()
          };
        }

        const connection = connectionsRef.current.get(targetPeer.peerId);
        if (!connection) {
          console.warn(`⚠️ No connection found for ICE candidate from ${data.fromPeerId}`);
          return;
        }

        await connection.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
        
      } catch (error) {
        console.error('❌ Error handling ICE candidate:', error);
      }
    };

    // Handle peer discovery results - do NOT auto-connect
    const handlePeersDiscovered = (data: any) => {
      console.log(`🔍 [PEER DISCOVERY] Discovered ${data.peers.length} WebRTC peers in room ${roomId}`);
      console.log(`🔍 [PEER DISCOVERY] Peer details:`, data.peers);
      
      // Log each discovered peer
      data.peers.forEach((peer: any, index: number) => {
        console.log(`🔍 [PEER DISCOVERY] Peer ${index + 1}: ${peer.displayName} (socketId: ${peer.socketId}, peerId: ${peer.peerId})`);
      });
      
      setAvailablePeers(data.peers);
      console.log(`🔍 [PEER DISCOVERY] Updated availablePeers state with ${data.peers.length} peers`);
      // Note: We do NOT automatically connect to peers here to prevent loops
      // Connections should be initiated manually or through user interaction
    };

    // Handle connection failures
    const handleConnectionFailed = (data: any) => {
      console.log(`❌ WebRTC connection failed with ${data.fromPeerId}: ${data.error}`);
      
      const targetPeer = availablePeersRef.current.find(p => p.socketId === data.from);
      if (targetPeer) {
        const connection = connectionsRef.current.get(targetPeer.peerId);
        if (connection) {
          connection.status = 'failed';
          setConnections(prev => new Map(prev.set(targetPeer.peerId, connection)));
        }
      }
    };

    // Handle peer disconnections
    const handlePeerDisconnected = (data: any) => {
      console.log(`👋 WebRTC peer disconnected: ${data.fromPeerId}`);
      
      const targetPeer = availablePeersRef.current.find(p => p.socketId === data.from);
      if (targetPeer) {
        disconnectFromPeer(targetPeer.peerId);
      }
    };

    // 🆕 P2P MESSAGE PERSISTENCE: Handle server storage confirmations
    const handleP2PMessageStored = (data: any) => {
      console.log(`📦 P2P message stored on server:`, data.messageId);
      // Message is now persistent - no additional action needed
    };

    const handleP2PMessageStoreError = (data: any) => {
      console.warn(`⚠️ P2P message storage failed:`, data.error, data.messageId);
      // Could implement retry logic here if needed
    };

    // Register socket event handlers
    socket.on('webrtc-offer', handleOffer);
    socket.on('webrtc-answer', handleAnswer);
    socket.on('webrtc-ice-candidate', handleIceCandidate);
    socket.on('webrtc-peers-discovered', handlePeersDiscovered);
    socket.on('webrtc-connection-failed', handleConnectionFailed);
    socket.on('webrtc-peer-disconnected', handlePeerDisconnected);
    
    // 🆕 P2P MESSAGE PERSISTENCE: Register storage event handlers
    socket.on('p2p-message-stored', handleP2PMessageStored);
    socket.on('p2p-message-store-error', handleP2PMessageStoreError);

    // Initial peer discovery (ONE TIME, no auto-connect)
    refreshPeers();

    // Cleanup function
    return () => {
      socket.off('webrtc-offer', handleOffer);
      socket.off('webrtc-answer', handleAnswer);
      socket.off('webrtc-ice-candidate', handleIceCandidate);
      socket.off('webrtc-peers-discovered', handlePeersDiscovered);
      socket.off('webrtc-connection-failed', handleConnectionFailed);
      socket.off('webrtc-peer-disconnected', handlePeerDisconnected);
      
      // 🆕 P2P MESSAGE PERSISTENCE: Cleanup storage event handlers
      socket.off('p2p-message-stored', handleP2PMessageStored);
      socket.off('p2p-message-store-error', handleP2PMessageStoreError);
      
      cleanup();
    };
  }, [socket, roomId, displayName, createPeerConnection, cleanup, disconnectFromPeer, refreshPeers, socket?.connected]);

  // Update connection status based on active connections
  useEffect(() => {
    const activeConnections = Array.from(connections.values()).filter(
      conn => conn.status === 'connected'
    );

    if (activeConnections.length > 0) {
      setConnectionStatus('connected');
    } else if (connections.size > 0) {
      setConnectionStatus('connecting');
    } else {
      setConnectionStatus('disconnected');
    }
  }, [connections]);

  // 🚀 Add hook to report current P2P status periodically for dashboard
  useEffect(() => {
    if (!socket || !socket.connected) return;
    
    const reportInterval = setInterval(() => {
      const activeConnections = Array.from(connections.values()).filter(
        conn => conn.status === 'connected'
      );
      
      if (activeConnections.length > 0) {
        // Report current P2P status to server
        socket.emit('p2p-status-update', {
          roomId,
          activeConnections: activeConnections.length,
          connectedPeers: activeConnections.map(conn => conn.peerId),
          timestamp: Date.now()
        });
        
        console.log(`📊 Reported P2P status: ${activeConnections.length} active connections`);
      }
    }, 10000); // Report every 10 seconds if we have connections
    
    return () => clearInterval(reportInterval);
  }, [socket, connections, roomId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Direct cleanup without triggering state updates using ref
      const currentConnections = connectionsRef.current;
      currentConnections.forEach((connection, peerId) => {
        try {
          if (connection.dataChannel) {
            connection.dataChannel.close();
          }
          connection.peerConnection.close();
          console.log(`🚫 Unmount cleanup: Closed connection to ${peerId}`);
        } catch (error) {
          console.warn(`⚠️ Unmount cleanup error for ${peerId}:`, error);
        }
      });
    };
  }, []); // No dependencies to prevent re-running

  return {
    connections,
    connectionStatus,
    sendMessage,
    onMessage,
    setOnMessage: setOnMessageHandler, // 🔧 Use enhanced handler
    connectToPeer,
    connectToAllAvailablePeers,
    disconnectFromPeer,
    availablePeers,
    refreshPeers,
    debugInfo: debugInfo.current
  };
}
