#!/bin/bash

echo "🧹 CLEANING UP ALL BULLSHIT EMERGENCY SCRIPTS..."

# List of all the emergency/fix scripts to delete
SCRIPTS_TO_DELETE=(
    "CONNECTION_OPTIMIZATION_SUMMARY.md"
    "CRITICAL_FIX_DEPLOY.sh"
    "EMERGENCY_CHAT_FIX.sh"
    "EMERGENCY_FIX.js"
    "EMERGENCY_NULL_SAFETY_FIX.sh"
    "EMERGENCY_SWITCH_TO_SIMPLE_CHAT.sh"
    "EMERGENCY_TAILWIND_FIX.sh"
    "HYBRID_EMERGENCY_FIX.sh"
    "RUN_EMERGENCY_FIX.sh"
    "ULTRA_SAFE_FIX.sh"
    "deploy-clean-staging.sh"
    "deploy-complete-fix.sh"
    "deploy-staging-explicit.sh"
    "diagnose-vercel-build-failure.sh"
    "emergency-deploy-production.sh"
    "emergency-deploy-staging.sh"
    "emergency-disable-tailwind.sh"
    "emergency-test-connection.js"
    "emergency-websocket-patch.js"
    "final-tailwind-fix.sh"
    "fix-production-environment-variables.sh"
    "fix-staging-environment-detection.sh"
    "fix-tailwind-properly.sh"
    "fix-vercel-build-errors.sh"
    "force-clean-staging-deploy.sh"
    "get-build-error-logs.sh"
    "implement-clean-environment-structure.sh"
    "quick-staging-fix.sh"
    "root-cause-analysis.sh"
    "run_deploy.sh"
    "test-all-admin-endpoints.js"
    "test-build-fixes.sh"
    "test-deployment-commands.sh"
    "test-emergency-fix.sh"
    "test-fixed-deployment.sh"
    "test-local-build.sh"
    "test-staging-auth.js"
)

# Delete each script
for script in "${SCRIPTS_TO_DELETE[@]}"; do
    if [ -f "$script" ]; then
        echo "Deleting: $script"
        rm "$script"
    fi
done

# Clean up old .env backups
echo "Cleaning up old .env backups..."
rm -f .env.local.backup.*
rm -f .env.production.backup.*
rm -f .env.staging.backup.*

echo "✅ ALL EMERGENCY SCRIPTS CLEANED UP!"
echo "Project is now clean and ready for proper deployment."
