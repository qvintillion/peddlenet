#!/bin/bash

# 🎯 Deploy Environment-Specific WebSocket Servers
# Deploys separate WebSocket servers for preview, staging, and production

set -e

PROJECT_ID="peddlenet-1749130439"
REGION="us-central1"

echo "🎯 Deploying Environment-Specific WebSocket Servers"
echo "==================================================="

# Colors for output  
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

deploy_websocket_server() {
    local env=$1
    local service_name="peddlenet-websocket-server-${env}"
    
    echo ""
    echo -e "${BLUE}🚀 Deploying ${env} WebSocket server...${NC}"
    echo -e "${YELLOW}Service: ${service_name}${NC}"
    
    # Build and deploy using the FIXED minimal configuration (same as production)
    echo -e "${YELLOW}Using deployment/cloudbuild-minimal.yaml with Dockerfile.minimal${NC}"
    
    # Create temporary cloudbuild config for this specific environment
    local temp_cloudbuild="/tmp/cloudbuild-${env}.yaml"
    sed "s/peddlenet-websocket-server/${service_name}/g" deployment/cloudbuild-minimal.yaml > "$temp_cloudbuild"
    
    gcloud builds submit --config="$temp_cloudbuild"
    
    # Clean up temporary file
    rm -f "$temp_cloudbuild"
    
    # Get service URL
    local service_url=$(gcloud run services describe $service_name \
        --region=$REGION \
        --project=$PROJECT_ID \
        --format="value(status.url)" 2>/dev/null)
    
    local websocket_url="wss://${service_url#https://}"
    
    echo -e "${GREEN}✅ ${env} WebSocket server deployed:${NC}"
    echo -e "${YELLOW}   URL: ${websocket_url}${NC}"
    
    # Test health
    if curl -s --fail "$service_url/health" > /dev/null; then
        echo -e "${GREEN}   Health: ✅ OK${NC}"
    else
        echo -e "${RED}   Health: ❌ Failed${NC}"
    fi
    
    return 0
}

# Check gcloud auth
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "@"; then
    echo -e "${RED}❌ Not authenticated with Google Cloud${NC}"
    echo -e "${YELLOW}Please run: gcloud auth login${NC}"
    exit 1
fi

# Set project
gcloud config set project $PROJECT_ID

echo -e "${PURPLE}Deploying 3 separate WebSocket servers...${NC}"

# Deploy all environments
deploy_websocket_server "preview"
deploy_websocket_server "staging"  
deploy_websocket_server "production"

echo ""
echo -e "${GREEN}🎉 All WebSocket servers deployed successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Environment Summary:${NC}"
echo -e "${YELLOW}• Preview: peddlenet-websocket-server-preview${NC}"
echo -e "${YELLOW}• Staging: peddlenet-websocket-server-staging${NC}"  
echo -e "${YELLOW}• Production: peddlenet-websocket-server-production${NC}"
echo ""
echo -e "${PURPLE}🔄 Next Steps:${NC}"
echo -e "${YELLOW}1. Update .env.preview with preview server URL${NC}"
echo -e "${YELLOW}2. Update .env.staging with staging server URL${NC}"
echo -e "${YELLOW}3. Update .env.local with production server URL${NC}"
echo -e "${YELLOW}4. Test each environment separately${NC}"
echo ""
echo -e "${GREEN}✅ Now each environment has its own isolated WebSocket server!${NC}"
