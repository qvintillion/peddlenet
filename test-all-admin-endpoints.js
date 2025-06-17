#!/usr/bin/env node

// Test all admin endpoints on staging server
const https = require('https');

const STAGING_SERVER = 'peddlenet-websocket-server-staging-hfttiarlja-uc.a.run.app';
const ADMIN_CREDENTIALS = 'th3p3ddl3r:letsmakeatrade';
const authHeader = 'Basic ' + Buffer.from(ADMIN_CREDENTIALS).toString('base64');

console.log('🧪 Testing all admin endpoints on staging server...');
console.log(`🌐 Server: ${STAGING_SERVER}`);

const endpoints = [
  { path: '/admin/analytics', method: 'GET' },
  { path: '/admin/activity', method: 'GET' },
  { path: '/admin/users/detailed', method: 'GET' },
  { path: '/admin/rooms/detailed', method: 'GET' },
  { path: '/admin/mesh-status', method: 'GET' },
  { path: '/admin/broadcast', method: 'POST' },
  { path: '/admin/broadcast/room', method: 'POST' },
  { path: '/admin/users/remove', method: 'POST' },
  { path: '/admin/room/clear', method: 'POST' },
  { path: '/admin/room/delete', method: 'POST' },
  { path: '/admin/database/wipe', method: 'POST' }
];

async function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    const options = {
      hostname: STAGING_SERVER,
      port: 443,
      path: endpoint.path,
      method: endpoint.method,
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        const status = res.statusCode;
        const success = status < 400;
        
        console.log(`${success ? '✅' : '❌'} ${endpoint.method} ${endpoint.path} → ${status} ${res.statusMessage}`);
        
        if (!success && data) {
          const preview = data.length > 100 ? data.substring(0, 100) + '...' : data;
          console.log(`   Error: ${preview}`);
        }
        
        resolve({ endpoint: endpoint.path, method: endpoint.method, status, success });
      });
    });

    req.on('error', (e) => {
      console.log(`❌ ${endpoint.method} ${endpoint.path} → ERROR: ${e.message}`);
      resolve({ endpoint: endpoint.path, method: endpoint.method, status: 'ERROR', success: false });
    });

    req.setTimeout(5000, () => {
      console.log(`❌ ${endpoint.method} ${endpoint.path} → TIMEOUT`);
      req.destroy();
      resolve({ endpoint: endpoint.path, method: endpoint.method, status: 'TIMEOUT', success: false });
    });

    // Add dummy body for POST requests
    if (endpoint.method === 'POST') {
      req.write(JSON.stringify({ test: true }));
    }
    
    req.end();
  });
}

async function testAllEndpoints() {
  console.log('\n📋 Testing endpoints...\n');
  
  const results = [];
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    results.push(result);
  }

  console.log('\n📊 Summary:');
  console.log(`✅ Working: ${results.filter(r => r.success).length}`);
  console.log(`❌ Failed: ${results.filter(r => !r.success).length}`);
  
  const failed = results.filter(r => !r.success);
  if (failed.length > 0) {
    console.log('\n❌ Failed endpoints:');
    failed.forEach(f => console.log(`   ${f.method} ${f.endpoint} (${f.status})`));
  }
}

testAllEndpoints().catch(console.error);
