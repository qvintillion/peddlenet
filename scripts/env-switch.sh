#!/bin/bash

# Environment Configuration Manager
# Quick switching between development, staging, and production environments

set -e

COMMAND=${1:-"show"}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

show_current() {
    echo -e "${BLUE}🔍 Current Environment Configuration${NC}"
    echo "=================================="
    
    if [ -f .env.local ]; then
        if grep -q "NEXT_PUBLIC_SIGNALING_SERVER.*staging" .env.local 2>/dev/null; then
            echo -e "Environment: ${YELLOW}STAGING${NC}"
            echo "WebSocket: $(grep NEXT_PUBLIC_SIGNALING_SERVER .env.local | cut -d'=' -f2)"
        elif grep -q "NEXT_PUBLIC_SIGNALING_SERVER.*preview" .env.local 2>/dev/null; then
            echo -e "Environment: ${BLUE}PREVIEW${NC}"
            echo "WebSocket: $(grep NEXT_PUBLIC_SIGNALING_SERVER .env.local | cut -d'=' -f2)"
        elif grep -q "NEXT_PUBLIC_SIGNALING_SERVER" .env.local 2>/dev/null; then
            echo -e "Environment: ${RED}PRODUCTION${NC}"
            echo "WebSocket: $(grep NEXT_PUBLIC_SIGNALING_SERVER .env.local | cut -d'=' -f2)"
        else
            echo -e "Environment: ${GREEN}DEVELOPMENT (Local)${NC}"
            echo "WebSocket: localhost:3001 (auto-detected)"
        fi
        
        if grep -q "BUILD_TARGET" .env.local 2>/dev/null; then
            echo "Build Target: $(grep BUILD_TARGET .env.local | cut -d'=' -f2)"
        fi
    else
        echo -e "Environment: ${GREEN}DEVELOPMENT (Default)${NC}"
        echo "WebSocket: localhost:3001 (no .env.local found)"
    fi
    echo ""
}

set_development() {
    echo -e "${GREEN}🏠 Setting up DEVELOPMENT environment${NC}"
    
    cat > .env.local << EOF
# Local development environment variables
# For use with: npm run dev:mobile

# No NEXT_PUBLIC_SIGNALING_SERVER set - uses localhost:3001 automatically
# Your ServerUtils handles this: localhost detected -> uses local server

# Build target
BUILD_TARGET=local

# Development notes:
# - Leave NEXT_PUBLIC_SIGNALING_SERVER unset to use localhost:3001
# - NEXT_PUBLIC_DETECTED_IP is auto-set by scripts/dev-mobile.sh
# - ServerUtils automatically detects local development and uses local server
EOF

    echo "✅ Development environment configured"
    echo "🚀 Run: npm run dev:mobile"
    echo ""
}

set_staging() {
    echo -e "${YELLOW}🎭 Setting up STAGING environment${NC}"
    
    if [ ! -f .env.staging ]; then
        echo "❌ .env.staging not found. Deploy staging server first:"
        echo "   ./scripts/deploy-websocket-staging.sh"
        exit 1
    fi
    
    cp .env.staging .env.local
    echo "✅ Staging environment configured"
    echo "🎭 Run: npm run deploy:firebase:complete"
    echo ""
}

set_preview() {
    echo -e "${BLUE}🎆 Setting up PREVIEW environment${NC}"
    
    if [ ! -f .env.preview ]; then
        echo "❌ .env.preview not found. Deploy preview server first:"
        echo "   Contact admin for preview server setup"
        exit 1
    fi
    
    cp .env.preview .env.local
    echo "✅ Preview environment configured"
    echo "🎆 Run: npm run preview:deploy [name]"
    echo ""
}

set_production() {
    echo -e "${RED}🏭 Setting up PRODUCTION environment${NC}"
    
    if [ ! -f .env.production ]; then
        echo "❌ .env.production not found. Deploy production server first:"
        echo "   ./scripts/deploy-websocket-cloudbuild.sh"
        exit 1
    fi
    
    cp .env.production .env.local
    echo "✅ Production environment configured"
    echo "🏭 Run: ./deploy.sh"
    echo ""
}

case $COMMAND in
    "show"|"status"|"current")
        show_current
        ;;
    "dev"|"development"|"local")
        set_development
        show_current
        ;;
    "preview")
        set_preview
        show_current
        ;;
    "staging"|"stage")
        set_staging
        show_current
        ;;
    "prod"|"production")
        set_production
        show_current
        ;;
    "help"|"-h"|"--help")
        echo "Environment Configuration Manager"
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  show, current     Show current environment"
        echo "  dev, local        Set development (localhost:3001)"
        echo "  preview           Set preview environment"
        echo "  staging           Set staging environment"
        echo "  production        Set production environment"
        echo "  help              Show this help"
        echo ""
        echo "Examples:"
        echo "  $0 dev            # Setup for npm run dev:mobile"
        echo "  $0 preview        # Setup for npm run preview:deploy"
        echo "  $0 staging        # Setup for npm run deploy:firebase:complete"
        echo "  $0 production     # Setup for ./deploy.sh"
        echo "  $0 show           # See current configuration"
        ;;
    *)
        echo "❌ Unknown command: $COMMAND"
        echo "Run '$0 help' for usage information"
        exit 1
        ;;
esac
