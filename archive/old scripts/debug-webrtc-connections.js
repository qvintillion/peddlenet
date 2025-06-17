// 🔍 WebRTC Connection Diagnostic Tool
// Run this in browser console to debug P2P connection issues

async function diagnosticWebRTCConnections() {
  console.log('🔍 ===== WEBRTC CONNECTION DIAGNOSTIC =====');
  
  // 1. Check WebRTC support
  console.log('\n1️⃣ WebRTC Support Check:');
  console.log('   - RTCPeerConnection:', !!window.RTCPeerConnection);
  console.log('   - MediaDevices:', !!navigator.mediaDevices);
  console.log('   - getUserMedia:', !!navigator.mediaDevices?.getUserMedia);
  
  // 2. Check debug tools availability
  console.log('\n2️⃣ Debug Tools Check:');
  console.log('   - NativeWebRTCDebug:', !!window.NativeWebRTCDebug);
  console.log('   - HybridChatDebug:', !!window.HybridChatDebug);
  console.log('   - MessageBridgeDebug:', !!window.MessageBridgeDebug);
  
  if (window.NativeWebRTCDebug) {
    // 3. Check current WebRTC state
    console.log('\n3️⃣ Current WebRTC State:');
    const connections = window.NativeWebRTCDebug.getConnections();
    const signalingStatus = window.NativeWebRTCDebug.getSignalingStatus();
    const stats = window.NativeWebRTCDebug.getStats();
    
    console.log('   - Active connections:', connections.length);
    console.log('   - Signaling connected:', signalingStatus.connected);
    console.log('   - Socket ID:', signalingStatus.socketId);
    console.log('   - Connection stats:', stats);
    
    if (connections.length > 0) {
      console.log('\n📊 Connection Details:');
      connections.forEach(([peerId, connection], index) => {
        console.log(`   Connection ${index + 1} (${peerId}):`);
        console.log(`     - State: ${connection.connectionState}`);
        console.log(`     - Data Channel: ${connection.dataChannel?.readyState || 'none'}`);
        console.log(`     - Last Seen: ${new Date(connection.lastSeen).toLocaleTimeString()}`);
      });
    }
  }
  
  // 4. Test STUN server connectivity
  console.log('\n4️⃣ STUN Server Test:');
  try {
    const testPC = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun.cloudflare.com:3478' }
      ]
    });
    
    console.log('   - Test PeerConnection created successfully');
    
    // Create a data channel to trigger ICE gathering
    const testChannel = testPC.createDataChannel('test');
    console.log('   - Test data channel created');
    
    // Wait for ICE gathering
    testPC.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('   ✅ ICE candidate received:', event.candidate.type);
      } else {
        console.log('   ✅ ICE gathering complete');
      }
    };
    
    testPC.onicegatheringstatechange = () => {
      console.log('   - ICE gathering state:', testPC.iceGatheringState);
    };
    
    // Create offer to start ICE gathering
    const offer = await testPC.createOffer();
    await testPC.setLocalDescription(offer);
    console.log('   - Test offer created, waiting for ICE candidates...');
    
    // Clean up after 5 seconds
    setTimeout(() => {
      testPC.close();
      console.log('   - Test connection closed');
    }, 5000);
    
  } catch (error) {
    console.error('   ❌ STUN server test failed:', error);
  }
  
  // 5. Check network conditions
  console.log('\n5️⃣ Network Conditions:');
  console.log('   - Online:', navigator.onLine);
  console.log('   - User Agent:', navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop');
  
  if ('connection' in navigator) {
    const conn = navigator.connection;
    console.log('   - Connection Type:', conn.effectiveType);
    console.log('   - Downlink:', conn.downlink, 'Mbps');
    console.log('   - RTT:', conn.rtt, 'ms');
  }
  
  // 6. Force WebRTC re-initialization if available
  console.log('\n6️⃣ Re-initialization Test:');
  if (window.NativeWebRTCDebug?.forceInitialize) {
    console.log('   - Force re-initialization available');
    console.log('   - Run: window.NativeWebRTCDebug.forceInitialize()');
  }
  
  // 7. Check for common issues
  console.log('\n7️⃣ Common Issues Check:');
  const loopStatus = window.NativeWebRTCDebug?.getLoopDetectionStatus?.();
  if (loopStatus) {
    console.log('   - Loop detection status:', loopStatus);
    if (loopStatus.inCooldown) {
      console.log('   ⚠️ ISSUE: Loop detection cooldown active!');
      console.log('   🔧 FIX: Run window.NativeWebRTCDebug.clearLoopDetection()');
    }
  }
  
  const globalInstances = window.NativeWebRTCDebug?.getGlobalInstances?.();
  if (globalInstances !== undefined) {
    console.log('   - Global instances:', globalInstances);
    if (globalInstances > 1) {
      console.log('   ⚠️ ISSUE: Multiple WebRTC instances detected!');
      console.log('   🔧 FIX: Refresh the page or run window.NativeWebRTCDebug.clearGlobalInstances()');
    }
  }
  
  console.log('\n🔍 ===== DIAGNOSTIC COMPLETE =====');
  console.log('\n🔧 Quick Fixes to Try:');
  console.log('1. Clear loop detection: window.NativeWebRTCDebug?.clearLoopDetection?.()');
  console.log('2. Force initialize: window.NativeWebRTCDebug?.forceInitialize?.()');
  console.log('3. Test P2P with all peers: window.NativeWebRTCDebug?.testP2PWithAllPeers?.()');
  console.log('4. Clear global instances: window.NativeWebRTCDebug?.clearGlobalInstances?.()');
  console.log('5. Enable admin P2P: window.HybridChatDebug?.enableP2PForAdminDashboard?.()');
  
  return {
    webrtcSupported: !!window.RTCPeerConnection,
    debugToolsAvailable: !!window.NativeWebRTCDebug,
    currentConnections: window.NativeWebRTCDebug?.getConnections?.()?.length || 0,
    signalingConnected: window.NativeWebRTCDebug?.getSignalingStatus?.()?.connected || false,
    recommendedAction: loopStatus?.inCooldown ? 'clearLoopDetection' : 
                      globalInstances > 1 ? 'clearGlobalInstances' : 
                      'forceInitialize'
  };
}

// Auto-run the diagnostic
diagnosticWebRTCConnections().then(result => {
  console.log('\n📋 DIAGNOSTIC SUMMARY:', result);
});
