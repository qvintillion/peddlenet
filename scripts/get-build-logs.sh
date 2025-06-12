#!/bin/bash

echo "📋 Getting detailed Cloud Build logs..."

# Get the latest failed build ID
BUILD_ID=$(gcloud builds list --limit=1 --filter="status=FAILURE" --format="value(id)")

if [ -z "$BUILD_ID" ]; then
    echo "❌ No failed builds found"
    exit 1
fi

echo "🔍 Latest failed build ID: $BUILD_ID"
echo "📊 Getting detailed logs..."

# Get detailed logs
gcloud logging read "resource.type=build AND resource.labels.build_id=$BUILD_ID" --limit=50 --format="table(timestamp,severity,textPayload)" --project=peddlenet-1749130439

echo ""
echo "🌐 You can also view logs in browser:"
echo "https://console.cloud.google.com/cloud-build/builds/$BUILD_ID?project=peddlenet-1749130439"
