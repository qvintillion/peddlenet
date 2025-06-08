#!/bin/bash

# Priority 1 Cleanup Script
# Organizes files created during Firebase Studio integration

echo "🧹 Priority 1 Cleanup - Firebase Studio Integration"
echo "=================================================="

# Create archive directory for one-time setup scripts
mkdir -p tools/archive/priority-1-setup

echo "📁 Archiving one-time setup scripts..."

# Move one-time setup scripts to archive
scripts_to_archive=(
    "firebase-setup-complete.sh"
    "firebase-setup-alternative.sh"
    "firebase-setup-no-npm.sh"
    "connect-existing-firebase.sh"
    "create-firebase-project.sh"
    "firebase-deploy.sh"
)

for script in "${scripts_to_archive[@]}"; do
    if [ -f "tools/$script" ]; then
        mv "tools/$script" "tools/archive/priority-1-setup/"
        echo "   ✅ Archived $script"
    fi
done

echo ""
echo "📋 Scripts kept for production workflow:"
essential_scripts=(
    "deploy-to-cloudrun.sh"
    "update-firebase-websocket.sh"
    "test-firebase-build.sh"
)

for script in "${essential_scripts[@]}"; do
    if [ -f "tools/$script" ]; then
        echo "   🔧 $script (WebSocket deployment & testing)"
    fi
done

# Create summary of what was accomplished
echo ""
echo "📊 Priority 1 Summary:"
echo "   ✅ Firebase Studio integrated"
echo "   ✅ Google Cloud Run WebSocket server deployed"
echo "   ✅ Cross-device testing confirmed working"
echo "   ✅ Dual hosting setup (Vercel + Firebase)"
echo ""
echo "🗂️  Files organized:"
echo "   📁 tools/archive/priority-1-setup/ (one-time setup scripts)"
echo "   🔧 tools/ (production workflow scripts)"
echo "   📚 documentation/PRIORITY-1-COMPLETE.md (full documentation)"
echo ""
echo "🎯 Ready for Priority 2: Streamlined Join Room Section"
echo ""
echo "💡 For new chat session, reference:"
echo "   documentation/PRIORITY-1-COMPLETE.md"
echo "   documentation/FESTIVAL-CHAT-NEXT-STEPS.md (Priority 2 section)"
