#!/bin/bash

# 🚀 Quick Deploy to GitHub
# Run this from the festival-chat directory

echo "🎵 PeddleNet - Quick Deploy to GitHub"
echo "====================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Run this script from the festival-chat project root"
    exit 1
fi

# Check if it's a git repository
if [ ! -d ".git" ]; then
    echo "📁 Initializing Git repository..."
    git init
    git branch -M main
    echo ""
    echo "⚠️  Don't forget to:"
    echo "   1. Create repository on GitHub"
    echo "   2. Add remote: git remote add origin https://github.com/YOUR_USERNAME/peddlenet.git"
    echo ""
fi

# Show current status
echo "📋 Current status:"
git status --short

echo ""
echo "📦 Files ready for deployment:"
echo "✅ Clean UI with simplified status indicators"
echo "✅ Mobile debug panel with better contrast" 
echo "✅ Production-ready Next.js configuration"
echo "✅ Vercel deployment configuration"
echo "✅ Comprehensive documentation"
echo ""

# Add all files
echo "➕ Staging all files..."
git add .

# Create commit
echo "📝 Creating deployment commit..."
git commit -m "🧹 UI Cleanup & Production Ready - Festival Chat App

✨ Key Improvements:
- Clean status indicators with green '1 online' tags  
- Network info moved to dropdown (ℹ️ button)
- Removed manual connect/refresh buttons
- Enhanced mobile debug panel contrast
- Focused interface for festival use

🚀 Ready for Production:
- Next.js 15 + React 19
- WebRTC P2P architecture  
- Mobile-optimized experience
- Cross-platform messaging
- QR code instant connections

🎪 Perfect for festivals and events!"

if [ $? -eq 0 ]; then
    echo "✅ Commit created successfully!"
    echo ""
    echo "🚀 Ready to push to GitHub!"
    echo ""
    
    # Check if remote exists
    git remote -v
    
    if git remote get-url origin >/dev/null 2>&1; then
        echo "📡 GitHub remote configured"
        echo ""
        read -p "Push to GitHub now? (y/n): " push_confirm
        
        if [[ $push_confirm =~ ^[Yy]$ ]]; then
            echo ""
            echo "🌍 Pushing to GitHub..."
            git push origin main
            
            if [ $? -eq 0 ]; then
                echo ""
                echo "🎉 Successfully deployed to GitHub!"
                echo ""
                echo "📋 Next Steps:"
                echo "1. ✅ Code deployed to GitHub"
                echo "2. 🔗 Connect repository to Vercel"
                echo "3. ⚡ Vercel auto-deploys on push"
                echo "4. 🧪 Test live deployment"
                echo ""
                echo "🎯 Your festival chat app will be live!"
            else
                echo "❌ Push failed. Check your GitHub permissions."
            fi
        else
            echo ""
            echo "⏸️  Ready to push when you are:"
            echo "   git push origin main"
        fi
    else
        echo "⚠️  No GitHub remote configured yet."
        echo ""
        echo "🔗 To connect to GitHub:"
        echo "   1. Create repository on GitHub"
        echo "   2. Run: git remote add origin https://github.com/YOUR_USERNAME/peddlenet.git"
        echo "   3. Run: git push -u origin main"
    fi
else
    echo "❌ Commit failed! Check git status."
fi

echo ""
echo "📚 For detailed deployment info, see:"
echo "• DEPLOY-CHECKLIST.md"
echo "• DEPLOYMENT.md"
