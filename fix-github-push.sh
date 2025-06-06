#!/bin/bash

echo "🔐 Fixing GitHub Push Issue"
echo "=========================="
echo ""

cd "/Users/qvint/Documents/Design/Design Stuff/Side Projects/Peddler Network App/festival-chat"

echo "🔍 Testing SSH connection to GitHub..."
ssh -T git@github.com -o BatchMode=yes -o ConnectTimeout=5

if [ $? -eq 0 ]; then
    echo "✅ SSH authentication working!"
    echo "🚀 Attempting to push..."
    git push origin main
else
    echo "❌ SSH authentication failed"
    echo "🔄 Switching to HTTPS authentication..."
    
    # Switch to HTTPS
    git remote set-url origin https://github.com/qvintillion/peddlenet.git
    
    echo "📡 Attempting HTTPS push..."
    git push origin main
    
    if [ $? -eq 0 ]; then
        echo "✅ HTTPS push successful!"
        echo ""
        echo "📋 Repository now uses HTTPS authentication"
        echo "🔗 Remote URL: $(git remote get-url origin)"
    else
        echo "❌ HTTPS push also failed"
        echo ""
        echo "🔍 Possible issues:"
        echo "• GitHub authentication token needed"
        echo "• Repository permissions"
        echo "• Network connectivity"
        echo ""
        echo "💡 Try manual authentication:"
        echo "   git push origin main"
        echo "   (GitHub will prompt for username/token)"
    fi
fi

echo ""
echo "🎯 After successful push:"
echo "• Check Vercel dashboard for auto-deployment"
echo "• Verify build starts automatically"
echo "• Test live deployment"
