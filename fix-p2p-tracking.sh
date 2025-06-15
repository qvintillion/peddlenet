#!/bin/bash

# 🔧 CRITICAL P2P STATUS TRACKING FIX
# ===================================
# Fixes the mesh panel showing empty data by fixing P2P peer mapping

echo "🔧 Applying critical P2P status tracking fix..."

# Backup the current signaling server
cp signaling-server.js signaling-server.js.backup.$(date +%Y%m%d-%H%M%S)
echo "✅ Backed up signaling-server.js"

# Apply the fix to the p2p-status-update handler
# The issue is that the peer mapping logic is failing, causing connection.peers to be empty

# Create a fixed version of the p2p-status-update handler
cat > p2p-status-fix.patch << 'EOF'
  // 🚀 FIXED: P2P status reporting with PROPER peer tracking
  socket.on('p2p-status-update', ({ roomId, activeConnections, connectedPeers, timestamp }) => {
    try {
      console.log(`📊 P2P status update from ${socket.id}: ${activeConnections} active connections in room ${roomId}`);
      console.log(`📊 Connected peers reported:`, connectedPeers);
      
      // Update P2P connection tracking for this socket
      if (!p2pConnections.has(socket.id)) {
        p2pConnections.set(socket.id, {
          peers: new Set(),
          status: 'disconnected',
          roomId,
          lastUpdate: timestamp
        });
      }
      
      const connection = p2pConnections.get(socket.id);
      
      // 🔧 SIMPLIFIED FIX: If activeConnections > 0, mark as connected with peer data
      if (activeConnections > 0 && connectedPeers && Array.isArray(connectedPeers)) {
        connection.status = 'connected';
        // Store peer display names directly (mesh status endpoint will handle mapping)
        connection.connectedPeerNames = connectedPeers;
        connection.peers = new Set(connectedPeers); // Use display names as peer identifiers
        
        console.log(`✅ P2P connection marked as active for ${socket.id}: ${connectedPeers.length} peers`);
      } else {
        connection.status = 'disconnected';
        connection.connectedPeerNames = [];
        connection.peers = new Set();
        
        console.log(`❌ P2P connection marked as inactive for ${socket.id}`);
      }
      
      connection.lastUpdate = timestamp;
      connection.roomId = roomId;
      connection.reportedActiveConnections = activeConnections;
      
      // 🔧 REAL-TIME METRIC UPDATE: Count connections that report > 0 active connections
      const actualActiveConnections = Array.from(p2pConnections.values())
        .filter(conn => conn.status === 'connected' && conn.reportedActiveConnections > 0).length;
      
      meshMetrics.activeP2PConnections = actualActiveConnections;
      
      console.log(`🌐 P2P Connection State Update:`);
      console.log(`   - Socket ${socket.id} status: ${connection.status}`);
      console.log(`   - Socket ${socket.id} reported connections: ${activeConnections}`);
      console.log(`   - Socket ${socket.id} connected peers: ${connectedPeers}`);
      console.log(`   - Total P2P connections tracked: ${p2pConnections.size}`);
      console.log(`   - Active P2P connections: ${actualActiveConnections}`);
      console.log(`   - Global mesh metric updated to: ${meshMetrics.activeP2PConnections}`);
      
      // Log activity for admin dashboard
      addActivityLog('p2p-status-update', {
        socketId: socket.id,
        roomId,
        activeConnections,
        connectedPeers: connectedPeers ? connectedPeers.length : 0,
        globalP2PConnections: meshMetrics.activeP2PConnections,
        connectionStatus: connection.status
      }, '📊');
      
    } catch (error) {
      console.error('❌ P2P status update error:', error);
    }
  });
EOF

echo "🔧 Fix prepared. The issue is in the p2p-status-update handler."
echo "The peer mapping logic is causing connection.peers to be empty."
echo ""
echo "🎯 SOLUTION:"
echo "We need to fix the p2p-status-update handler to properly track P2P connections."
echo "The current mapping from display names to socket IDs is failing."
echo ""
echo "📋 TO APPLY THE FIX:"
echo "1. We need to update the p2p-status-update handler in signaling-server.js"
echo "2. Simplify the peer tracking to use display names directly"
echo "3. Fix the mesh status endpoint to properly detect P2P active users"
echo ""
echo "🚀 This will make the mesh panel show the correct P2P connection data!"

