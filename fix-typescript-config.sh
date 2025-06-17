#!/bin/bash

echo "🔧 FIXING TYPESCRIPT CONFIGURATION CONFLICTS"
echo "============================================="

echo ""
echo "The issue appears to be duplicate TypeScript dependencies and config conflicts."

echo ""
echo "Step 1: Cleaning up package.json dependencies..."

# Remove TypeScript types from regular dependencies (they should only be in devDependencies)
npm uninstall @types/react @types/react-dom typescript

# Install them properly as devDependencies
npm install --save-dev @types/react @types/node @types/react-dom typescript

echo "✅ Cleaned up TypeScript dependencies"

echo ""
echo "Step 2: Checking for TypeScript configuration files..."

if [ -f "tsconfig.json" ]; then
    echo "📄 Found tsconfig.json - ensuring it's properly configured..."
    
    # Create a clean tsconfig.json for Next.js
    cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": false,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
EOF
    echo "✅ Updated tsconfig.json"
else
    echo "⚠️  No tsconfig.json found - this might be the issue!"
    echo "Creating a proper tsconfig.json for Next.js..."
    
    cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": false,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
EOF
    echo "✅ Created tsconfig.json"
fi

echo ""
echo "Step 3: Ensuring next-env.d.ts exists..."

if [ ! -f "next-env.d.ts" ]; then
    echo "Creating next-env.d.ts..."
    cat > next-env.d.ts << 'EOF'
/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/building-your-application/configuring/typescript for more information.
EOF
    echo "✅ Created next-env.d.ts"
fi

echo ""
echo "Step 4: Testing local build..."

npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 LOCAL BUILD SUCCESSFUL!"
    echo "========================="
    echo ""
    echo "🚀 Deploying to Vercel..."
    npm run deploy:vercel:complete
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ DEPLOYMENT COMPLETE!"
        echo "======================="
        echo ""
        echo "🌐 Your festival chat is FINALLY live:"
        echo "   • Frontend: https://peddlenet.app"
        echo "   • Admin: https://peddlenet.app/admin-analytics"
        echo "   • API Health: https://peddlenet.app/api/health"
        echo ""
        echo "🎯 Final fixes applied:"
        echo "   • Cleaned up duplicate TypeScript dependencies"
        echo "   • Created proper tsconfig.json for Next.js"
        echo "   • Added next-env.d.ts file"
        echo "   • Fixed TypeScript configuration conflicts"
        echo ""
        echo "🎪🎊 FESTIVAL CHAT IS FINALLY LIVE! 🎊🎪"
        echo ""
        echo "After that epic battle with TypeScript/JavaScript,"
        echo "your P2P WebRTC festival chat is now deployed!"
        echo ""
        echo "🚀 MISSION ACCOMPLISHED! 🚀"
    else
        echo ""
        echo "❌ Local build succeeded but Vercel deployment failed"
        echo "This might be a Vercel-specific configuration issue"
    fi
else
    echo ""
    echo "❌ Local build still failing:"
    npm run build 2>&1 | head -30
    
    echo ""
    echo "🔍 Let's check what TypeScript files are causing issues:"
    find src/ -name "*.ts" -o -name "*.tsx" | head -10
fi

echo ""
echo "📊 TYPESCRIPT CONFIGURATION FIX SUMMARY"
echo "========================================"
echo "• Cleaned up duplicate TypeScript dependencies"
echo "• Moved all @types/* to devDependencies only"
echo "• Created proper tsconfig.json for Next.js"
echo "• Added next-env.d.ts for TypeScript support"
echo ""
echo "This should resolve the TypeScript configuration conflicts! 🎯"
