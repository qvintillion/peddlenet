// utils/network-utils.ts - Network detection for mobile access
export const NetworkUtils = {
  // Get local network IP for mobile access
  getLocalNetworkIP(): string {
    if (typeof window === 'undefined') return 'localhost';
    
    // Try to determine the local IP from the current URL
    const hostname = window.location.hostname;
    
    // If already on an IP address, use it
    if (hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
      return hostname;
    }
    
    // If on localhost, we need to provide instructions
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // Store detected IPs for user selection
      const storedIP = localStorage.getItem('selected_network_ip');
      if (storedIP) {
        return storedIP;
      }
      
      // Return localhost as fallback - will show IP selection UI
      return 'localhost';
    }
    
    // Use current hostname (for production deployments)
    return hostname;
  },
  
  // Get base URL for QR codes
  getBaseURL(): string {
    if (typeof window === 'undefined') return 'http://localhost:3000';
    
    // In production, use the current origin (Vercel URL)
    return window.location.origin;
  },
  
  // Common local network IP patterns
  getCommonLocalIPs(): string[] {
    // This is a simplified version - in a real app you'd use WebRTC to detect local IPs
    // For now, return common patterns that users can select from
    return [
      '192.168.1.100', // Common router default range
      '192.168.0.100',
      '10.0.0.100',    // Another common range
      '172.16.0.100'   // Less common but possible
    ];
  },
  
  // Set the selected network IP
  setNetworkIP(ip: string): void {
    localStorage.setItem('selected_network_ip', ip);
    console.log(`📱 Network IP set to: ${ip}`);
  },
  
  // Get instructions for finding local IP
  getIPInstructions(): string[] {
    const platform = navigator.platform;
    
    if (platform.includes('Mac')) {
      return [
        'On Mac: System Preferences → Network → WiFi → Advanced → TCP/IP',
        'Or in Terminal: ifconfig | grep "inet 192"',
        'Look for something like: 192.168.1.100'
      ];
    } else if (platform.includes('Win')) {
      return [
        'On Windows: Command Prompt → ipconfig',
        'Look for "IPv4 Address" under your WiFi adapter',
        'Look for something like: 192.168.1.100'
      ];
    } else {
      return [
        'Find your local IP address:',
        '• Look in your WiFi settings',
        '• Should be something like: 192.168.1.xxx',
        '• Make sure both devices are on the same WiFi network'
      ];
    }
  },
  
  // Check if current URL is mobile-accessible
  isMobileAccessible(): boolean {
    const hostname = this.getLocalNetworkIP();
    return hostname !== 'localhost' && hostname !== '127.0.0.1';
  }
};

// Global access for debugging
if (typeof window !== 'undefined') {
  (window as any).NetworkUtils = NetworkUtils;
  console.log('🌐 Network Utils available as window.NetworkUtils');
}