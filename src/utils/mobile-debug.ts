// Mobile Connection Debug Utility
export const MobileConnectionDebug = {
  // Test mobile WebRTC capabilities
  testMobileWebRTC() {
    const results = {
      userAgent: navigator.userAgent,
      isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      webrtcSupport: !!(window as any).RTCPeerConnection,
      peerJSLoaded: !!(window as any).Peer,
      protocol: window.location.protocol,
      timestamp: new Date().toISOString()
    };
    
    console.log('📱 Mobile WebRTC Test Results:', results);
    return results;
  },
  
  // Force mobile connection reset
  resetMobileConnections() {
    if (typeof window === 'undefined') return;
    
    // Clear connection attempts
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.includes('connection_attempts') || key.includes('reconnect_attempts')) {
        localStorage.removeItem(key);
      }
    });
    
    console.log('📱 Mobile connection attempts reset');
  },
  
  // Get mobile connection diagnostics
  getMobileDiagnostics(p2pHook: any) {
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    return {
      isMobile,
      device: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine
      },
      webrtc: {
        support: !!(window as any).RTCPeerConnection,
        peerJSLoaded: !!(window as any).Peer
      },
      connection: {
        protocol: window.location.protocol,
        hostname: window.location.hostname,
        port: window.location.port
      },
      p2pStats: p2pHook ? {
        peerId: p2pHook.peerId,
        connectedPeers: p2pHook.getConnectedPeers(),
        connectionAttempts: p2pHook.getConnectionAttempts(),
        reconnectAttempts: p2pHook.getReconnectAttempts(),
        roomPeers: p2pHook.roomPeers
      } : null,
      recommendations: this.getMobileRecommendations()
    };
  },
  
  // Get mobile-specific recommendations
  getMobileRecommendations() {
    const recommendations = [];
    
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      recommendations.push('⚠️ Use HTTPS for mobile WebRTC connections');
    }
    
    if (!navigator.onLine) {
      recommendations.push('⚠️ Device appears to be offline');
    }
    
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
      recommendations.push('📱 Try switching between WiFi and mobile data');
      recommendations.push('📱 Consider using mobile hotspot for testing');
      recommendations.push('📱 Ensure browser has camera/microphone permissions');
    }
    
    return recommendations;
  },
  
  // Test specific peer connection
  async testPeerConnection(targetPeerId: string, p2pHook: any) {
    if (!p2pHook || !targetPeerId) {
      console.error('❌ Missing p2pHook or targetPeerId');
      return false;
    }
    
    console.log(`📱 Testing mobile connection to: ${targetPeerId}`);
    
    const startTime = Date.now();
    const result = await p2pHook.connectToPeer(targetPeerId);
    const duration = Date.now() - startTime;
    
    const testResult = {
      success: result,
      duration,
      targetPeerId,
      timestamp: new Date().toISOString(),
      attempts: p2pHook.getConnectionAttempts()[targetPeerId] || 0
    };
    
    console.log('📱 Mobile connection test result:', testResult);
    return testResult;
  },
  
  // Get mobile network info
  getMobileNetworkInfo() {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    if (connection) {
      return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      };
    }
    
    return { info: 'Network API not available' };
  }
};

// Global access for mobile debugging
if (typeof window !== 'undefined') {
  (window as any).MobileConnectionDebug = MobileConnectionDebug;
  console.log('📱 Mobile Connection Debug available as window.MobileConnectionDebug');
}
