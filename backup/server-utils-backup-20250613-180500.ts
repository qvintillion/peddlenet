// utils/server-utils.ts - Centralized server URL management with Vercel support

export const ServerUtils = {
  /**
   * Get the HTTP URL for REST API calls (room codes, health checks, etc.)
   */
  getHttpServerUrl(): string {
    if (typeof window === 'undefined') return 'http://localhost:3001';
    
    const envUrl = process.env.NEXT_PUBLIC_SIGNALING_SERVER;
    const detectedIP = process.env.NEXT_PUBLIC_DETECTED_IP;
    const currentHostname = window.location.hostname;
    const currentProtocol = window.location.protocol;
    const currentOrigin = window.location.origin;
    
    console.log('🔍 HTTP Server URL detection:');
    console.log('  - NEXT_PUBLIC_SIGNALING_SERVER:', envUrl);
    console.log('  - NEXT_PUBLIC_DETECTED_IP:', detectedIP);
    console.log('  - Current hostname:', currentHostname);
    console.log('  - Current protocol:', currentProtocol);
    console.log('  - Current origin:', currentOrigin);
    
    // 🚀 VERCEL DETECTION: If we're on a Vercel domain, use the current origin for API calls
    if (currentHostname.includes('.vercel.app') || 
        currentHostname.includes('peddlenet.app') ||
        (currentHostname !== 'localhost' && !currentHostname.match(/^\d+\.\d+\.\d+\.\d+$/))) {
      console.log('🚀 Vercel deployment detected, using current origin for API:', currentOrigin);
      return currentOrigin;
    }
    
    // PRIORITY: If we're on localhost, always use local server
    if (currentHostname === 'localhost' || currentHostname === '127.0.0.1') {
      const localUrl = 'http://localhost:3001';
      console.log('🏠 Using localhost (development mode):', localUrl);
      return localUrl;
    }
    
    // Development: Use detected IP for local network (mobile testing)
    if (detectedIP && detectedIP !== 'localhost' && currentHostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
      const httpUrl = `http://${detectedIP}:3001`;
      console.log('📱 Using detected IP for mobile testing:', httpUrl);
      return httpUrl;
    }
    
    // Development: Use current hostname if accessing via IP
    if (currentHostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
      const httpUrl = `http://${currentHostname}:3001`;
      console.log('🌐 Using current IP for HTTP:', httpUrl);
      return httpUrl;
    }
    
    // Production: Convert WSS to HTTPS for HTTP calls (Cloud Run fallback)
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
    
    // PRIORITY: If we're on localhost, always use local server
    if (currentHostname === 'localhost' || currentHostname === '127.0.0.1') {
      const localUrl = 'http://localhost:3001';
      console.log('🏠 Using localhost (development mode):', localUrl);
      return localUrl;
    }
    
    // Development: Use detected IP for local network (mobile testing)
    if (detectedIP && detectedIP !== 'localhost' && currentHostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
      const httpUrl = `http://${detectedIP}:3001`;
      console.log('📱 Using detected IP for mobile testing:', httpUrl);
      return httpUrl;
    }
    
    // Development: Use current hostname if accessing via IP
    if (currentHostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
      const httpUrl = `http://${currentHostname}:3001`;
      console.log('🌐 Using current IP for WebSocket:', httpUrl);
      return httpUrl;
    }
    
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
    
    // Fallback: localhost
    const fallbackUrl = 'http://localhost:3001';
    console.log('🏠 Using localhost fallback for WebSocket:', fallbackUrl);
    return fallbackUrl;
  },

  /**
   * Get the API endpoint path for admin calls
   * Returns "/api/admin" for Vercel, "/admin" for Cloud Run
   */
  getAdminApiPath(): string {
    if (typeof window === 'undefined') return '/admin';
    
    const currentHostname = window.location.hostname;
    
    // If we're on Vercel (or similar platform), use /api/admin
    if (currentHostname.includes('.vercel.app') || 
        currentHostname.includes('peddlenet.app') ||
        (currentHostname !== 'localhost' && !currentHostname.match(/^\d+\.\d+\.\d+\.\d+$/))) {
      console.log('🚀 Using Vercel API path: /api/admin');
      return '/api/admin';
    }
    
    // For localhost or Cloud Run, use /admin
    console.log('🌐 Using Cloud Run API path: /admin');
    return '/admin';
  },

  /**
   * Test if the HTTP server is reachable
   */
  async testHttpHealth(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const serverUrl = this.getHttpServerUrl();
      console.log('🏥 Testing HTTP health:', serverUrl);
      
      // For Vercel deployments, use the API route
      const healthEndpoint = serverUrl.includes('.vercel.app') || serverUrl.includes('peddlenet.app') || serverUrl === window.location.origin
        ? `${serverUrl}/api/health`
        : `${serverUrl}/health`;
      
      const response = await fetch(healthEndpoint, {
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
   * Detect current deployment environment based on URL patterns
   */
  detectEnvironment(): 'development' | 'staging' | 'production' {
    if (typeof window === 'undefined') return 'development';
    
    const hostname = window.location.hostname;
    const href = window.location.href;
    
    // Development - localhost or IP addresses
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
      return 'development';
    }
    
    // Staging detection patterns
    if (
      // Firebase preview channels
      href.includes('--') && href.includes('.web.app') ||
      // Staging-specific domains
      hostname.includes('staging') ||
      hostname.includes('preview') ||
      // Firebase preview channel pattern: project-id--preview-name-123.web.app
      /--[\w-]+\.web\.app$/.test(hostname)
    ) {
      return 'staging';
    }
    
    // Production - main domains
    if (
      hostname.includes('peddlenet.app') ||
      hostname === 'festival-chat-peddlenet.web.app' ||
      hostname.includes('.vercel.app')
    ) {
      return 'production';
    }
    
    // Default to production for unknown domains
    return 'production';
  },

  /**
   * Get environment info for debugging
   */
  getEnvironmentInfo(): {
    httpUrl: string;
    webSocketUrl: string;
    adminApiPath: string;
    environment: 'development' | 'staging' | 'production';
    platform: 'localhost' | 'vercel' | 'cloudrun' | 'firebase' | 'other';
    protocol: string;
    hostname: string;
    isPreviewChannel: boolean;
  } {
    const httpUrl = this.getHttpServerUrl();
    const webSocketUrl = this.getWebSocketServerUrl();
    const adminApiPath = this.getAdminApiPath();
    const environment = this.detectEnvironment();
    
    let platform: 'localhost' | 'vercel' | 'cloudrun' | 'firebase' | 'other' = 'other';
    let isPreviewChannel = false;
    
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const href = window.location.href;
      
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        platform = 'localhost';
      } else if (hostname.includes('.vercel.app')) {
        platform = 'vercel';
      } else if (httpUrl.includes('run.app')) {
        platform = 'cloudrun';
      } else if (hostname.includes('.web.app') || hostname.includes('.firebaseapp.com')) {
        platform = 'firebase';
        // Detect Firebase preview channels
        isPreviewChannel = href.includes('--') || /--[\w-]+\.web\.app$/.test(hostname);
      }
    }
    
    return {
      httpUrl,
      webSocketUrl,
      adminApiPath,
      environment,
      platform,
      protocol: typeof window !== 'undefined' ? window.location.protocol : 'http:',
      hostname: typeof window !== 'undefined' ? window.location.hostname : 'localhost',
      isPreviewChannel
    };
  }
};

// Global access for debugging - use setTimeout to avoid initialization issues
if (typeof window !== 'undefined') {
  setTimeout(() => {
    try {
      (window as any).ServerUtils = ServerUtils;
      console.log('🔧 Server Utils loaded - Enhanced environment detection');
      console.log('📊 Current environment:', ServerUtils.getEnvironmentInfo());
    } catch (error) {
      console.warn('ServerUtils initialization failed:', error);
    }
  }, 0);
}
