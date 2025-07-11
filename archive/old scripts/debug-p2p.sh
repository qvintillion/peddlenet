#!/bin/bash

echo "🧪 P2P Connection Testing Script"
echo "==============================="
echo ""

# Function to wait for user input
wait_for_enter() {
    echo "Press Enter to continue..."
    read
}

echo "🔍 Let's debug the P2P connection step by step:"
echo ""

echo "📋 STEP 1: Clear old data and test basic setup"
echo "   This will clear localStorage and test with simplified P2P"
echo ""
echo "   What to do:"
echo "   1. Open browser console (F12)"
echo "   2. Run this command to clear old data:"
echo "      localStorage.clear(); location.reload();"
echo "   3. Check console for peer initialization logs"
echo ""
wait_for_enter

echo "📋 STEP 2: Test with simplified P2P hook"
echo "   Create a test URL with simplified connection logic"
echo ""
echo "   Test URL (add to end of your ngrok URL):"
echo "   /chat/test-room"
echo ""
echo "   Example: https://abc123.ngrok.io/chat/test-room"
echo ""
echo "   What to look for:"
echo "   ✅ Single '✅ P2P ready with peer ID:' message"
echo "   ❌ Multiple peer recreations"
echo ""
wait_for_enter

echo "📋 STEP 3: Test manual connection first"
echo "   Before testing QR codes, verify P2P works manually"
echo ""
echo "   Instructions:"
echo "   1. Desktop: Open test room, copy peer ID"
echo "   2. Mobile: Open same test room"
echo "   3. Mobile: Click 'Manual Connect'"
echo "   4. Mobile: Paste peer ID and connect"
echo "   5. Watch for '✅ Connected to host via QR!' message"
echo ""
echo "   Expected result: Manual connection should work"
echo ""
wait_for_enter

echo "📋 STEP 4: Test QR connection"
echo "   Only if manual connection works"
echo ""
echo "   Instructions:"
echo "   1. Desktop: Generate QR code"
echo "   2. Mobile: Scan QR code"
echo "   3. Check console for connection attempt"
echo ""
echo "   Common issues:"
echo "   • QR contains old/invalid peer ID"
echo "   • Peer recreated after QR generation"
echo "   • Network/tunnel instability"
echo ""
wait_for_enter

echo "📋 STEP 5: Check network stability"
echo "   Test if ngrok tunnel is stable"
echo ""
echo "   What to check:"
echo "   1. Visit ngrok dashboard: http://localhost:4040"
echo "   2. Check for tunnel disconnections"
echo "   3. Try different ngrok region:"
echo "      ngrok http 3000 --region=eu"
echo "   4. Test with multiple browser tabs"
echo ""
wait_for_enter

echo "🎯 TROUBLESHOOTING GUIDE:"
echo ""
echo "If manual connection fails:"
echo "   • Check both devices are using HTTPS"
echo "   • Verify firewall isn't blocking WebRTC"
echo "   • Try different WiFi network"
echo "   • Check browser compatibility"
echo ""
echo "If QR connection fails but manual works:"
echo "   • QR peer ID doesn't match actual peer ID"
echo "   • Peer recreated after QR generation"
echo "   • URL parsing issues"
echo ""
echo "If peer keeps recreating:"
echo "   • React StrictMode (check layout.tsx)"
echo "   • Effect dependencies causing re-runs"
echo "   • ngrok tunnel instability"
echo ""
echo "🚀 Quick fixes to try:"
echo "   1. Use test page: /chat/test-room"
echo "   2. Clear localStorage completely"
echo "   3. Restart ngrok tunnel"
echo "   4. Try different browser"
echo "   5. Test on same device (two tabs)"
echo ""
echo "Good luck! 🎉"
