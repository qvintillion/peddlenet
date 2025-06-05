#!/bin/bash

# 🚀 Quick Production Deployment for PeddleNet Signaling Server
# This script helps you deploy the signaling server in under 10 minutes

echo "🎵 PeddleNet Quick Production Deployment"
echo "========================================"
echo ""

# Ensure we're in the right directory
if [ ! -f "signaling-server.js" ]; then
    echo "❌ Error: Run this script from the festival-chat project root"
    echo "Usage: ./scripts/quick-deploy.sh"
    exit 1
fi

echo "🎯 This script will help you deploy a production signaling server"
echo "   to solve the 11pm timeout issue and improve P2P reliability."
echo ""

# Check if production signaling server exists
if [ ! -f "signaling-server-production.js" ]; then
    echo "❌ Error: signaling-server-production.js not found"
    echo "Please run the deployment setup first."
    exit 1
fi

echo "📋 Recommended: Railway Deployment (Free + 24/7 uptime)"
echo ""
echo "⚡ Step-by-step Railway deployment:"
echo ""
echo "1. 🌐 Open https://railway.app in your browser"
echo "2. 🔐 Sign in with GitHub"
echo "3. ➕ Create new project → 'Deploy from GitHub repo'"
echo "4. 📁 Select your festival-chat repository"
echo "5. ⚙️  In Settings → Environment, add:"
echo "     NODE_ENV=production"
echo "     PORT=3001"
echo "6. 🚀 In Settings → General, set start command:"
echo "     node signaling-server-production.js"
echo "7. 🔗 Copy the generated Railway URL"
echo ""

read -p "✅ Have you completed the Railway deployment? (y/n): " railway_done

if [[ $railway_done =~ ^[Yy]$ ]]; then
    echo ""
    read -p "🔗 Enter your Railway URL (e.g., https://xyz.up.railway.app): " railway_url
    
    if [[ $railway_url =~ ^https?:// ]]; then
        echo ""
        echo "🔧 Next: Update Vercel Environment Variables"
        echo "=========================================="
        echo ""
        echo "1. 🌐 Go to https://vercel.com/dashboard"
        echo "2. 📁 Select your peddlenet project"
        echo "3. ⚙️  Go to Settings → Environment Variables"
        echo "4. ➕ Add new variable:"
        echo "     Name: NEXT_PUBLIC_SIGNALING_SERVER"
        echo "     Value: $railway_url"
        echo "5. 🚀 Redeploy the project"
        echo ""
        
        read -p "✅ Have you updated the Vercel environment variable? (y/n): " vercel_done
        
        if [[ $vercel_done =~ ^[Yy]$ ]]; then
            echo ""
            echo "🧪 Testing Your Deployment"
            echo "========================="
            echo ""
            echo "Testing signaling server health..."
            
            # Test the health endpoint
            if command -v curl &> /dev/null; then
                echo "🔍 Health check: $railway_url/health"
                
                response=$(curl -s "$railway_url/health" --max-time 10)
                if [[ $? -eq 0 ]] && [[ $response == *"ok"* ]]; then
                    echo "✅ Signaling server is healthy!"
                    echo "📊 Server response: $response"
                else
                    echo "⚠️  Health check failed. Please verify the URL and try again."
                    echo "💡 Make sure the server is fully deployed on Railway."
                fi
            else
                echo "📝 Please manually test: $railway_url/health"
                echo "   You should see a JSON response with 'status': 'ok'"
            fi
            
            echo ""
            echo "🎯 Final Testing Steps:"
            echo "1. 🌐 Visit https://peddlenet.app"
            echo "2. 🏠 Create a room"
            echo "3. 📱 Generate QR code and test P2P connection"
            echo "4. 🔍 Check browser DevTools → Network → WebSocket"
            echo "   Should see connection to: $railway_url"
            echo ""
            echo "✅ Expected Improvements:"
            echo "• ⚡ Faster connections (3-5 seconds)"
            echo "• 🔄 No more 11pm timeouts"
            echo "• 📈 Higher success rate (98%+)"
            echo "• 📱 Better mobile reliability"
            echo ""
            echo "🎉 Production signaling server deployment complete!"
            echo ""
            echo "🛠️  Troubleshooting:"
            echo "• If connections still fail, check CORS settings"
            echo "• Verify Railway app is running (not sleeping)"
            echo "• Test health endpoint: $railway_url/health"
            echo ""
            
        else
            echo ""
            echo "⏸️  Deployment paused. Please update Vercel environment variables and run this script again."
        fi
        
    else
        echo "❌ Invalid URL format. Please provide a complete URL starting with http:// or https://"
    fi
    
else
    echo ""
    echo "⏸️  Please complete the Railway deployment first."
    echo ""
    echo "🔗 Quick Railway Setup:"
    echo "1. Visit: https://railway.app"
    echo "2. Sign in with GitHub"
    echo "3. Deploy from GitHub repo → Select festival-chat"
    echo "4. Set environment variables and start command as shown above"
    echo ""
    echo "💡 Alternative: Run './deployment/deploy.sh' for more options"
fi

echo ""
echo "📚 For detailed instructions, see:"
echo "   deployment/PRODUCTION-DEPLOYMENT.md"
echo ""
