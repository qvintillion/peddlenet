#!/bin/bash

echo "🚨 FINAL NUCLEAR FIX - DIRECT IMPORTS"
echo "===================================="

# Commit the direct import paths
git add src/app/admin-analytics/page.tsx
git commit -m "NUCLEAR FIX: Use direct .tsx import paths"

echo "Deploying with direct imports..."
npm run deploy:vercel:complete

echo "✅ NUCLEAR FIX DEPLOYMENT COMPLETE"
