#!/bin/bash

echo "🔧 FIXED DUPLICATE DEPENDENCIES - FINAL DEPLOY ATTEMPT"
echo "===================================================="

git add package.json
git commit -m "Remove duplicate @types/react entries from devDependencies"

echo "Testing build locally first..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ LOCAL BUILD SUCCESS! Deploying to production..."
    npm run deploy:vercel:complete
    echo ""
    echo "🎉🎉🎉 FINALLY DEPLOYED! 🎉🎉🎉"
else
    echo "❌ Local build still failing..."
fi
