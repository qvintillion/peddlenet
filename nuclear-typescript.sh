#!/bin/bash

echo "🚨 NUCLEAR: MOVE TYPESCRIPT TO DEPENDENCIES"
echo "==========================================="

git add package.json
git commit -m "NUCLEAR: Move TypeScript to dependencies - Vercel strips devDependencies"

echo "Final deployment attempt..."
npm run deploy:vercel:complete

echo ""
if [ $? -eq 0 ]; then
    echo "🎉 DEPLOYED! TypeScript in dependencies worked!"
else
    echo "💀 Still failing. The build system is fundamentally broken."
fi
