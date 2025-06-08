#!/bin/bash

# 🚀 Festival Chat Deployment Script
# ===================================
# Edit the commit message and description below before running

echo "🚀 Deploying Festival Chat Changes"
echo "=================================="
echo ""

# ⚠️ EDIT THIS SECTION BEFORE EACH DEPLOYMENT ⚠️
# ================================================

COMMIT_TITLE="🎨 UI Sync: Dev/Staging/Production Alignment"

COMMIT_DESCRIPTION="🎯 **UI SYNCHRONIZATION COMPLETE: Professional Interface Across All Environments**

Fixed UI inconsistencies to ensure identical, professional experience across dev, staging, and production environments.

🧹 **Cleaned Up Development-Only Elements:**
✅ Removed \"ME\" tag from message timestamps (cleaner UI)
✅ Eliminated localhost warnings from QR Modal in staging/production
✅ Debug panel properly restricted to development only
✅ Enhanced QR Modal IP detection for staging environments

🎨 **UI Consistency Improvements:**
✅ Clean message timestamps across all environments
✅ Professional QR Modal without unnecessary warnings
✅ Environment-aware IP detection and display
✅ Staging shows same clean interface as production

🔧 **Technical Enhancements:**
- Enhanced QR Modal IP detection logic for staging/production
- Better hostname-based environment detection
- Improved autoDetectedIP state management
- Added defensive checks for localhost/127.0.0.1
- Environment-specific button visibility (Change button only in dev)

📱 **Cross-Environment Experience:**
✅ **Development**: Clean UI + debug panel + full IP detection options
✅ **Staging**: Professional clean interface + mobile-accessible QR codes
✅ **Production**: Identical to staging (clean, professional experience)

🗂️ **Files Modified:**
- src/app/chat/[roomId]/page.tsx (removed ME tags, kept debug panel in dev only)
- src/components/QRModal.tsx (enhanced IP detection, removed localhost warnings)
- documentation/UI-SYNC-COMPLETE.md (complete implementation documentation)

🎪 **Result**: Perfect UI synchronization across all environments - festival chat now provides a consistent, professional experience whether users access via peddlenet.app (production) or staging, while maintaining full debugging capabilities in development."

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
            echo "🧪 Test the UI sync changes once deployed:"
            echo "• Visit: https://peddlenet.app"
            echo "• Test QR Modal (should be clean, no localhost warnings)"
            echo "• Check message timestamps (no ME tags)"
            echo "• Verify professional appearance matches staging"
            echo "• Test mobile QR code scanning"
            echo ""
            echo "🎪 UI synchronization deployment complete!"
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
