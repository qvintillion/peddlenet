#!/bin/bash
echo "🚨 EMERGENCY PRODUCTION DEPLOYMENT"
echo "Deploying with emergency fixes..."

# Use production environment
cp .env.production .env.local

# Build with production target
BUILD_TARGET=production npm run build

# Deploy to Vercel production
vercel --prod
