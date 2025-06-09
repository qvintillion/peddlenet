// utils/server-utils.ts - Centralized server URL management with HTTP/WS separation

export const ServerUtils = {
  /**
   * Get the HTTP URL for REST API calls (health checks, etc.)
   */
  getHttpServerUrl(): string {
    if (typeof window === 'undefined') return 'http://localhost:3001';
    
    const envUrl = process.env.NEXT_PUBLIC_SIGNALING_SERVER;
    const detectedIP = process.env.NEXT_PUBLIC_DETECTED_IP;
    const currentHostname = window.location.hostname;
    const currentProtocol = window.location.protocol;
    
    console.log('🔍 HTTP Server URL detection:');
    console.log('  - NEXT_PUBLIC_SIGNALING_SERVER:', envUrl);
    console.log('  - NEXT_PUBLIC_DETECTED_IP:', detectedIP);
    console.log('  - Current hostname:', currentHostname);
    console.log('  - Current protocol:', currentProtocol);
    
    // Production: Convert WSS to HTTPS for HTTP calls
    if (envUrl && envUrl.startsWith('wss://')) {
      const httpUrl = envUrl.replace('wss://', 'https://');
      console.log('🌐 Using production HTTP URL:', httpUrl);
      return httpUrl;
    }
    
    // Production: Use HTTPS URL directly if provided
    if (envUrl && envUrl.startsWith('https://')) {
      console.log('🌐 Using production HTTPS URL:', envUrl);
      return envUrl;
    }
    
    // Production: Use HTTP URL if provided  
    if (envUrl && envUrl.startsWith('http://')) {
      console.log('🌐 Using production HTTP URL:', envUrl);
      return envUrl;
    }
    
    // Development: Use detected IP for local network
    if (detectedIP && detectedIP !== 'localhost') {
      const httpUrl = `http://${detectedIP}:3001`;
      console.log('🌐 Using detected IP for HTTP:', httpUrl);
      return httpUrl;
    }
    
    // Development: Use current hostname if accessing via IP
    if (currentHostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
      const httpUrl = `http://${currentHostname}:3001`;
      console.log('🌐 Using current hostname for HTTP:', httpUrl);
      return httpUrl;
    }
    
    // Development: Use HTTPS if we're on HTTPS
    if (currentProtocol === 'https:' && currentHostname !== 'localhost') {
      const httpsUrl = `https://${currentHostname}:3001`;
      console.log('🌐 Using HTTPS for secure context:', httpsUrl);
      return httpsUrl;
    }
    
    // Fallback: localhost
    const fallbackUrl = 'http://localhost:3001';
    console.log('🏠 Using localhost fallback for HTTP:', fallbackUrl);
    return fallbackUrl;
  },

  /**
   * Get the WebSocket URL for Socket.IO connections
   */
  getWebSocketServerUrl(): string {
    if (typeof window === 'undefined') return 'http://localhost:3001';
    
    const envUrl = process.env.NEXT_PUBLIC_SIGNALING_SERVER;
    const detectedIP = process.env.NEXT_PUBLIC_DETECTED_IP;
    const currentHostname = window.location.hostname;
    const currentProtocol = window.location.protocol;
    
    console.log('🔍 WebSocket Server URL detection:');
    console.log('  - NEXT_PUBLIC_SIGNALING_SERVER:', envUrl);
    console.log('  - NEXT_PUBLIC_DETECTED_IP:', detectedIP);
    console.log('  - Current hostname:', currentHostname);
    console.log('  - Current protocol:', currentProtocol);
    
    // Production: Use WSS URL directly for WebSocket connections
    if (envUrl && envUrl.startsWith('wss://')) {
      console.log('🌐 Using production WSS URL:', envUrl);
      return envUrl;
    }
    
    // Production: Convert HTTPS to WSS for WebSocket connections  
    if (envUrl && envUrl.startsWith('https://')) {
      const wssUrl = envUrl.replace('https://', 'wss://');
      console.log('🌐 Using converted WSS URL:', wssUrl);
      return wssUrl;
    }
    
    // Production: Use HTTP URL for WebSocket (Socket.IO will handle protocol)
    if (envUrl && envUrl.startsWith('http://')) {
      console.log('🌐 Using production HTTP URL for WebSocket:', envUrl);
      return envUrl;
    }
    
    // Development: Use detected IP for local network
    if (detectedIP && detectedIP !== 'localhost') {
      const httpUrl = `http://${detectedIP}:3001`;
      console.log('🌐 Using detected IP for WebSocket:', httpUrl);
      return httpUrl;
    }
    
    // Development: Use current hostname if accessing via IP
    if (currentHostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
      const httpUrl = `http://${currentHostname}:3001`;
      console.log('🌐 Using current hostname for WebSocket:', httpUrl);
      return httpUrl;
    }
    
    // Development: Use HTTP even if we're on HTTPS (Socket.IO will upgrade)
    if (currentProtocol === 'https:' && currentHostname !== 'localhost') {
      const httpUrl = `http://${currentHostname}:3001`;
      console.log('🌐 Using HTTP for WebSocket (will upgrade to WSS):', httpUrl);
      return httpUrl;
    }
    
    // Fallback: localhost
    const fallbackUrl = 'http://localhost:3001';
    console.log('🏠 Using localhost fallback for WebSocket:', fallbackUrl);
    return fallbackUrl;
  },

  /**
   * Test if the HTTP server is reachable
   */
  async testHttpHealth(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const serverUrl = this.getHttpServerUrl();
      console.log('🏥 Testing HTTP health:', serverUrl);
      
      const response = await fetch(`${serverUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(10000),
        mode: 'cors'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ HTTP health check passed:', data);
      return { success: true, data };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ HTTP health check failed:', errorMessage);
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Get environment info for debugging
   */
  getEnvironmentInfo(): {
    httpUrl: string;
    webSocketUrl: string;
    environment: 'development' | 'production';
    protocol: string;
    hostname: string;
  } {
    const httpUrl = this.getHttpServerUrl();
    const webSocketUrl = this.getWebSocketServerUrl();
    const environment = httpUrl.includes('localhost') || httpUrl.includes('192.168.') || httpUrl.includes('10.') ? 'development' : 'production';
    
    return {
      httpUrl,
      webSocketUrl,
      environment,
      protocol: typeof window !== 'undefined' ? window.location.protocol : 'http:',
      hostname: typeof window !== 'undefined' ? window.location.hostname : 'localhost'
    };
  }
};

// Global access for debugging
if (typeof window !== 'undefined') {
  (window as any).ServerUtils = ServerUtils;
  console.log('🔧 Server Utils loaded - separate HTTP/WebSocket URL management');
}
