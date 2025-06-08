#!/bin/bash

# Clean up and test Firebase build

echo "🧹 Cleaning up duplicate files..."

# Remove the separate generateStaticParams file since we added it to page.tsx
if [ -f "src/app/chat/[roomId]/generateStaticParams.ts" ]; then
    rm "src/app/chat/[roomId]/generateStaticParams.ts"
    echo "✅ Removed duplicate generateStaticParams.ts"
fi

echo "🏗️ Testing Firebase build..."

# Clean build directories
rm -rf .next out

# Test Firebase build
BUILD_TARGET=firebase npm run build

if [ $? -eq 0 ]; then
    echo "✅ Firebase build successful!"
    echo "📁 Checking output directory..."
    
    if [ -d "out" ]; then
        echo "✅ 'out' directory created"
        echo "📊 Files generated: $(find out -type f | wc -l)"
        echo "📦 Total size: $(du -sh out | cut -f1)"
        
        echo ""
        echo "🎉 Ready for Firebase deployment!"
        echo "🚀 Run: firebase deploy --only hosting"
    else
        echo "❌ 'out' directory not found"
    fi
else
    echo "❌ Firebase build failed"
    echo "💡 Check the error messages above"
fi
