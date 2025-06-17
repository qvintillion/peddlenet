#!/bin/bash

echo "🚨 EMERGENCY: MOVING TAILWIND TO DEPENDENCIES"
echo "============================================="

# Commit the change and deploy immediately
git add package.json
git commit -m "EMERGENCY: Move Tailwind to dependencies to prevent Vercel stripping"

echo "Deploying with Tailwind in dependencies..."
npm run deploy:vercel:complete

echo "✅ EMERGENCY DEPLOYMENT COMPLETE"
