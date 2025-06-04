#!/bin/bash

echo "🔍 Checking Git history for P2P hook changes..."
echo "=============================================="

# Show the specific file's history
echo "📋 P2P Hook commit history:"
git log --oneline --follow src/hooks/use-p2p-persistent.ts

echo ""
echo "🔍 Show what the P2P hook looked like before our changes:"
git show b7f68d1:src/hooks/use-p2p-persistent.ts > original-p2p-hook.ts

echo ""
echo "✅ Original P2P hook saved to: original-p2p-hook.ts"
echo "💡 Compare with current version to see what's different"
echo ""
echo "📋 To see differences:"
echo "   diff src/hooks/use-p2p-persistent.ts original-p2p-hook.ts"
