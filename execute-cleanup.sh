#!/bin/bash

echo "🧹 EXECUTING CLEANUP NOW..."

# Delete all the emergency scripts directly
rm -f CONNECTION_OPTIMIZATION_SUMMARY.md
rm -f CRITICAL_FIX_DEPLOY.sh
rm -f EMERGENCY_CHAT_FIX.sh
rm -f EMERGENCY_FIX.js
rm -f EMERGENCY_NULL_SAFETY_FIX.sh
rm -f EMERGENCY_SWITCH_TO_SIMPLE_CHAT.sh
rm -f EMERGENCY_TAILWIND_FIX.sh
rm -f HYBRID_EMERGENCY_FIX.sh
rm -f RUN_EMERGENCY_FIX.sh
rm -f ULTRA_SAFE_FIX.sh
rm -f deploy-clean-staging.sh
rm -f deploy-complete-fix.sh
rm -f deploy-staging-explicit.sh
rm -f diagnose-vercel-build-failure.sh
rm -f emergency-deploy-production.sh
rm -f emergency-deploy-staging.sh
rm -f emergency-disable-tailwind.sh
rm -f emergency-test-connection.js
rm -f emergency-websocket-patch.js
rm -f final-tailwind-fix.sh
rm -f fix-production-environment-variables.sh
rm -f fix-staging-environment-detection.sh
rm -f fix-tailwind-properly.sh
rm -f fix-vercel-build-errors.sh
rm -f force-clean-staging-deploy.sh
rm -f get-build-error-logs.sh
rm -f implement-clean-environment-structure.sh
rm -f quick-staging-fix.sh
rm -f root-cause-analysis.sh
rm -f run_deploy.sh
rm -f test-all-admin-endpoints.js
rm -f test-build-fixes.sh
rm -f test-deployment-commands.sh
rm -f test-emergency-fix.sh
rm -f test-fixed-deployment.sh
rm -f test-local-build.sh
rm -f test-staging-auth.js

# Clean up old .env backups
rm -f .env.local.backup.*
rm -f .env.production.backup.*
rm -f .env.staging.backup.*

# Clean up this cleanup script too
rm -f cleanup-scripts.sh

echo "✅ ALL BULLSHIT SCRIPTS DELETED!"
echo "Now run: chmod +x fix-tailwind-final.sh && ./fix-tailwind-final.sh"
