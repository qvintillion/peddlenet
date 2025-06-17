#!/bin/bash

echo "🔧 FIXED THE PATH - TESTING BUILD"
echo "================================="

npm run build

if [ $? -eq 0 ]; then
    echo "✅ BUILD SUCCESS! Path was just wrong - simple fix!"
    git add src/app/api/debug/room-codes/route.ts
    git commit -m "Fix API route import path depth"
    npm run deploy:vercel:complete
else
    echo "❌ Still broken, checking for other issues..."
fi
