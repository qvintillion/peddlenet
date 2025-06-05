#!/bin/bash

echo "📱 Mobile Connection Test"
echo "========================"
echo ""

# Get the IP from Next.js output or environment
NEXTJS_IP="192.168.0.154"  # From your Next.js output
ENV_IP=$(grep NEXT_PUBLIC_SIGNALING_SERVER .env.local 2>/dev/null | cut -d'=' -f2 | sed 's/http:\/\///' | cut -d':' -f1)

echo "🔍 Network Configuration:"
echo "   Next.js IP: $NEXTJS_IP"
echo "   Environment IP: $ENV_IP"
echo ""

# Test the URLs that mobile will try to access
TEST_IP="$NEXTJS_IP"

echo "🧪 Testing mobile-accessible URLs..."

# Test Next.js app
echo -n "   📱 App (http://$TEST_IP:3000): "
curl -s -I "http://$TEST_IP:3000" >/dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Reachable"
else
    echo "❌ Not reachable"
fi

# Test WebSocket server
echo -n "   📡 Server (http://$TEST_IP:3001): "
curl -s "http://$TEST_IP:3001/health" >/dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Reachable"
else
    echo "❌ Not reachable"
fi

echo ""
echo "📱 Mobile Test Instructions:"
echo "   1. Ensure mobile is on same WiFi network"
echo "   2. Open mobile browser"
echo "   3. Go to: http://$TEST_IP:3000"
echo "   4. Should load the festival chat app"
echo ""

# Test from mobile perspective
echo "🔍 Quick mobile connectivity test:"
echo "   Open this URL on your mobile device:"
echo "   👉 http://$TEST_IP:3000"
echo ""

if [ "$NEXTJS_IP" != "$ENV_IP" ]; then
    echo "⚠️  IP mismatch detected!"
    echo "   Next.js IP: $NEXTJS_IP"
    echo "   Environment IP: $ENV_IP"
    echo ""
    echo "🔧 To fix:"
    echo "   1. Update .env.local: NEXT_PUBLIC_SIGNALING_SERVER=http://$NEXTJS_IP:3001"
    echo "   2. Restart both servers"
    echo ""
fi

echo "💡 If mobile still doesn't work:"
echo "   • Check both devices are on same WiFi"
echo "   • Try disabling mobile data temporarily"
echo "   • Check firewall settings"
echo "   • Try opening: http://$TEST_IP:3000 directly in mobile browser"
