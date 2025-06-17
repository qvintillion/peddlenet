// 🚀 WebRTC Re-enablement Script
// Run this in your browser console to safely enable WebRTC with full monitoring

console.log('🔧 Starting controlled WebRTC re-enablement...');

// Check if debug tools are available
if (typeof window.HybridChatDebug === 'undefined') {
  console.error('❌ HybridChatDebug not available - make sure you\'re on a chat page');
} else {
  console.log('✅ Debug tools found');
  
  // Get current status
  const status = window.HybridChatDebug.getWebRTCStatus();
  console.log('📊 Current WebRTC Status:', status);
  
  // Enable mesh for auto-upgrade
  const meshResult = window.HybridChatDebug.enableMesh();
  console.log('🌐 Mesh Enable Result:', meshResult);
  
  // Get stability info
  const stability = window.HybridChatDebug.getStabilityStatus();
  console.log('📈 Stability Status:', stability);
  
  // Monitor connection quality
  const quality = window.HybridChatDebug.getConnectionQuality();
  console.log('🎯 Connection Quality:', quality);
  
  console.log('');
  console.log('🎪 WebRTC Re-enablement Complete!');
  console.log('📊 Monitor the admin dashboard for real-time P2P connection data');
  console.log('🔍 Watch console for connection attempts and mesh formation');
  console.log('⏰ Auto-upgrade will attempt in 30 seconds if conditions are met');
  console.log('');
  console.log('💡 Available commands:');
  console.log('  - window.HybridChatDebug.forceAutoUpgrade() - Force immediate upgrade');
  console.log('  - window.HybridChatDebug.getWebRTCStatus() - Check current status');
  console.log('  - window.HybridChatDebug.disableMesh() - Disable if needed');
}
