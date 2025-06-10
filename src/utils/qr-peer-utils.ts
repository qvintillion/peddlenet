// QR Code Peer Discovery - Enhanced for reliable direct connection
export const QRPeerUtils = {
  // Enhanced QR generation with host peer info for instant connection
  generateRoomQRWithPeer(roomId: string, peerId: string, displayName: string) {
    const roomData = {
      roomId,
      hostPeerId: peerId,
      hostName: displayName,
      timestamp: Date.now(),
      version: '3.0',
      capabilities: ['webrtc', 'text']
    };
    
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const params = new URLSearchParams({
      room: roomId,
      host: peerId,
      name: encodeURIComponent(displayName),
      t: Date.now().toString() // timestamp for freshness
    });
    
    const qrUrl = `${baseUrl}/chat/${roomId}?${params.toString()}`;
    console.log('📱 Generated QR with host peer info:', peerId);
    return qrUrl;
  },
  
  // Parse QR code URL to extract host peer info
  parseQRUrl(url: string) {
    try {
      const urlObj = new URL(url);
      const params = new URLSearchParams(urlObj.search);
      const pathParts = urlObj.pathname.split('/');
      const roomId = pathParts[pathParts.length - 1];
      
      return {
        roomId,
        hostPeerId: params.get('host'),
        hostName: decodeURIComponent(params.get('name') || ''),
        timestamp: parseInt(params.get('t') || '0'),
        hasHostInfo: !!params.get('host')
      };
    } catch (e) {
      console.error('Failed to parse QR URL:', e);
      return null;
    }
  },
  
  // Enhanced host peer info storage with metadata
  storeHostPeerInfo(hostInfo: any, currentRoomId: string) {
    if (!hostInfo || !hostInfo.hostPeerId || hostInfo.roomId !== currentRoomId) return;
    
    const hostKey = `host_peer_v3_${currentRoomId}`;
    const enhancedHostInfo = {
      ...hostInfo,
      discoveredAt: Date.now(),
      connectionAttempts: 0,
      lastConnectionAttempt: 0,
      version: '3.0'
    };
    
    localStorage.setItem(hostKey, JSON.stringify(enhancedHostInfo));
    
    // Also add to presence for discovery
    const presenceKey = `presence_v3_${currentRoomId}_${hostInfo.hostPeerId}`;
    const presenceData = {
      peerId: hostInfo.hostPeerId,
      roomId: currentRoomId,
      timestamp: Date.now(),
      displayName: hostInfo.hostName,
      capabilities: ['webrtc', 'text'],
      lastSeen: Date.now(),
      isHost: true
    };
    localStorage.setItem(presenceKey, JSON.stringify(presenceData));
    
    console.log('📱 Stored host peer info for direct connection:', hostInfo.hostPeerId);
  },
  
  // Get host peer info with enhanced validation
  getHostPeerInfo(roomId: string) {
    const hostKey = `host_peer_v3_${roomId}`;
    try {
      const stored = localStorage.getItem(hostKey);
      if (stored) {
        const hostInfo = JSON.parse(stored);
        const tenMinutesAgo = Date.now() - 10 * 60 * 1000; // Extended to 10 minutes
        
        if (hostInfo.discoveredAt > tenMinutesAgo) {
          return hostInfo;
        } else {
          // Clean up old host info
          localStorage.removeItem(hostKey);
          console.log('🧹 Cleaned up expired host peer info');
        }
      }
    } catch (e) {
      localStorage.removeItem(hostKey);
    }
    return null;
  },
  
  // Smart connection to host peer with retry logic
  async connectToHostPeer(roomId: string, p2pHook: any): Promise<boolean> {
    const hostInfo = this.getHostPeerInfo(roomId);
    
    if (!hostInfo || !hostInfo.hostPeerId) {
      console.log('📭 No host peer info available for direct connection');
      return false;
    }
    
    // Check if already connected
    const connectedPeers = p2pHook.getConnectedPeers();
    if (connectedPeers.includes(hostInfo.hostPeerId)) {
      console.log('✅ Already connected to host peer');
      return true;
    }
    
    // Rate limiting - don't attempt too frequently
    const now = Date.now();
    const timeSinceLastAttempt = now - (hostInfo.lastConnectionAttempt || 0);
    if (timeSinceLastAttempt < 5000) { // 5 second cooldown
      console.log('⏰ Host connection on cooldown');
      return false;
    }
    
    // Update attempt tracking
    hostInfo.connectionAttempts = (hostInfo.connectionAttempts || 0) + 1;
    hostInfo.lastConnectionAttempt = now;
    
    // If we've failed 2+ times, this host peer is likely stale
    if (hostInfo.connectionAttempts >= 2) {
      console.log('🕰️ Host peer appears stale after 2 failed attempts, removing');
      localStorage.removeItem(`host_peer_v3_${roomId}`);
      return false;
    }
    
    localStorage.setItem(`host_peer_v3_${roomId}`, JSON.stringify(hostInfo));
    
    console.log(`📱 Attempting connection to host: ${hostInfo.hostPeerId} (attempt ${hostInfo.connectionAttempts})`);
    
    try {
      const result = await p2pHook.connectToPeer(hostInfo.hostPeerId);
      if (result) {
        console.log('✅ Successfully connected to host peer via QR');
        // Reset attempt counter on success
        hostInfo.connectionAttempts = 0;
        localStorage.setItem(`host_peer_v3_${roomId}`, JSON.stringify(hostInfo));
      } else {
        console.log('❌ Failed to connect to host peer - removing stale data');
        localStorage.removeItem(`host_peer_v3_${roomId}`);
      }
      return result;
    } catch (e) {
      console.error('💥 Error connecting to host peer:', e);
      
      // If error indicates peer doesn't exist, remove stale data immediately
      if (e.message && (e.message.includes('peer-unavailable') || e.message.includes('could not connect'))) {
        console.log('🧠 Peer unavailable error detected, clearing stale host data');
        localStorage.removeItem(`host_peer_v3_${roomId}`);
      }
      
      return false;
    }
  },
  
  // Auto-connect to host peer if available
  autoConnectToHost(roomId: string, p2pHook: any) {
    // Only auto-connect if we have no other connections
    if (p2pHook.getConnectedPeers().length > 0) {
      return;
    }
    
    const hostInfo = this.getHostPeerInfo(roomId);
    if (hostInfo && hostInfo.hasHostInfo) {
      setTimeout(() => {
        this.connectToHostPeer(roomId, p2pHook);
      }, 2000); // 2 second delay for initialization
    }
  },
  
  // Clean up old host peer data
  cleanupOldHostData(roomId?: string) {
    if (typeof window === 'undefined') return;
    
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
    let cleaned = 0;
    
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key?.startsWith('host_peer_v3_') && (!roomId || key.includes(roomId))) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          if (data.discoveredAt < tenMinutesAgo) {
            localStorage.removeItem(key);
            cleaned++;
          }
        } catch (e) {
          localStorage.removeItem(key);
          cleaned++;
        }
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} old host peer entries`);
    }
  },
  
  // Get connection strategy for room
  getConnectionStrategy(roomId: string) {
    const hostInfo = this.getHostPeerInfo(roomId);
    
    return {
      hasHostPeer: !!hostInfo,
      hostPeerId: hostInfo?.hostPeerId,
      hostName: hostInfo?.hostName,
      strategy: hostInfo ? 'direct_via_qr' : 'discovery_only',
      canAutoConnect: !!hostInfo && (hostInfo.connectionAttempts || 0) < 3
    };
  }
};

// Global access for debugging - use setTimeout to avoid initialization issues
if (typeof window !== 'undefined') {
  setTimeout(() => {
    try {
      (window as any).QRPeerUtils = QRPeerUtils;
      console.log('📱 QR Peer Utils v3.0 available as window.QRPeerUtils');
    } catch (error) {
      console.warn('QRPeerUtils initialization failed:', error);
    }
  }, 0);
}