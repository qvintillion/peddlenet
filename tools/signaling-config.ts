// src/utils/signaling-config.ts
'use client';

export interface SignalingConfig {
  enabled: boolean;
  url: string | null;
  reason?: string;
}

/**
 * Unified signaling configuration for both mobile and desktop
 * This ensures both platforms use the same signaling server
 */
export function getSignalingConfig(): SignalingConfig {
  if (typeof window === 'undefined') {
    return { enabled: false, url: null, reason: 'Server-side rendering' };
  }

  // Priority 1: Environment variable (set by production or mobile-dev.sh)
  const envSignalingUrl = process.env.NEXT_PUBLIC_SIGNALING_SERVER;
  if (envSignalingUrl) {
    console.log('🔌 Using configured signaling server:', envSignalingUrl);
    return { enabled: true, url: envSignalingUrl };
  }

  // Priority 2: Production signaling server (your current deployed server)
  const currentHost = window.location.hostname;
  const isProduction = currentHost === 'peddlenet.app' || currentHost.includes('vercel.app');
  
  if (isProduction) {
    const productionSignalingUrl = 'https://peddlenet-signaling-433318323150.us-central1.run.app';
    console.log('🔌 Using production signaling server:', productionSignalingUrl);
    return { enabled: true, url: productionSignalingUrl };
  }

  // Priority 3: Local development detection
  if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
    const localSignalingUrl = 'http://localhost:3001';
    console.log('🔌 Using local signaling server:', localSignalingUrl);
    return { enabled: true, url: localSignalingUrl };
  }

  // Priority 4: ngrok environment
  if (currentHost.includes('ngrok')) {
    // For ngrok, we need a separate tunnel for signaling
    // This requires manual setup - see mobile-dev.sh
    console.log('🔌 ngrok detected - signaling requires separate tunnel');
    
    // Try to detect if a signaling tunnel is configured
    const possibleSignalingUrl = localStorage.getItem('ngrok_signaling_url');
    if (possibleSignalingUrl) {
      console.log('🔌 Found stored ngrok signaling URL:', possibleSignalingUrl);
      return { enabled: true, url: possibleSignalingUrl };
    }
    
    return { 
      enabled: false, 
      url: null, 
      reason: 'ngrok requires separate signaling tunnel - check mobile-dev.sh' 
    };
  }

  // Fallback: Disable signaling
  console.log('🔌 Unknown environment, disabling signaling (direct P2P only)');
  return { 
    enabled: false, 
    url: null, 
    reason: 'Unknown environment - using direct P2P only' 
  };
}

/**
 * Test signaling server connectivity
 */
export async function testSignalingConnectivity(url: string): Promise<boolean> {
  try {
    console.log('🔍 Testing signaling server connectivity:', url);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${url}/health`, { 
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      }
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Signaling server health check passed:', data);
      return true;
    } else {
      console.warn('⚠️ Signaling server health check failed:', response.status);
      return false;
    }
  } catch (error) {
    console.warn('❌ Signaling server unreachable:', error);
    return false;
  }
}

/**
 * Store ngrok signaling URL for reuse
 */
export function storeNgrokSignalingUrl(url: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('ngrok_signaling_url', url);
    console.log('💾 Stored ngrok signaling URL:', url);
  }
}

/**
 * Debug function to get current signaling status
 */
export function getSignalingDebugInfo() {
  const config = getSignalingConfig();
  return {
    config,
    userAgent: navigator.userAgent,
    hostname: window.location.hostname,
    origin: window.location.origin,
    envSignalingServer: process.env.NEXT_PUBLIC_SIGNALING_SERVER,
    storedNgrokUrl: localStorage.getItem('ngrok_signaling_url'),
    timestamp: new Date().toISOString()
  };
}