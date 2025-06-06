#!/bin/bash

echo "🔧 Fix Duplicate Connections & Message Format Debug"
echo "================================================="
echo ""

cd "/Users/qvint/Documents/Design/Design Stuff/Side Projects/Peddler Network App/festival-chat"

echo "🔧 Testing build with connection fixes..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "📦 Staging connection fixes..."
    git add .
    
    echo "📝 Committing connection & message fixes..."
    git commit -m "🔧 Fix duplicate connections & improve message debugging

🛠️ Connection Fixes:
- Prevent duplicate connections when display name changes
- Better cleanup when display name becomes invalid
- Disconnect stale connections to prevent '2 online' bug
- Improved connection lifecycle management

🔍 Enhanced Message Debugging:
- Show full JSON structure of messages sent to server
- Better tracking of connection state changes
- Cleaner disconnect logging

🎯 Should Fix:
- '2 online' showing instead of '1 online'
- Messages not appearing (better debug to identify server issue)
- Duplicate peer connections from same device

📊 Expected Debug Output:
- Cleaner connection logs
- Full message JSON structure
- Better tracking of peer join/leave events"

    if [ $? -eq 0 ]; then
        echo "✅ Connection fixes committed!"
        echo ""
        echo "🚀 Pushing to production..."
        git push origin main
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "🎉 Connection fixes deployed!"
            echo ""
            echo "⏰ Vercel auto-deployment starting..."
            echo ""
            echo "🧪 Test After Deployment (1-2 mins):"
            echo "1. Clear browser cache completely"
            echo "2. Join room on both devices"
            echo "3. Check console for:"
            echo "   📤 Full message JSON structure"
            echo "   📥 Any message received logs"
            echo "   🔌 Connection/disconnection logs"
            echo "4. Verify only '1 online' (not 2)"
            echo "5. Try sending messages"
            echo ""
            echo "🎯 The full JSON will show exactly what's sent to server!"
        else
            echo "❌ Push failed."
        fi
    else
        echo "❌ Commit failed."
    fi
else
    echo "❌ Build failed."
fi
