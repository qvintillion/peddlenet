#!/bin/bash

echo "🔍 CHECKING YOUR ACTUAL BUILD HISTORY"
echo "====================================="

echo "Recent git commits:"
git log --oneline -10

echo ""
echo "🔍 Looking for when Tailwind/imports last worked..."
echo "Let's see what changed recently in package.json:"
git log --oneline -p --follow package.json | head -50

echo ""
echo "🔍 When did globals.css change?"
git log --oneline -p src/app/globals.css | head -20

echo ""
echo "🔍 Any recent changes to tsconfig.json?"
git log --oneline -p tsconfig.json | head -20
