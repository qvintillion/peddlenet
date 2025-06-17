#!/bin/bash

echo "🚨 NUCLEAR FIX - DEPLOY NOW"
echo "=========================="

# Lock exact versions and deploy immediately
echo "Committing exact Tailwind versions..."
git add package.json
git commit -m "LOCK TAILWIND VERSIONS FOR PRODUCTION BUILD"

echo "Deploying to production with locked versions..."
npm run deploy:vercel:complete

echo "✅ DEPLOYED WITH LOCKED TAILWIND VERSIONS"
