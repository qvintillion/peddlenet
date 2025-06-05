#!/usr/bin/env node

// Simple, reliable IP detection for development scripts
const os = require('os');

function detectBestIP() {
  const interfaces = os.networkInterfaces();
  const candidates = [];
  
  // Collect all non-internal IPv4 addresses
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        candidates.push({
          interface: name,
          ip: iface.address,
          isWiFi: isWiFiInterface(name)
        });
      }
    }
  }
  
  if (candidates.length === 0) {
    return null;
  }
  
  // Priority 1: WiFi interfaces
  const wifiIPs = candidates.filter(c => c.isWiFi);
  if (wifiIPs.length > 0) {
    return wifiIPs[0].ip;
  }
  
  // Priority 2: 192.168.x.x addresses (most common home networks)
  const homeIPs = candidates.filter(c => c.ip.startsWith('192.168.'));
  if (homeIPs.length > 0) {
    return homeIPs[0].ip;
  }
  
  // Priority 3: 10.x.x.x addresses
  const tenIPs = candidates.filter(c => c.ip.startsWith('10.'));
  if (tenIPs.length > 0) {
    return tenIPs[0].ip;
  }
  
  // Priority 4: 172.16-31.x.x addresses
  const seventeenIPs = candidates.filter(c => {
    const parts = c.ip.split('.');
    return parts[0] === '172' && parseInt(parts[1]) >= 16 && parseInt(parts[1]) <= 31;
  });
  if (seventeenIPs.length > 0) {
    return seventeenIPs[0].ip;
  }
  
  // Fallback: first available IP
  return candidates[0].ip;
}

function isWiFiInterface(name) {
  const lowerName = name.toLowerCase();
  return lowerName.includes('wi') || 
         lowerName.includes('wlan') || 
         lowerName.includes('en0') ||
         lowerName.includes('wlp');
}

// Main execution
const detectedIP = detectBestIP();

// Handle command line arguments
const args = process.argv.slice(2);
const verbose = args.includes('--verbose') || args.includes('-v');

if (verbose) {
  console.log('🌐 IP Detection Results:');
  console.log('========================');
  
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        const isWiFi = isWiFiInterface(name);
        const marker = isWiFi ? '🎯' : '  ';
        const selected = iface.address === detectedIP ? ' ← SELECTED' : '';
        console.log(`${marker} ${iface.address} (${name})${selected}`);
      }
    }
  }
  console.log('========================');
}

if (detectedIP) {
  if (verbose) {
    console.log(`✅ Best IP: ${detectedIP}`);
  } else {
    // Just output the IP for easy parsing in scripts
    console.log(detectedIP);
  }
} else {
  if (verbose) {
    console.log('❌ No suitable IP address found');
  }
  process.exit(1);
}
