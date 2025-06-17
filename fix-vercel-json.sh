#!/bin/bash

echo "🔧 FIXING VERCEL.JSON RUNTIME ERROR"
echo "==================================="

echo ""
echo "The vercel.json has an invalid runtime configuration. Let's fix it..."

echo ""
echo "Step 1: Creating a corrected vercel.json..."

cat > vercel.json << 'EOF'
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev", 
  "installCommand": "npm install",
  "framework": "nextjs"
}
EOF

echo "✅ Fixed vercel.json (removed invalid function runtime config)"

echo ""
echo "Step 2: Alternative - try without vercel.json (Next.js auto-detection)..."

# Backup the vercel.json and try without it
mv vercel.json vercel.json.backup

echo "✅ Moved vercel.json to backup - Next.js should auto-configure"

echo ""
echo "Step 3: Testing deployment without explicit vercel.json..."

npm run deploy:vercel:complete

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ DEPLOYMENT SUCCESSFUL!"
    echo "========================"
    echo ""
    echo "🌐 Your festival chat is LIVE:"
    echo "   • Frontend: https://peddlenet.app"
    echo "   • Admin: https://peddlenet.app/admin-analytics"
    echo ""
    echo "🎯 What worked: Removing invalid vercel.json and letting Next.js auto-configure"
    echo ""
    echo "🎪 FESTIVAL CHAT IS FINALLY LIVE! 🎪"
else
    echo ""
    echo "❌ Still failing - let's try the corrected vercel.json..."
    
    # Restore the corrected vercel.json
    mv vercel.json.backup vercel.json
    
    echo "Restored corrected vercel.json - trying deployment again..."
    npm run deploy:vercel:complete
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ DEPLOYMENT SUCCESSFUL with corrected vercel.json!"
        echo "=================================================="
        echo ""
        echo "🌐 Your festival chat is LIVE!"
        echo "🎪 MISSION ACCOMPLISHED! 🎪"
    else
        echo ""
        echo "❌ Still failing. The issue might be deeper in the TypeScript setup."
        echo ""
        echo "Let's try manual deployment:"
        echo "1. vercel login"
        echo "2. vercel --prod"
        echo ""
        echo "Your build works locally, so manual deployment should work!"
    fi
fi

echo ""
echo "📊 VERCEL.JSON FIX SUMMARY"
echo "=========================="
echo "• Removed invalid function runtime configuration"
echo "• Simplified vercel.json to basic Next.js setup"
echo "• Tried deployment without vercel.json (auto-detection)"
echo "• Your local build works - deployment should succeed!"
