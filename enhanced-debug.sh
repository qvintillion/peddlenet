#!/bin/bash

echo "🔧 Enhanced Message Debugging - Display Name & Server Communication"
echo "=================================================================="
echo ""

cd "/Users/qvint/Documents/Design/Design Stuff/Side Projects/Peddler Network App/festival-chat"

echo "🔧 Testing build with enhanced debugging..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "📦 Staging enhanced debugging..."
    git add .
    
    echo "📝 Committing enhanced debugging..."
    git commit -m "🔧 Enhanced message debugging - display name & server format

🔍 Enhanced Debug Logging:
- Track display name validation (displayName vs effectiveDisplayName)
- Detailed message format being sent to server
- Better server response tracking
- Message ID and timestamp generation
- Clearer error messages for connection issues

🎯 Specific Issues to Debug:
- Why display name shows as '1' instead of actual name
- Exact message format sent to WebSocket server
- Whether server receives and processes messages
- If messages are broadcast back to all clients
- Message deduplication and state updates

🔧 Message Format Changes:
- Include message ID, timestamp, and full Message object
- Match expected server-side message structure
- Better error handling for invalid display names

📊 Expected Console Output:
📝 Display name check: {displayName: 'UserName', effectiveDisplayName: 'UserName'}
📤 Sending message to server: {full message object}
📥 Received message from server: {message from server}
✅ Adding message to state: {final message}"

    if [ $? -eq 0 ]; then
        echo "✅ Enhanced debugging committed!"
        echo ""
        echo "🚀 Pushing to production..."
        git push origin main
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "🎉 Enhanced debug version deployed!"
            echo ""
            echo "🧪 Testing Steps (after 1-2 min deployment):"
            echo "1. Clear browser cache and reload"
            echo "2. Open dev tools console (F12)"
            echo "3. Join/create room (watch display name logs)"
            echo "4. Send a message (watch full flow)"
            echo ""
            echo "🔍 Key Debug Logs to Watch:"
            echo "📝 Display name validation"
            echo "📤 Message being sent to server (full object)"
            echo "📥 Message received from server"
            echo "✅ Message added to UI state"
            echo ""
            echo "🎯 This will identify exactly where the message flow breaks!"
        else
            echo "❌ Push failed."
        fi
    else
        echo "❌ Commit failed."
    fi
else
    echo "❌ Build failed."
fi
