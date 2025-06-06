#!/bin/bash

# 🚀 Festival Chat Deployment Script
# ===================================
# Edit the commit message and description below before running

echo "🚀 Deploying Festival Chat Changes"
echo "=================================="
echo ""

# ⚠️ EDIT THIS SECTION BEFORE EACH DEPLOYMENT ⚠️
# ================================================

COMMIT_TITLE="🔧 Fix: Message display and solo messaging + UI cleanup"

COMMIT_DESCRIPTION="🎯 **Issues Resolved**
1. Messages not displaying at all (format mismatch) ✅ FIXED
2. Users can now send messages when alone in room ✅ FIXED
3. Removed redundant 'THEM' debug tags from UI ✅ CLEANED

🛠️ **Key Changes**
✅ Fixed message format - simplified to match server expectations exactly
✅ Server expects: { roomId, message: { content } }
✅ Removed redundant fields that server overrides anyway
✅ Enhanced debugging to track message flow server → client
✅ Fixed input enabling logic (server connection vs peer count)
✅ Improved status messages for better UX
✅ Cleaned up debug tags: keep 'ME' for own messages, remove 'THEM' (username already shown)

📂 **Files Modified**
- src/hooks/use-websocket-chat.ts (message format + debugging)
- src/app/chat/[roomId]/page.tsx (input logic + UI cleanup)

🎉 **Results Confirmed**
- Messages display correctly on both sender and receiver ✅
- Solo messaging works when connected to server ✅
- Clean UI with no redundant debug labels ✅
- Clear debugging shows message processing pipeline ✅
- Fixed server message reconstruction using proper displayName ✅

🧪 **Technical Fix**
Server was reconstructing messages with socket.userData.displayName
but client wasn't receiving them due to format mismatch.
Now using exact server format: message.content only.

🏠 Ready for complete festival chat experience!"

# ================================================
# END EDITABLE SECTION
# ================================================

cd "/Users/qvint/Documents/Design/Design Stuff/Side Projects/Peddler Network App/festival-chat"

echo "📋 Current changes:"
git status --short

echo ""
echo "➕ Staging all changes..."
git add -A

echo ""
echo "📝 Committing changes..."
git commit -m "$COMMIT_TITLE

$COMMIT_DESCRIPTION"

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
            echo "🎉 Successfully deployed to GitHub!"
            echo ""
            echo "📋 Deployment Summary:"
            echo "✅ Changes committed and pushed"
            echo "✅ Repository synced"
            echo "✅ Production deployment triggered"
            echo ""
            echo "⏳ Vercel auto-deployment starting..."
            echo "🔗 Monitor: https://vercel.com/dashboard"
            echo ""
            echo "🧪 Test the live app once deployed:"
            echo "• Visit: https://peddlenet.app"
            echo "• Test the changes you just deployed"
            echo "• Verify everything works as expected"
            echo ""
            echo "🎪 Festival chat deployment complete!"
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
