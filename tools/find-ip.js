const os = require('os');

console.log('🌐 Finding your local IP address for mobile QR codes...\n');

function getLocalIPs() {
  const interfaces = os.networkInterfaces();
  const ips = [];
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip over internal (i.e. 127.0.0.1) and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push({
          interface: name,
          ip: iface.address
        });
      }
    }
  }
  
  return ips;
}

const localIPs = getLocalIPs();

if (localIPs.length > 0) {
  console.log('📱 Available IP addresses:');
  localIPs.forEach(({ interface, ip }) => {
    const isLikelyWiFi = interface.toLowerCase().includes('wi') || 
                        interface.toLowerCase().includes('wlan') ||
                        interface.toLowerCase().includes('en0') ||
                        interface.toLowerCase().includes('wlp');
    
    const marker = isLikelyWiFi ? '🎯' : '  ';
    console.log(`${marker} ${ip} (${interface})`);
  });
  
  // Find the most likely WiFi IP
  const wifiIP = localIPs.find(({ interface }) => 
    interface.toLowerCase().includes('wi') || 
    interface.toLowerCase().includes('wlan') ||
    interface.toLowerCase().includes('en0')
  );
  
  if (wifiIP) {
    console.log(`\n✅ Recommended IP: ${wifiIP.ip}`);
    console.log(`🔗 Test URL: http://${wifiIP.ip}:3000`);
  }
} else {
  console.log('❌ No network interfaces found');
}

console.log('\n🔍 What to look for:');
console.log('  • IP starting with 192.168.x.x (most common)');
console.log('  • IP starting with 10.x.x.x');
console.log('  • IP starting with 172.16-31.x.x');

console.log('\n💡 Next steps:');
console.log('  1. Start your dev server: npm run dev');
console.log('  2. Open the app and create/join a room');
console.log('  3. Click "📱 Invite" button');
console.log('  4. The app will auto-detect your IP!');
console.log('  5. If auto-detection fails, use the IP shown above');

console.log('\n🎯 Both devices must be on the same WiFi network!');
