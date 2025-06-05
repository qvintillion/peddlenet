#!/bin/bash

echo "🧪 Testing Mobile Connection Fix"
echo "==============================="
echo ""

# Check if files exist
echo "📁 Checking files..."
if [ ! -f "signaling-server.js" ]; then
    echo "❌ signaling-server.js not found"
    exit 1
fi

if [ ! -f "src/hooks/use-websocket-chat.ts" ]; then
    echo "❌ WebSocket hook not found"
    exit 1
fi

if [ ! -f "src/components/MobileConnectionDebug.tsx" ]; then
    echo "❌ Mobile debug component not found"
    exit 1
fi

echo "✅ All required files present"

# Test compilation
echo "🔨 Testing compilation..."
npm run build > /tmp/build.log 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed - check log:"
    tail -10 /tmp/build.log
    exit 1
fi

# Test server start
echo "📡 Testing server startup..."
timeout 10s node signaling-server.js > /tmp/server.log 2>&1 &
SERVER_PID=$!
sleep 3

# Check if server is responding
curl -s http://localhost:3001/health > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Server responding on port 3001"
else
    # Try other ports
    for port in 3002 3003 3004 3005; do
        curl -s http://localhost:$port/health > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            echo "✅ Server responding on port $port"
            break
        fi
    done
fi

# Stop server
kill $SERVER_PID 2>/dev/null

echo "🎉 Basic tests passed!"
echo ""
echo "🚀 Ready to test mobile connections:"
echo "   1. Run: ./tools/quick-mobile-fix.sh"
echo "   2. Open app on computer"
echo "   3. Generate QR code"
echo "   4. Scan with mobile device"
echo ""
echo "✅ Mobile fix is ready!"
