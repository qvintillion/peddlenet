#!/bin/bash

echo "🔍 CHECKING THE ACTUAL BREAKING CHANGES"
echo "======================================"

echo "📦 Current package.json tailwind setup:"
grep -A5 -B5 "tailwindcss" package.json

echo ""
echo "🎨 Current globals.css content:"
head -10 src/app/globals.css

echo ""
echo "⚙️ Current tsconfig.json paths:"
grep -A10 "paths" tsconfig.json

echo ""
echo "🔍 Let's see what specific build-breaking changes I made:"
echo "Show recent commits that mention tailwind, imports, or dependencies:"
git log --oneline -20 | grep -i -E "(tailwind|import|dependencies|@/|path)"

echo ""
echo "💡 The issue is probably:"
echo "1. Tailwind dependency location (moved to dependencies vs devDependencies)"
echo "2. Globals.css import syntax"
echo "3. Maybe missing admin component exports"
echo ""
echo "These are all fixable without reverting your P2P work!"
