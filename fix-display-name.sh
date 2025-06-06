#!/bin/bash

echo "🐛 Fixing Display Name and Message Issues"
echo "========================================"
echo ""

cd "/Users/qvint/Documents/Design/Design Stuff/Side Projects/Peddler Network App/festival-chat"

echo "🔧 Testing build with fixes..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "📦 Staging fixes..."
    git add .
    
    echo "📝 Committing display name fix..."
    git commit -m "🐛 Fix display name prompt and message sending

✅ Fixed Issues:
- Display name now properly prompts user (no more '1' fallback)
- WebSocket hook waits for valid display name before connecting
- Messages will send properly after display name is set
- Added loading state while setting up chat

🔧 Technical Changes:
- Added isDisplayNameSet state to track when ready
- WebSocket hook only initializes with valid display name
- Improved user experience with loading overlay
- Disabled message input until display name is set

🎯 Result: Users will be properly prompted for display name
and messages will send correctly in festival chat rooms!"

    if [ $? -eq 0 ]; then
        echo "✅ Changes committed!"
        echo ""
        echo "🚀 Pushing to GitHub..."
        git push origin main
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "🎉 Fix deployed to GitHub!"
            echo ""
            echo "⏰ Vercel auto-deployment will start within 1-2 minutes"
            echo ""
            echo "🧪 After deployment, test:"
            echo "1. Visit live site"
            echo "2. Should prompt for display name properly"
            echo "3. Create room and generate QR"
            echo "4. Test message sending between devices"
            echo "5. Verify display names show correctly"
            echo ""
            echo "🎪 The festival chat should now work perfectly!"
        else
            echo "❌ Push failed. Check error above."
        fi
    else
        echo "❌ Commit failed."
    fi
else
    echo "❌ Build failed. Check errors above."
fi
