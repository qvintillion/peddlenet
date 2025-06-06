#!/bin/bash

echo "🔧 Testing build after cleanup..."
cd "/Users/qvint/Documents/Design/Design Stuff/Side Projects/Peddler Network App/festival-chat"

# Run build
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful! Ready for deployment."
else
    echo "❌ Build still failing. Let's check for other issues."
fi
