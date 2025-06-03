#!/bin/bash

echo "🔍 WebRTC Connection Debugging"
echo "=============================="
echo ""

echo "The connection started but got stuck. Common causes:"
echo ""

echo "1. 🔥 FIREWALL/NAT Issues:"
echo "   • Corporate/school networks often block WebRTC"
echo "   • Mobile carrier blocking P2P connections"
echo "   • Router/firewall blocking STUN/TURN"
echo ""

echo "2. 📱 MOBILE BROWSER Issues:"
echo "   • Safari on iOS has stricter WebRTC policies"
echo "   • Chrome mobile vs Safari mobile differences"
echo "   • Background tab limitations"
echo ""

echo "3. 🌐 NETWORK Configuration:"
echo "   • Both devices not on same network type"
echo "   • STUN servers not reachable"
echo "   • ICE candidates failing"
echo ""

echo "🧪 DEBUGGING STEPS:"
echo ""

echo "Step 1: Check mobile console for errors"
echo "   • Open mobile dev tools"
echo "   • Look for WebRTC/ICE errors"
echo "   • Check for STUN server failures"
echo ""

echo "Step 2: Test different network combinations"
echo "   • Desktop: WiFi, Mobile: WiFi (same network)"
echo "   • Desktop: WiFi, Mobile: Cellular data"
echo "   • Both on mobile hotspot"
echo ""

echo "Step 3: Test different browsers"
echo "   • Mobile Chrome vs Safari"
echo "   • Desktop Chrome vs Firefox"
echo ""

echo "Step 4: Check WebRTC support"
echo "   In mobile console run:"
echo "   console.log('WebRTC supported:', !!(window.RTCPeerConnection || window.webkitRTCPeerConnection));"
echo ""

echo "🚀 QUICK TESTS:"
echo ""

echo "Test A: Same device connection"
echo "   1. Open two tabs on desktop: /test-room"
echo "   2. Copy peer ID from tab 1"  
echo "   3. Manual connect from tab 2"
echo "   4. Should connect instantly"
echo ""

echo "Test B: Check STUN servers"
echo "   In console run:"
echo "   fetch('https://stun.l.google.com:19302').catch(e => console.log('STUN blocked:', e));"
echo ""

echo "Try the enhanced debugging first, then we'll see what's failing!"
