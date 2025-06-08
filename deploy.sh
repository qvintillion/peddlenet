#!/bin/bash

# 🚀 Festival Chat Deployment Script
# ===================================
# Edit the commit message and description below before running

echo "🚀 Deploying Festival Chat Changes"
echo "=================================="
echo ""

# ⚠️ EDIT THIS SECTION BEFORE EACH DEPLOYMENT ⚠️
# ================================================

COMMIT_TITLE="🔔 Priority 3: Push Notifications Complete"

COMMIT_DESCRIPTION="🎯 **PRIORITY 3 COMPLETE: Full Push Notification System**

Implemented comprehensive background notification system for Festival Chat, providing seamless communication even when users switch between apps during festivals.

🔔 **Core Push Notification Features:**
✅ Service Worker for background notification handling
✅ Smart notification triggering (only when app is backgrounded)
✅ Permission management with clear user interface
✅ Local notification system (no external push service required)
✅ Room context in notifications: \"New Message in [room-id]\"
✅ Granular notification settings (messages, joins, leaves)

📱 **User Experience Enhancements:**
✅ \"🔔 Alerts\" button in chat header for easy access
✅ Visual permission status with helpful instructions
✅ Test notification functionality for verification
✅ One-click enable/disable toggle with clear feedback
✅ Festival-optimized tips and battery-conscious design
✅ Multi-room support perfect for festival scenarios

🛠️ **Technical Implementation:**
- public/sw.js (Complete service worker with notification handling)
- src/hooks/use-push-notifications.ts (Full notification management logic)
- src/components/NotificationSettings.tsx (Comprehensive settings interface)
- Enhanced chat integration with automatic notification triggers

🎪 **Festival-Ready Features:**
✅ Background notifications work when switching between festival apps
✅ Clear room identification for multi-room scenarios (Main Stage, VIP, Food Court)
✅ Notification click jumps directly to specific room conversation
✅ Works even when phone is locked or app is minimized
✅ Smart detection prevents notifications when actively viewing chat
✅ Battery-conscious implementation (only notifies when needed)

🌍 **Cross-Platform Support:**
✅ Chrome/Edge: Full support with all features
✅ Firefox: Complete notification functionality
✅ Safari: iOS notification integration
✅ Mobile browsers: Background notification support
✅ Graceful fallbacks for unsupported browsers

🔧 **Files Added/Modified:**
- public/sw.js (NEW - Service worker for push notifications)
- src/hooks/use-push-notifications.ts (NEW - Complete notification logic)
- src/components/NotificationSettings.tsx (NEW - Settings interface)
- src/app/chat/[roomId]/page.tsx (Enhanced with notification integration)
- documentation/PRIORITY-3-COMPLETE.md (Complete implementation docs)

🎉 **Result**: Festival Chat now provides a complete real-time communication experience with intelligent background notifications. Users never miss important messages during festivals while maintaining battery efficiency and providing clear room context for multi-room scenarios.

🎪 Ready for Priority 4: Mesh Network Research!"

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
            echo "🧪 Test the Priority 3 push notifications once deployed:"
            echo "• Visit: https://peddlenet.app"
            echo "• Navigate to any chat room"
            echo "• Click '🔔 Alerts' button in chat header"
            echo "• Enable push notifications and test functionality"
            echo "• Test background notifications by backgrounding app"
            echo "• Verify room context appears in notification titles"
            echo "• Check notification click opens correct room"
            echo ""
            echo "🎪 Priority 3 deployment complete - Background notifications live!"
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
