#!/bin/zsh

echo "🔧 Making Vercel deployment script executable..."
chmod +x "/Users/qvint/Documents/Design/Design Stuff/Side Projects/Peddler Network App/festival-chat/deploy-vercel.sh"

if [ $? -eq 0 ]; then
    echo "✅ Script is now executable"
    echo ""
    echo "🚀 Ready to deploy to Vercel!"
    echo ""
    echo "To deploy, run:"
    echo "npm run deploy:vercel:complete"
    echo ""
    echo "Or manually:"
    echo "./deploy-vercel.sh"
else
    echo "❌ Failed to make script executable"
    exit 1
fi
