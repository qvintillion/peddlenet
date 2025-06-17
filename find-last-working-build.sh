#!/bin/bash

echo "📅 WHEN DID YOUR BUILD LAST WORK?"
echo "================================"

# Check git history to find recent commits
echo "Recent commits (last 20):"
git log --oneline -20

echo ""
echo "🔍 Let's check what was working before..."
echo "When did we last have a successful build? Let's see commits from today:"
git log --since="1 day ago" --oneline

echo ""
echo "📦 Package.json changes today:"
git log --since="1 day ago" -p package.json

echo ""
echo "🎨 Globals.css changes today:"
git log --since="1 day ago" -p src/app/globals.css
