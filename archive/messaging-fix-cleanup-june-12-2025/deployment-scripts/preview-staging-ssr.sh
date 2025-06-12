#!/bin/bash

# 🎭 Festival Chat - Preview Staging Script (SSR-Aware)
# Deploy to Firebase preview channels with correct environment handling

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}🎭 [PREVIEW-STAGING]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅ [SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️ [WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}❌ [ERROR]${NC} $1"
}

# Check if feature name is provided
if [ -z "$1" ]; then
    print_error "Please provide a feature name for the preview channel"
    echo ""
    echo "Usage: ./preview-staging.sh <feature-name>"
    echo ""
    echo "Examples:"
    echo "  ./preview-staging.sh room-codes"
    echo "  ./preview-staging.sh notification-fix"
    echo "  ./preview-staging.sh mobile-ui"
    echo ""
    exit 1
fi

FEATURE_NAME="$1"
PREVIEW_CHANNEL="preview-${FEATURE_NAME}"

print_status "Starting SSR-aware preview staging deployment for feature: ${FEATURE_NAME}"
print_status "Preview channel: ${PREVIEW_CHANNEL}"

# Show current environment
print_status "Environment configuration:"
echo "  📁 Working directory: $(pwd)"
echo "  🌿 Git branch: $(git branch --show-current 2>/dev/null || echo 'unknown')"
echo "  🔧 Node version: $(node --version)"
echo "  🏗️ Architecture: SSR via Firebase Functions"

# Verify Firebase Functions environment is set correctly
print_status "Verifying Firebase Functions environment..."
CURRENT_CONFIG=$(firebase functions:config:get --project "festival-chat-peddlenet" 2>/dev/null | grep -o 'preview-433318323150' || echo "not-found")

if [[ "$CURRENT_CONFIG" == "preview-433318323150" ]]; then
    print_success "Firebase Functions environment correctly set to preview server"
else
    print_warning "Firebase Functions environment might not be set correctly"
    echo "  Current config contains: $CURRENT_CONFIG"
    echo "  Expected: preview-433318323150"
fi

# Cache bust - clear builds to ensure fresh deployment
print_status "Cache bust: clearing all builds..."
rm -rf .next/
rm -rf .firebase/
rm -rf functions/.next/
rm -rf functions/lib/
print_success "Build cache cleared"

# Temporarily disable .env.production to avoid conflicts
print_status "Temporarily disabling conflicting environment files..."
if [ -f ".env.production" ]; then
    mv .env.production .env.production.disabled
    print_success "Disabled .env.production (will restore after build)"
fi

# Ensure we're using preview environment
print_status "Setting up preview environment..."
if [ -f ".env.preview" ]; then
    cp .env.preview .env.local
    print_success "Applied .env.preview to .env.local"
    
    echo ""
    echo -e "${YELLOW}📝 Environment being used:${NC}"
    grep NEXT_PUBLIC_SIGNALING_SERVER .env.local
else
    print_error ".env.preview not found!"
    exit 1
fi

# Build with explicit environment variables
print_status "Building Next.js app with preview environment..."
NEXT_PUBLIC_SIGNALING_SERVER="wss://peddlenet-websocket-server-preview-433318323150.us-central1.run.app" \
BUILD_TARGET="preview" \
npm run build

# Build Firebase Functions
print_status "Building Firebase Functions..."
cd functions
NEXT_PUBLIC_SIGNALING_SERVER="wss://peddlenet-websocket-server-preview-433318323150.us-central1.run.app" \
npm run build
cd ..

# Verify the build contains correct URLs
print_status "Verifying build contains preview server URLs..."
if grep -r "preview-433318323150" .next/ >/dev/null 2>&1; then
    print_success "Preview server URL found in client build"
else
    print_warning "Preview server URL not found in client build (might be SSR-only)"
fi

# Deploy to preview channel
print_status "Deploying to Firebase preview channel..."
firebase hosting:channel:deploy "$PREVIEW_CHANNEL" \
    --project "festival-chat-peddlenet" \
    --expires "7d" 2>&1 | tee /tmp/preview_deploy.log

# Extract preview URL from deployment output
PREVIEW_URL=$(grep -o 'https://[^[:space:]]*' /tmp/preview_deploy.log | head -1)

# Restore original environment
print_status "Restoring original environment..."
if [ -f ".env.production.disabled" ]; then
    mv .env.production.disabled .env.production
    print_success "Restored .env.production"
fi

# Show results
echo ""
print_success "Preview staging deployment completed!"
echo -e "${BLUE}📋 Channel ID: ${PREVIEW_CHANNEL}${NC}"
echo -e "${BLUE}⏰ Expires: 7 days from now${NC}"

if [ -n "$PREVIEW_URL" ]; then
    echo ""
    echo -e "${GREEN}🔗 PREVIEW URL:${NC}"
    echo -e "${YELLOW}${PREVIEW_URL}${NC}"
    echo ""
    
    # Copy URL to clipboard
    echo -n "$PREVIEW_URL" | pbcopy 2>/dev/null && print_success "URL copied to clipboard!" || print_warning "Copy the URL manually"
    
    echo ""
    echo -e "${PURPLE}🧪 TESTING INSTRUCTIONS:${NC}"
    echo -e "${BLUE}========================${NC}"
    echo ""
    echo -e "${YELLOW}1. Open the preview URL above${NC}"
    echo -e "${YELLOW}2. Open browser console (F12)${NC}"
    echo -e "${YELLOW}3. Look for this log line:${NC}"
    echo -e "${GREEN}   🔍 HTTP Server URL detection:${NC}"
    echo -e "${GREEN}   - NEXT_PUBLIC_SIGNALING_SERVER: wss://peddlenet-websocket-server-preview-433318323150.us-central1.run.app${NC}"
    echo ""
    echo -e "${YELLOW}4. Test room stats by going to: ${PREVIEW_URL}/test-room-stats${NC}"
    echo -e "${YELLOW}5. Should show room stats without 404 errors${NC}"
    echo ""
    
else
    print_warning "Could not extract preview URL from deployment output"
    echo "Check the deployment output above for the URL"
fi

echo ""
echo -e "${PURPLE}🛠️ Management Commands:${NC}"
echo -e "${YELLOW}List channels:${NC} firebase hosting:channel:list --project festival-chat-peddlenet"
echo -e "${YELLOW}Delete channel:${NC} firebase hosting:channel:delete $PREVIEW_CHANNEL --project festival-chat-peddlenet"
echo ""
print_success "SSR-aware preview staging deployment complete!"
echo -e "${BLUE}💡 Firebase Functions environment is persistent across deployments${NC}"

# Cleanup temp file
rm -f /tmp/preview_deploy.log
