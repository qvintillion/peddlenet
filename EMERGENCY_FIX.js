// EMERGENCY FIX for WebRTC TypeError and WebSocket URL
// Apply these changes IMMEDIATELY

// 1. In src/hooks/use-native-webrtc.ts line ~240
// REPLACE:
const currentConnections = Array.from(connectionsRef.current?.entries() || []);

// WITH:
if (!connectionsRef.current) {
  console.log('📭 No connections ref available');
  return 'No connections ref';
}
const currentConnections = Array.from(connectionsRef.current.entries() || []);

// 2. In src/hooks/use-native-webrtc.ts line ~190
// REPLACE the environment variable section with:
const envServerUrl = process.env.NEXT_PUBLIC_SIGNALING_SERVER;
if (envServerUrl) {
  console.log(`🌍 Using environment WebSocket URL: ${envServerUrl}`);
  return envServerUrl;
}

// 3. Update .env.production to:
NEXT_PUBLIC_SIGNALING_SERVER=wss://peddlenet-websocket-server-hfttiarlja-uc.a.run.app
BUILD_TARGET=production
NODE_ENV=production
PLATFORM=vercel
