#!/bin/bash

# 🔍 Debug Admin Dashboard Issues
# Diagnoses why admin dashboard is still showing production

echo "🔍 Debugging Admin Dashboard Issues"
echo "=================================="

echo ""
echo "🎯 Issues reported:"
echo "❌ Environment still showing 'production'"
echo "❌ User/Room modals empty"
echo "❌ Clear room doesn't work"
echo ""

echo "🧪 Debug steps to run:"
echo ""
echo "1. TEST HEALTH ENDPOINT:"
echo "   curl -s https://[YOUR_PREVIEW_URL]/api/health | jq"
echo "   Should show: \"environment\": \"staging\""
echo ""

echo "2. TEST ADMIN ANALYTICS ENDPOINT:"
echo "   curl -s -H 'Authorization: Basic dGgzcDNkZGwzcjpsZXRzbWFrZWF0cmFkZQ==' \\"
echo "        https://[YOUR_PREVIEW_URL]/api/admin/analytics | jq"
echo "   Should show: \"environment\": \"staging\""
echo ""

echo "3. CHECK WEBSOCKET SERVER STATUS:"
echo "   curl -s https://peddlenet-websocket-server-staging-hfttiarlja-uc.a.run.app/health"
echo "   Should return 200 OK"
echo ""

echo "4. TEST ADMIN ENDPOINTS:"
echo "   curl -s https://[YOUR_PREVIEW_URL]/api/admin/rooms \\"
echo "        -H 'Authorization: Basic dGgzcDNkZGwzcjpsZXRzbWFrZWF0cmFkZQ==' | jq"
echo ""

echo "🔍 LIKELY CAUSES:"
echo ""
echo "1. WebSocket server is offline/unreachable"
echo "   - Admin analytics API falls back to default data with 'production'"
echo "   - User/room data comes from WebSocket server"
echo ""

echo "2. Environment detection in analytics API not working"
echo "   - Check if preview URL matches our detection patterns"
echo "   - Firebase preview URLs might have different format"
echo ""

echo "3. Admin endpoints expecting different data format"
echo "   - Clear room expects room ID in URL path"
echo "   - Database wipe needs confirmation in body"
echo ""

echo "📋 IMMEDIATE ACTIONS:"
echo ""
echo "1. Deploy staging WebSocket server:"
echo "   ./scripts/deploy-websocket-staging.sh"
echo ""

echo "2. Check if preview URL matches our patterns:"
echo "   - Should be: festival-chat-peddlenet--channel-name.web.app"
echo "   - Our code checks for '--' and '.web.app'"
echo ""

echo "3. Test individual API endpoints manually"
echo ""

echo "🎯 ROOT CAUSE ANALYSIS:"
echo ""
echo "If environment still shows 'production', then:"
echo "- Either WebSocket server is down (returns default data)"
echo "- Or environment detection logic doesn't match preview URL format"
echo "- Or admin analytics API isn't using our updated environment detection"
echo ""

echo "If user/room modals are empty:"
echo "- WebSocket server is definitely not connected"
echo "- Need to deploy staging WebSocket server with admin endpoints"
echo ""

echo "If clear room doesn't work:"
echo "- Admin dashboard might be calling wrong endpoint"
echo "- Or WebSocket server doesn't have clear room functionality"
