const os = require('os');

console.log('🔍 Checking network setup consistency...');

// Get the current hostname from environment
const envServer = process.env.NEXT_PUBLIC_SIGNALING_SERVER;
console.log('Environment server:', envServer);

// Get all network interfaces
const interfaces = os.networkInterfaces();
console.log('\\n📡 Available network interfaces:');

for (const name of Object.keys(interfaces)) {
  for (const iface of interfaces[name]) {
    if (iface.family === 'IPv4' && !iface.internal) {
      const isEnvIP = envServer && envServer.includes(iface.address);
      console.log(`  ${name}: ${iface.address} ${isEnvIP ? '✅ (matches env)' : ''}`);
    }
  }
}

console.log('\\n🎯 Recommendations:');

if (envServer) {
  const envIP = envServer.match(/\\/\\/([^:]+)/)?.[1];
  if (envIP) {
    console.log(`✅ Environment is configured for: ${envIP}`);
    console.log(`🌐 Next.js should serve on: http://${envIP}:3000`);
    console.log(`📡 WebSocket server on: http://${envIP}:3001`);
    console.log(`📱 Mobile QR codes should use: ${envIP}`);
  }
} else {
  console.log('⚠️  NEXT_PUBLIC_SIGNALING_SERVER not set in .env.local');
  console.log('   Run: node tools/setup-mobile-env.js');
}

console.log('\\n💡 To ensure consistency:');
console.log('  1. Both servers should use the same IP');
console.log('  2. QR codes should use the same IP as Next.js');
console.log('  3. Mobile device must be on same WiFi network');
