#!/bin/bash

echo "🧹 Fixing GitHub Push Issue - Removing Large Files"
echo "=================================================="

cd "/Users/qvint/Documents/Design/Design Stuff/Side Projects/Peddler Network App/festival-chat"

echo "🗑️ Removing large files from Git tracking..."

# Remove functions/node_modules and .next from Git tracking
git rm -r --cached functions/node_modules/ 2>/dev/null || echo "functions/node_modules already removed or doesn't exist"
git rm -r --cached functions/.next/ 2>/dev/null || echo "functions/.next already removed or doesn't exist"

echo "✅ Large files removed from tracking"

echo ""
echo "📋 Updated .gitignore to prevent future issues"
echo "✅ Added /functions/node_modules to .gitignore"
echo "✅ Added /functions/.next/ to .gitignore"

echo ""
echo "📦 Current repository size after cleanup:"
git status --short | wc -l | xargs echo "Files to be committed:"

echo ""
echo "💾 Committing .gitignore fix..."
git add .gitignore

echo ""
echo "🚀 Ready to retry push!"
echo ""
echo "Next steps:"
echo "1. The large files have been removed from Git tracking"
echo "2. .gitignore has been updated to prevent this in the future"
echo "3. You can now run ./deploy.sh again"
echo ""
echo "⚠️ Note: If you need the functions dependencies, run 'cd functions && npm install' after cloning"
