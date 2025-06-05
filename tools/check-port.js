const { exec } = require('child_process');

function checkPort(port) {
  return new Promise((resolve) => {
    exec(`lsof -ti:${port}`, (error, stdout, stderr) => {
      if (error) {
        resolve({ port, inUse: false, pids: [] });
      } else {
        const pids = stdout.trim().split('\n').filter(pid => pid);
        resolve({ port, inUse: pids.length > 0, pids });
      }
    });
  });
}

async function main() {
  console.log('🔍 Checking port 3001...');
  const result = await checkPort(3001);
  
  if (result.inUse) {
    console.log('❌ Port 3001 is in use by process(es):', result.pids.join(', '));
    console.log('');
    console.log('🛠️ Solutions:');
    console.log('1. Run: ./tools/kill-port-3001.sh');
    console.log('2. Or just run: node signaling-server.js (it will try other ports)');
    console.log('3. Or manually kill: kill -9', result.pids.join(' '));
  } else {
    console.log('✅ Port 3001 is available');
    console.log('🚀 You can run: node signaling-server.js');
  }
}

main().catch(console.error);
