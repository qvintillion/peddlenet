// scripts/test-p2p-connection.js - Enhanced test with better error handling
const http = require('http');

async function testConnection(url, name) {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout: 5000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let parsedData = null;
        
        // Try to parse as JSON, fall back to checking if it's HTML
        try {
          parsedData = JSON.parse(data);
        } catch (e) {
          // If it starts with HTML, it's probably the Next.js app
          if (data.trim().startsWith('<!DOCTYPE') || data.trim().startsWith('<html')) {
            parsedData = { type: 'html', title: 'Next.js App' };
          } else {
            parsedData = { type: 'text', content: data.substring(0, 100) };
          }
        }
        
        resolve({
          name,
          status: 'success',
          code: res.statusCode,
          data: parsedData
        });
      });
    });
    
    req.on('error', (error) => {
      resolve({
        name,
        status: 'error',
        error: error.message
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({
        name,
        status: 'timeout'
      });
    });
  });
}

function checkPortInUse(port) {
  return new Promise((resolve) => {
    const { exec } = require('child_process');
    exec(`lsof -ti:${port}`, (error, stdout) => {
      resolve(!!stdout.trim());
    });
  });
}

async function runP2PTest() {
  console.log('🧪 Testing P2P Connection Components');
  console.log('═══════════════════════════════════════');
  
  // First check if ports are in use
  const ports = [
    { port: 9000, name: 'PeerJS Server' },
    { port: 3001, name: 'Signaling Server' },
    { port: 3000, name: 'Next.js App' }
  ];
  
  console.log('\n🔍 Checking if ports are in use...');
  const portChecks = await Promise.all(
    ports.map(async (p) => ({
      ...p,
      inUse: await checkPortInUse(p.port)
    }))
  );
  
  portChecks.forEach(p => {
    const icon = p.inUse ? '✅' : '❌';
    console.log(`${icon} Port ${p.port} (${p.name}): ${p.inUse ? 'IN USE' : 'FREE'}`);
  });
  
  const portsInUse = portChecks.filter(p => p.inUse).length;
  
  if (portsInUse === 0) {
    console.log('\n⚠️  No servers are running!');
    console.log('\n🚀 Start the servers first:');
    console.log('   ./start-enhanced.sh');
    console.log('   # OR manually:');
    console.log('   npm run dev:peerjs     # Port 9000');
    console.log('   npm run dev:signaling  # Port 3001'); 
    console.log('   npm run dev            # Port 3000');
    process.exit(1);
  }
  
  // Test HTTP endpoints
  const tests = [
    { url: 'http://localhost:9000/health', name: 'PeerJS Server' },
    { url: 'http://localhost:3001/health', name: 'Signaling Server' },
    { url: 'http://localhost:3000', name: 'Next.js App' }
  ];
  
  console.log('\n🌐 Testing HTTP endpoints...');
  const results = await Promise.all(
    tests.map(test => testConnection(test.url, test.name))
  );
  
  results.forEach(result => {
    const icon = result.status === 'success' ? '✅' : 
                 result.status === 'timeout' ? '⏰' : '❌';
    console.log(`${icon} ${result.name.padEnd(20)} ${result.status} (${result.code || 'no response'})`);
    
    if (result.data && result.data.type !== 'html') {
      console.log(`   └─ ${JSON.stringify(result.data)}`);
    } else if (result.data && result.data.type === 'html') {
      console.log(`   └─ HTML page loaded (Next.js app running)`);
    } else if (result.error) {
      console.log(`   └─ Error: ${result.error}`);
    }
  });
  
  const successCount = results.filter(r => r.status === 'success').length;
  
  console.log(`\n🎯 Overall: ${successCount}/${results.length} services responding`);
  
  if (successCount === results.length) {
    console.log('\n🎉 All P2P components are working!');
    console.log('\n📋 Test the P2P connections:');
    console.log('   1. Open: http://localhost:3000');
    console.log('   2. Create a room (you\'ll auto-join as host)');
    console.log('   3. Click "📱 QR Code" button');
    console.log('   4. Open the QR URL in another browser/device');
    console.log('   5. Should connect in 5-10 seconds');
    
    console.log('\n🔧 Debug tools available in browser console:');
    console.log('   • window.P2PDebug - Connection debugging');
    console.log('   • window.QRPeerUtils - QR utilities');
    
    process.exit(0);
  } else {
    console.log('\n⚠️ Some services are not responding');
    
    const failedServices = results.filter(r => r.status !== 'success');
    console.log('\n💥 Failed services:');
    failedServices.forEach(service => {
      console.log(`   • ${service.name}: ${service.error || service.status}`);
    });
    
    console.log('\n🔧 Troubleshooting steps:');
    console.log('   1. Make sure all servers are running: ./start-enhanced.sh');
    console.log('   2. Check for port conflicts (kill other processes on ports 3000, 3001, 9000)');
    console.log('   3. Try running servers individually:');
    console.log('      npm run dev:peerjs');
    console.log('      npm run dev:signaling'); 
    console.log('      npm run dev');
    
    process.exit(1);
  }
}

if (require.main === module) {
  runP2PTest().catch(console.error);
}

module.exports = { testConnection, runP2PTest };