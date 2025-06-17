// Mobile connection diagnostics
export const MobileNetworkDebug = {
  // Test if we can reach the server
  async testServerReachability(baseUrl: string): Promise<{
    reachable: boolean;
    port: number;
    error: string;
    latency: number;
  }> {
    const ports = [3001, 3002, 3003, 3004, 3005];
    
    for (const port of ports) {
      const testUrl = `${baseUrl.replace(/:\d+$/, '')}:${port}`;
      try {
        const start = Date.now();
        const response = await fetch(`${testUrl}/health`, {
          method: 'HEAD',
          signal: AbortSignal.timeout(5000)
        });
        
        if (response.ok) {
          return {
            reachable: true,
            port,
            latency: Date.now() - start
          };
        }
      } catch (error) {
        console.log(`Port ${port} not reachable:`, error.message);
      }
    }
    
    return {
      reachable: false,
      error: 'No server found on any port'
    };
  },

  // Get current network info
  getNetworkInfo() {
    const connection = (navigator as any).connection || 
                     (navigator as any).mozConnection || 
                     (navigator as any).webkitConnection;
    
    return {
      userAgent: navigator.userAgent,
      onLine: navigator.onLine,
      connection: connection ? {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      } : null,
      url: window.location.href,
      origin: window.location.origin,
      hostname: window.location.hostname
    };
  },

  // Test WebSocket connectivity
  async testWebSocketConnection(url: string): Promise<{
    success: boolean;
    error: string;
    transport: string;
  }> {
    return new Promise((resolve) => {
      const socket = new WebSocket(url.replace(/^http/, 'ws'));
      
      const timeout = setTimeout(() => {
        socket.close();
        resolve({
          success: false,
          error: 'Connection timeout'
        });
      }, 5000);
      
      socket.onopen = () => {
        clearTimeout(timeout);
        socket.close();
        resolve({
          success: true,
          transport: 'websocket'
        });
      };
      
      socket.onerror = (error) => {
        clearTimeout(timeout);
        resolve({
          success: false,
          error: 'WebSocket error'
        });
      };
    });
  },

  // Comprehensive mobile connectivity test
  async runFullDiagnostics(targetIP: string): Promise<any> {
    console.log('🔍 Running mobile network diagnostics...');
    
    const results = {
      timestamp: new Date().toISOString(),
      network: this.getNetworkInfo(),
      servers: [],
      recommendations: []
    };
    
    // Test localhost
    const localhostTest = await this.testServerReachability('http://localhost');
    results.servers.push({
      type: 'localhost',
      url: 'http://localhost',
      ...localhostTest
    });
    
    // Test detected IP if available
    if (targetIP && targetIP !== 'localhost') {
      const ipTest = await this.testServerReachability(`http://${targetIP}`);
      results.servers.push({
        type: 'detected-ip',
        url: `http://${targetIP}`,
        ...ipTest
      });
      
      // Test WebSocket to detected IP
      if (ipTest.reachable) {
        const wsTest = await this.testWebSocketConnection(`http://${targetIP}:${ipTest.port}`);
        results.servers[results.servers.length - 1].websocket = wsTest;
      }
    }
    
    // Generate recommendations
    const reachableServers = results.servers.filter(s => s.reachable);
    
    if (reachableServers.length === 0) {
      results.recommendations.push('❌ No servers reachable. Start the signaling server: node signaling-server.js');
      results.recommendations.push('🌐 Ensure both devices are on the same WiFi network');
    } else if (reachableServers.some(s => s.type === 'detected-ip')) {
      results.recommendations.push('✅ Mobile connection should work!');
    } else {
      results.recommendations.push('⚠️ Only localhost reachable. Mobile devices cannot connect.');
      results.recommendations.push('🔧 Check firewall settings or use IP detection tools');
    }
    
    return results;
  },

  // Simple connectivity check for UI
  async quickConnectivityCheck(serverUrl: string): Promise<boolean> {
    try {
      const response = await fetch(`${serverUrl}/health`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(3000)
      });
      return response.ok;
    } catch {
      return false;
    }
  }
};

// Global access for debugging - use setTimeout to avoid initialization issues
if (typeof window !== 'undefined') {
  setTimeout(() => {
    try {
      (window as any).MobileNetworkDebug = MobileNetworkDebug;
      console.log('🔍 Mobile Network Debug available as window.MobileNetworkDebug');
    } catch (error) {
      console.warn('MobileNetworkDebug initialization failed:', error);
    }
  }, 0);
}
