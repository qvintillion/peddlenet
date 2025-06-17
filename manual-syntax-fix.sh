#!/bin/bash

echo "🔧 MANUALLY FIXING SPECIFIC SYNTAX ERRORS"
echo "========================================"

# Fix ConnectionTest.jsx - remove destructuring type annotation
echo "1. Fixing ConnectionTest.jsx..."
sed -i '' 's/{ className }: ConnectionTestProps/{ className }/g' src/components/ConnectionTest.jsx
sed -i '' 's/useState<{/useState({/g' src/components/ConnectionTest.jsx
sed -i '' "s/'testing' | 'success' | 'error'/String/g" src/components/ConnectionTest.jsx

# Fix room-utils.js - remove type annotations from function parameters
echo "2. Fixing room-utils.js..."
sed -i '' 's/(roomName: string): string/(roomName)/g' src/utils/room-utils.js

# Fix admin-analytics page.jsx - remove type annotations
echo "3. Fixing admin-analytics page.jsx..."
sed -i '' 's/: DashboardData//g' src/app/admin-analytics/page.jsx

# Fix API routes - remove NextRequest type annotations
echo "4. Fixing API routes..."
sed -i '' 's/(request: NextRequest)/(request)/g' src/app/api/admin/activity/route.js
sed -i '' 's/(request: NextRequest)/(request)/g' src/app/api/admin/analytics/route.js

# Also fix any other API routes
find src/app/api -name "*.js" | while read file; do
    echo "Cleaning API route: $file"
    sed -i '' 's/: NextRequest//g' "$file"
    sed -i '' 's/: NextResponse//g' "$file"
done

echo "✅ Fixed specific syntax errors"

git add .
git commit -m "Manually fix JavaScript syntax errors"

echo "Testing build..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ BUILD SUCCESS! Deploying now..."
    npm run deploy:vercel:complete
    echo ""
    echo "🎉🎉🎉 FINALLY DEPLOYED! 🎉🎉🎉"
else
    echo "❌ Still failing..."
    # Show first few errors
    npm run build 2>&1 | head -20
fi
