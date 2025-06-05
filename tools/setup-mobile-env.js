const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('🌐 Setting up environment for mobile development...');

// Get local IP address
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  
  return 'localhost';
}

// Test server connectivity
async function testServerConnectivity(ip, port) {
  try {
    const response = await fetch(`http://${ip}:${port}/health`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(3000)
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function main() {
  const localIP = getLocalIP();
  console.log(`📍 Detected local IP: ${localIP}`);

  // Test server connectivity on different ports
  const ports = [3001, 3002, 3003, 3004, 3005];
  let serverPort = null;

  console.log('🔍 Testing server connectivity...');
  for (const port of ports) {
    const isReachable = await testServerConnectivity(localIP, port);
    if (isReachable) {
      console.log(`✅ Server found on port ${port}`);
      serverPort = port;
      break;
    }
  }

  // Create or update .env.local
  const envPath = path.join(process.cwd(), '.env.local');
  let envContent = '';

  // Read existing .env.local if it exists
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  // Update or add the signaling server URL
  const serverUrl = serverPort 
    ? `http://${localIP}:${serverPort}`
    : `http://${localIP}:3001`;

  const signalingServerLine = `NEXT_PUBLIC_SIGNALING_SERVER=${serverUrl}`;

  if (envContent.includes('NEXT_PUBLIC_SIGNALING_SERVER=')) {
    // Replace existing line
    envContent = envContent.replace(
      /NEXT_PUBLIC_SIGNALING_SERVER=.*/,
      signalingServerLine
    );
  } else {
    // Add new line
    envContent += envContent ? '\n' : '';
    envContent += `# Auto-configured for mobile development\n`;
    envContent += signalingServerLine + '\n';
  }

  // Write .env.local
  fs.writeFileSync(envPath, envContent);
  
  console.log('📝 Updated .env.local:');
  console.log(`   ${signalingServerLine}`);
  
  if (!serverPort) {
    console.log('\n⚠️  Server not detected on any port');
    console.log('   Start the server with: node signaling-server.js');
  }

  console.log('\n🎯 Next steps:');
  console.log('   1. Restart your Next.js dev server: npm run dev');
  console.log('   2. Open the app and test mobile QR codes');
  console.log('   3. Both devices should connect automatically!');
  
  console.log('\n📱 Mobile URL will be:');
  console.log(`   http://${localIP}:3000`);
}

main().catch(console.error);
