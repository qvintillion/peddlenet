// 🔍 Enhanced WebRTC Connection Debugger
// Run this to get detailed signaling flow analysis

function analyzeWebRTCSignaling() {
  console.log('🔍 ===== WEBRTC SIGNALING ANALYSIS =====');
  
  const connections = window.NativeWebRTCDebug.getConnections();
  console.log(`\n📊 Total Connections: ${connections.length}`);
  
  connections.forEach(([peerId, conn], i) => {
    console.log(`\n🔗 Connection ${i+1} Analysis (${peerId}):`);
    console.log('   Basic State:', {
      connectionState: conn.connectionState,
      iceConnectionState: conn.peerConnection.iceConnectionState,
      iceGatheringState: conn.peerConnection.iceGatheringState,
      signalingState: conn.peerConnection.signalingState
    });
    
    console.log('   SDP States:', {
      hasLocalDescription: !!conn.peerConnection.localDescription,
      hasRemoteDescription: !!conn.peerConnection.remoteDescription,
      localType: conn.peerConnection.localDescription?.type || 'none',
      remoteType: conn.peerConnection.remoteDescription?.type || 'none'
    });
    
    console.log('   Data Channel:', {
      exists: !!conn.dataChannel,
      readyState: conn.dataChannel?.readyState || 'none',
      label: conn.dataChannel?.label || 'none'
    });
    
    // Check for common issues
    const issues = [];
    if (!conn.peerConnection.localDescription) {
      issues.push('❌ Missing local description (offer/answer not created)');
    }
    if (!conn.peerConnection.remoteDescription) {
      issues.push('❌ Missing remote description (offer/answer not received)');
    }
    if (conn.peerConnection.iceConnectionState === 'new' && conn.peerConnection.iceGatheringState === 'complete') {
      issues.push('⚠️ ICE gathering complete but connection still new (signaling issue)');
    }
    if (!conn.dataChannel && conn.connectionState !== 'new') {
      issues.push('⚠️ No data channel created (initiator issue)');
    }
    
    if (issues.length > 0) {
      console.log('   🚨 Issues Detected:');
      issues.forEach(issue => console.log(`      ${issue}`));
    } else {
      console.log('   ✅ No obvious issues detected');
    }
  });
  
  // Check signaling connectivity
  console.log('\n📡 Signaling Status:');
  const signalingStatus = window.NativeWebRTCDebug.getSignalingStatus();
  console.log('   WebSocket Connected:', signalingStatus.connected);
  console.log('   Socket ID:', signalingStatus.socketId);
  
  // Suggest next steps
  console.log('\n🔧 Suggested Actions:');
  if (connections.length === 0) {
    console.log('   1. Run: window.NativeWebRTCDebug.forceInitialize()');
    console.log('   2. Wait 5 seconds, then run: window.NativeWebRTCDebug.testP2PWithAllPeers()');
  } else {
    const hasLocalDesc = connections.some(([_, conn]) => conn.peerConnection.localDescription);
    const hasRemoteDesc = connections.some(([_, conn]) => conn.peerConnection.remoteDescription);
    
    if (!hasLocalDesc) {
      console.log('   1. ❌ Local descriptions missing - WebRTC offers/answers not being created');
      console.log('   2. Check browser console for WebRTC creation errors');
    } else if (!hasRemoteDesc) {
      console.log('   1. ❌ Remote descriptions missing - Signaling server not forwarding offers/answers');
      console.log('   2. Check WebSocket server logs for signaling errors');
    } else {
      console.log('   1. ✅ Offer/Answer exchange looks complete');
      console.log('   2. Issue likely with ICE connectivity or TURN servers');
      console.log('   3. Wait 10-15 seconds for ICE gathering to complete');
    }
  }
  
  console.log('\n🔍 ===== ANALYSIS COMPLETE =====');
  
  return {
    totalConnections: connections.length,
    signalingConnected: signalingStatus.connected,
    hasLocalDescriptions: connections.some(([_, conn]) => conn.peerConnection.localDescription),
    hasRemoteDescriptions: connections.some(([_, conn]) => conn.peerConnection.remoteDescription),
    connectionStates: connections.map(([peerId, conn]) => ({
      peerId: peerId.substring(0, 8),
      state: conn.connectionState,
      iceState: conn.peerConnection.iceConnectionState
    }))
  };
}

// Auto-run analysis
analyzeWebRTCSignaling();
