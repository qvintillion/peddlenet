'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Message } from '@/lib/types';
import { generateCompatibleUUID } from '@/utils/peer-utils';

// Socket.IO P2P Integration for Phase 1 Mesh Networking
// This provides automatic P2P upgrade for WebSocket connections

interface P2PManager {
  isEnabled: boolean;
  isConnected: boolean;
  peerCount: number;
  upgrade: () => void;
  downgrade: () => void;
  sendMessage: (message: Message) => boolean;
  onMessage: (handler: (message: Message) => void) => () => void;
  getStats: () => P2PStats;
}

interface P2PStats {
  isP2PActive: boolean;
  connectedPeers: number;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'none';
  messagesViaMesh: number;
  fallbackToWebSocket: number;
  lastUpgradeAttempt: number;
}

// Mock implementation for when socket.io-p2p is not available
class MockP2PManager implements P2PManager {
  isEnabled = false;
  isConnected = false;
  peerCount = 0;
  
  private messageHandlers = new Set<(message: Message) => void>();
  private stats: P2PStats = {
    isP2PActive: false,
    connectedPeers: 0,
    connectionQuality: 'none',
    messagesViaMesh: 0,
    fallbackToWebSocket: 0,
    lastUpgradeAttempt: 0
  };
  
  upgrade() {
    console.log('🌐 P2P upgrade requested (mock mode - socket.io-p2p not available)');
    this.stats.lastUpgradeAttempt = Date.now();
  }
  
  downgrade() {
    console.log('🌐 P2P downgrade requested (mock mode)');
  }
  
  sendMessage(message: Message): boolean {
    console.log('🌐 P2P send requested (mock mode) - message will fall back to WebSocket');
    this.stats.fallbackToWebSocket++;
    return false;
  }
  
  onMessage(handler: (message: Message) => void): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }
  
  getStats(): P2PStats {
    return { ...this.stats };
  }
}

// Real implementation when socket.io-p2p is available
class SocketIOPeerManager implements P2PManager {
  private socket: Socket | null = null;
  private p2pSocket: any = null; // socket.io-p2p instance
  private messageHandlers = new Set<(message: Message) => void>();
  private roomId: string;
  private isP2PUpgraded = false;
  
  private stats: P2PStats = {
    isP2PActive: false,
    connectedPeers: 0,
    connectionQuality: 'none',
    messagesViaMesh: 0,
    fallbackToWebSocket: 0,
    lastUpgradeAttempt: 0
  };
  
  constructor(socket: Socket, roomId: string) {
    this.socket = socket;
    this.roomId = roomId;
    this.initializeP2P();
  }
  
  get isEnabled(): boolean {
    return !!this.p2pSocket;
  }
  
  get isConnected(): boolean {
    return this.isP2PUpgraded && this.stats.connectedPeers > 0;
  }
  
  get peerCount(): number {
    return this.stats.connectedPeers;
  }
  
  private async initializeP2P() {
    try {
      // Dynamically import socket.io-p2p if available
      const P2P = await import('socket.io-p2p');
      
      if (this.socket && P2P.default) {
        console.log('🌐 Initializing socket.io-p2p...');
        
        this.p2pSocket = new P2P.default(this.socket, {
          autoUpgrade: false, // Manual control for better user experience
          numClients: 5, // Limit mesh size for performance
          forceDisconnect: false
        });
        
        this.setupP2PEventHandlers();
        console.log('✅ Socket.IO P2P initialized successfully');
      }
    } catch (error) {
      console.log('ℹ️ socket.io-p2p not available, using mock mode:', error.message);
      // P2P features will be disabled, fallback to WebSocket only
    }
  }
  
  private setupP2PEventHandlers() {
    if (!this.p2pSocket) return;
    
    // P2P connection established
    this.p2pSocket.on('upgrade', () => {
      console.log('🌐 P2P connection upgraded successfully');
      this.isP2PUpgraded = true;
      this.stats.isP2PActive = true;
      this.stats.connectionQuality = 'good';
      this.updatePeerCount();
    });
    
    // P2P connection failed or downgraded
    this.p2pSocket.on('downgrade', () => {
      console.log('🔄 P2P connection downgraded to WebSocket');
      this.isP2PUpgraded = false;
      this.stats.isP2PActive = false;
      this.stats.connectionQuality = 'none';
      this.stats.connectedPeers = 0;
    });
    
    // Peer joined the mesh
    this.p2pSocket.on('peer joined', (peer: any) => {
      console.log('👥 P2P peer joined:', peer);
      this.updatePeerCount();
      this.stats.connectionQuality = this.stats.connectedPeers > 2 ? 'excellent' : 'good';
    });
    
    // Peer left the mesh
    this.p2pSocket.on('peer left', (peer: any) => {
      console.log('👋 P2P peer left:', peer);
      this.updatePeerCount();
      this.stats.connectionQuality = this.stats.connectedPeers > 2 ? 'excellent' : 
                                     this.stats.connectedPeers > 0 ? 'good' : 'none';
    });
    
    // Receive P2P message
    this.p2pSocket.on('message', (data: any) => {
      try {
        if (data?.type === 'chat' && data?.content) {
          console.log('📨 P2P message received:', data);
          this.stats.messagesViaMesh++;
          
          // Notify message handlers
          this.messageHandlers.forEach(handler => {
            try {
              handler(data as Message);
            } catch (e) {
              console.error('P2P message handler error:', e);
            }
          });
        }
      } catch (error) {
        console.error('P2P message processing error:', error);
      }
    });
    
    // P2P connection errors
    this.p2pSocket.on('error', (error: any) => {
      console.error('❌ P2P connection error:', error);
      this.stats.connectionQuality = 'poor';
    });
  }
  
  private updatePeerCount() {
    if (this.p2pSocket && this.p2pSocket.peers) {
      this.stats.connectedPeers = Object.keys(this.p2pSocket.peers).length;
    }
  }
  
  upgrade() {
    if (!this.p2pSocket || this.isP2PUpgraded) {
      console.log('🌐 P2P upgrade not possible');
      return;
    }
    
    console.log('🌐 Attempting P2P upgrade...');
    this.stats.lastUpgradeAttempt = Date.now();
    
    try {
      // Signal the server that we want to attempt P2P
      if (this.socket) {
        this.socket.emit('request-p2p-upgrade', {
          roomId: this.roomId,
          maxPeers: 5
        });
      }
      
      // Initiate the P2P upgrade
      this.p2pSocket.upgrade();
    } catch (error) {
      console.error('❌ P2P upgrade failed:', error);
      this.stats.fallbackToWebSocket++;
    }
  }
  
  downgrade() {
    if (!this.p2pSocket || !this.isP2PUpgraded) {
      console.log('🌐 P2P downgrade not needed');
      return;
    }
    
    console.log('🔄 Downgrading P2P to WebSocket...');
    
    try {
      this.p2pSocket.downgrade();
    } catch (error) {
      console.error('❌ P2P downgrade failed:', error);
    }
  }
  
  sendMessage(message: Message): boolean {
    if (!this.isP2PUpgraded || !this.p2pSocket) {
      this.stats.fallbackToWebSocket++;
      return false;
    }
    
    try {
      console.log('📤 Sending message via P2P mesh:', message.content);
      
      // Send via P2P mesh
      this.p2pSocket.emit('message', {
        id: message.id,
        content: message.content,
        sender: message.sender,
        senderId: message.senderId,
        timestamp: message.timestamp,
        type: message.type || 'chat',
        roomId: this.roomId
      });
      
      this.stats.messagesViaMesh++;
      return true;
    } catch (error) {
      console.error('❌ P2P message send failed:', error);
      this.stats.fallbackToWebSocket++;
      return false;
    }
  }
  
  onMessage(handler: (message: Message) => void): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }
  
  getStats(): P2PStats {
    this.updatePeerCount(); // Update peer count before returning stats
    return { ...this.stats };
  }
}

// Hook for socket.io-p2p integration
export function useSocketIOPeer(socket: Socket | null, roomId: string) {
  const [p2pManager, setP2PManager] = useState<P2PManager | null>(null);
  const [isP2PAvailable, setIsP2PAvailable] = useState(false);
  const initializingRef = useRef(false);
  
  // Initialize P2P manager when socket is available
  useEffect(() => {
    if (!socket || !roomId || initializingRef.current) return;
    
    initializingRef.current = true;
    
    const initializeManager = async () => {
      try {
        // Try to create real P2P manager
        const manager = new SocketIOPeerManager(socket, roomId);
        
        // Wait a bit to see if P2P initializes
        setTimeout(() => {
          if (manager.isEnabled) {
            setP2PManager(manager);
            setIsP2PAvailable(true);
            console.log('✅ Socket.IO P2P manager ready');
          } else {
            // Fall back to mock manager
            const mockManager = new MockP2PManager();
            setP2PManager(mockManager);
            setIsP2PAvailable(false);
            console.log('ℹ️ Using mock P2P manager (socket.io-p2p not available)');
          }
          initializingRef.current = false;
        }, 1000);
        
      } catch (error) {
        console.log('❌ Failed to initialize P2P manager:', error);
        const mockManager = new MockP2PManager();
        setP2PManager(mockManager);
        setIsP2PAvailable(false);
        initializingRef.current = false;
      }
    };
    
    initializeManager();
    
    return () => {
      initializingRef.current = false;
    };
  }, [socket, roomId]);
  
  // Auto-upgrade conditions (conservative approach)
  const attemptAutoUpgrade = useCallback(() => {
    if (!p2pManager || !isP2PAvailable) return;
    
    // Only attempt upgrade if:
    // 1. Not already upgraded
    // 2. Small group (better success rate)
    // 3. WiFi connection preferred
    if (!p2pManager.isConnected) {
      console.log('🤖 Auto-attempting P2P upgrade...');
      p2pManager.upgrade();
    }
  }, [p2pManager, isP2PAvailable]);
  
  // Auto-upgrade timer (conservative - only after being in room for a while)
  useEffect(() => {
    if (!p2pManager || !isP2PAvailable) return;
    
    const upgradeTimer = setTimeout(() => {
      attemptAutoUpgrade();
    }, 15000); // Wait 15 seconds before attempting upgrade
    
    return () => clearTimeout(upgradeTimer);
  }, [p2pManager, isP2PAvailable, attemptAutoUpgrade]);
  
  return {
    p2pManager,
    isP2PAvailable,
    isP2PConnected: p2pManager?.isConnected || false,
    peerCount: p2pManager?.peerCount || 0,
    stats: p2pManager?.getStats() || {
      isP2PActive: false,
      connectedPeers: 0,
      connectionQuality: 'none' as const,
      messagesViaMesh: 0,
      fallbackToWebSocket: 0,
      lastUpgradeAttempt: 0
    },
    attemptUpgrade: attemptAutoUpgrade
  };
}

// Advanced P2P utilities
export const P2PUtils = {
  // Check if P2P is likely to work in current environment
  isP2PViable(): boolean {
    if (typeof window === 'undefined') return false;
    
    // Check for WebRTC support
    const hasWebRTC = !!(
      window.RTCPeerConnection ||
      (window as any).webkitRTCPeerConnection ||
      (window as any).mozRTCPeerConnection
    );
    
    if (!hasWebRTC) return false;
    
    // Check for basic socket.io support
    if (typeof io === 'undefined') return false;
    
    return true;
  },
  
  // Detect optimal conditions for P2P upgrade
  shouldAttemptUpgrade(peerCount: number, connectionType?: string): boolean {
    // Small groups work better for P2P
    if (peerCount > 5) return false;
    
    // Prefer WiFi connections for P2P
    if (connectionType === 'cellular') return false;
    
    // Don't attempt if WebRTC not supported
    if (!this.isP2PViable()) return false;
    
    return true;
  },
  
  // Get connection quality assessment
  assessConnectionQuality(latency: number, packetLoss: number = 0): 'excellent' | 'good' | 'poor' | 'none' {
    if (latency === 0) return 'none';
    if (latency < 50 && packetLoss < 0.01) return 'excellent';
    if (latency < 150 && packetLoss < 0.05) return 'good';
    if (latency < 500 && packetLoss < 0.15) return 'poor';
    return 'none';
  }
};
