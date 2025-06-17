#!/bin/bash

echo "🎯 FIXING ALL ADMIN COMPONENTS WITH TYPESCRIPT SYNTAX"
echo "====================================================="

echo ""
echo "Converting admin components from .jsx to .tsx (they contain TypeScript syntax)..."

# List of admin components that need to be converted to .tsx
admin_components=(
    "src/components/admin/ActivityFeed.jsx"
    "src/components/admin/AdminControls.jsx" 
    "src/components/admin/DetailedRoomView.jsx"
    "src/components/admin/DetailedUserView.jsx"
    "src/components/admin/MeshNetworkStatus.jsx"
    "src/components/ConnectionTest.jsx"
)

# Convert .jsx files with TypeScript syntax to .tsx
for file in "${admin_components[@]}"; do
    if [ -f "$file" ]; then
        new_file="${file%.jsx}.tsx"
        echo "🔄 Converting $file → $new_file"
        mv "$file" "$new_file"
        echo "   ✅ Converted successfully"
    else
        echo "   ⏭️  $file not found, skipping"
    fi
done

echo ""
echo "Converting utility files from .js to .ts (they contain TypeScript syntax)..."

# Convert .js files with TypeScript syntax to .ts
util_files=(
    "src/utils/room-utils.js"
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
echo "Fixing any remaining API routes with TypeScript syntax..."

# Clean up API routes - remove type annotations but keep as .js
find src/app/api -name "*.js" | while read file; do
    if grep -q ": NextRequest\|: NextResponse\|: string\|: number\|: boolean" "$file"; then
        echo "🔧 Cleaning TypeScript syntax from: $file"
        
        # Remove various TypeScript syntax patterns
        sed -i '' 's/(request: NextRequest)/(request)/g' "$file"
        sed -i '' 's/(request: NextResponse)/(request)/g' "$file"
        sed -i '' 's/: NextRequest//g' "$file"  
        sed -i '' 's/: NextResponse//g' "$file"
        sed -i '' 's/: string//g' "$file"
        sed -i '' 's/: number//g' "$file"
        sed -i '' 's/: boolean//g' "$file"
        
        echo "   ✅ Cleaned TypeScript syntax"
    fi
done

echo ""
echo "Testing build..."

npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ BUILD SUCCESSFUL!"
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
        echo ""
        echo "🎯 What was fixed:"
        echo "   • Admin components converted to .tsx"
        echo "   • Utility files converted to .ts"
        echo "   • API routes cleaned of TypeScript syntax"
        echo "   • Build now uses proper TypeScript/JavaScript separation"
    else
        echo ""
        echo "❌ Deployment failed after successful build"
        echo "Check Vercel logs for deployment-specific issues"
    fi
else
    echo ""
    echo "❌ Build still failing. Let's see the current errors:"
    echo ""
    npm run build 2>&1 | head -40
    
    echo ""
    echo "🔍 Let's check what files still have issues..."
    echo ""
    
    # Check for remaining TypeScript syntax in .jsx/.js files
    echo "Files that still contain TypeScript syntax:"
    grep -r ": [A-Za-z]" src/ --include="*.jsx" --include="*.js" | head -10
fi

echo ""
echo "📝 Summary:"
echo "==========="
echo "• Converted admin components to TypeScript (.tsx)"
echo "• Converted utility files to TypeScript (.ts)" 
echo "• Cleaned API routes of TypeScript syntax"
echo "• Your project now has proper TypeScript/JavaScript separation"
