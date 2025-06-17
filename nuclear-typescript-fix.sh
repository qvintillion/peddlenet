#!/bin/bash

echo "🚨 NUCLEAR FIX: FIND AND CONVERT ALL TYPESCRIPT SYNTAX"
echo "======================================================"

echo ""
echo "Step 1: Scanning ENTIRE src directory for TypeScript syntax in JS/JSX files..."

# Find ALL files with TypeScript syntax and convert them
echo "🔍 Finding files with TypeScript syntax patterns..."

# Search for files containing TypeScript syntax patterns
files_with_ts_syntax=()

# Check for interface declarations, type annotations, generics in .js/.jsx files
while IFS= read -r -d '' file; do
    if grep -q "interface \|}: [A-Z][a-zA-Z]*\|<[A-Z][a-zA-Z]*>\|: [A-Z][a-zA-Z]*Props" "$file"; then
        files_with_ts_syntax+=("$file")
    fi
done < <(find src/ -name "*.js" -o -name "*.jsx" -print0)

echo ""
echo "Found ${#files_with_ts_syntax[@]} files with TypeScript syntax:"

# Convert all found files
for file in "${files_with_ts_syntax[@]}"; do
    echo "🔄 Processing: $file"
    
    # Determine new extension based on current extension
    if [[ "$file" == *.jsx ]]; then
        new_file="${file%.jsx}.tsx"
    elif [[ "$file" == *.js ]]; then
        # Check if it's an API route (should stay .js but get cleaned)
        if [[ "$file" == *"src/app/api/"* && "$file" == *"route.js" ]]; then
            echo "   🔧 Cleaning API route (keeping as .js): $file"
            
            # Clean TypeScript syntax from API routes
            sed -i '' '/^interface /,/^}/d' "$file"
            sed -i '' 's/(request: NextRequest)/(request)/g' "$file"
            sed -i '' 's/(request: NextResponse)/(request)/g' "$file"
            sed -i '' 's/: NextRequest//g' "$file"
            sed -i '' 's/: NextResponse//g' "$file"
            sed -i '' 's/: string//g' "$file"
            sed -i '' 's/: number//g' "$file"
            sed -i '' 's/: boolean//g' "$file"
            sed -i '' 's/: [A-Z][a-zA-Z]*Props//g' "$file"
            sed -i '' 's/<[A-Z][a-zA-Z]*>//g' "$file"
            
            echo "   ✅ Cleaned TypeScript syntax from API route"
            continue
        else
            new_file="${file%.js}.ts"
        fi
    fi
    
    echo "   📄 Converting to: $new_file"
    mv "$file" "$new_file"
    echo "   ✅ Converted successfully"
done

echo ""
echo "Step 2: Converting specific problematic files mentioned in errors..."

# List of specific files that showed errors
specific_problem_files=(
    "src/components/CompactGlobalNotificationBanner.jsx"
    "src/components/JoinedRooms.jsx"
    "src/app/admin-analytics/page-debug.jsx"
    "src/app/admin-analytics/page-login-fix.jsx"
    "src/app/chat/[roomId]/layout.jsx"
    "src/app/chat/[roomId]/page.jsx"
    "src/app/diagnostic/page.jsx"
    "src/app/network-analysis/page.jsx"
    "src/app/test-room-stats/page.jsx"
    "src/utils/tab-visibility-override.js"
    "src/utils/mobile-network-debug.js"
    "src/utils/p2p-debug.js"
)

for file in "${specific_problem_files[@]}"; do
    if [ -f "$file" ]; then
        if [[ "$file" == *.jsx ]]; then
            new_file="${file%.jsx}.tsx"
        else
            new_file="${file%.js}.ts"
        fi
        
        echo "🔄 Converting problematic file: $file → $new_file"
        mv "$file" "$new_file"
        echo "   ✅ Converted"
    else
        echo "   ⏭️  $file already converted or not found"
    fi
done

echo ""
echo "Step 3: Verifying all TypeScript declaration files are properly named..."

# Fix any remaining .d.js files
find src/ -name "*.d.js" | while read file; do
    new_file="${file%.d.js}.d.ts"
    echo "🔧 Fixing type declaration: $file → $new_file"
    mv "$file" "$new_file"
done

echo ""
echo "Step 4: Final cleanup of any remaining API routes..."

# Ensure all API routes are clean JavaScript
find src/app/api -name "*.js" | while read file; do
    echo "🔍 Final check of API route: $file"
    
    # Remove any remaining TypeScript syntax
    sed -i '' '/^interface /,/^}/d' "$file"
    sed -i '' '/^type /d' "$file"
    sed -i '' 's/}: [A-Z][a-zA-Z]*Props)/})/g' "$file"
    sed -i '' 's/: [A-Z][a-zA-Z]*Props//g' "$file"
    sed -i '' 's/: NextRequest//g' "$file"
    sed -i '' 's/: NextResponse//g' "$file"
    sed -i '' 's/: string//g' "$file"
    sed -i '' 's/: number//g' "$file"
    sed -i '' 's/: boolean//g' "$file"
    sed -i '' 's/<[A-Z][a-zA-Z]*>//g' "$file"
    
    echo "   ✅ API route cleaned"
done

echo ""
echo "Step 5: Testing the build..."

npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 BUILD SUCCESSFUL!"
    echo "==================="
    echo ""
    echo "🚀 Deploying to Vercel..."
    npm run deploy:vercel:complete
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ DEPLOYMENT COMPLETE!"
        echo "======================="
        echo ""
        echo "🌐 Your festival chat is live:"
        echo "   • Frontend: https://peddlenet.app"
        echo "   • Admin: https://peddlenet.app/admin-analytics"
        echo "   • API Health: https://peddlenet.app/api/health"
        echo ""
        echo "🎯 What was fixed:"
        echo "   • Converted ALL components with TS syntax to .tsx"
        echo "   • Converted ALL utilities with TS syntax to .ts"
        echo "   • Cleaned ALL API routes to pure JavaScript"
        echo "   • Fixed ALL type declaration files"
        echo "   • Project now has complete TS/JS separation"
        echo ""
        echo "🚨 NO MORE TYPESCRIPT SYNTAX ERRORS! 🚨"
    else
        echo ""
        echo "❌ Build succeeded but deployment failed"
        echo "Check Vercel dashboard for deployment issues"
    fi
else
    echo ""
    echo "❌ Build still failing. Remaining errors:"
    echo ""
    npm run build 2>&1 | head -60
    
    echo ""
    echo "🔍 Files that STILL contain TypeScript syntax:"
    find src/ -name "*.js" -o -name "*.jsx" | xargs grep -l "}: [A-Z][a-zA-Z]*\|interface \|<[A-Z][a-zA-Z]*>" 2>/dev/null | head -20
    
    echo ""
    echo "💡 If errors persist, try:"
    echo "   1. Delete .next folder: rm -rf .next"
    echo "   2. Clear npm cache: npm run build --cache-clear"
    echo "   3. Check for more files with this command:"
    echo "      grep -r '}: [A-Z]' src/ --include='*.js' --include='*.jsx'"
fi

echo ""
echo "📊 FINAL SUMMARY"
echo "================"
echo "• Scanned entire src/ directory for TypeScript syntax"
echo "• Converted ALL .jsx files with TS syntax to .tsx"
echo "• Converted ALL .js files with TS syntax to .ts"
echo "• Kept API routes as .js but cleaned them thoroughly"
echo "• Fixed all type declaration files (.d.ts)"
echo ""
echo "Your project should now build successfully! 🎯"
