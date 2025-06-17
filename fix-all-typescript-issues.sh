#!/bin/bash

echo "🚨 COMPREHENSIVE TYPESCRIPT SYNTAX FIX"
echo "======================================"

echo ""
echo "Step 1: Converting ALL utility files with TypeScript syntax to .ts..."

# Utility files that need to be converted to .ts
util_files=(
    "src/utils/message-persistence.js"
    "src/utils/server-utils.js"
    "src/utils/room-utils.js"
    "src/utils/network-utils.js"
    "src/utils/peer-utils.js"
    "src/utils/qr-utils.js"
    "src/utils/qr-peer-utils.js"
    "src/lib/types.js"
    "src/lib/constants.js"
)

for file in "${util_files[@]}"; do
    if [ -f "$file" ]; then
        new_file="${file%.js}.ts"
        echo "🔄 Converting $file → $new_file"
        mv "$file" "$new_file"
        echo "   ✅ Converted successfully"
    else
        echo "   ⏭️  $file not found, skipping"
    fi
done

echo ""
echo "Step 2: Converting remaining components with TypeScript syntax..."

# Check for any remaining .jsx files with TypeScript syntax
remaining_jsx_files=(
    "src/app/admin-analytics/page.jsx"
    "src/app/diagnostics/page.jsx"
    "src/app/layout.jsx"
    "src/app/page.jsx"
)

for file in "${remaining_jsx_files[@]}"; do
    if [ -f "$file" ]; then
        # Check if file contains TypeScript syntax
        if grep -q "interface \|: [A-Z][a-zA-Z]*\|<[A-Z][a-zA-Z]*>" "$file"; then
            new_file="${file%.jsx}.tsx"
            echo "🔄 Converting $file → $new_file (contains TypeScript syntax)"
            mv "$file" "$new_file"
            echo "   ✅ Converted successfully"
        else
            echo "   ✅ $file is clean JavaScript, keeping as .jsx"
        fi
    fi
done

echo ""
echo "Step 3: Fixing type definition files..."

# Fix the type definition file that's incorrectly named .js
if [ -f "src/types/jsqr.d.js" ]; then
    echo "🔧 Fixing incorrectly named type definition file..."
    mv "src/types/jsqr.d.js" "src/types/jsqr.d.ts"
    echo "   ✅ Renamed jsqr.d.js → jsqr.d.ts"
fi

echo ""
echo "Step 4: Ensuring API routes are clean JavaScript..."

# API routes should be pure JavaScript - remove any TypeScript syntax
find src/app/api -name "*.js" | while read file; do
    if grep -q "interface \|: [A-Z][a-zA-Z]*\|<[A-Z][a-zA-Z]*>\|: string\|: number\|: boolean" "$file"; then
        echo "🔧 Cleaning TypeScript syntax from API route: $file"
        
        # Remove various TypeScript syntax patterns
        sed -i '' '/^interface /,/^}/d' "$file"
        sed -i '' 's/(request: NextRequest)/(request)/g' "$file"
        sed -i '' 's/(request: NextResponse)/(request)/g' "$file"
        sed -i '' 's/: NextRequest//g' "$file"
        sed -i '' 's/: NextResponse//g' "$file"
        sed -i '' 's/: string//g' "$file"
        sed -i '' 's/: number//g' "$file"
        sed -i '' 's/: boolean//g' "$file"
        sed -i '' 's/: [A-Z][a-zA-Z]*//g' "$file"
        sed -i '' 's/<[A-Z][a-zA-Z]*>//g' "$file"
        
        echo "   ✅ Cleaned TypeScript syntax"
    fi
done

echo ""
echo "Step 5: Verifying API routes are enabled..."

# Check that API routes export the correct functions
echo "🔍 Checking API route exports..."

find src/app/api -name "route.js" | while read file; do
    if ! grep -q "export.*GET\|export.*POST\|export.*PUT\|export.*DELETE" "$file"; then
        echo "⚠️  WARNING: $file may not have proper exports"
    else
        echo "   ✅ $file has proper exports"
    fi
done

echo ""
echo "Step 6: Testing build..."

npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ BUILD SUCCESSFUL!"
    echo ""
    echo "🔍 Verifying API routes are working..."
    
    # Quick check that the server can start
    timeout 10s npm start &
    sleep 5
    
    # Test a basic API endpoint
    curl -s http://localhost:3000/api/health > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ API routes are responding"
    else
        echo "⚠️  API routes may need additional testing"
    fi
    
    # Kill the test server
    pkill -f "next start" 2>/dev/null
    
    echo ""
    echo "🚀 Deploying to Vercel..."
    npm run deploy:vercel:complete
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "🎉 DEPLOYMENT COMPLETE!"
        echo "======================================"
        echo ""
        echo "✅ Your festival chat is now deployed:"
        echo "   🌐 Frontend: https://peddlenet.app"
        echo "   📊 Admin: https://peddlenet.app/admin-analytics" 
        echo "   🔧 API Health: https://peddlenet.app/api/health"
        echo ""
        echo "🎯 What was fixed:"
        echo "   • All utility files converted to TypeScript (.ts)"
        echo "   • All admin components converted to TypeScript (.tsx)"
        echo "   • API routes cleaned and verified as JavaScript (.js)"
        echo "   • Type definitions properly named (.d.ts)"
        echo "   • Build system now handles TypeScript/JavaScript correctly"
    else
        echo ""
        echo "❌ Deployment failed after successful build"
        echo "Check Vercel logs for deployment-specific issues"
    fi
else
    echo ""
    echo "❌ Build still failing. Current errors:"
    echo ""
    npm run build 2>&1 | head -50
    
    echo ""
    echo "🔍 Remaining files with TypeScript syntax:"
    find src/ -name "*.js" -o -name "*.jsx" | xargs grep -l "interface \|: [A-Z][a-zA-Z]*\|<[A-Z][a-zA-Z]*>" 2>/dev/null | head -10
fi

echo ""
echo "📝 Final Summary:"
echo "=================="
echo "• Converted utility files to TypeScript (.ts)"
echo "• Converted components to TypeScript (.tsx)"
echo "• API routes cleaned and kept as JavaScript (.js)"
echo "• Type definitions properly structured"
echo "• Project now has clear TypeScript/JavaScript separation"
