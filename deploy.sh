#!/bin/bash

# 🚀 Festival Chat Deployment Script
# ===================================
# Edit the commit message and description below before running

echo "🚀 Deploying Festival Chat Changes"
echo "=================================="
echo ""

# ⚠️ EDIT THIS SECTION BEFORE EACH DEPLOYMENT ⚠️
# ================================================

COMMIT_TITLE="🔧 URGENT: Fix production server for chat messaging"

COMMIT_DESCRIPTION="🎯 **CRITICAL FIX**
Production messaging was broken - server missing chat-message handler!

🐛 **Root Cause Found**
Dev works perfectly, but production server (signaling-only/server.js) 
was running OLD version without chat-message support.

🛠️ **Production Server Updates**
✅ Added chat-message handler with persistent storage
✅ Added message history on room join
✅ Updated room structure: { peers: Map, messages: Array }
✅ Fixed disconnect cleanup for new room structure
✅ Fixed metrics/health endpoints for new structure
✅ Updated to v1.2.0 (indicates chat support)

📂 **Files Modified**
- signaling-only/server.js (production server with chat support)
- deploy.sh (updated commit message)

🎉 **Expected Results**
✅ Messages now display in production (same as dev)
✅ Cross-device messaging works in production
✅ Message persistence across room joins
✅ Solo messaging enabled in production
✅ Complete parity between dev and production

🧪 **Technical Details**
Production server at https://peddlenet-signaling-433318323150.us-central1.run.app
needs to be updated with this new server.js code to enable chat messaging.

🏠 Production festival chat ready after server deployment!"

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
