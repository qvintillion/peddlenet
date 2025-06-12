#!/bin/bash

echo "🧹 Cleaning up temporary debugging scripts..."

# Remove temporary scripts created during environment debugging
rm -f debug-env.sh
rm -f nuclear-preview-deploy.sh  
rm -f simple-ssr-fix.sh
rm -f ssr-fix-deploy.sh

echo "✅ Temporary scripts removed"
echo ""
echo "📋 Remaining scripts:"
echo "  ✅ preview-staging-ssr.sh (main preview staging script)"
echo "  ✅ preview-staging.sh (legacy, can be removed if not needed)"
echo ""
echo "🎯 Main preview staging script: ./preview-staging-ssr.sh"
