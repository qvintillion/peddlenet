#!/bin/bash

echo "🐛 Adding Message Debugging to Production"
echo "======================================="
echo ""

cd "/Users/qvint/Documents/Design/Design Stuff/Side Projects/Peddler Network App/festival-chat"

echo "🔧 Testing build with debugging..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "📦 Staging debugging changes..."
    git add .
    
    echo "📝 Committing message debugging..."
    git commit -m "🐛 Add message debugging to production

🔍 Added Debug Logging:
- Log when server messages are updated
- Log when real-time messages are received  
- Log message sending process
- Track message IDs and duplicates
- Better error tracking for message flow

🎯 Purpose: Identify why messages are sent but not appearing
in the chat UI. This will help diagnose the WebSocket message
handling issue in the live festival chat app.

✅ Will help identify:
- If messages reach the server
- If messages come back from server
- If messages are added to local state
- Where the message flow breaks"

    if [ $? -eq 0 ]; then
        echo "✅ Debugging committed!"
        echo ""
        echo "🚀 Pushing debug version to production..."
        git push origin main
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "🎉 Debug version deployed!"
            echo ""
            echo "🧪 Testing Instructions:"
            echo "1. Wait for Vercel auto-deployment (1-2 mins)"
            echo "2. Open browser dev tools (F12)"
            echo "3. Visit live site and create/join room"
            echo "4. Try sending messages"
            echo "5. Check console for debug logs:"
            echo "   📤 Sending message logs"
            echo "   📨 Receiving message logs"
            echo "   ✅ Message added to UI logs"
            echo "   ⚠️ Any error or duplicate logs"
            echo ""
            echo "🎯 This will show exactly where messages get stuck!"
        else
            echo "❌ Push failed."
        fi
    else
        echo "❌ Commit failed."
    fi
else
    echo "❌ Build failed."
fi
