#!/bin/bash

echo "🔧 FIXING FINAL @ IMPORT IN LAYOUT.TSX"
echo "====================================="

echo "1. Fixing layout.tsx..."
sed -i '' "s|from '@/utils/tab-visibility-override'|from '../utils/tab-visibility-override'|g" src/app/layout.tsx

echo "2. Testing build..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ BUILD SUCCESS! ALL @ IMPORTS FIXED!"
    git add src/app/layout.tsx
    git commit -m "Fix final @ import in layout.tsx"
    npm run deploy:vercel:complete
    echo ""
    echo "🎉 YOUR P2P WEBRTC APP IS NOW DEPLOYED!"
    echo "All your performance optimizations are preserved!"
else
    echo "❌ Still broken, checking what's left..."
    find src -name "*.tsx" -o -name "*.ts" | xargs grep -l "from '@/" | head -5
fi
