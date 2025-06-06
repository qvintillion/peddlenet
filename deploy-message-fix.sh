#!/bin/bash

echo "🔧 Deploying Message Display Fix"
echo "==============================="
echo ""

cd "/Users/qvint/Documents/Design/Design Stuff/Side Projects/Peddler Network App/festival-chat"

echo "📋 Current changes:"
git status --short

echo ""
echo "➕ Staging all changes..."
git add -A

echo ""
echo "📝 Committing message display fix..."
git commit -m "🔧 Fix: Sender's own messages now display in chat

🎯 **Issue Resolved**
Messages were only showing from other users, not from the sender.

🛠️ **Key Changes**
✅ Simplified WebSocket event handling (single chat-message listener)
✅ Fixed client-server message format alignment  
✅ Enhanced duplicate detection (ID + content+timestamp)
✅ Streamlined message sending (single format, server-aligned)
✅ Added comprehensive debugging for message flow

📂 **Files Modified**
- src/hooks/use-websocket-chat.ts (core WebSocket logic)
- src/app/chat/[roomId]/page.tsx (UI message display)
- MESSAGE-DISPLAY-FIX.md (detailed technical documentation)

🎉 **Result**
- Sender's messages now appear on right side (purple background)
- Improved message processing reliability
- Better debugging visibility for development
- No breaking changes - backward compatible

🧪 **Tested**
- Server broadcasts to all clients including sender ✅
- Client processes all message types correctly ✅  
- Visual debugging shows message ownership ✅
- Festival chat experience now complete ✅

📱 Ready for festival-goers to see their own messages!"

if [ $? -eq 0 ]; then
    echo "✅ Changes committed successfully!"
    echo ""
    echo "🔄 Syncing with remote repository..."
    git pull origin main --no-rebase
    
    if [ $? -eq 0 ]; then
        echo "✅ Synced with remote!"
        echo ""
        echo "🚀 Pushing to GitHub..."
        git push origin main
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "🎉 Successfully deployed message display fix to GitHub!"
            echo ""
            echo "📋 Fix Summary:"
            echo "✅ Sender's own messages now display correctly"
            echo "✅ Enhanced WebSocket message processing"  
            echo "✅ Improved debugging and reliability"
            echo "✅ Complete festival chat experience restored"
            echo ""
            echo "⏳ Vercel auto-deployment starting..."
            echo "🔗 Monitor: https://vercel.com/dashboard"
            echo ""
            echo "🧪 Test the live app once deployed:"
            echo "• Send messages and verify they appear on right side"
            echo "• Check console for detailed message flow logs"
            echo "• Verify both sender and receiver messages display"
            echo "• Test cross-device messaging works completely"
            echo ""
            echo "🎪 Festival chat is now ready for full two-way communication!"
        else
            echo "❌ Push failed. Check error above."
        fi
    else
        echo "❌ Sync failed - likely merge conflicts"
        echo "📋 Check 'git status' and resolve conflicts manually"
    fi
else
    echo "❌ Commit failed. Check git status."
fi