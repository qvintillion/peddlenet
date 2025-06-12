#!/bin/bash

# 🎪 Festival Chat - Preview Channel Management
# Utility script for managing Firebase preview channels

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

PROJECT_ID="festival-chat-peddlenet"

echo -e "${PURPLE}🎪 Festival Chat Preview Channel Manager${NC}"
echo -e "${BLUE}======================================${NC}"

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}❌ Firebase CLI not found. Please install: npm install -g firebase-tools${NC}"
    exit 1
fi

# Function to list all preview channels
list_channels() {
    echo -e "${BLUE}📋 Listing all preview channels:${NC}"
    firebase hosting:channel:list --project "$PROJECT_ID"
}

# Function to delete expired channels
cleanup_expired() {
    echo -e "${YELLOW}🧹 Cleaning up expired channels...${NC}"
    echo -e "${BLUE}Note: This will show channels but won't auto-delete. Manual deletion required.${NC}"
    firebase hosting:channel:list --project "$PROJECT_ID"
}

# Function to delete a specific channel
delete_channel() {
    if [ -z "$1" ]; then
        echo -e "${RED}❌ Please provide a channel ID to delete${NC}"
        echo -e "${YELLOW}Usage: $0 delete <channel-id>${NC}"
        return 1
    fi
    
    echo -e "${YELLOW}🗑️ Deleting channel: $1${NC}"
    firebase hosting:channel:delete "$1" --project "$PROJECT_ID" --force
    echo -e "${GREEN}✅ Channel deleted successfully${NC}"
}

# Function to open a specific channel
open_channel() {
    if [ -z "$1" ]; then
        echo -e "${RED}❌ Please provide a channel ID to open${NC}"
        echo -e "${YELLOW}Usage: $0 open <channel-id>${NC}"
        return 1
    fi
    
    echo -e "${BLUE}🌐 Opening channel: $1${NC}"
    
    # Get the channel URL using Firebase CLI
    CHANNEL_INFO=$(firebase hosting:channel:list --project "$PROJECT_ID" --json 2>/dev/null)
    
    if [ $? -eq 0 ] && [ -n "$CHANNEL_INFO" ]; then
        # Try to extract URL from JSON (requires jq if available)
        if command -v jq &> /dev/null; then
            CHANNEL_URL=$(echo "$CHANNEL_INFO" | jq -r ".[] | select(.name == \"$1\") | .url" 2>/dev/null)
            if [ -n "$CHANNEL_URL" ] && [ "$CHANNEL_URL" != "null" ]; then
                echo -e "${GREEN}🔗 Channel URL: ${CHANNEL_URL}${NC}"
                open "$CHANNEL_URL" 2>/dev/null || {
                    echo -e "${YELLOW}⚠️  Could not auto-open browser. Please manually visit:${NC}"
                    echo -e "${GREEN}${CHANNEL_URL}${NC}"
                }
                return 0
            fi
        fi
    fi
    
    # Fallback: construct URL manually
    CONSTRUCTED_URL="https://${PROJECT_ID}--${1}.web.app"
    echo -e "${YELLOW}🔗 Trying constructed URL: ${CONSTRUCTED_URL}${NC}"
    
    # Use our custom Chrome profile opener if available
    if [ -f "scripts/open-in-chrome-profile.sh" ]; then
        chmod +x scripts/open-in-chrome-profile.sh
        ./scripts/open-in-chrome-profile.sh "$CONSTRUCTED_URL"
    else
        open "$CONSTRUCTED_URL" 2>/dev/null || {
            echo -e "${YELLOW}⚠️  Could not auto-open browser. Please manually visit:${NC}"
            echo -e "${GREEN}${CONSTRUCTED_URL}${NC}"
        }
    fi
}

# Main command handling
case "$1" in
    "list"|"ls")
        list_channels
        ;;
    "cleanup"|"clean")
        cleanup_expired
        ;;
    "delete"|"del"|"rm")
        delete_channel "$2"
        ;;
    "open")
        open_channel "$2"
        ;;
    "help"|"--help"|"-h"|"")
        echo -e "${GREEN}Available commands:${NC}"
        echo -e "  ${YELLOW}list, ls${NC}          - List all preview channels"
        echo -e "  ${YELLOW}cleanup, clean${NC}     - Show expired channels for manual cleanup"
        echo -e "  ${YELLOW}delete, del, rm${NC}    - Delete a specific channel"
        echo -e "  ${YELLOW}open${NC}               - Open a specific channel in browser"
        echo -e "  ${YELLOW}help${NC}               - Show this help message"
        echo ""
        echo -e "${BLUE}Examples:${NC}"
        echo -e "  ${YELLOW}$0 list${NC}"
        echo -e "  ${YELLOW}$0 delete pr-123${NC}"
        echo -e "  ${YELLOW}$0 open manual-20250611${NC}"
        ;;
    *)
        echo -e "${RED}❌ Unknown command: $1${NC}"
        echo -e "${YELLOW}Use '$0 help' to see available commands${NC}"
        exit 1
        ;;
esac
