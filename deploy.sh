#!/bin/bash

# 🚀 Festival Chat Deployment Script
# ===================================
# Edit the commit message and description below before running

echo "🚀 Deploying Festival Chat Changes"
echo "=================================="
echo ""

# ⚠️ EDIT THIS SECTION BEFORE EACH DEPLOYMENT ⚠️
# ================================================

COMMIT_TITLE="✨ Priority 2: Streamlined Join Room Section"

COMMIT_DESCRIPTION="🎯 **PRIORITY 2 COMPLETE: Enhanced Join Room Experience**

Implemented horizontal Recent Rooms above Room Code input with Clear button, focusing only on Room CODES for joining (Room ID becomes display name only).

🎉 **What's New:**
✅ Recent Rooms moved above Room Code input as horizontal scrolling cards
✅ Clear button with confirmation dialog next to \"Recent Rooms\" title
✅ Enhanced 7-day retention for 8 recent rooms (was 24h for 5 rooms)
✅ Room ID displayed above Room Code in cards for easy identification
✅ Improved mobile-friendly card design with hidden scrollbars
✅ Updated Room Code vs Room ID terminology throughout UI

📱 **User Experience Improvements:**
✅ Horizontal scrolling optimized for mobile touch
✅ Smart timestamps (Just now, 2m ago, 3h ago, 2d ago)
✅ Enhanced Room Code Display with ticket emoji 🎫
✅ \"Primary Join Method\" indicator for clarity
✅ Removed Room ID join option - Room Codes are now the only join method

🗂️ **Files Modified:**
- src/components/RoomCode.tsx (complete restructure with horizontal layout)
- src/utils/room-codes.ts (added clear functionality & formatTimeAgo helper)
- src/app/globals.css (added horizontal scrollbar hiding CSS)
- src/app/page.tsx (removed Room ID join section, updated terminology)
- documentation/PRIORITY-2-COMPLETE.md (complete implementation docs)

🔧 **Technical Enhancements:**
✅ Added RoomCodeManager.clearRecentRooms() method
✅ Added RoomCodeManager.formatTimeAgo() helper
✅ Enhanced getRecentRoomCodes() with better retention logic
✅ Cross-browser scrollbar hiding with .scrollbar-hide CSS class
✅ Force re-render mechanism for clearing recent rooms

🎪 **Festival-Ready Features:**
✅ Recent rooms persist for 7 days (perfect for multi-day festivals)
✅ Horizontal cards show Room ID for quick identification
✅ Room Codes remain the prominent clickable element
✅ Clean, intuitive interface for quick reconnections
✅ All existing functionality preserved (WebSocket, QR codes, cross-device)

🚀 **Ready for Priority 3: Push Notifications**
Streamlined join experience complete - festival chat is even more user-friendly!"

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
            echo "🧪 Test the Priority 2 changes once deployed:"
            echo "• Visit: https://peddlenet.app"
            echo "• Test Join Room section with horizontal Recent Rooms"
            echo "• Verify Clear button functionality"
            echo "• Check Room Code vs Room ID display"
            echo "• Test mobile horizontal scrolling"
            echo ""
            echo "🎪 Priority 2 deployment complete - ready for Priority 3!"
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
