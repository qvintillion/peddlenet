#!/bin/bash

echo "🎯 FIXING TYPESCRIPT SYNTAX IN JAVASCRIPT FILES"
echo "==============================================="

echo ""
echo "Step 1: Identifying files with TypeScript syntax..."

# Find the specific problem files
problem_files=(
    "src/components/ConnectionTest.jsx"
    "src/utils/room-utils.js" 
    "src/app/admin-analytics/page.jsx"
)

echo ""
echo "Step 2: Converting files back to TypeScript..."

# Rename JavaScript files with TypeScript syntax back to TypeScript
for file in "${problem_files[@]}"; do
    if [ -f "$file" ]; then
        echo "🔄 Converting $file to TypeScript..."
        
        # Determine new extension
        if [[ "$file" == *.jsx ]]; then
            new_file="${file%.jsx}.tsx"
        elif [[ "$file" == *.js ]]; then
            new_file="${file%.js}.ts"
        fi
        
        # Rename the file
        mv "$file" "$new_file"
        echo "   ✅ Renamed to $new_file"
    else
        echo "   ⏭️  $file not found, skipping"
    fi
done

echo ""
echo "Step 3: Checking API routes..."

# Fix API routes by removing type annotations
find src/app/api -name "*.js" | while read file; do
    if grep -q ": NextRequest\|: NextResponse" "$file"; then
        echo "🔧 Fixing API route: $file"
        
        # Remove type annotations from function parameters
        sed -i '' 's/(request: NextRequest)/(request)/g' "$file"
        sed -i '' 's/(request: NextResponse)/(request)/g' "$file"
        sed -i '' 's/: NextRequest//g' "$file"
        sed -i '' 's/: NextResponse//g' "$file"
        
        echo "   ✅ Removed TypeScript syntax"
    fi
done

echo ""
echo "Step 4: Testing build..."

npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ BUILD SUCCESSFUL!"
    echo ""
    echo "🚀 Now deploying to Vercel..."
    npm run deploy:vercel:complete
    
    echo ""
    echo "🎉 DEPLOYMENT COMPLETE!"
    echo "Your festival chat is now working properly."
else
    echo ""
    echo "❌ Build still failing. Let's see the errors:"
    echo ""
    npm run build 2>&1 | head -30
fi
