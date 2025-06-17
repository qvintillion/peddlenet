#!/bin/bash

echo "🚨 DEFINITIVE VERCEL TYPESCRIPT FIX"
echo "==================================="

echo ""
echo "Vercel keeps missing TypeScript deps even though they're in package.json."
echo "Let's force the exact dependencies Vercel needs..."

echo ""
echo "Step 1: Completely reinstalling TypeScript dependencies..."

# Remove all TypeScript related packages completely
npm uninstall typescript @types/react @types/react-dom @types/node

# Clear npm cache to ensure clean slate
npm cache clean --force

# Install the exact versions Vercel expects
npm install --save-dev typescript@^5.0.0 @types/react@^18.0.0 @types/react-dom@^18.0.0 @types/node@^20.0.0

echo "✅ Reinstalled TypeScript dependencies with compatible versions"

echo ""
echo "Step 2: Updating package.json with exact dependency versions..."

# Ensure the package.json has the exact dependencies Vercel needs
node << 'EOF'
const fs = require('fs');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Ensure TypeScript dependencies are in devDependencies with compatible versions
packageJson.devDependencies = packageJson.devDependencies || {};
packageJson.devDependencies['typescript'] = '^5.0.0';
packageJson.devDependencies['@types/react'] = '^18.0.0';
packageJson.devDependencies['@types/react-dom'] = '^18.0.0';
packageJson.devDependencies['@types/node'] = '^20.0.0';

// Remove any TypeScript deps from regular dependencies if they exist
if (packageJson.dependencies) {
  delete packageJson.dependencies['typescript'];
  delete packageJson.dependencies['@types/react'];
  delete packageJson.dependencies['@types/react-dom'];
  delete packageJson.dependencies['@types/node'];
}

fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
console.log('✅ Updated package.json with exact TypeScript dependencies');
EOF

echo ""
echo "Step 3: Creating a .vercelignore to ensure clean builds..."

cat > .vercelignore << 'EOF'
node_modules
.next
.git
*.log
.DS_Store
EOF

echo "✅ Created .vercelignore"

echo ""
echo "Step 4: Creating vercel.json with build configuration..."

cat > vercel.json << 'EOF'
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "functions": {
    "app/api/**/*.js": {
      "runtime": "nodejs18.x"
    }
  }
}
EOF

echo "✅ Created vercel.json with explicit build configuration"

echo ""
echo "Step 5: Testing local build..."

npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 LOCAL BUILD SUCCESSFUL!"
    echo "========================="
    echo ""
    echo "Step 6: Deploying to Vercel with explicit configuration..."
    
    # Deploy with explicit TypeScript support
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
        echo "🎯 What finally worked:"
        echo "   • Forced exact TypeScript dependency versions"
        echo "   • Cleaned npm cache completely"
        echo "   • Added explicit Vercel configuration"
        echo "   • Ensured dependencies are in correct sections"
        echo ""
        echo "🎪🎊 FESTIVAL CHAT IS FINALLY LIVE! 🎊🎪"
        echo ""
        echo "After that epic battle with TypeScript dependencies,"
        echo "your P2P WebRTC festival chat is now deployed!"
        echo ""
        echo "🚀 MISSION ACCOMPLISHED! 🚀"
    else
        echo ""
        echo "❌ Still failing on Vercel - let's try manual deployment"
        echo ""
        echo "Try these manual steps:"
        echo "1. vercel login"
        echo "2. vercel --prod"
        echo ""
        echo "Or check Vercel dashboard for specific error details."
    fi
else
    echo ""
    echo "❌ Local build failed after dependency changes:"
    npm run build 2>&1 | head -30
fi

echo ""
echo "📊 DEFINITIVE TYPESCRIPT FIX SUMMARY"
echo "===================================="
echo "• Completely reinstalled TypeScript dependencies"
echo "• Used exact versions compatible with Vercel"
echo "• Cleaned npm cache for fresh start"
echo "• Added explicit Vercel build configuration"
echo "• Ensured proper dependency placement"
echo ""
echo "This should resolve Vercel's TypeScript detection issues! 🎯"
