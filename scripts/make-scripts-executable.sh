#!/bin/bash

# Make Essential Festival Chat Scripts Executable
# Updated for streamlined workflow (June 12, 2025)

echo "🚀 Making essential Festival Chat scripts executable..."

# Core development
chmod +x scripts/dev-mobile.sh

# Preview environment
chmod +x scripts/deploy-preview-simple.sh
chmod +x scripts/preview-manager.sh

# Deployment
chmod +x scripts/deploy-websocket-staging.sh
chmod +x scripts/deploy-websocket-cloudbuild.sh

# Main deployment script (root level)
chmod +x deploy.sh

echo "✅ Essential scripts made executable"
echo "🎆 Your streamlined deployment workflow is ready!"
echo ""
echo "📜 Available commands:"
echo "  npm run dev:mobile"
echo "  npm run preview:deploy feature-name"
echo "  npm run preview:list"
echo "  npm run preview:manage"
echo "  npm run preview:cleanup"
echo "  npm run deploy:firebase:complete"
echo "  ./deploy.sh"
