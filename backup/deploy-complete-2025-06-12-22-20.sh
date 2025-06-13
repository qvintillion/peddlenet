#!/bin/bash

# Complete Firebase + Cloud Run Deployment Script - STAGING VERSION
# Deploys WebSocket server to STAGING Cloud Run and rebuilds Firebase with the URL
# ENHANCED: Now includes dev server safety checks and environment protection
# UPDATED: Automatically targets STAGING environment (not production)

set -e

echo "🎭 Complete Firebase + Cloud Run Deployment (STAGING)"
echo "===================================================="

PROJECT_ID="festival-chat-peddlenet"
SERVICE_NAME="peddlenet-websocket-server-staging"  # 🎯 STAGING SERVER
REGION="us-central1"

# SAFETY: Backup current development environment
echo "💾 Protecting development environment..."
if [ -f .env.local ]; then
    cp .env.local .env.local.backup
    echo "✅ Backed up .env.local"
fi

# SAFETY: Check if dev server is running and warn user
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️ WARNING: Development server