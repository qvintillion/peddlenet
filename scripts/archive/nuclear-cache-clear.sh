#!/bin/bash

# 🔥 NUCLEAR CACHE CLEAR - Clear EVERYTHING
echo "🔥 NUCLEAR CACHE CLEAR - Clearing ALL possible caches..."

# Stop all processes
echo "🛑 Stopping all processes..."
pkill -f "next" || true
pkill -f "signaling" || true
pkill -f "node" || true
sleep 2

# Clear Next.js cache
echo "🗑️ Clearing Next.js cache..."
rm -rf .next/
rm -rf .next.bak/
rm -rf node_modules/.cache/
rm -rf .vercel/

# Clear Firebase cache
echo "🗑️ Clearing Firebase cache..."
rm -rf .firebase/
rm -rf functions/.next/
rm -rf functions/lib/

# Clear npm cache
echo "🗑️ Clearing npm cache..."
npm cache clean --force
npm cache verify

# Clear environment files
echo "🗑️ Clearing environment backups..."
rm -f .env.local.backup*
rm -f .env.*.backup*

# Clear any temp files
echo "🗑️ Clearing temp files..."
find . -name "*.tmp" -delete 2>/dev/null || true
find . -name "*.temp" -delete 2>/dev/null || true
find . -name ".DS_Store" -delete 2>/dev/null || true

# Clear node_modules and reinstall (nuclear option)
echo "🗑️ Clearing node_modules..."
rm -rf node_modules/
rm -f package-lock.json

echo "📦 Reinstalling dependencies..."
npm install

# Verify file timestamps
echo "🕒 Verifying file timestamps..."
echo "ChatRoomSwitcher.tsx modified: $(stat -f %Sm src/components/ChatRoomSwitcher.tsx)"
echo "page.tsx modified: $(stat -f %Sm src/app/chat/[roomId]/page.tsx)"

echo "✅ NUCLEAR CACHE CLEAR COMPLETE!"
echo ""
echo "🚀 Now run: npm run preview:deploy nuclear-clear-$(date +%H%M)"
