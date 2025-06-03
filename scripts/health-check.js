// scripts/health-check.js - Connection health diagnostic tool
const http = require('http');
const https = require('https');

const services = [
  { name: 'PeerJS Server', url: 'http://localhost:9000/health' },
  { name: 'Signaling Server', url: 'http://localhost:3001/health' },
  { name: 'Next.js App', url: 'http://localhost:3000' },
  { name: 'Google STUN', url: 'https://www.google.com', timeout: 3000 }
];

async function checkService(service) {
  return new Promise((resolve) => {
    const client = service.url.startsWith('https') ? https : http;
    const timeout = service.timeout || 5000;
    
    const req = client.get(service.url, { timeout }, (res) => {
      resolve({
        name: service.name,
        status: 'online',
        code: res.statusCode,
        message: `HTTP ${res.statusCode}`
      });
    });
    
    req.on('error', (error) => {
      resolve({
        name: service.name,
        status: 'offline',
        code: null,
        message: error.message
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({
        name: service.name,
        status: 'timeout',
        code: null,
        message: 'Connection timeout'
      });
    });
  });
}

async function runHealthCheck() {
  console.log('🏥 Festival Chat Health Check');
  console.log('════════════════════════════════');
  
  const results = await Promise.all(services.map(checkService));
  
  results.forEach(result => {
    const status = result.status === 'online' ? '✅' : 
                  result.status === 'timeout' ? '⏰' : '❌';
    console.log(`${status} ${result.name.padEnd(20)} ${result.message}`);
  });
  
  console.log('\n📊 Network Information:');
  console.log(`   OS Platform: ${process.platform}`);
  console.log(`   Node Version: ${process.version}`);
  console.log(`   Timestamp: ${new Date().toISOString()}`);
  
  const onlineCount = results.filter(r => r.status === 'online').length;
  const totalCount = results.length;
  
  console.log(`\n🎯 Overall Status: ${onlineCount}/${totalCount} services online`);
  
  if (onlineCount === totalCount) {
    console.log('🎉 All systems are operational!');
    process.exit(0);
  } else {
    console.log('⚠️  Some services are not responding');
    process.exit(1);
  }
}

if (require.main === module) {
  runHealthCheck().catch(console.error);
}

module.exports = { checkService, runHealthCheck };