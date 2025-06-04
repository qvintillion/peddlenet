#!/bin/bash

echo "🔍 Investigating P2P hook history..."
echo "====================================="

# Check if the file exists in the working commit
echo "📋 Checking if P2P hook exists in commit b7f68d1:"
git ls-tree b7f68d1 -- src/hooks/

echo ""
echo "📋 Checking the entire src/hooks directory structure:"
git ls-tree -r b7f68d1 -- src/hooks/

echo ""
echo "📋 All TypeScript files in that commit:"
git ls-tree -r b7f68d1 -- "*.ts"

echo ""
echo "📋 All files in src/hooks in that commit:"
git show b7f68d1 --name-only | grep hooks

echo ""
echo "📋 Recent commits affecting the P2P hook file:"
git log --oneline --follow src/hooks/use-p2p-persistent.ts -10

echo ""
echo "📋 When was this file first created?"
git log --reverse --oneline -- src/hooks/use-p2p-persistent.ts | head -1
