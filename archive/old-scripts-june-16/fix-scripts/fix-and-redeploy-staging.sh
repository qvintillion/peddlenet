#!/bin/bash

# 🚨 QUICK FIX: Commit WebRTC fix and re-deploy staging complete
# This fixes the TypeError and re-runs the staging:vercel:complete command

echo "🚨 QUICK FIX AND RE-DEPLOY"
echo "========================="
echo "📅 Date: $(date)"
echo ""

# Step 1: Commit the WebRTC hook fix
echo "🔹 Step 1: Committing WebRTC hook fix..."
git add src/hooks/use-native-webrtc.ts signaling-server.js

# Check if there are changes to commit
if git diff --staged --quiet; then
    echo "⚠️ No changes to commit - fixes may already be applied"
else
    git commit -m "🚨 CRITICAL FIX: WebRTC hook syntax error + CORS update

- Fixed TypeError: Cannot read properties of undefined (reading 'length')
- Updated forceICERestart to use connectionsRef.current instead of connections
- Added CORS support for Vercel domain: festival-chat-5x4hx04q3-thepeddlers-projects-d74f9d42.vercel.app
- Both staging and production deployments should now work without crashes"

    if [ $? -eq 0 ]; then
        echo "✅ Fixes committed successfully"
    else
        echo "❌ Commit failed"
        exit 1
    fi
fi

echo ""
echo "🔹 Step 2: Re-running staging complete deployment..."
echo "This will deploy both WebSocket server (with CORS fix) AND frontend (with WebRTC fix)"
echo ""

# Step 2: Re-run the staging complete deployment
npm run staging:vercel:complete

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 STAGING COMPLETE DEPLOYMENT WITH FIXES SUCCESSFUL!"
    echo "=================================================="
    echo ""
    echo "📊 FIXES APPLIED:"
    echo "   ✅ WebSocket server: CORS updated for Vercel domains"
    echo "   ✅ Frontend: WebRTC hook syntax error fixed"
    echo "   ✅ Both deployed together using staging:vercel:complete"
    echo ""
    echo "⚡ TESTING CHECKLIST:"
    echo "   □ Check Vercel preview URL from output above"
    echo "   □ No CORS errors in Network tab"
    echo "   □ No TypeError crashes in console"
    echo "   □ WebSocket connection shows 'connected'"
    echo "   □ Chat functionality works end-to-end"
    echo ""
    echo "🚀 If staging works, run: npm run deploy:production:complete"
else
    echo "❌ Staging deployment failed - check errors above"
    exit 1
fi
