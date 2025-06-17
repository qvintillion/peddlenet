#!/bin/bash

# 🚨 COMPLETE FIX DEPLOYMENT: WebSocket CORS + Frontend WebRTC
# Fixes both the CORS error and WebRTC hook syntax error

echo "🚨 COMPLETE FIX DEPLOYMENT"
echo "========================="
echo "📅 Date: $(date)"
echo ""
echo "🔧 ISSUES TO FIX:"
echo "   1. CORS Error: WebSocket server doesn't allow Vercel domain"
echo "   2. WebRTC Error: TypeError in forceICERestart function"
echo ""

# Step 1: Deploy WebSocket server with CORS fix
echo "🔹 PHASE 1: DEPLOYING WEBSOCKET SERVER WITH CORS FIX"
echo "=================================================="
chmod +x deploy-websocket-cors-fix.sh
./deploy-websocket-cors-fix.sh

if [ $? -eq 0 ]; then
    echo "✅ Phase 1 complete: WebSocket server CORS fixed"
    echo ""
    
    # Wait a moment for server to be ready
    echo "⏱️  Waiting 10 seconds for server to be fully ready..."
    sleep 10
    
    # Step 2: Deploy frontend with WebRTC fix
    echo "🔹 PHASE 2: DEPLOYING FRONTEND WITH WEBRTC FIX"
    echo "=============================================="
    chmod +x deploy-frontend-webrtc-fix.sh
    ./deploy-frontend-webrtc-fix.sh
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "🎉 COMPLETE FIX DEPLOYMENT SUCCESSFUL!"
        echo "====================================="
        echo ""
        echo "📊 ALL FIXES APPLIED:"
        echo "   ✅ WebSocket server CORS updated for Vercel domain"
        echo "   ✅ WebRTC hook syntax error fixed"
        echo "   ✅ forceICERestart function crash resolved"
        echo "   ✅ Both staging and production deployed"
        echo ""
        echo "⚡ FINAL TESTING:"
        echo "   1. Visit the Vercel production URL"
        echo "   2. Check: No CORS errors in Network tab"
        echo "   3. Check: No TypeError crashes in console"
        echo "   4. Test: Join a room and send messages"
        echo "   5. Verify: WebSocket connection status shows 'connected'"
        echo ""
        echo "🔍 DEBUG TOOLS AVAILABLE:"
        echo "   - window.NativeWebRTCDebug (WebRTC debugging)"
        echo "   - Browser DevTools Network tab (WebSocket connection)"
        echo "   - Browser Console (error monitoring)"
        echo ""
        echo "✅ Festival Chat should now be fully functional!"
    else
        echo "❌ Phase 2 failed: Frontend deployment error"
        exit 1
    fi
else
    echo "❌ Phase 1 failed: WebSocket deployment error"
    exit 1
fi
