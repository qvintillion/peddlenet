#!/bin/bash

# 🚨 CRITICAL FIX: Deploy frontend with WebRTC hook syntax fix
# This fixes the TypeError: Cannot read properties of undefined (reading 'length')

echo "🚨 DEPLOYING FRONTEND WITH WEBRTC FIX"
echo "====================================="
echo "📅 Date: $(date)"
echo ""
echo "🔹 Fix: WebRTC hook forceICERestart function syntax error"
echo "🔹 Issue: TypeError: Cannot read properties of undefined (reading 'length')"
echo "🔹 Solution: Use connectionsRef.current instead of connections state"
echo ""

# Step 1: Commit the WebRTC fix
echo "🔹 Step 1: Committing WebRTC hook fix..."
git add src/hooks/use-native-webrtc.ts
git commit -m "🚨 CRITICAL FIX: WebRTC hook syntax error - forceICERestart function

- Fixed TypeError: Cannot read properties of undefined (reading 'length')
- Changed connections?.entries() to connectionsRef.current?.entries()
- Removed unnecessary dependency from useCallback
- This resolves the crash reported in Vercel deployment"

if [ $? -eq 0 ]; then
    echo "✅ WebRTC fix committed successfully"
else
    echo "⚠️ Nothing to commit (fix may already be applied)"
fi

echo ""
echo "🔹 Step 2: Deploying to Vercel..."

# Deploy to Vercel
vercel --prod

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 WEBRTC FIX DEPLOYED!"
    echo "======================"
    echo ""
    echo "📊 FIXES APPLIED:"
    echo "   ✅ WebRTC hook syntax error fixed"
    echo "   ✅ forceICERestart function now uses connectionsRef.current"
    echo "   ✅ Removed problematic dependencies from useCallback"
    echo ""
    echo "⚡ TESTING CHECKLIST:"
    echo "   □ No more TypeError in browser console"
    echo "   □ WebRTC connections work properly"
    echo "   □ ICE restart function works without crashes"
    echo "   □ Chat functionality restored"
    echo ""
    echo "🧪 TEST THE FIX:"
    echo "   1. Visit the production URL from Vercel CLI output"
    echo "   2. Check browser console for errors"
    echo "   3. Try joining a room and sending messages"
    echo "   4. Verify WebRTC debug tools work: window.NativeWebRTCDebug"
else
    echo "❌ Vercel deployment failed"
    exit 1
fi
