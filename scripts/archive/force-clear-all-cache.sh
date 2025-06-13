#!/bin/bash

# 🧹 AGGRESSIVE CACHE CLEAR SCRIPT
# This will completely wipe all possible cache sources

echo "🧹 STARTING AGGRESSIVE CACHE CLEAR..."

# Clear Next.js cache
echo "🗑️ Clearing Next.js build cache..."
rm -rf .next/
rm -rf .next.bak/

# Clear Firebase cache
echo "🗑️ Clearing Firebase cache..."
rm -rf .firebase/

# Clear Node modules cache (optional but thorough)
echo "🗑️ Clearing npm cache..."
npm cache clean --force

# Clear any function builds
echo "🗑️ Clearing function builds..."
rm -rf functions/.next/
rm -rf functions/lib/

# Clear any backup environments
echo "🗑️ Clearing environment backups..."
rm -f .env.local.backup.*

# Clear browser build artifacts
echo "🗑️ Clearing any remaining build artifacts..."
find . -name "*.d.ts.map" -delete 2>/dev/null || true
find . -name ".DS_Store" -delete 2>/dev/null || true

echo "✅ AGGRESSIVE CACHE CLEAR COMPLETE!"
echo ""
echo "🔥 Now run your preview deployment:"
echo "npm run preview:deploy admin-analytics-v2"
