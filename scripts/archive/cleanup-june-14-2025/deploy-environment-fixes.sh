#!/bin/bash

# 🚀 Deploy Environment Detection Fixes
# Deploys all the environment detection fixes we made

echo "🚀 Deploying Environment Detection Fixes"
echo "======================================="

echo "✅ Changes made:"
echo "  - Updated /api/admin/analytics to detect staging environment"
echo "  - Updated /api/health to detect staging environment"  
echo "  - Fixed database wipe to include confirmation parameter"
echo "  - Environment detection works on server-side (API routes)"
echo ""

echo "🧪 What to test after deployment:"
echo "1. Visit admin dashboard: /admin-analytics"
echo "2. Check 'Environment' field shows 'staging' (not 'production')"
echo "3. Test database wipe button (should work now)"
echo "4. Check /api/health endpoint shows 'staging'"
echo ""

# Deploy to preview 
echo "🚀 Deploying to preview channel..."
npm run preview:deploy environment-detection-fixed

echo ""
echo "📋 After deployment, test these URLs:"
echo "  - Admin Dashboard: [PREVIEW_URL]/admin-analytics"
echo "  - Health Check: [PREVIEW_URL]/api/health"
echo ""
echo "🔍 Look for:"
echo "  ✅ Environment: staging (in Network Monitoring section)"
echo "  ✅ Database wipe works"
echo "  ✅ Clear room messages works"
echo "  ❌ User/Room modals still empty (needs WebSocket server)"
