#!/bin/bash

echo "🚨 FINAL ADMIN COMPONENTS FIX"
echo "============================="

# Commit the admin index file
git add src/components/admin/index.ts
git commit -m "Add admin components index.ts for proper imports"

echo "Deploying with admin components fixed..."
npm run deploy:vercel:complete

echo "✅ ADMIN COMPONENTS DEPLOYMENT COMPLETE"
