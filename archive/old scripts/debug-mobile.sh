#!/bin/bash

echo "🔧 Mobile PeerJS Debugging"
echo "========================"
echo ""
echo "The mobile device is getting config errors. Let's check:"
echo ""

echo "📱 MOBILE DEBUGGING STEPS:"
echo ""
echo "1. Open mobile browser console:"
echo "   • Chrome: Menu → More Tools → Developer Tools"
echo "   • Safari: Settings → Advanced → Web Inspector"
echo ""

echo "2. Check for these specific errors:"
echo "   ❌ 'PeerJS not loaded' - CDN issue"
echo "   ❌ 'SSL certificate' - HTTPS issue" 
echo "   ❌ 'Network unreachable' - Firewall/network"
echo "   ❌ 'WebRTC not supported' - Browser compatibility"
echo ""

echo "3. Test basic PeerJS loading:"
echo "   In mobile console, run:"
echo "   console.log('PeerJS available:', !!window.Peer);"
echo ""

echo "4. Test network connectivity:"
echo "   In mobile console, run:"
echo "   fetch('/api/health').then(r => console.log('Network OK'));"
echo ""

echo "🔧 QUICK FIXES TO TRY:"
echo ""
echo "Fix 1: Try different mobile browser"
echo "   • Chrome → Safari (or vice versa)"
echo "   • Firefox mobile"
echo ""

echo "Fix 2: Check ngrok tunnel"
echo "   • Visit: http://localhost:4040"
echo "   • Look for connection errors"
echo "   • Try new tunnel: pkill ngrok && ngrok http 3000"
echo ""

echo "Fix 3: Test with different network"
echo "   • Mobile hotspot instead of WiFi"
echo "   • Different WiFi network"
echo ""

echo "Fix 4: Clear mobile browser data"
echo "   • Clear cookies/cache"
echo "   • Restart browser"
echo ""

echo "🎯 Most likely causes:"
echo "   1. PeerJS CDN not loading on mobile"
echo "   2. ngrok tunnel instability" 
echo "   3. Mobile network blocking WebRTC"
echo "   4. HTTPS certificate issues"
echo ""

echo "Try the test page first: https://your-ngrok.io/test-room"
echo "This will show if the issue is in the complex P2P logic or basic setup."
