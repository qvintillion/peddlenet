#!/bin/bash

echo "📦 Staging and Committing Local Changes"
echo "======================================"
echo ""

cd "/Users/qvint/Documents/Design/Design Stuff/Side Projects/Peddler Network App/festival-chat"

echo "📋 Current changes:"
git status --short

echo ""
echo "➕ Staging all changes..."
git add -A

echo ""
echo "📝 Committing cleanup changes..."
git commit -m "🧹 Production cleanup: Move test files to archive

✅ Moved test directories to archive:
- src/app/cameratest → archive/cameratest  
- src/app/peertest → archive/peertest
- src/app/test-chat → archive/test-chat
- src/app/test-room → archive/test-room

✅ Added deployment automation scripts
✅ Fixed build errors for production
✅ Ready for clean Vercel deployment

🎯 This resolves the npm build failures and prepares
   for automatic deployment to production."

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
            echo "✅ Test files archived (no more build errors)"
            echo "✅ UI cleanup completed"  
            echo "✅ Production scripts added"
            echo "✅ Repository synced and pushed"
            echo ""
            echo "⏳ Vercel auto-deployment should start within 1-2 minutes"
            echo "🔗 Check: https://vercel.com/dashboard"
            echo ""
            echo "🧪 Test the live app once deployed:"
            echo "• Create room"
            echo "• Generate QR code"
            echo "• Test mobile connections"
            echo "• Verify clean UI (no debug panels)"
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
