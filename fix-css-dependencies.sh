#!/bin/bash

echo "🔧 FIXING MISSING AUTOPREFIXER DEPENDENCY"
echo "========================================="

echo ""
echo "The build is now working! Just missing autoprefixer for CSS processing..."

echo ""
echo "Step 1: Installing missing CSS dependencies..."

# Install the missing autoprefixer and postcss dependencies
npm install --save-dev autoprefixer postcss

echo "✅ Installed autoprefixer and postcss"

echo ""
echo "Step 2: Checking if postcss.config.js exists and is correct..."

if [ ! -f "postcss.config.js" ]; then
    echo "Creating postcss.config.js..."
    cat > postcss.config.js << 'EOF'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF
    echo "✅ Created postcss.config.js"
else
    echo "✅ postcss.config.js already exists"
fi

echo ""
echo "Step 3: Ensuring all Tailwind CSS dependencies are present..."

# Check if we need to install tailwindcss
if ! npm list tailwindcss > /dev/null 2>&1; then
    echo "Installing tailwindcss..."
    npm install --save-dev tailwindcss
    echo "✅ Installed tailwindcss"
else
    echo "✅ tailwindcss already installed"
fi

echo ""
echo "Step 4: Testing build with CSS dependencies..."

npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 BUILD SUCCESSFUL!"
    echo "==================="
    echo ""
    echo "🚀 Deploying to Vercel with fixed configuration..."
    npm run deploy:vercel:complete
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ DEPLOYMENT FINALLY SUCCESSFUL!"
        echo "================================="
        echo ""
        echo "🌐 Your festival chat is LIVE:"
        echo "   • Frontend: https://peddlenet.app"
        echo "   • Admin: https://peddlenet.app/admin-analytics"
        echo "   • API Health: https://peddlenet.app/api/health"
        echo ""
        echo "🎯 What was the final fix:"
        echo "   • Working TypeScript configuration restored ✅"
        echo "   • Missing autoprefixer dependency added ✅"
        echo "   • Proper CSS processing pipeline restored ✅"
        echo "   • All your improvements preserved ✅"
        echo ""
        echo "🎪🎊 FESTIVAL CHAT IS FINALLY LIVE! 🎊🎪"
        echo ""
        echo "After that epic battle with TypeScript and dependencies,"
        echo "your P2P WebRTC festival chat is now deployed with"
        echo "all your latest optimizations and improvements!"
        echo ""
        echo "🚀 MISSION ACCOMPLISHED! 🚀"
    else
        echo ""
        echo "❌ Build succeeded but deployment failed"
        echo "Check Vercel dashboard for deployment-specific issues"
    fi
else
    echo ""
    echo "❌ Build still failing. Let's see the error:"
    npm run build 2>&1 | head -40
    
    echo ""
    echo "If still failing, let's check package.json for CSS dependencies:"
    echo "Current devDependencies:"
    node -e "const pkg = require('./package.json'); console.log(Object.keys(pkg.devDependencies || {}).filter(dep => dep.includes('css') || dep.includes('post') || dep.includes('auto')).join(', '))"
fi

echo ""
echo "📊 CSS DEPENDENCY FIX SUMMARY"
echo "============================="
echo "• Added missing autoprefixer dependency"
echo "• Added postcss dependency"
echo "• Ensured tailwindcss is properly installed"
echo "• Created/verified postcss.config.js"
echo ""
echo "This should resolve the CSS processing error! 🎯"
