#!/usr/bin/env node

// Quick test script to verify staging server authentication
const https = require('https');

const STAGING_SERVER = 'peddlenet-websocket-server-staging-hfttiarlja-uc.a.run.app';
const ADMIN_CREDENTIALS = 'th3p3ddl3r:letsmakeatrade';

console.log('🧪 Testing staging server authentication...');
console.log(`🌐 Server: ${STAGING_SERVER}`);
console.log(`🔐 Credentials: ${ADMIN_CREDENTIALS}`);

const authHeader = 'Basic ' + Buffer.from(ADMIN_CREDENTIALS).toString('base64');

const options = {
  hostname: STAGING_SERVER,
  port: 443,
  path: '/admin/analytics',
  method: 'GET',
  headers: {
    'Authorization': authHeader,
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  console.log(`\n📊 Response Status: ${res.statusCode}`);
  console.log(`📋 Response Headers:`, res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\n📄 Response Body:');
    
    if (res.statusCode === 200) {
      try {
        const parsed = JSON.parse(data);
        console.log('✅ SUCCESS! Admin authentication working');
        console.log(`👥 Active Users: ${parsed.realTimeStats?.activeUsers || 0}`);
        console.log(`🏠 Active Rooms: ${parsed.realTimeStats?.activeRooms || 0}`);
        console.log(`🔐 Admin User: ${parsed.admin?.requestedBy || 'N/A'}`);
      } catch (e) {
        console.log('✅ SUCCESS! (Raw response):');
        console.log(data.substring(0, 200) + '...');
      }
    } else if (res.statusCode === 401) {
      console.log('❌ AUTHENTICATION FAILED');
      console.log('🔐 Check credentials in WebSocket server');
      console.log('Response:', data);
    } else {
      console.log(`❌ UNEXPECTED STATUS: ${res.statusCode}`);
      console.log('Response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ REQUEST FAILED: ${e.message}`);
  console.log('\n🔍 Possible issues:');
  console.log('  1. Server not running');
  console.log('  2. Network connectivity issues');
  console.log('  3. SSL/TLS issues');
  console.log('  4. Server overloaded');
});

req.setTimeout(10000, () => {
  console.error('❌ REQUEST TIMEOUT (10s)');
  req.destroy();
});

req.end();
