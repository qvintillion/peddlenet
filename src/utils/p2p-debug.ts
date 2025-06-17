// Debug utilities for P2P connections
export const P2PDebugUtils = {
  // Enable debug logging
  enableDebugLogging() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('P2P_DEBUG', 'true');
      console.log('🐛 P2P debug logging enabled');
    }
  },

  // Disable debug logging
  disableDebugLogging() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('P2P_DEBUG');
      console.log('🐛 P2P debug logging disabled');
    }
  },

  // Check if debug logging is enabled
  isDebugEnabled(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('P2P_DEBUG') === 'true';
  },

  // Get all presence data for debugging
  getAllPresenceData(roomId: string) {
    if (typeof window === 'undefined') return [];
    
    const presenceData = [];
    const prefix = `presence_v2_${roomId}_`;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(prefix)) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          presenceData.push({ key, ...data });
        } catch (e) {
          presenceData.push({ key, error: 'Parse error' });
        }
      }
    }
    
    return presenceData;
  },

  // Clear all presence data for a room
  clearRoomPresence(roomId: string) {
    if (typeof window === 'undefined') return 0;
    
    let cleared = 0;
    const prefix = `presence_v2_${roomId}_`;
    
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key?.startsWith(prefix)) {
        localStorage.removeItem(key);
        cleared++;
      }
    }
    
    console.log(`🧹 Cleared ${cleared} presence entries for room ${roomId}`);
    return cleared;
  },

  // Get connection statistics
  getConnectionStats(p2pHook: any) {
    return {
      peerId: p2pHook.peerId,
      connectedPeers: p2pHook.getConnectedPeers(),
      status: p2pHook.status,
      queuedMessages: p2pHook.getQueuedMessages(),
      connectionQuality: p2pHook.getConnectionQuality(),
      connectionAttempts: p2pHook.getConnectionAttempts(),
      reconnectAttempts: p2pHook.getReconnectAttempts(),
      roomPeers: p2pHook.roomPeers
    };
  },

  // Monitor connection health
  startConnectionMonitor(p2pHook: any, intervalMs = 5000) {
    const interval = setInterval(() => {
      const stats = this.getConnectionStats(p2pHook);
      
      if (this.isDebugEnabled()) {
        console.log('📊 P2P Connection Stats:', {
          timestamp: new Date().toISOString(),
          ...stats
        });
      }
    }, intervalMs);
    
    console.log(`🔍 Started connection monitor (${intervalMs}ms interval)`);
    return interval;
  },

  // Stop connection monitor
  stopConnectionMonitor(interval: NodeJS.Timeout) {
    clearInterval(interval);
    console.log('🔍 Stopped connection monitor');
  },

  // Test connection to a specific peer
  async testConnection(p2pHook: any, targetPeerId: string) {
    console.log(`🧪 Testing connection to peer: ${targetPeerId}`);
    
    const startTime = Date.now();
    const result = await p2pHook.connectToPeer(targetPeerId);
    const duration = Date.now() - startTime;
    
    console.log(`🧪 Connection test result: ${result ? 'SUCCESS' : 'FAILED'} (${duration}ms)`);
    return { success: result, duration };
  },

  // Force reconnect to all peers
  async forceReconnectAll(p2pHook: any) {
    console.log('🔄 Forcing reconnection to all peers...');
    
    const startTime = Date.now();
    await p2pHook.forceReconnect();
    const duration = Date.now() - startTime;
    
    console.log(`🔄 Reconnection completed in ${duration}ms`);
    return duration;
  },

  // Simulate network issues
  simulateNetworkIssues(p2pHook: any, durationMs = 10000) {
    console.log(`🌐 Simulating network issues for ${durationMs}ms`);
    
    // Clear all connections
    p2pHook.getConnectedPeers().forEach((peerId: string) => {
      console.log(`❌ Simulating disconnection from ${peerId}`);
    });
    
    // Schedule recovery
    setTimeout(() => {
      console.log('🌐 Network recovery - attempting reconnection');
      p2pHook.forceReconnect();
    }, durationMs);
  },

  // Export debug data
  exportDebugData(p2pHook: any, roomId: string) {
    const debugData = {
      timestamp: new Date().toISOString(),
      roomId,
      stats: this.getConnectionStats(p2pHook),
      presenceData: this.getAllPresenceData(roomId),
      localStorage: this.getRelevantLocalStorage(roomId),
      browserInfo: {
        userAgent: navigator.userAgent,
        webrtcSupport: !!(window as any).RTCPeerConnection,
        peerJSLoaded: !!(window as any).Peer
      }
    };
    
    // Create downloadable file
    const blob = new Blob([JSON.stringify(debugData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `festival-chat-debug-${roomId}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('📋 Debug data exported');
    return debugData;
  },

  // Get relevant localStorage data
  getRelevantLocalStorage(roomId: string) {
    if (typeof window === 'undefined') return {};
    
    const relevantKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes(roomId) || key.includes('P2P') || key.includes('presence'))) {
        relevantKeys.push(key);
      }
    }
    
    const data: Record<string, any> = {};
    relevantKeys.forEach(key => {
      try {
        data[key] = JSON.parse(localStorage.getItem(key) || '{}');
      } catch (e) {
        data[key] = localStorage.getItem(key);
      }
    });
    
    return data;
  },

  // Validate P2P environment
  validateEnvironment() {
    const checks = {
      https: window.location.protocol === 'https:' || window.location.hostname === 'localhost',
      webrtc: !!(window as any).RTCPeerConnection,
      peerjs: !!(window as any).Peer,
      localStorage: !!window.localStorage,
      modernBrowser: 'crypto' in window && 'randomUUID' in crypto
    };
    
    const allPassed = Object.values(checks).every(Boolean);
    
    console.log('🔍 P2P Environment Check:', {
      ...checks,
      overall: allPassed ? 'PASS' : 'FAIL'
    });
    
    if (!allPassed) {
      const issues = Object.entries(checks)
        .filter(([_, passed]) => !passed)
        .map(([check]) => check);
      
      console.warn('⚠️ P2P Environment Issues:', issues);
    }
    
    return { checks, allPassed };
  },

  // Performance profiler
  startPerformanceProfile() {
    const profile = {
      startTime: Date.now(),
      connections: 0,
      messages: 0,
      errors: 0,
      connectionTimes: [] as number[]
    };
    
    console.log('📈 Started performance profiling');
    return profile;
  },

  // Log performance event
  logPerformanceEvent(profile: any, event: string, data: any) {
    const timestamp = Date.now() - profile.startTime;
    
    if (this.isDebugEnabled()) {
      console.log(`📈 [${timestamp}ms] ${event}:`, data);
    }
    
    // Track specific metrics
    switch (event) {
      case 'connection_established':
        profile.connections++;
        if (data?.duration) {
          profile.connectionTimes.push(data.duration);
        }
        break;
      case 'message_sent':
        profile.messages++;
        break;
      case 'error':
        profile.errors++;
        break;
    }
  },

  // Get performance summary
  getPerformanceSummary(profile: any) {
    const duration = Date.now() - profile.startTime;
    const avgConnectionTime = profile.connectionTimes.length > 0 
      ? profile.connectionTimes.reduce((a, b) => a + b, 0) / profile.connectionTimes.length
      : 0;
    
    const summary = {
      totalDuration: duration,
      connectionsEstablished: profile.connections,
      messagesSent: profile.messages,
      errors: profile.errors,
      averageConnectionTime: avgConnectionTime,
      connectionsPerMinute: (profile.connections / duration) * 60000,
      messagesPerMinute: (profile.messages / duration) * 60000,
      errorRate: profile.errors / Math.max(1, profile.connections + profile.messages)
    };
    
    console.log('📈 Performance Summary:', summary);
    return summary;
  }
};

// Global debug interface for browser console
if (typeof window !== 'undefined') {
  (window as any).P2PDebug = P2PDebugUtils;
  console.log('🐛 P2P Debug utilities available as window.P2PDebug');
}
