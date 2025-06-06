#!/bin/bash

echo "🔄 Syncing Local Repository with GitHub"
echo "======================================"
echo ""

cd "/Users/qvint/Documents/Design/Design Stuff/Side Projects/Peddler Network App/festival-chat"

echo "📋 Current local status:"
git status --short

echo ""
echo "📡 Fetching latest changes from GitHub..."
git fetch origin

echo ""
echo "🔍 Checking differences with remote:"
git log --oneline main..origin/main

echo ""
echo "📥 Pulling remote changes..."
git pull origin main --no-rebase

if [ $? -eq 0 ]; then
    echo "✅ Successfully synced with remote!"
    echo ""
    echo "🚀 Now pushing local changes..."
    git push origin main
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "🎉 Successfully pushed to GitHub!"
        echo ""
        echo "📋 Next Steps:"
        echo "1. ✅ Repository synced and pushed"
        echo "2. ⏳ Check Vercel dashboard for auto-deployment"
        echo "3. 🔗 Visit https://vercel.com/dashboard"
        echo "4. 🧪 Test live deployment when ready"
        echo ""
        echo "🎯 Auto-deployment should trigger within 1-2 minutes"
    else
        echo "❌ Push failed after sync. Check output above."
    fi
else
    echo "❌ Pull failed - likely merge conflicts"
    echo ""
    echo "🔧 Manual resolution needed:"
    echo "1. Check 'git status' for conflicted files"
    echo "2. Edit files to resolve conflicts"
    echo "3. Run 'git add .' then 'git commit'"
    echo "4. Run 'git push origin main'"
    echo ""
    echo "📋 Current status:"
    git status
fi
