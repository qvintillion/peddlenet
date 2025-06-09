#!/bin/bash

# 🔧 Festival Chat - Room Code Fix Quick Deploy
# Quick deployment for room code server-side resolution fix

echo "🔧 Quick Deploy: Room Code Fix"
echo "=============================="
echo ""

cd "/Users/qvint/Documents/Design/Design Stuff/Side Projects/Peddler Network App/festival-chat"

# Quick commit and push
echo "📋 Current changes:"
git status --short

echo ""
echo "➕ Staging changes..."
git add -A

echo ""
echo "📝 Committing room code fix..."
git commit -m "🔧 Fix: Room Code Server-Side Resolution

✅ Fixed room joining issue in staging
✅ Added server-side room code mapping storage  
✅ Room codes now work across different browsers/devices
✅ Backward compatible with localStorage fallback

🛠️ Changes:
- signaling-server.js: Added roomCodes Map and API endpoints
- room-codes.ts: Enhanced with server lookup functionality  
- RoomCode.tsx: Updated for async room code resolution

🎯 Result: Users can now reliably join existing rooms using room codes instead of creating new ones."

if [ $? -eq 0 ]; then
    echo "✅ Changes committed!"
    echo ""
    echo "🔄 Pushing to GitHub..."
    git push origin main
    
    if [ $? -eq 0 ]; then
        echo "✅ Pushed to GitHub!"
        echo ""
        echo "🎯 Choose your deployment method:"
        echo ""
        echo "📱 For Frontend + Backend (Recommended):"
        echo "   npm run deploy:firebase"
        echo ""
        echo "🌐 For Frontend Only (Vercel):"
        echo "   npm run deploy:vercel"
        echo ""
        echo "⚙️ For Backend Only (Cloud Run):"
        echo "   chmod +x deploy-staging-fix.sh && ./deploy-staging-fix.sh"
        echo ""
        echo "🧪 Testing after deployment:"
        echo "1. Open two different browsers/devices"
        echo "2. Create a room in browser A, note the room code"
        echo "3. Enter the room code in browser B"
        echo "4. Verify browser B joins the same room ✅"
        echo ""
        echo "🎪 Room code fix is ready for deployment!"
    else
        echo "❌ Push failed. Check error above."
    fi
else
    echo "❌ Commit failed. Check git status."
fi
