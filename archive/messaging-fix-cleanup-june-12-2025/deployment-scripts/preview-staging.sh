#!/bin/bash

# 🎭 Festival Chat - Preview Staging Deployment Script
# Deploy to Firebase preview channels for testing features
#
# Usage: ./preview-staging.sh <feature-name>
# This creates a preview channel for testing UI fixes, bigger features, and when you need to test notifications
# Uses .env.preview environment (preview server) for real environment testing
#
# Examples:
#   ./preview-staging.sh room-codes      → Creates preview-room-codes channel
#   ./preview-staging.sh mobile-ui       → Creates preview-mobile-ui channel
#   ./preview-staging.sh notification-fix → Creates preview-notification-fix channel

set -e  # Exit on any error

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

print_status "Starting preview staging deployment for feature: ${FEATURE_NAME}"
print_status "Preview channel: ${PREVIEW_CHANNEL}"

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    print_error "Firebase CLI is not installed. Please install it first:"
    echo "  npm install -g firebase-tools"
    exit 1
fi

# Check if logged into Firebase
if ! firebase projects:list &> /dev/null; then
    print_error "Please login to Firebase first:"
    echo "  firebase login"
    exit 1
fi

# Show current environment
print_status "Environment configuration:"
echo "  📁 Working directory: $(pwd)"
echo "  🌿 Git branch: $(git branch --show-current 2>/dev/null || echo 'unknown')"
echo "  🔧 Node version: $(node --version)"
echo "  📦 npm version: $(npm --version)"

# Check if .env.preview exists
if [ ! -f ".env.preview" ]; then
    print_warning ".env.preview not found, creating from