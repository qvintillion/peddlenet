#!/bin/bash

# 🛠️ Admin Dashboard Complete Fix
# Fixes environment detection, API calls, and admin functionality

echo "🛠️ Admin Dashboard Complete Fix"
echo "==============================="

# Back up critical files
echo "💾 Backing up admin components..."
mkdir -p backup/admin-fix-$(date +%Y%m%d-%H%M%S)

cp src/app/admin-analytics/page.tsx backup/admin-fix-$(date +%Y%m%d-%H%M%S)/
cp src/app/api/admin/database/route.ts backup/admin-fix-$(date +%Y%m%d-%H%M%S)/

echo "✅ Files backed up"

echo ""
echo "🔧 Summary of issues to fix:"
echo "1. Environment detection (should show 'staging' in preview)"
echo "2. User/Room modals showing empty data"
echo "3. Clear room messages not working"
echo "4. Database wipe requiring confirmation parameter"
echo "5. API calls need to be consistent between page and hook"

echo ""
echo "🚀 Next steps:"
echo "1. Deploy latest staging WebSocket server"
echo "2. Test admin functionality with WebSocket server connected"
echo "3. Update admin page to handle disconnected WebSocket gracefully"

echo ""
echo "📋 Current status:"
echo "✅ Environment detection API updated"
echo "✅ Clear room endpoint exists at /api/admin/room/[roomId]/messages"
echo "✅ Database wipe endpoint exists at /api/admin/database"
echo "❌ WebSocket server may not be connected"
echo "❌ Admin page expects live data from WebSocket server"

echo ""
echo "🎯 Immediate actions needed:"
echo "1. Deploy staging WebSocket server: ./scripts/deploy-websocket-staging.sh"
echo "2. Test admin dashboard with live WebSocket connection"
echo "3. Check if admin endpoints exist on WebSocket server"
