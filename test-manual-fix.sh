#!/bin/bash

echo "🔧 MANUALLY FIXED LAYOUT.TSX - TESTING BUILD"
echo "==========================================="

npm run build

if [ $? -eq 0 ]; then
    echo "✅ BUILD SUCCESS! FINALLY!"
    git add src/app/layout.tsx
    git commit -m "Manually fix layout.tsx import path"
    npm run deploy:vercel:complete
    echo ""
    echo "🎉 SUCCESS! YOUR P2P WEBRTC APP IS DEPLOYED!"
else
    echo "❌ Still broken, let's see what's left..."
    find src -name "*.tsx" -o -name "*.ts" | xargs grep -l "from '@/" 2>/dev/null | head -5
fi
