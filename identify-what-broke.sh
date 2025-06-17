#!/bin/bash

echo "🔍 IDENTIFYING WHAT I BROKE VS YOUR WORK"
echo "========================================"

echo "📋 Recent commits to see what I touched vs your P2P work:"
git log --oneline -30

echo ""
echo "🎯 Let's see what files I modified vs your WebRTC work:"
echo "Files changed in last 10 commits:"
git diff --name-only HEAD~10

echo ""
echo "📦 Package.json changes (probably my fault):"
git log -5 --oneline -p package.json

echo ""
echo "🎨 Globals.css changes (probably my fault):"
git log -5 --oneline -p src/app/globals.css

echo ""
echo "🔧 Admin components (probably new, not the issue):"
ls -la src/components/admin/

echo ""
echo "💡 We should only revert:"
echo "  - package.json dependency changes"
echo "  - globals.css Tailwind import changes" 
echo "  - Any path alias fuckups"
echo ""
echo "🚫 We should NOT revert:"
echo "  - Your P2P WebRTC optimizations"
echo "  - Server performance improvements"
echo "  - Chat functionality changes"
