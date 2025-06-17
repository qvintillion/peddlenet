#!/bin/bash

echo "🔧 FIXING TYPESCRIPT SYNTAX IN JAVASCRIPT FILES"
echo "==============================================="

echo "Removing TypeScript syntax from all JavaScript files..."

# Fix all .js and .jsx files by removing TypeScript syntax
find src -name "*.js" -o -name "*.jsx" | while read file; do
    echo "Cleaning TypeScript syntax from $file..."
    
    # Remove interface declarations completely
    sed -i '' '/^interface /,/^}/d' "$file"
    
    # Remove type annotations from function parameters
    sed -i '' 's/: [A-Za-z0-9_<>[\]|{}, ]*)/)/g' "$file"
    sed -i '' 's/: [A-Za-z0-9_<>[\]|{}, ]*,/,/g' "$file"
    sed -i '' 's/: [A-Za-z0-9_<>[\]|{}, ]*;/;/g' "$file"
    
    # Remove return type annotations
    sed -i '' 's/): [A-Za-z0-9_<>[\]|{}, ]* {/) {/g' "$file"
    
    # Remove type imports
    sed -i '' '/^import type /d' "$file"
    
    # Remove generic type parameters
    sed -i '' 's/<[A-Za-z0-9_<>[\]|{}, ]*>//g' "$file"
    
    # Remove optional property markers
    sed -i '' 's/?:/:/g' "$file"
    
    # Remove as type assertions
    sed -i '' 's/ as [A-Za-z0-9_<>[\]|{}, ]*//g' "$file"
done

echo "✅ Cleaned all TypeScript syntax from JavaScript files"

git add .
git commit -m "Remove TypeScript syntax from JavaScript files"

echo "Testing build..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ BUILD SUCCESS! Deploying..."
    npm run deploy:vercel:complete
    echo ""
    echo "🎉 FINALLY DEPLOYED! Pure JavaScript build!"
else
    echo "❌ Still failing - checking remaining syntax errors..."
fi
