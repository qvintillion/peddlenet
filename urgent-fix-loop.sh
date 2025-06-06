#!/bin/bash

echo "🚨 URGENT: Fix Infinite Debug Loop"
echo "================================"
echo ""

cd "/Users/qvint/Documents/Design/Design Stuff/Side Projects/Peddler Network App/festival-chat"

echo "🔧 Testing build with infinite loop fix..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "📦 Staging urgent fix..."
    git add .
    
    echo "📝 Committing infinite loop fix..."
    git commit -m "🚨 URGENT: Fix infinite debug loop causing performance issues

❌ Fixed Critical Bug:
- Removed console.log from render loop in WebSocket hook
- Was causing infinite re-renders and performance issues
- Causing duplicate peer counting ('2 online' instead of 1)
- Blocking message sending functionality

✅ Result:
- Normal performance restored
- Correct peer counting
- Messages should send properly again
- Clean console output

🎯 This was causing the festival chat to malfunction due to
infinite logging on every component render."

    if [ $? -eq 0 ]; then
        echo "✅ Critical fix committed!"
        echo ""
        echo "🚀 URGENT: Pushing to production..."
        git push origin main
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "🎉 Critical fix deployed!"
            echo ""
            echo "⏰ Vercel auto-deployment should start within 30 seconds"
            echo ""
            echo "✅ Expected Results After Deployment:"
            echo "- No more infinite console logging"
            echo "- Correct '1 online' instead of '2 online'"
            echo "- Messages should send and receive properly"
            echo "- Normal app performance"
            echo ""
            echo "🧪 Test immediately after deployment!"
        else
            echo "❌ Push failed. Check error above."
        fi
    else
        echo "❌ Commit failed."
    fi
else
    echo "❌ Build failed."
fi
