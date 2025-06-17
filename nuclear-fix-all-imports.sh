#!/bin/bash

echo "🚨 NUCLEAR OPTION: FIX ALL @ IMPORTS IN ALL FILES"
echo "================================================="

# Fix diagnostics page
echo "Fixing diagnostics page..."
sed -i '' "s|from '@/components/ConnectionTest'|from '../../components/ConnectionTest'|g" src/app/diagnostics/page.tsx

# Fix improved-admin page  
echo "Fixing improved-admin page..."
sed -i '' "s|from '@/utils/room-utils'|from '../../utils/room-utils'|g" src/app/improved-admin/page.tsx

# Fix main page
echo "Fixing main page..."
sed -i '' "s|from '@/components/RoomCode'|from '../components/RoomCode'|g" src/app/page.tsx
sed -i '' "s|from '@/hooks/use-background-notifications'|from '../hooks/use-background-notifications'|g" src/app/page.tsx
sed -i '' "s|from '@/components/CompactGlobalNotificationBanner'|from '../components/CompactGlobalNotificationBanner'|g" src/app/page.tsx

# Find and fix ALL remaining @ imports in src/app
echo "Finding all remaining @ imports..."
find src/app -name "*.tsx" -o -name "*.ts" | xargs grep -l "from '@/" | while read file; do
    echo "Fixing $file..."
    
    # Count directory depth to determine relative path
    depth=$(echo "$file" | tr -cd '/' | wc -c)
    depth=$((depth - 2)) # subtract src/app
    
    # Create relative path prefix
    if [ $depth -eq 0 ]; then
        prefix="../"
    elif [ $depth -eq 1 ]; then
        prefix="../../"
    elif [ $depth -eq 2 ]; then
        prefix="../../../"
    else
        prefix="../../../../"
    fi
    
    # Replace @ imports
    sed -i '' "s|from '@/|from ${prefix}|g" "$file"
    echo "  Fixed @ imports in $file with prefix $prefix"
done

echo "✅ Fixed all @ imports"

# Test build
echo "Testing build..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ BUILD SUCCESS! Committing and deploying..."
    git add -A
    git commit -m "NUCLEAR FIX: Replace all @ imports with relative paths"
    npm run deploy:vercel:complete
else
    echo "❌ BUILD STILL FAILED"
fi
