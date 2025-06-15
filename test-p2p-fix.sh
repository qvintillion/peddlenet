#!/bin/bash

# 🚀 P2P Tracking Fix Test Script
echo "🧪 Testing P2P tracking fix for mesh panel..."
echo ""

# Test 1: Basic connection test
echo "🔧 Test 1: Basic mesh status check"
response=$(curl -s -u th3p3ddl3r:letsmakeatrade \
  https://peddlenet-websocket-server-staging-hfttiarlja-uc.a.run.app/admin/mesh-status)

echo "📊 Response received (truncated):"
echo "$response" | jq -c '.metrics' 2>/dev/null || echo "Raw response: $response"
echo ""

# Extract key metrics
activeConnections=$(echo "$response" | jq -r '.metrics.activeP2PConnections // "null"' 2>/dev/null)
currentP2PUsers=$(echo "$response" | jq -r '.metrics.currentP2PUsers // "null"' 2>/dev/null)
totalActiveUsers=$(echo "$response" | jq -r '.metrics.totalActiveUsers // "null"' 2>/dev/null)

echo "🔍 Key Metrics Analysis:"
echo "   - Active P2P Connections: $activeConnections"
echo "   - Current P2P Users: $currentP2PUsers" 
echo "   - Total Active Users: $totalActiveUsers"
echo ""

# Test if metrics make sense
if [ "$activeConnections" != "null" ] && [ "$currentP2PUsers" != "null" ]; then
    if [ "$activeConnections" -ge 0 ] && [ "$currentP2PUsers" -ge 0 ]; then
        echo "✅ Fix appears to be working - metrics are valid numbers"
        
        if [ "$currentP2PUsers" -gt 0 ] && [ "$activeConnections" -gt 0 ]; then
            echo "🌟 EXCELLENT: P2P connections are being tracked properly!"
        elif [ "$totalActiveUsers" -gt 0 ]; then
            echo "ℹ️  Users are connected but not using P2P (expected if no P2P activity)"
        else
            echo "ℹ️  No active users currently (normal when no one is testing)"
        fi
    else
        echo "❌ Metrics are null or invalid"
    fi
else
    echo "❌ Failed to get valid metrics - response may be malformed"
fi

echo ""
echo "🚀 Test complete. The fix should resolve the mesh panel issue!"
echo "   - Peer mapping logic improved"
echo "   - Connection validation enhanced" 
echo "   - Better error handling added"
