#!/bin/bash

echo "🔍 Running debug build to see what files are available..."

# Check if we're in the right directory
if [ ! -f "signaling-server-production.js" ]; then
    echo "❌ Error: signaling-server-production.js not found in current directory"
    echo "Please run this script from the project root directory"
    exit 1
fi

# Set project variables
PROJECT_ID="peddlenet-1749130439"

echo "📋 Debug Configuration:"
echo "   Project: $PROJECT_ID"
echo "   Build Config: deployment/cloudbuild-debug.yaml"
echo ""

# Set the project
echo "🎯 Setting project to $PROJECT_ID..."
gcloud config set project $PROJECT_ID

# Submit debug build
echo "🔍 Submitting debug build to see file structure..."
gcloud builds submit --config deployment/cloudbuild-debug.yaml

echo ""
echo "🔍 Check the build logs above to see what files are available in the build context"
