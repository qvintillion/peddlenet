#!/bin/bash

# 🚀 Deploy PeddleNet Production Signaling Server to GitHub

echo "🚀 Deploying PeddleNet Production Infrastructure to GitHub"
echo "========================================================"
echo ""

# Check if we're in the right directory
if [ ! -f "signaling-server.js" ]; then
    echo "❌ Error: Run this script from the festival-chat project root"
    exit 1
fi

# Make scripts executable
echo "🔧 Making deployment scripts executable..."
chmod +x scripts/*.sh
chmod +x make-executable.sh

# Check git status
echo ""
echo "📋 Current git status:"
git status --short

echo ""
echo "📁 New files added for production deployment:"
echo "• Production signaling servers (basic + Firebase enhanced)"
echo "• Complete Google Cloud deployment automation"
echo "• Multi-platform deployment configurations"  
echo "• Comprehensive documentation and guides"
echo "• Interactive deployment scripts"
echo ""

# Add all new files
echo "➕ Adding all deployment files to git..."
git add .

# Read the commit message
COMMIT_MESSAGE=$(cat COMMIT-MESSAGE.md)

# Create the commit
echo "📝 Creating comprehensive deployment commit..."
git commit -m "$COMMIT_MESSAGE"

# Show the commit info
echo ""
echo "✅ Commit created successfully!"
echo ""
echo "📊 Commit details:"
git show --stat HEAD

echo ""
echo "🚀 Ready to push to GitHub!"
echo ""
echo "Current signaling server URL:"
echo "https://peddlenet-signaling-padyxgyv5a-uc.a.run.app"
echo ""

read -p "Push to GitHub now? (y/n): " push_confirm

if [[ $push_confirm =~ ^[Yy]$ ]]; then
    echo ""
    echo "🌍 Pushing to GitHub..."
    git push origin main
    
    echo ""
    echo "🎉 Successfully deployed to GitHub!"
    echo ""
    echo "📋 Next Steps:"
    echo "1. ✅ Code deployed to GitHub"
    echo "2. ⏳ Add NEXT_PUBLIC_SIGNALING_SERVER to Vercel environment"
    echo "3. ⏳ Vercel will auto-deploy the updated code"
    echo "4. ✅ Test P2P connections at peddlenet.app"
    echo ""
    echo "🔗 Vercel Environment Variable:"
    echo "Key: NEXT_PUBLIC_SIGNALING_SERVER"
    echo "Value: https://peddlenet-signaling-padyxgyv5a-uc.a.run.app"
    echo ""
    echo "🎯 Result: 24/7 reliable signaling, no more 11pm timeouts! 🚀"
else
    echo ""
    echo "⏸️  Deployment paused. Run 'git push origin main' when ready."
fi

echo ""
echo "📚 For detailed documentation, see:"
echo "• deployment/GOOGLE-CLOUD-DEPLOYMENT.md"
echo "• DEPLOYMENT-SUMMARY.md"
echo "• deployment/COMPARISON.md"
