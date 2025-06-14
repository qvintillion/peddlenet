#!/bin/bash

# Fix API routes for static export builds by adding required exports
# 2025-06-14

echo "🔧 Adding dynamic exports to API routes..."

# Find all API route files
find /Users/qvint/Documents/Design/Design\ Stuff/Side\ Projects/Peddler\ Network\ App/festival-chat/src/app/api -name "route.ts" | while read -r file; do
    echo "Processing: $file"
    
    # Check if the file already has dynamic export
    if ! grep -q "export const dynamic" "$file"; then
        # Create a backup
        cp "$file" "${file}.backup"
        
        # Add the exports after the imports
        sed -i '' '/^import.*$/a\
\
// Required for static export builds\
export const dynamic = '\''force-dynamic'\'';\
export const revalidate = false;\
' "$file"
        
        echo "✅ Added dynamic exports to: $file"
    else
        echo "⚠️  Already has dynamic export: $file"
    fi
done

echo "🎉 Finished processing API routes"
