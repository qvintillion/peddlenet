const { io } = require('socket.io-client');

const testUrls = [
  'wss://peddlenet-websocket-server-staging-hfttiarlja-uc.a.run.app',
  'wss://peddlenet-websocket-server-hfttiarlja-uc.a.run.app'
];

async function testConnection(url) {
  return new Promise((resolve) => {
    console.log(`🧪 Testing connection to: ${url}`);
    
    const socket = io(url, {
      transports: ['websocket'],
      timeout: 10000,
      forceNew: true
    });
    
    const timeout = setTimeout(() => {
      socket.disconnect();
      resolve({ url, success: false, error: 'timeout' });
    }, 10000);
    
    socket.on('connect', () => {
      clearTimeout(timeout);
      console.log(`✅ Connection successful: ${url}`);
      socket.disconnect();
      resolve({ url, success: true });
    });
    
    socket.on('connect_error', (error) => {
      clearTimeout(timeout);
      console.error(`❌ Connection failed: ${url}`, error.message);
      resolve({ url, success: false, error: error.message });
    });
  });
}

async function runTests() {
  console.log('🚨 EMERGENCY CONNECTION TESTS');
  console.log('============================');
  
  for (const url of testUrls) {
    const result = await testConnection(url);
    console.log(`${result.success ? '✅' : '❌'} ${url}: ${result.success ? 'OK' : result.error}`);
  }
}

runTests().catch(console.error);
