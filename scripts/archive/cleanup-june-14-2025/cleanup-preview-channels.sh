#!/bin/bash

# 🧹 Firebase Preview Channel Cleanup Script
# Removes old expired channels to free up quota

set -e

PROJECT_ID="festival-chat-peddlenet"

echo "🧹 Firebase Preview Channel Cleanup"
echo "=================================="

# Get list of channels and parse them
echo "📋 Fetching current channels..."

# Delete old channels (keeping the most recent ones)
CHANNELS_TO_DELETE=(
    "test-chrome-profile"
    "test-correct-profile" 
    "test-working-solution"
    "reconnection-fix"
    "cors-fix-test"
    "api-endpoint-fix"
    "cors-fix-2"
    "rate-limit-fix"
    "messaging-fix-20250611"
    "sender-echo-fix-20250611-1820"
    "connection-conflict-fix-20250611-1823"
    "working-github-version-20250611-1831"
    "connection-fix-github-rates-20250611-1836"
    "critical-fix"
    "staging-test"
    "staging-test2"
    "test-room-stats"
    "room-stats-test"
    "cache-bust-test"
    "env-explicit-test"
    "final-test"
    "ultra-cache-bust-test"
    "test-fixed"
    "resolved-maybe"
    "staging-fix"
    "preview-your-feature-name"
    "background-notifications-fix"
    "background-notifications-fix-v2"
    "background-notifications-working-test"
    "background-notifications-sqlite-test"
    "background-notifications-cross-room-fix"
    "notification-fixes"
    "notification-test"
    "test-messaging-fix"
    "staging-messaging-test"
    "staging-script-test"
    "staging-script-test2"
    "staging-script-test3"
    "UI-check"
)

echo "🗑️ Deleting ${#CHANNELS_TO_DELETE[@]} old channels..."

for channel in "${CHANNELS_TO_DELETE[@]}"; do
    echo "Deleting: $channel"
    firebase hosting:channel:delete "$channel" --project "$PROJECT_ID" --force 2>/dev/null || echo "  ↳ Channel $channel not found or already deleted"
done

echo ""
echo "✅ Channel cleanup complete!"
echo ""
echo "📋 Remaining channels:"
firebase hosting:channel:list --project "$PROJECT_ID"

echo ""
echo "🚀 Now you can create new preview channels:"
echo "npm run preview:deploy environment-detection-fix"
