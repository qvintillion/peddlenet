'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
// Remove npm import, use CDN version instead
// import Peer, { DataConnection } from 'peerjs';
import type { Message, ConnectionStatus } from '@/lib/types';
import { APP_CONFIG } from '@/lib/constants';

// TypeScript declarations for CDN Peer
declare global {
  interface Window {
    Peer: any;
  }
}

type DataConnection = any; // Use any for CDN version

export function useP2PSimple(roomId: string) {
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

  // Store and retrieve peer IDs for the room (client-side only)
  const storeRoomPeer = useCallback((newPeerId: string) => {
    if (typeof window === 'undefined' || newPeerId === peerId) {
      return;
    }

    const storageKey = `roomPeers_${roomIdRef.current}`;
    const stored = localStorage.getItem(storageKey);
    const peerIds = stored ? JSON.parse(stored) : [];
    
    if (!peerIds.includes(newPeerId)) {
      console.log('🔄 Storing new room peer:', newPeerId);
      peerIds.push(newPeerId);
      const filteredPeerIds = peerIds.filter((id: string) => id !== peerId);
      localStorage.setItem(storageKey, JSON.stringify(filteredPeerIds));
      setRoomPeers(filteredPeerIds);
      
      // Schedule connection attempt after connectToPeer is available
      setTimeout(() => {
        if (peerRef.current && !connectionsRef.current.has(newPeerId)) {
          console.log('🚀 Auto-connecting to newly discovered peer:', newPeerId);
          // Use peerRef directly to avoid dependency issue
          if (peerRef.current && newPeerId !== peerId && !connectionsRef.current.has(newPeerId)) {
            try {
              const conn = peerRef.current.connect(newPeerId, {
                reliable: true,
                metadata: { roomId: roomIdRef.current }
              });
              
              conn.on('open', () => {
                console.log('✓ Successfully connected to newly discovered peer:', newPeerId);
                // Setup connection will be handled by the existing connection handler
              });
              
              conn.on('error', (error: any) => {
                console.error('Failed to connect to newly discovered peer:', newPeerId, error);
              });
            } catch (error) {
              console.error('Exception connecting to newly discovered peer:', newPeerId, error);
            }
          }
        }
      }, 1000);
    }
  }, [peerId]);

  const getRoomPeers = useCallback((): string[] => {
    if (typeof window === 'undefined') return [];
    
    const storageKey = `roomPeers_${roomIdRef.current}`;
    const stored = localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : [];
  }, []);

  const setupConnection = useCallback((conn: DataConnection, isIncoming = false) => {
    console.log(`Setting up ${isIncoming ? 'incoming' : 'outgoing'} connection with:`, conn.peer);

    const handleData = (data: any) => {
      console.log('📨 Raw data received from', conn.peer, ':', data);
      if (data && typeof data === 'object' && 'type' in data) {
        const message = data as Message;
        console.log('📨 Parsed message from', conn.peer, ':', message.content);
        messageHandlersRef.current.forEach(handler => handler(message));
      }
    };

    const handleOpen = () => {
      console.log('✓ Successfully connected to:', conn.peer);
      setConnections(prev => {
        const newConnections = new Map(prev);
        newConnections.set(conn.peer, conn);
        return newConnections;
      });
      
      storeRoomPeer(conn.peer);
      updateStatus();
    };

    const handleClose = () => {
      console.log('Connection closed with:', conn.peer);
      setConnections(prev => {
        const newConnections = new Map(prev);
        newConnections.delete(conn.peer);
        return newConnections;
      });
      updateStatus();
    };

    const handleError = (error: any) => {
      console.error('Connection error with', conn.peer, ':', error);
      setConnections(prev => {
        const newConnections = new Map(prev);
        newConnections.delete(conn.peer);
        return newConnections;
      });
      updateStatus();
    };

    conn.on('data', handleData);
    conn.on('open', handleOpen);
    conn.on('close', handleClose);
    conn.on('error', handleError);

    if (conn.open) {
      handleOpen();
    }
  }, [storeRoomPeer, updateStatus]);

  const connectToPeer = useCallback(async (targetPeerId: string, retryCount = 0): Promise<boolean> => {
    const maxRetries = 3;
    
    if (!peerRef.current || !targetPeerId) {
      console.log('Cannot connect: no peer or no target');
      return false;
    }

    if (targetPeerId === peerId) {
      console.log('Preventing self-connection to:', targetPeerId);
      return false;
    }

    if (connectionsRef.current.has(targetPeerId)) {
      console.log('Already connected to:', targetPeerId);
      return true;
    }

    try {
      console.log(`Attempting to connect to peer: ${targetPeerId} (attempt ${retryCount + 1}/${maxRetries + 1})`);
      const conn = peerRef.current.connect(targetPeerId, {
        reliable: true,
        metadata: { roomId: roomIdRef.current }
      });
      
      return new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => {
          console.log(`Connection timeout for: ${targetPeerId} (attempt ${retryCount + 1})`);
          conn.close();
          
          if (retryCount < maxRetries) {
            console.log(`Retrying connection to ${targetPeerId} in 2 seconds...`);
            setTimeout(async () => {
              const retryResult = await connectToPeer(targetPeerId, retryCount + 1);
              resolve(retryResult);
            }, 2000);
          } else {
            console.log(`Max retries exceeded for: ${targetPeerId}`);
            resolve(false);
          }
        }, APP_CONFIG.connectionTimeout);

        conn.on('open', () => {
          clearTimeout(timeout);
          console.log('✓ Successfully connected to:', targetPeerId);
          setupConnection(conn, false);
          resolve(true);
        });

        conn.on('error', (error) => {
          clearTimeout(timeout);
          console.error(`Failed to connect to peer: ${targetPeerId} (attempt ${retryCount + 1}):`, error.type || error.message);
          
          if ((error.type === 'network' || error.type === 'server-error') && retryCount < maxRetries) {
            console.log(`Retrying connection to ${targetPeerId} due to ${error.type} in 2 seconds...`);
            setTimeout(async () => {
              const retryResult = await connectToPeer(targetPeerId, retryCount + 1);
              resolve(retryResult);
            }, 2000);
          } else {
            resolve(false);
          }
        });
      });
    } catch (error) {
      console.error('Exception connecting to peer:', targetPeerId, error);
      return false;
    }
  }, [peerId, setupConnection]);

  const autoConnectToRoomPeers = useCallback(async () => {
    if (!peerId) {
      console.log('No peerId yet, skipping auto-connect');
      return;
    }

    const peers = getRoomPeers();
    const validPeers = peers.filter(id => id !== peerId && id !== null && id !== undefined);
    console.log('Auto-connecting to room peers:', validPeers, '(filtered from:', peers, ')');

    if (validPeers.length === 0) {
      console.log('No valid peers to connect to');
      return;
    }

    for (const targetPeerId of validPeers) {
      if (!connectionsRef.current.has(targetPeerId)) {
        console.log('Attempting auto-connect to:', targetPeerId);
        const connected = await connectToPeer(targetPeerId);
        if (connected) {
          console.log('Auto-connected successfully to:', targetPeerId);
        } else {
          console.log('Auto-connect failed to:', targetPeerId);
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        console.log('Already connected to:', targetPeerId);
      }
    }
  }, [peerId, getRoomPeers, connectToPeer]);

  const sendMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>): string => {
    const fullMessage: Message = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      synced: false,
    };

    console.log('Sending message:', fullMessage.content, 'to', connectionsRef.current.size, 'connections');

    let sentCount = 0;
    connectionsRef.current.forEach((conn, peerId) => {
      if (conn.open) {
        try {
          conn.send(fullMessage);
          sentCount++;
          console.log('✓ Message sent to', peerId);
        } catch (error) {
          console.error('✗ Failed to send message to', conn.peer, ':', error);
        }
      }
    });

    console.log(`📤 Message sent to ${sentCount}/${connectionsRef.current.size} peers`);
    return fullMessage.id;
  }, []);

  const onMessage = useCallback((handler: (message: Message) => void) => {
    messageHandlersRef.current.add(handler);
    return () => {
      messageHandlersRef.current.delete(handler);
    };
  }, []);

  // Client-side only initialization to prevent hydration mismatch
  useEffect(() => {
    if (!roomId || isInitialized) return;
    
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Check HTTPS requirement
    if (window.location.protocol === 'http:') {
      console.error('🚨 HTTPS REQUIRED: PeerJS cannot connect reliably over HTTP on desktop browsers');
      console.log('💡 Solutions:');
      console.log('  1. Use: ngrok http 3000 (and use the HTTPS URL)');
      console.log('  2. Deploy to production (Vercel/Netlify)');
      return;
    }

    const initializePeer = async (): Promise<void> => {
      try {
        console.log('🚀 Initializing P2P for room:', roomId);
        console.log('📡 Current URL:', window.location.href);
        console.log('🔒 Is HTTPS:', window.location.protocol === 'https:');
        
        // Use the EXACT same configuration as the working diagnostic
        const workingConfig = {
          debug: 2, // Same as diagnostic
          // No additional config - use all defaults like the diagnostic
        };
        
        console.log('⚙️ Creating PeerJS with minimal config');
        
        // Wait for CDN PeerJS to load
        if (!window.Peer) {
          console.error('❌ PeerJS CDN not loaded yet');
          setTimeout(() => initializePeer(), 1000);
          return;
        }
        
        const newPeer = new window.Peer(undefined, workingConfig);
        
        // Increased timeout for slower networks
        const timeout = setTimeout(() => {
          console.error('⏰ P2P initialization timeout after 45 seconds');
          if (!newPeer.destroyed) {
            newPeer.destroy();
          }
          setIsInitialized(true); // Prevent retry loops
        }, 45000);

        newPeer.on('open', (id) => {
          clearTimeout(timeout);
          console.log('✅ P2P initialized with ID:', id);
          setPeerId(id);
          setPeer(newPeer);
          setIsInitialized(true);
          
          // Announce our peer ID to others in the same room
          console.log('📢 Announcing peer ID to room:', roomId);
          const announcement = {
            type: 'peer-announcement',
            roomId: roomId,
            peerId: id,
            timestamp: Date.now()
          };
          
          // Store our own peer ID announcement
          const announcementKey = `peerAnnouncement_${roomId}_${id}`;
          localStorage.setItem(announcementKey, JSON.stringify(announcement));
          
          // Clean up room peers storage
          const storageKey = `roomPeers_${roomId}`;
          const stored = localStorage.getItem(storageKey);
          const existingPeers = stored ? JSON.parse(stored) : [];
          
          const validPeers = existingPeers.filter((peerId: string) => 
            peerId !== id && peerId && peerId.length > 10
          );
          
          console.log('🧹 Cleaned room peers from', existingPeers, 'to', validPeers);
          localStorage.setItem(storageKey, JSON.stringify(validPeers));
          setRoomPeers(validPeers);
          
          // Check for other peer announcements in this room
          setTimeout(() => {
            console.log('🔍 Checking for other peers in room...');
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && key.startsWith(`peerAnnouncement_${roomId}_`) && !key.endsWith(`_${id}`)) {
                try {
                  const otherAnnouncement = JSON.parse(localStorage.getItem(key) || '{}');
                  if (otherAnnouncement.peerId && otherAnnouncement.peerId !== id) {
                    console.log('🎯 Found other peer in room:', otherAnnouncement.peerId);
                    storeRoomPeer(otherAnnouncement.peerId);
                  }
                } catch (e) {
                  console.log('Error parsing announcement:', e);
                }
              }
            }
          }, 2000);
          
          // Auto-connect to room peers after initialization
          setTimeout(autoConnectToRoomPeers, 5000);
        });

        newPeer.on('connection', (conn) => {
          console.log('📞 Incoming connection from:', conn.peer);
          setupConnection(conn, true);
        });

        newPeer.on('error', (error) => {
          clearTimeout(timeout);
          console.error('❌ Peer error:', error.type, error.message);
          setIsInitialized(true); // Prevent retry loops
          
          // Specific error handling
          if (error.type === 'network') {
            console.error('🌐 Network Error: Cannot reach PeerJS server');
            console.log('💡 Try switching networks or check firewall settings');
          } else if (error.type === 'server-error') {
            console.error('🖥️ Server Error: PeerJS cloud server issue');
            console.log('💡 Try refreshing the page in a few minutes');
          }
          
          console.log('🔄 Full error details:', error);
        });

        newPeer.on('disconnected', () => {
          console.log('🔌 Peer disconnected, attempting to reconnect...');
          if (!newPeer.destroyed) {
            try {
              newPeer.reconnect();
            } catch (e) {
              console.error('Failed to reconnect:', e);
            }
          }
        });

        newPeer.on('close', () => {
          console.log('🔒 Peer connection closed');
          setPeer(null);
          setPeerId(null);
          setConnections(new Map());
          updateStatus();
        });

      } catch (error) {
        console.error('💥 Exception during P2P initialization:', error);
        setIsInitialized(true); // Prevent retry loops
      }
    };

    console.log('🌍 Environment check:');
    console.log('- Protocol:', window.location.protocol);
    console.log('- WebRTC supported:', !!(window.RTCPeerConnection || window.webkitRTCPeerConnection));
    
    initializePeer();

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up P2P connections');
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
  }, [roomId, isInitialized, setupConnection, autoConnectToRoomPeers, updateStatus, storeRoomPeer]);

  // Retry auto-connect every 20 seconds if not connected
  useEffect(() => {
    if (peerId && connectionsRef.current.size === 0 && typeof window !== 'undefined') {
      const interval = setInterval(() => {
        console.log('🔄 Retrying auto-connect...');
        autoConnectToRoomPeers();
      }, 20000);

      return () => clearInterval(interval);
    }
  }, [peerId, autoConnectToRoomPeers, status.connectedPeers]);

  return {
    peerId,
    status,
    roomPeers,
    connectToPeer,
    sendMessage,
    onMessage,
    getConnectedPeers: () => Array.from(connectionsRef.current.keys()),
    // Debug helpers
    forceReconnect: autoConnectToRoomPeers,
    clearRoomPeers: () => {
      if (typeof window !== 'undefined') {
        const storageKey = `roomPeers_${roomId}`;
        localStorage.removeItem(storageKey);
        setRoomPeers([]);
      }
    }
  };
}