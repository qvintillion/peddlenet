// utils/network-utils.ts - Network detection for mobile access with fresh IP detection
export const NetworkUtils = {
  // Always detect fresh local IP using WebRTC (no caching)
  async detectLocalIP(): Promise<string> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') {
        resolve('localhost');
        return;
      }

      console.log('🌐 Detecting fresh local IP address...');
      
      // Try WebRTC method to get local IP
      try {
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        pc.createDataChannel('');
        
        const foundIPs = new Set<string>();
        
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            const candidate = event.candidate.candidate;
            const ipMatch = candidate.match(/(\d+\.\d+\.\d+\.\d+)/);
            
            if (ipMatch && ipMatch[1]) {
              const ip = ipMatch[1];
              foundIPs.add(ip);
              
              // Prioritize local network IPs
              if (ip.startsWith('192.168.') || ip.startsWith('10.') || 
                  (ip.startsWith('172.') && this.isPrivateIP(ip))) {
                console.log('🎯 Found local network IP:', ip);
                pc.close();
                resolve(ip);
                return;
              }
            }
          }
        };

        pc.createOffer().then(offer => pc.setLocalDescription(offer));

        // Extended timeout with fallback logic
        setTimeout(() => {
          pc.close();
          console.log('🌐 WebRTC detection timeout');
          
          // Try to find the best IP from what we found
          const localIPs = Array.from(foundIPs).filter(ip => 
            ip.startsWith('192.168.') || ip.startsWith('10.') || this.isPrivateIP(ip)
          );
          
          if (localIPs.length > 0) {
            const bestIP = this.selectBestIP(localIPs);
            console.log('🌐 Using best found IP:', bestIP);
            resolve(bestIP);
          } else {
            console.log('🌐 No local IPs found, checking current hostname');
            const hostname = window.location.hostname;
            if (hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
              console.log('🌐 Using current hostname IP:', hostname);
              resolve(hostname);
            } else {
              console.log('🌐 Falling back to localhost');
              resolve('localhost');
            }
          }
        }, 4000);

      } catch (error) {
        console.log('🌐 WebRTC detection failed:', error);
        // Check if we're already on an IP
        const hostname = window.location.hostname;
        if (hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
          resolve(hostname);
        } else {
          resolve('localhost');
        }
      }
    });
  },

  // Check if IP is in private range
  isPrivateIP(ip: string): boolean {
    const parts = ip.split('.').map(Number);
    if (parts.length !== 4) return false;
    
    // 172.16.0.0 to 172.31.255.255
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) {
      return true;
    }
    
    return false;
  },

  // Select the best IP from multiple candidates
  selectBestIP(ips: string[]): string {
    // Priority 1: 192.168.x.x (most common home networks)
    const homeIPs = ips.filter(ip => ip.startsWith('192.168.'));
    if (homeIPs.length > 0) {
      return homeIPs[0];
    }
    
    // Priority 2: 10.x.x.x
    const tenIPs = ips.filter(ip => ip.startsWith('10.'));
    if (tenIPs.length > 0) {
      return tenIPs[0];
    }
    
    // Priority 3: 172.16-31.x.x
    const seventeenIPs = ips.filter(ip => this.isPrivateIP(ip));
    if (seventeenIPs.length > 0) {
      return seventeenIPs[0];
    }
    
    // Fallback: first available
    return ips[0];
  },

  // Get local network IP for mobile access (always fresh)
  async getLocalNetworkIP(): Promise<string> {
    if (typeof window === 'undefined') return 'localhost';
    
    // Always try to get a fresh IP first
    const detectedIP = await this.detectLocalIP();
    
    // If we got a real IP, use it (don't store it anymore)
    if (detectedIP !== 'localhost') {
      console.log('🌐 Using freshly detected IP:', detectedIP);
      return detectedIP;
    }
    
    // Fallback: check current hostname
    const hostname = window.location.hostname;
    if (hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
      console.log('🌐 Using current hostname IP:', hostname);
      return hostname;
    }
    
    console.log('🌐 No network IP available, using localhost');
    return 'localhost';
  },
  
  // Get base URL for QR codes (always fresh detection)
  async getBaseURL(): Promise<string> {
    if (typeof window === 'undefined') return 'http://localhost:3000';
    
    const protocol = window.location.protocol;
    const port = window.location.port;
    const hostname = await this.getLocalNetworkIP();
    
    // Build the URL with the freshly detected IP
    let url = `${protocol}//${hostname}`;
    if (port && port !== '80' && port !== '443') {
      url += `:${port}`;
    }
    
    console.log('🌐 Generated base URL:', url);
    return url;
  },

  // Synchronous version for compatibility (uses current hostname only)
  getBaseURLSync(): string {
    if (typeof window === 'undefined') return 'http://localhost:3000';
    
    const protocol = window.location.protocol;
    const port = window.location.port;
    const hostname = window.location.hostname;
    
    let url = `${protocol}//${hostname}`;
    if (port && port !== '80' && port !== '443') {
      url += `:${port}`;
    }
    
    return url;
  },
  
  // Common local network IP patterns for manual selection
  getCommonLocalIPs(): string[] {
    return [
      '192.168.1.100', // Common router default range
      '192.168.1.101',
      '192.168.0.100',
      '192.168.0.101',
      '10.0.0.100',    // Another common range
      '10.0.0.101',
      '172.16.0.100'   // Less common but possible
    ];
  },
  
  // Force refresh IP detection (for manual refresh buttons)
  async forceRefreshIP(): Promise<string> {
    console.log('🔄 Force refreshing IP detection...');
    return await this.detectLocalIP();
  },
  
  // Get instructions for finding local IP manually
  getIPInstructions(): string[] {
    const platform = navigator.platform;
    
    if (platform.includes('Mac')) {
      return [
        'Mac: System Preferences → Network → WiFi → Advanced → TCP/IP',
        'Terminal: ifconfig | grep "inet 192"',
        'Look for: 192.168.x.x or 10.x.x.x'
      ];
    } else if (platform.includes('Win')) {
      return [
        'Windows: Command Prompt → ipconfig',
        'Look for "IPv4 Address" under WiFi adapter',
        'Should be: 192.168.x.x or 10.x.x.x'
      ];
    } else if (platform.includes('Linux')) {
      return [
        'Linux: Terminal → ip addr show or ifconfig',
        'Look for inet under your WiFi interface',
        'Should be: 192.168.x.x or 10.x.x.x'
      ];
    } else {
      return [
        'Find your local IP in network settings',
        'Should start with 192.168.x.x or 10.x.x.x',
        'Both devices must be on the same WiFi'
      ];
    }
  },
  
  // Check if current setup is mobile-accessible
  async isMobileAccessible(): Promise<boolean> {
    const ip = await this.getLocalNetworkIP();
    return ip !== 'localhost' && ip !== '127.0.0.1';
  },

  // Test if an IP is reachable
  async testIPReachability(ip: string, port: string = '3000'): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`http://${ip}:${port}/api/health`, {
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    }
  },

  // Get current network status
  async getNetworkStatus(): Promise<{
    currentIP: string;
    isMobileAccessible: boolean;
    hostname: string;
    protocol: string;
    port: string;
  }> {
    const currentIP = await this.getLocalNetworkIP();
    const isMobileAccessible = await this.isMobileAccessible();
    
    return {
      currentIP,
      isMobileAccessible,
      hostname: window.location.hostname,
      protocol: window.location.protocol,
      port: window.location.port
    };
  }
};

// Global access for debugging - use setTimeout to avoid initialization issues
if (typeof window !== 'undefined') {
  setTimeout(() => {
    try {
      (window as any).NetworkUtils = NetworkUtils;
      console.log('🌐 Enhanced Network Utils loaded - ready for fresh IP detection');
    } catch (error) {
      console.warn('NetworkUtils initialization failed:', error);
    }
  }, 0);
}
