#!/usr/bin/env node

// debug-messaging.js - Quick diagnostic tool for Festival Chat messaging issues

const os = require('os');
const fs = require('fs');
const { execSync } = require('child_process');

console.log('🔍 FESTIVAL CHAT MESSAGING DIAGNOSTICS');
console.log('=====================================\n');

// 1. Check if servers are running
console.log('1. 📡 CHECKING RUNNING PROCESSES...');
try {
  const processes = execSync('lsof -i :3001 2>/dev/null || echo "No process on port 3001"').toString();
  const nextProcesses = execSync('lsof -i :3000 2>/dev/null || echo "No process on port 3000"').toString();
  
  console.log('Port 3001 (Signaling Server):');
  console.log(processes.includes('node') ? '✅ Server running' : '❌ No server running');
  console.log('Port 3000 (Next.js):');
  console.log(nextProcesses.includes('node') ? '✅ Next.js running' : '❌ Next.js not running');
} catch (e) {
  console.log('⚠️  Could not check processes (permissions issue)');
}

console.log('\n2. 📁 CHECKING FILE STRUCTURE...');

// 2. Check if required files exist
const requiredFiles = [
  'signaling-server.js',
  'signaling-server-sqlite.js',
  'sqlite-persistence.js',
  'package.json',
  'src/hooks/use-websocket-chat.ts'
];

for (const file of requiredFiles) {
  const exists = fs.existsSync(file);
  console.log(`${exists ? '✅' : '❌'} ${file}`);
}

// 3. Check database
console.log('\n3. 💾 CHECKING DATABASE...');
const dbPath = './data/festival-chat.db';
const dbExists = fs.existsSync(dbPath);
console.log(`${dbExists ? '✅' : '❌'} SQLite database: ${dbPath}`);

if (dbExists) {
  try {
    const stats = fs.statSync(dbPath);
    console.log(`   Size: ${stats.size} bytes`);
    console.log(`   Modified: ${stats.mtime.toISOString()}`);
  } catch (e) {
    console.log('   ⚠️  Could not read database stats');
  }
}

// 4. Check network configuration
console.log('\n4. 🌐 CHECKING NETWORK CONFIG...');
const interfaces = os.networkInterfaces();
const localIPs = [];

for (const name of Object.keys(interfaces)) {
  for (const iface of interfaces[name]) {
    if (iface.family === 'IPv4' && !iface.internal) {
      localIPs.push(iface.address);
    }
  }
}

console.log('Local IP addresses:');
localIPs.forEach(ip => console.log(`   📱 http://${ip}:3000`));

// 5. Check environment variables
console.log('\n5. ⚙️  CHECKING ENVIRONMENT...');
console.log(`NEXT_PUBLIC_DETECTED_IP: ${process.env.NEXT_PUBLIC_DETECTED_IP || 'Not set'}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'Not set'}`);

// 6. Test server health (if running)
console.log('\n6. 🏥 TESTING SERVER HEALTH...');

const testServerHealth = async () => {
  const testURLs = [
    'http://localhost:3001/health',
    ...(localIPs.map(ip => `http://${ip}:3001/health`))
  ];

  for (const url of testURLs) {
    try {
      console.log(`Testing: ${url}`);
      const response = await fetch(url);
      const data = await response.json();
      console.log(`✅ ${url}:`);
      console.log(`   Status: ${data.status}`);
      console.log(`   Rooms: ${data.memory?.rooms || 0}`);
      console.log(`   Users: ${data.memory?.totalUsers || 0}`);
      if (data.database) {
        console.log(`   DB Messages: ${data.database.totalMessages || 0}`);
      }
      return true;
    } catch (e) {
      console.log(`❌ ${url}: ${e.message}`);
    }
  }
  return false;
};

// 7. Provide recommendations
console.log('\n7. 💡 RECOMMENDATIONS...');

const recommendations = [];

if (!fs.existsSync('signaling-server-sqlite.js')) {
  recommendations.push('❌ Missing SQLite server file');
}

if (!fs.existsSync('./data/festival-chat.db')) {
  recommendations.push('🆕 Database will be created on first run');
}

if (localIPs.length === 0) {
  recommendations.push('⚠️  No local network IP detected - mobile connections may fail');
}

if (recommendations.length === 0) {
  recommendations.push('✅ File structure looks good');
}

recommendations.forEach(rec => console.log(`   ${rec}`));

console.log('\n8. 🚀 QUICK START COMMANDS...');
console.log('   Start servers: npm run dev:mobile');
console.log('   Test health:   curl http://localhost:3001/health');
console.log('   View logs:     tail -f /tmp/festival-chat.log');

console.log('\n9. 🔧 TROUBLESHOOTING STEPS...');
console.log('   1. Stop all servers: pkill -f "node signaling-server"');
console.log('   2. Clear browser data: localStorage.clear() in console');
console.log('   3. Restart: npm run dev:mobile');
console.log('   4. Test in incognito mode');
console.log('   5. Check browser console for connection errors');

console.log('\n==========================================');
console.log('🎪 Festival Chat Diagnostics Complete!');
console.log('==========================================\n');

// Try to test server health
if (typeof fetch !== 'undefined') {
  testServerHealth().then(success => {
    if (!success) {
      console.log('💡 Server appears to be offline. Run: npm run dev:mobile');
    }
  });
} else {
  console.log('💡 To test server health, run: curl http://localhost:3001/health');
}
