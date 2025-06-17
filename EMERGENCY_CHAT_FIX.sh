#!/bin/bash

echo "🚨 EMERGENCY CHAT PAGE FIX SCRIPT"
echo "=================================="

# Step 1: Backup current configs
echo "📋 Step 1: Backing up current configurations..."
cp .env.staging .env.staging.backup.$(date +%Y%m%d-%H%M%S)
cp .env.production .env.production.backup.$(date +%Y%m%d-%H%M%S)
cp .env.local .env.local.backup.$(date +%Y%m%d-%H%M%S)

# Step 2: Create emergency WebSocket URL fix
echo "🔧 Step 2: Creating emergency WebSocket URL configuration..."

# STAGING - Firebase hosting needs staging server
cat > .env.staging << 'EOF'
# EMERGENCY FIX - Staging environment for Firebase
NEXT_PUBLIC_SIGNALING_SERVER=wss://peddlenet-websocket-server-staging-hfttiarlja-uc.a.run.app
BUILD_TARGET=staging
NODE_ENV=development
PLATFORM=firebase
FIREBASE_PROJECT_ID=festival-chat-peddlenet

# Emergency WebSocket debugging
NEXT_PUBLIC_DEBUG_WS=true
NEXT_PUBLIC_WS_TIMEOUT=30000
EOF

# PRODUCTION - Vercel needs production server  
cat > .env.production << 'EOF'
# EMERGENCY FIX - Production environment for Vercel
NEXT_PUBLIC_SIGNALING_SERVER=wss://peddlenet-websocket-server-hfttiarlja-uc.a.run.app
BUILD_TARGET=production
NODE_ENV=production
PLATFORM=vercel

# Emergency WebSocket debugging
NEXT_PUBLIC_DEBUG_WS=true
NEXT_PUBLIC_WS_TIMEOUT=30000
EOF

# LOCAL - Use staging for testing
cat > .env.local << 'EOF'
# EMERGENCY FIX - Local development pointing to staging server for testing
NEXT_PUBLIC_SIGNALING_SERVER=wss://peddlenet-websocket-server-staging-hfttiarlja-uc.a.run.app
BUILD_TARGET=preview
FIREBASE_PROJECT_ID=festival-chat-peddlenet
NODE_ENV=development

# Emergency WebSocket debugging
NEXT_PUBLIC_DEBUG_WS=true
NEXT_PUBLIC_WS_TIMEOUT=30000
EOF

echo "✅ Step 2 Complete: Environment files updated"

# Step 3: Create emergency WebSocket connection test
echo "🔧 Step 3: Creating emergency connection test..."

cat > emergency-test-connection.js << 'EOF'
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
EOF

echo "✅ Step 3 Complete: Emergency connection test created"

# Step 4: Create simplified WebSocket hook fix
echo "🔧 Step 4: Creating emergency WebSocket hook patch..."

# Backup the original
cp src/hooks/use-websocket-chat.ts src/hooks/use-websocket-chat.ts.backup.$(date +%Y%m%d-%H%M%S)

# Create emergency patch for WebSocket URL detection
cat > emergency-websocket-patch.js << 'EOF'
// EMERGENCY PATCH: Replace the getWebSocketServerUrl function with simplified logic

const fs = require('fs');
const path = require('path');

const hookPath = 'src/hooks/use-websocket-chat.ts';
const hookContent = fs.readFileSync(hookPath, 'utf8');

// Find the getWebSocketServerUrl function and replace it
const newFunction = `
// EMERGENCY FIX: Simplified WebSocket URL detection with correct production server
const getWebSocketServerUrl = () => {
  if (typeof window === 'undefined') return 'ws://localhost:3001';
  
  const hostname = window.location.hostname;
  
  console.log(\`🚨 EMERGENCY: WebSocket URL Detection\`, {
    hostname,
    envVar: process.env.NEXT_PUBLIC_SIGNALING_SERVER,
    protocol: window.location.protocol
  });
  
  // CRITICAL FIX: Always use environment variable first
  if (process.env.NEXT_PUBLIC_SIGNALING_SERVER) {
    console.log('✅ EMERGENCY: Using environment WebSocket URL:', process.env.NEXT_PUBLIC_SIGNALING_SERVER);
    return process.env.NEXT_PUBLIC_SIGNALING_SERVER;
  }
  
  // Local development detection
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const url = \`ws://localhost:3001\`;
    console.log(\`🏠 EMERGENCY: Local development WebSocket: \${url}\`);
    return url;
  }
  
  // Mobile accessing dev server via IP
  if (hostname.match(/^192\\.168\\.|^10\\.|^172\\.(1[6-9]|2[0-9]|3[01])\\./)) {
    const url = \`ws://\${hostname}:3001\`;
    console.log(\`📱 EMERGENCY: Mobile development WebSocket: \${url}\`);
    return url;
  }
  
  // Firebase staging - use staging server
  if (hostname.includes('firebase') || hostname.includes('web.app')) {
    const url = 'wss://peddlenet-websocket-server-staging-hfttiarlja-uc.a.run.app';
    console.log(\`🔥 EMERGENCY: Firebase WebSocket: \${url}\`);
    return url;
  }
  
  // Vercel production - use production server
  if (hostname.includes('vercel.app') || hostname === 'peddlenet.app') {
    const url = 'wss://peddlenet-websocket-server-hfttiarlja-uc.a.run.app';
    console.log(\`▲ EMERGENCY: Vercel WebSocket: \${url}\`);
    return url;
  }
  
  // Default to staging for testing
  const fallbackUrl = 'wss://peddlenet-websocket-server-staging-hfttiarlja-uc.a.run.app';
  console.warn(\`⚠️ EMERGENCY: Using staging WebSocket as fallback: \${fallbackUrl}\`);
  return fallbackUrl;
};`;

// Replace the function in the file
const updatedContent = hookContent.replace(
  /const getWebSocketServerUrl = \(\) => \{[^}]*\};?/s,
  newFunction
);

fs.writeFileSync(hookPath, updatedContent);
console.log('✅ WebSocket hook patched with emergency fix');
EOF

node emergency-websocket-patch.js

echo "✅ Step 4 Complete: WebSocket hook emergency patch applied"

# Step 5: Create emergency deployment scripts
echo "🔧 Step 5: Creating emergency deployment commands..."

cat > emergency-deploy-staging.sh << 'EOF'
#!/bin/bash
echo "🚨 EMERGENCY STAGING DEPLOYMENT"
echo "Deploying with emergency fixes..."

# Use staging environment
cp .env.staging .env.local

# Build with staging target
BUILD_TARGET=staging npm run build

# Deploy to Firebase staging
firebase deploy --project festival-chat-peddlenet --only hosting:festival-chat-peddlenet
EOF

cat > emergency-deploy-production.sh << 'EOF'
#!/bin/bash
echo "🚨 EMERGENCY PRODUCTION DEPLOYMENT"
echo "Deploying with emergency fixes..."

# Use production environment
cp .env.production .env.local

# Build with production target
BUILD_TARGET=production npm run build

# Deploy to Vercel production
vercel --prod
EOF

chmod +x emergency-deploy-staging.sh
chmod +x emergency-deploy-production.sh

echo "✅ Step 5 Complete: Emergency deployment scripts created"

echo ""
echo "🚨 EMERGENCY FIX COMPLETE!"
echo "=========================="
echo ""
echo "📋 IMMEDIATE NEXT STEPS:"
echo "1. Test connections: node emergency-test-connection.js"
echo "2. Deploy staging: ./emergency-deploy-staging.sh"
echo "3. Deploy production: ./emergency-deploy-production.sh"
echo ""
echo "🔍 If chat still doesn't load:"
echo "- Check browser console for 🚨 EMERGENCY logs"
echo "- Verify WebSocket server is running"
echo "- Check environment variables in browser DevTools"
echo ""
echo "⚡ CRITICAL: Test staging first before production!"
