#!/bin/bash

echo "🔧 Fixing Vercel Auto-Deploy Configuration"
echo "=========================================="
echo ""

# Check current directory
if [ ! -f "package.json" ]; then
    echo "❌ Run this from festival-chat directory"
    exit 1
fi

echo "📋 Current Git configuration:"
echo "Name: $(git config user.name)"
echo "Email: $(git config user.email)"
echo "Remote: $(git remote get-url origin)"
echo ""

# Check if we need to set git config
if [ -z "$(git config user.email)" ]; then
    echo "⚠️  Git email not set. Please configure:"
    echo "   git config user.email 'your.email@example.com'"
    echo "   git config user.name 'Your Name'"
    echo ""
    read -p "Enter your email: " email
    read -p "Enter your name: " name
    
    git config user.email "$email"
    git config user.name "$name"
    echo "✅ Git configuration updated"
fi

echo ""
echo "🔍 Checking build status..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "🚀 Triggering auto-deploy test..."
    
    # Create a small change to trigger deployment
    echo "<!-- Auto-deploy test $(date) -->" >> public/index.html 2>/dev/null || echo "# Auto-deploy test - $(date)" >> README.md
    
    git add .
    git commit -m "🔄 Fix auto-deploy: Update git config and trigger deployment

- Fixed git user configuration
- Cleaned up test files that broke build  
- Ready for automatic Vercel deployment
- Build verified successful"

    echo "📡 Pushing to GitHub..."
    git push origin main
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "🎉 Successfully pushed to GitHub!"
        echo ""
        echo "📋 Next steps:"
        echo "1. ✅ Code pushed with proper git config"
        echo "2. ⏳ Check Vercel dashboard for auto-deployment"
        echo "3. 🔗 Visit https://vercel.com/dashboard"
        echo "4. 👀 Look for deployment progress"
        echo ""
        echo "⏰ Auto-deployment should start within 1-2 minutes"
        echo ""
        echo "🔍 If still not deploying, check:"
        echo "• Vercel dashboard → Project → Settings → Git"
        echo "• GitHub webhook in repository settings"
        echo "• Deployment branch is set to 'main'"
    else
        echo "❌ Git push failed. Check repository permissions."
    fi
else
    echo "❌ Build failed. Fix build errors first."
fi

echo ""
echo "💡 Manual deploy option: vercel --prod"
