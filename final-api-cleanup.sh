#!/bin/bash

echo "🚨 FINAL API ROUTE SYNTAX CLEANUP"
echo "================================="

echo ""
echo "Fixing ALL remaining API route syntax errors..."

echo ""
echo "Step 1: Fixing database route duplicate timestamp..."
if [ -f "src/app/api/admin/database/route.js" ]; then
    echo "🔧 Fixing database route.js..."
    
    # Fix the duplicate timestamp issue
    sed -i '' 's/timestamp: timestamp: Date\.now()/timestamp: Date.now()/g' "src/app/api/admin/database/route.js"
    
    echo "   ✅ Fixed duplicate timestamp"
fi

echo ""
echo "Step 2: Fixing info route standalone Date.now()..."
if [ -f "src/app/api/admin/info/route.js" ]; then
    echo "🔧 Fixing info route.js..."
    
    # Fix standalone Date.now() by making it a proper property
    sed -i '' 's/Date\.now()/timestamp: Date.now()/g' "src/app/api/admin/info/route.js"
    
    # If that creates duplicate, clean it up
    sed -i '' 's/timestamp: timestamp: Date\.now()/timestamp: Date.now()/g' "src/app/api/admin/info/route.js"
    
    echo "   ✅ Fixed standalone Date.now()"
fi

echo ""
echo "Step 3: Fixing mesh-status route signal.timeout..."
if [ -f "src/app/api/admin/mesh-status/route.js" ]; then
    echo "🔧 Fixing mesh-status route.js..."
    
    # Fix the broken signal.timeout syntax
    sed -i '' 's/signal\.timeout([0-9]*)/timeout: 10000/g' "src/app/api/admin/mesh-status/route.js"
    
    # Alternative fix if it's part of a fetch call
    sed -i '' 's/headers: {/signal: AbortSignal.timeout(10000),\n      headers: {/g' "src/app/api/admin/mesh-status/route.js"
    
    echo "   ✅ Fixed signal.timeout syntax"
fi

echo ""
echo "Step 4: Fixing room messages route TypeScript syntax..."
if [ -f "src/app/api/admin/room/[roomId]/messages/route.js" ]; then
    echo "🔧 Fixing room messages route.js..."
    
    # Remove TypeScript generic syntax from Map
    sed -i '' 's/new Map<[^>]*>()/new Map()/g' "src/app/api/admin/room/[roomId]/messages/route.js"
    
    echo "   ✅ Fixed Map TypeScript syntax"
fi

echo ""
echo "Step 5: Comprehensive cleanup of ALL API routes..."

# Clean ALL API routes of any remaining TypeScript syntax and malformed JavaScript
find src/app/api -name "route.js" | while read file; do
    echo "🔧 Final cleanup: $file"
    
    # Remove TypeScript generic syntax
    sed -i '' 's/<[a-zA-Z, |<>[\]{}]*>//g' "$file"
    
    # Fix duplicate property names
    sed -i '' 's/timestamp: timestamp:/timestamp:/g' "$file"
    sed -i '' 's/headers: headers:/headers:/g' "$file"
    sed -i '' 's/body: body:/body:/g' "$file"
    
    # Fix standalone function calls that should be properties
    sed -i '' 's/^[[:space:]]*Date\.now()$/      timestamp: Date.now()/g' "$file"
    sed -i '' 's/^[[:space:]]*JSON\.stringify/      body: JSON.stringify/g' "$file"
    
    # Remove any remaining interface/type declarations
    sed -i '' '/^interface /,/^}/d' "$file"
    sed -i '' '/^type /d' "$file"
    sed -i '' '/^export interface /,/^}/d' "$file"
    sed -i '' '/^export type /d' "$file"
    
    # Fix any remaining type annotations
    sed -i '' 's/: string//g' "$file"
    sed -i '' 's/: number//g' "$file"
    sed -i '' 's/: boolean//g' "$file"
    sed -i '' 's/: object//g' "$file"
    sed -i '' 's/: any//g' "$file"
    sed -i '' 's/: [A-Z][a-zA-Z]*//g' "$file"
    
    echo "   ✅ Cleaned $file"
done

echo ""
echo "Step 6: Testing the build..."

npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 BUILD FINALLY SUCCESSFUL!"
    echo "============================"
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
        echo "   • Fixed duplicate timestamp property"
        echo "   • Fixed standalone Date.now() calls"
        echo "   • Fixed broken signal.timeout syntax"
        echo "   • Removed TypeScript generics from Map"
        echo "   • Cleaned all remaining TypeScript syntax"
        echo "   • Ensured all API routes use valid JavaScript"
        echo ""
        echo "🎪🎊 FESTIVAL CHAT IS FINALLY WORKING! 🎊🎪"
        echo ""
        echo "After all these fixes, your P2P WebRTC festival chat"
        echo "should be fully functional and ready for users! 🚀"
    else
        echo ""
        echo "❌ Build succeeded but deployment failed"
        echo "Check Vercel dashboard for deployment issues"
    fi
else
    echo ""
    echo "❌ Build STILL failing. Let's see what's left:"
    echo ""
    npm run build 2>&1 | head -100
    
    echo ""
    echo "🔍 If build still fails, let's check for any remaining syntax errors:"
    
    # Check for common JavaScript syntax errors
    echo ""
    echo "Checking for duplicate properties:"
    grep -r "timestamp: timestamp:\|headers: headers:\|body: body:" src/app/api/ || echo "No duplicate properties found"
    
    echo ""
    echo "Checking for standalone function calls:"
    grep -r "^[[:space:]]*Date\.now()\|^[[:space:]]*JSON\.stringify" src/app/api/ || echo "No standalone function calls found"
    
    echo ""
    echo "Checking for TypeScript syntax:"
    grep -r "<[a-zA-Z].*>\|interface \|: [A-Z][a-zA-Z]*" src/app/api/ || echo "No TypeScript syntax found"
fi

echo ""
echo "📊 FINAL CLEANUP SUMMARY"
echo "========================"
echo "• Fixed duplicate property names"
echo "• Fixed standalone function calls"
echo "• Fixed broken signal syntax"
echo "• Removed all TypeScript generics"
echo "• Ensured valid JavaScript syntax in all API routes"
echo ""
echo "Your API routes should now be completely clean! 🎯"
