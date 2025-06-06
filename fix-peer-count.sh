#!/bin/bash

echo "🎯 Fix Peer Count: Mobile Should Show '1 online' Like Desktop"
echo "==========================================================="
echo ""

cd "/Users/qvint/Documents/Design/Design Stuff/Side Projects/Peddler Network App/festival-chat"

echo "🔧 Testing build with peer count fix..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "📦 Staging peer count fix..."
    git add .
    
    echo "📝 Committing peer count fix..."
    git commit -m "🎯 Fix peer count: Mobile now shows '1 online' like desktop

✅ Peer Count Fix:
- Exclude self from connected peers count in all handlers  
- Mobile will now show '1 online' instead of '2 online'
- Desktop behavior unchanged (already correct)
- Consistent peer counting across all devices

🔧 Technical Changes:
- Filter out own displayName from room-peers list
- Skip self in peer-joined events
- Skip self in peer-left events  
- Added debug logging for peer counts

📊 Expected Result:
- Desktop: '1 online' ✅ (unchanged)
- Mobile: '1 online' ✅ (fixed from showing '2')
- Both show count of OTHER people in room, not including self

🎪 Festival chat will now show consistent peer counts!"

    if [ $? -eq 0 ]; then
        echo "✅ Peer count fix committed!"
        echo ""
        echo "🚀 Pushing to production..."
        git push origin main
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "🎉 Peer count fix deployed!"
            echo ""
            echo "⏰ Vercel auto-deployment starting..."
            echo ""
            echo "🧪 Test After Deployment (1-2 mins):"
            echo "1. Join room on both desktop and mobile"
            echo "2. Check console logs for:"
            echo "   'Room peers total: 2'"
            echo "   'Other peers (excluding self): 1'"
            echo "3. Verify BOTH devices show '1 online'"
            echo "4. Test message sending (original issue may be fixed too)"
            echo ""
            echo "✅ Expected: Both desktop and mobile show '1 online'"
            echo "❌ Before: Desktop '1 online', Mobile '2 online'"
        else
            echo "❌ Push failed."
        fi
    else
        echo "❌ Commit failed."
    fi
else
    echo "❌ Build failed."
fi
