'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Message, ConnectionStatus } from '@/lib/types';
import { APP_CONFIG } from '@/lib/constants';

// TypeScript declarations for CDN Peer

// ===== PATCH: SDP/Initiator Guard Logic =====
function shouldInitiateConnection(ownId: string, targetId: string): boolean {
  return ownId.localeCompare(targetId) > 0;
}

declare global {
  interface Window {
    Peer: any;
  }
}

type DataConnection = any; // Use any for CDN version

export function useP2POptimized(roomId: string) {
  const [peer, setPeer] = useState<any | null>(null);
  const [peerId, setPeerId] = useState<string | null>(null);
  const [connections, setConnections] = useState<Map<string, DataConnection>>(new Map());
  const [roomPeers, setRoomPeers] = useState<string[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>({
    isConnected: false,
    connectedPeers: 0,
    networkReach: 'isolated',
    signalStrength: 'none',
  });
  const [isInitialized, setIsInitialized] = useState(false);
  
  const connectionsRef = useRef<Map<string, DataConnection>>(new Map());
  const messageHandlersRef = useRef<Set<(message: Message) => void>>(new Set());
  const peerRef = useRef<any | null>(null);
  const roomIdRef = useRef<string>(roomId);
  const connectionAttemptsRef = useRef<Map<string, number>>(new Map());

  // Update refs when state changes
  useEffect(() => {
    connectionsRef.current = connections;
  }, [connections]);

  useEffect(() => {
    peerRef.current = peer;
  }, [peer]);

  useEffect(() => {
    roomIdRef.current = roomId;
  }, [roomId]);

  const updateStatus = useCallback(() => {
    const connectedCount = connectionsRef.current.size;
    setStatus({
      isConnected: connectedCount > 0,
      connectedPeers: connectedCount,
      networkReach: connectedCount > 0 ? 'local' : 'isolated',
      signalStrength: connectedCount > 0 ? 'strong' : 'none',
    });
  }, []);

  // Optimized peer storage with broadcast mechanism
  const broadcastPresence = useCallback((myPeerId: string) => {
    if (typeof window === 'undefined') return;
    
    const presenceKey = `presence_${roomIdRef.current}`;
    const presence = {
      peerId: myPeerId,
      timestamp: Date.now(),
      roomId: roomIdRef.current
    };
    
    // Broadcast our presence
    localStorage.setItem(`${presenceKey}_${myPeerId}`, JSON.stringify(presence));
    
    // Clean up old presences (older than 5 minutes)
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(presenceKey)) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          if (data.timestamp < fiveMinutesAgo) {
            localStorage.removeItem(key);
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
  }, []);

  // Discover peers more efficiently
  const discoverPeers = useCallback((): string[] => {
    if (typeof window === 'undefined') return [];
    
    const presenceKey = `presence_${roomIdRef.current}`;
    const peers: string[] = [];
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000; // Only consider recent presences
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(presenceKey) && !key.endsWith(`_${peerId}`)) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          if (data.peerId && data.timestamp > oneMinuteAgo && data.peerId !== peerId) {
            peers.push(data.peerId);
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
    
    return peers;
  }, [peerId]);

  // Enhanced connection setup with better error handling
  const setupConnection = useCallback((conn: DataConnection, isIncoming = false) => {
    console.log(`🔗 Setting up ${isIncoming ? 'incoming' : 'outgoing'} connection with:`, conn.peer);

    // Mark connection as pending
    conn._isSettingUp = true;

    const handleData = (data: any) => {
      console.log('📨 Raw data received from', conn.peer, ':', data);
      
      // Handle different data types
      if (data && typeof data === 'object') {
        if (data.type === 'ping') {
          // Respond to ping with pong
          try {
            conn.send({ type: 'pong', timestamp: Date.now() });
          } catch (e) {
            console.error('Failed to send pong:', e);
          }
        } else if (data.type === 'pong') {
          console.log('🏓 Pong received from', conn.peer);
        } else if ('type' in data && 'content' in data) {
          // This is a chat message
          const message = data as Message;
          console.log('💬 Chat message from', conn.peer, ':', message.content);
          messageHandlersRef.current.forEach(handler => {
            try {
              handler(message);
            } catch (e) {
              console.error('Error in message handler:', e);
            }
          });
        }
      }
    };

    const handleOpen = () => {
      console.log('✅ Connection opened with:', conn.peer);
      conn._isSettingUp = false;
      
      // Update connections
      setConnections(prev => {
        const newConnections = new Map(prev);
        newConnections.set(conn.peer, conn);
        return newConnections;
      });
      
      // Send initial ping to verify connection
      try {
        conn.send({ type: 'ping', timestamp: Date.now() });
        console.log('🏓 Sent ping to', conn.peer);
      } catch (e) {
        console.error('Failed to send initial ping:', e);
      }
      
      updateStatus();
    };

    const handleClose = () => {
      console.log('❌ Connection closed with:', conn.peer);
      conn._isSettingUp = false;
      
      setConnections(prev => {
        const newConnections = new Map(prev);
        newConnections.delete(conn.peer);
        return newConnections;
      });
      updateStatus();
    };

    const handleError = (error: any) => {
      console.error('⚠️ Connection error with', conn.peer, ':', error);
      conn._isSettingUp = false;
      
      setConnections(prev => {
        const newConnections = new Map(prev);
        newConnections.delete(conn.peer);
        return newConnections;
      });
      updateStatus();
    };

    // Remove old listeners to prevent duplicates
    conn.removeAllListeners('data');
    conn.removeAllListeners('open');
    conn.removeAllListeners('close');
    conn.removeAllListeners('error');

    // Set up new listeners
    conn.on('data', handleData);
    conn.on('open', handleOpen);
    conn.on('close', handleClose);
    conn.on('error', handleError);

    // If already open, trigger open handler
    if (conn.open) {
      handleOpen();
    }
  }, [updateStatus]);

  // Optimized connection with shorter timeouts and better retry logic
  const connectToPeer = useCallback(async (targetPeerId: string, retryCount = 0): Promise<boolean> => {
    const maxRetries = 2; // Reduced from 3
    const timeout = 5000; // Reduced from 15000
    
    if (!peerRef.current || !targetPeerId) {
      console.log('❌ Cannot connect: no peer or no target');
      return false;
    }

    if (targetPeerId === peerId) {
      console.log('❌ Preventing self-connection');
      return false;
    }

    // Check if already connected or connecting
    const existingConn = connectionsRef.current.get(targetPeerId);
    if (existingConn) {
      if (existingConn.open) {
        console.log('✅ Already connected to:', targetPeerId);
        return true;
      } else if (existingConn._isSettingUp) {
        console.log('⏳ Connection already in progress to:', targetPeerId);
        return false;
      }
    }

    // Track connection attempts
    const attempts = connectionAttemptsRef.current.get(targetPeerId) || 0;
    if (attempts >= 5) {
      console.log('❌ Too many connection attempts to:', targetPeerId);
      return false;
    }
    connectionAttemptsRef.current.set(targetPeerId, attempts + 1);

    try {
      console.log(`🚀 Connecting to: ${targetPeerId} (attempt ${retryCount + 1}/${maxRetries + 1})`);
      
      const conn = peerRef.current.connect(targetPeerId, {
        reliable: true,
        metadata: { roomId: roomIdRef.current }
      });
      
      return new Promise<boolean>((resolve) => {
        const timeoutId = setTimeout(() => {
          console.log(`⏰ Connection timeout for: ${targetPeerId}`);
          conn.close();
          
          if (retryCount < maxRetries) {
            console.log(`🔄 Retrying connection to ${targetPeerId}...`);
            setTimeout(async () => {
              const result = await connectToPeer(targetPeerId, retryCount + 1);
              resolve(result);
            }, 1000); // Reduced from 2000
          } else {
            console.log(`❌ Max retries exceeded for: ${targetPeerId}`);
            resolve(false);
          }
        }, timeout);

        conn.on('open', () => {
          clearTimeout(timeoutId);
          console.log('✅ Connected to:', targetPeerId);
          setupConnection(conn, false);
          resolve(true);
        });

        conn.on('error', (error: any) => {
          clearTimeout(timeoutId);
          console.error(`❌ Connection error: ${targetPeerId}:`, error.type || error);
          
          if (retryCount < maxRetries && (error.type === 'network' || error.type === 'server-error')) {
            setTimeout(async () => {
              const result = await connectToPeer(targetPeerId, retryCount + 1);
              resolve(result);
            }, 1000);
          } else {
            resolve(false);
          }
        });
      });
    } catch (error) {
      console.error('💥 Exception connecting to peer:', targetPeerId, error);
      return false;
    }
  }, [peerId, setupConnection]);

  // Fast auto-connect with parallel connections
  const autoConnectToRoomPeers = useCallback(async () => {
    if (!peerId) {
      console.log('⏳ No peerId yet, skipping auto-connect');
      return;
    }

    const discoveredPeers = discoverPeers();
    console.log('🔍 Discovered peers:', discoveredPeers);

    if (discoveredPeers.length === 0) {
      console.log('📭 No peers found in room');
      return;
    }

    // Connect to all peers in parallel for faster connection
    const connectionPromises = discoveredPeers.map(targetPeerId => {
      if (!connectionsRef.current.has(targetPeerId)) {
        return connectToPeer(targetPeerId);
      }
      return Promise.resolve(true);
    });

    const results = await Promise.all(connectionPromises);
    const successCount = results.filter(r => r).length;
    console.log(`✅ Connected to ${successCount}/${discoveredPeers.length} peers`);
  }, [peerId, discoverPeers, connectToPeer]);

  // Optimized message sending with verification
  const sendMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>): string => {
    const fullMessage: Message = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      synced: false,
    };

    console.log('📤 Sending message:', fullMessage.content);

    let sentCount = 0;
    let errors = 0;
    
    connectionsRef.current.forEach((conn, peerId) => {
      if (conn.open && !conn._isSettingUp) {
        try {
          conn.send(fullMessage);
          sentCount++;
          console.log('✅ Message sent to', peerId);
        } catch (error) {
          errors++;
          console.error('❌ Failed to send to', peerId, ':', error);
        }
      } else {
        console.log('⏭️ Skipping closed/pending connection:', peerId);
      }
    });

    console.log(`📊 Message sent: ${sentCount} success, ${errors} errors, ${connectionsRef.current.size} total peers`);
    return fullMessage.id;
  }, []);

  const onMessage = useCallback((handler: (message: Message) => void) => {
    messageHandlersRef.current.add(handler);
    return () => {
      messageHandlersRef.current.delete(handler);
    };
  }, []);

  // Heartbeat to keep connections alive
  useEffect(() => {
    if (!peer || connectionsRef.current.size === 0) return;

    const interval = setInterval(() => {
      connectionsRef.current.forEach((conn, peerId) => {
        if (conn.open) {
          try {
            conn.send({ type: 'ping', timestamp: Date.now() });
          } catch (e) {
            console.error('Heartbeat failed for', peerId);
          }
        }
      });
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [peer, status.connectedPeers]);

  // Initialize P2P with optimized settings
  useEffect(() => {
    if (!roomId || isInitialized) return;
    if (typeof window === 'undefined') return;

    const initializePeer = async (): Promise<void> => {
      try {
        console.log('🚀 Initializing optimized P2P for room:', roomId);
        
        // Wait for PeerJS CDN
        let attempts = 0;
        while (!window.Peer && attempts < 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
        
        if (!window.Peer) {
          console.error('❌ PeerJS CDN not loaded');
          return;
        }
        
        // Optimized config with multiple STUN servers
        const config = {
          debug: 2,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
              { urls: 'stun:stun2.l.google.com:19302' },
              { urls: 'stun:stun3.l.google.com:19302' },
              { urls: 'stun:stun4.l.google.com:19302' }
            ],
            iceCandidatePoolSize: 10
          }
        };
        
        const newPeer = new window.Peer(undefined, config);
        
        const timeout = setTimeout(() => {
          console.error('⏰ P2P initialization timeout');
          if (!newPeer.destroyed) {
            newPeer.destroy();
          }
          setIsInitialized(true);
        }, 10000); // Reduced from 45000

        newPeer.on('open', (id: string) => {
          clearTimeout(timeout);
          console.log('✅ P2P initialized with ID:', id);
          setPeerId(id);
          setPeer(newPeer);
          setIsInitialized(true);
          
          // Broadcast presence immediately
          broadcastPresence(id);
          
          // Start auto-connect quickly
          setTimeout(autoConnectToRoomPeers, 1000); // Reduced from 5000
        });

        newPeer.on('connection', (conn: DataConnection) => {
          console.log('📞 Incoming connection from:', conn.peer);
          setupConnection(conn, true);
          
          // Store this peer for future connections
          broadcastPresence(peerId || '');
        });

        newPeer.on('error', (error: any) => {
          clearTimeout(timeout);
          console.error('❌ Peer error:', error.type, error.message);
          setIsInitialized(true);
        });

        newPeer.on('disconnected', () => {
          console.log('🔌 Peer disconnected, attempting reconnect...');
          if (!newPeer.destroyed) {
            try {
              newPeer.reconnect();
            } catch (e) {
              console.error('Reconnect failed:', e);
            }
          }
        });

        newPeer.on('close', () => {
          console.log('🔒 Peer closed');
          setPeer(null);
          setPeerId(null);
          setConnections(new Map());
          updateStatus();
        });

      } catch (error) {
        console.error('💥 P2P initialization error:', error);
        setIsInitialized(true);
      }
    };

    initializePeer();

    return () => {
      console.log('🧹 Cleaning up P2P');
      connectionsRef.current.forEach(conn => {
        try {
          conn.close();
        } catch (error) {
          console.error('Error closing connection:', error);
        }
      });
      
      if (peerRef.current && !peerRef.current.destroyed) {
        peerRef.current.destroy();
      }
    };
  }, [roomId, isInitialized, setupConnection, autoConnectToRoomPeers, updateStatus, broadcastPresence]);

  // Periodic presence broadcast and peer discovery
  useEffect(() => {
    if (!peerId) return;

    // Broadcast presence every 30 seconds
    const presenceInterval = setInterval(() => {
      broadcastPresence(peerId);
    }, 30000);

    // Check for new peers every 10 seconds
    const discoveryInterval = setInterval(() => {
      if (connectionsRef.current.size === 0) {
        autoConnectToRoomPeers();
      }
    }, 10000); // Reduced from 20000

    return () => {
      clearInterval(presenceInterval);
      clearInterval(discoveryInterval);
    };
  }, [peerId, broadcastPresence, autoConnectToRoomPeers, status.connectedPeers]);

  // Set room peers from discovered peers
  useEffect(() => {
    if (typeof window !== 'undefined' && peerId) {
      const peers = discoverPeers();
      setRoomPeers(peers);
    }
  }, [peerId, discoverPeers, status.connectedPeers]);

  return {
    peerId,
    status,
    roomPeers,
    connectToPeer,
    sendMessage,
    onMessage,
    getConnectedPeers: () => Array.from(connectionsRef.current.keys()),
    forceReconnect: autoConnectToRoomPeers,
    clearRoomPeers: () => {
      if (typeof window !== 'undefined') {
        // Clear all presence data for this room
        const presenceKey = `presence_${roomId}`;
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && key.startsWith(presenceKey)) {
            localStorage.removeItem(key);
          }
        }
        connectionAttemptsRef.current.clear();
        setRoomPeers([]);
      }
    }
  };
}
