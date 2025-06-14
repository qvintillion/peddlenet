#!/bin/bash

echo "🚀 Quick Admin Dashboard Fix"
echo "============================"

# First, let's try to start the server and test if it responds
echo "1. Testing current server..."

# Kill any existing server process
pkill -f "signaling-server.js" || true
pkill -f "node.*3001" || true

# Start the server in background
echo "   Starting server..."
cd "/Users/qvint/Documents/Design/Design Stuff/Side Projects/Peddler Network App/festival-chat"
node signaling-server.js &
SERVER_PID=$!

# Wait a moment for server to start
sleep 3

# Test if server responds
echo "2. Testing server endpoints..."
if curl -s "http://localhost:3001/health" > /dev/null; then
    echo "   ✅ Server is running and responding"
    
    # Test admin endpoints
    if curl -s "http://localhost:3001/admin/analytics" > /dev/null; then
        echo "   ✅ Admin analytics endpoint exists"
    else
        echo "   ❌ Admin analytics endpoint missing"
    fi
    
    if curl -s "http://localhost:3001/admin/activity" > /dev/null; then
        echo "   ✅ Admin activity endpoint exists"  
    else
        echo "   ❌ Admin activity endpoint missing"
    fi
else
    echo "   ❌ Server not responding"
fi

echo ""
echo "3. Results:"
echo "   🌐 Server: http://localhost:3001"
echo "   📊 Health: http://localhost:3001/health"
echo "   🛡️ Admin Analytics: http://localhost:3001/admin/analytics"
echo "   📋 Admin Activity: http://localhost:3001/admin/activity"
echo ""
echo "4. Next Steps:"
echo "   - If endpoints are missing, server needs admin endpoints added"
echo "   - If working, check frontend URL construction in useAdminAnalytics" 
echo "   - Server PID: $SERVER_PID (kill with: kill $SERVER_PID)"
echo ""
echo "🔗 Admin Dashboard: http://localhost:3000/admin-analytics"
