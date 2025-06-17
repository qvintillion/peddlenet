#!/bin/bash
echo "🚨 EMERGENCY STAGING DEPLOYMENT"
echo "Deploying with emergency fixes..."

# Use staging environment
cp .env.staging .env.local

# Build with staging target
BUILD_TARGET=staging npm run build

# Deploy to Firebase staging
firebase deploy --project festival-chat-peddlenet --only hosting:festival-chat-peddlenet
