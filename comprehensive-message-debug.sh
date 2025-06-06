#!/bin/bash

echo "🔍 Comprehensive Message Debug: Multiple Formats & Error Logging"
echo "==============================================================="
echo ""

cd "/Users/qvint/Documents/Design/Design Stuff/Side Projects/Peddler Network App/festival-chat"

echo "🔧 Testing build with comprehensive message debugging..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "📦 Staging comprehensive message debug..."
    git add .
    
    echo "📝 Committing comprehensive message debugging..."
    git commit -m "🔍 Comprehensive message debug: Multiple formats & error logging

🎯 Message Format Testing:
- Try 4 different message formats simultaneously
- Test multiple event names (chat-message, message, send-message, room-message)
- Normalize incoming messages from any format
- Comprehensive message field mapping

🚨 Enhanced Error Logging:
- Listen for server errors, message errors
- Log server responses
- Track all message send attempts
- Detailed format logging

📋 Message Formats Tested:
1. Nested format: {roomId, message: {...}}
2. Flat format: {roomId, content, sender, ...}
3. Simple format: {room, text, user, time}
4. All sent to different event names

🎯 Expected Debug Output:
📤 Trying message format 1/2/3 (different structures)
📥 Received [event-name] from server (if any work)
🚨 Server error/Message error (if server rejects)
🔔 Server response (if server responds)

🛠️ This will identify:
- Which message format the server expects
- What event name the server uses
- Any server-side errors or rejections
- Whether server is responding at all"

    if [ $? -eq 0 ]; then
        echo "✅ Comprehensive debugging committed!"
        echo ""
        echo "🚀 Pushing to production..."
        git push origin main
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "🎉 Comprehensive debugging deployed!"
            echo ""
            echo "⏰ Vercel auto-deployment starting..."
            echo ""
            echo "🧪 Critical Test After Deployment (1-2 mins):"
            echo "1. Join room on both devices"
            echo "2. Send ONE message"
            echo "3. Watch console for:"
            echo "   📤 Multiple format attempts"
            echo "   📥 ANY received message events"
            echo "   🚨 ANY server errors"
            echo "   🔔 ANY server responses"
            echo ""
            echo "🎯 This will definitively identify:"
            echo "• Which format works (if any)"
            echo "• What event name server uses"
            echo "• Server errors/rejections"
            echo "• Root cause of message delivery issue"
            echo ""
            echo "💡 One of these formats should work!"
        else
            echo "❌ Push failed."
        fi
    else
        echo "❌ Commit failed."
    fi
else
    echo "❌ Build failed."
fi
