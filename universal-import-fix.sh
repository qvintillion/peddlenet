#!/bin/bash

echo "🔧 UNIVERSAL IMPORT FIX - RELATIVE PATHS"
echo "========================================"

# Use relative imports that work everywhere
git add src/app/admin-analytics/page.tsx
git commit -m "Use relative imports to avoid path alias issues"

echo "Testing build locally first..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Local build SUCCESS! Deploying to production..."
    npm run deploy:vercel:complete
else
    echo "❌ Local build FAILED - check errors above"
fi
