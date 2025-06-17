#!/bin/bash

# 🔥 P2P Admin Dashboard Connection Test
# Tests if the WebSocket server is reachable and responding to P2P admin requests

echo "🔥 Testing P2P Admin Dashboard Connectivity"
echo "============================================"

# Check if local WebSocket server is running
echo ""
echo "1. Testing Local WebSocket Server (port 3001)..."
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Local WebSocket server is running"
    
    # Test admin mesh endpoint
    echo ""
    echo "2. Testing Admin Mesh Endpoint..."
    response=$(curl -s -w "%{http_code}" -u "th3p3ddl3r:letsmakeatrade" http://localhost:3001/admin/mesh-status)
    http_code="${response: -3}"
    
    if [ "$http_code" = "200" ]; then
        echo "✅ Admin mesh endpoint accessible"
        echo "📊 P2P data available from WebSocket server"
    else
        echo "❌ Admin mesh endpoint returned HTTP $http_code"
        echo "🔍 Response: ${response%???}"
    fi
    
else
    echo "❌ Local WebSocket server not running on port 3001"
    echo "💡 Start it with: node signaling-server.js"
fi

echo ""
echo "3. Testing Next.js API Proxy..."
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Next.js development server is running"
    
    # Test mesh API proxy
    response=$(curl -s -w "%{http_code}" -u "th3p3ddl3r:letsmakeatrade" http://localhost:3000/api/admin/mesh-status)
    http_code="${response: -3}"
    
    if [ "$http_code" = "200" ]; then
        echo "✅ Mesh API proxy working - real P2P data flowing"
    elif [ "$http_code" = "503" ]; then
        echo "❌ Mesh API proxy returns 503 - WebSocket server unreachable"
        echo "🔧 This is the expected behavior with the new NO MOCK DATA policy"
    else
        echo "⚠️ Mesh API proxy returned HTTP $http_code"
    fi
    
else
    echo "❌ Next.js development server not running on port 3000"
    echo "💡 Start it with: npm run dev"
fi

echo ""
echo "4. Environment Check..."
echo "NEXT_PUBLIC_SIGNALING_SERVER: ${NEXT_PUBLIC_SIGNALING_SERVER:-"Not set"}"
echo "NODE_ENV: ${NODE_ENV:-"Not set"}"

echo ""
echo "🎯 Next Steps:"
echo "1. Ensure WebSocket server is running: node signaling-server.js"
echo "2. Ensure Next.js dev server is running: npm run dev"
echo "3. Test P2P connections in chat rooms"
echo "4. Check admin dashboard for real P2P data"
