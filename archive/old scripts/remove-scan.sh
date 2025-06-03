#!/bin/bash

# Remove the empty scan directory that's causing 404 errors
echo "Removing empty scan directory..."
rm -rf "src/app/scan"

# Clear Next.js cache to prevent old route prefetching
echo "Clearing Next.js cache..."
rm -rf ".next"

echo "✅ Cleanup complete! The /scan route has been removed."
echo "🚀 You can now rebuild and redeploy your app."
