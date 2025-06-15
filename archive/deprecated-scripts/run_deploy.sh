#!/bin/bash

# Deploy mesh networking fix to staging
echo "🚀 Deploying mesh networking environment fix to staging..."

# Use the existing preview deploy script with mesh-fixed channel
npm run preview:deploy mesh-fixed-v2
