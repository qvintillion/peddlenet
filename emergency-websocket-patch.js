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
