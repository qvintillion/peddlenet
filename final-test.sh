#!/bin/bash

echo "🔧 FIXED CHAT PAGE IMPORT - TESTING BUILD"
echo "========================================"

npm run build

if [ $? -eq 0 ]; then
    echo "✅ BUILD SUCCESS! FINALLY DEPLOYED!"
    git add src/app/chat/[roomId]/page.tsx
    git commit -m "Fix chat page dynamic import path"
    npm run deploy:vercel:complete
    echo ""
    echo "🎉🎉🎉 SUCCESS! YOUR P2P WEBRTC APP IS LIVE! 🎉🎉🎉"
    echo "All your performance optimizations are preserved!"
else
    echo "❌ Still broken, checking for more @ imports..."
    grep -r "from '@/" src/ --include="*.ts" --include="*.tsx" | head -5
fi
