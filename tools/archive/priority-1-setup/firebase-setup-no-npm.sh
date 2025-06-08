#!/bin/bash

# Firebase Setup Without npm Install
# Bypasses npm cache issues by using alternative installation methods

set -e

echo "🔥 Firebase Setup (npm cache bypass)"
echo "===================================="

# Function to test if Firebase CLI works
test_firebase() {
    if command -v firebase &> /dev/null; then
        echo "✅ Firebase CLI found globally"
        firebase --version
        return 0
    elif npx --yes firebase-tools --version &> /dev/null 2>&1; then
        echo "✅ Firebase CLI available via npx"
        npx --yes firebase-tools --version
        return 0
    else
        return 1
    fi
}

# Try different Firebase CLI options
echo "🔍 Testing Firebase CLI availability..."

if test_firebase; then
    echo "✅ Firebase CLI is working!"
    FIREBASE_CMD="firebase"
    if ! command -v firebase &> /dev/null; then
        FIREBASE_CMD="npx --yes firebase-tools"
    fi
else
    echo "⚠️  Firebase CLI not found. Let's try alternative installations..."
    
    # Try homebrew (Mac)
    if command -v brew &> /dev/null; then
        echo "🍺 Trying Homebrew installation..."
        if brew install firebase-cli; then
            FIREBASE_CMD="firebase"
            echo "✅ Firebase CLI installed via Homebrew"
        else
            echo "❌ Homebrew installation failed"
        fi
    fi
    
    # Fallback to npx with --yes flag (forces download)
    if [ -z "${FIREBASE_CMD}" ]; then
        echo "📦 Using npx with force download..."
        FIREBASE_CMD="npx --yes firebase-tools"
        echo "✅ Will use: $FIREBASE_CMD"
    fi
fi

# Test the chosen Firebase command
echo "🧪 Testing Firebase command: $FIREBASE_CMD"
if $FIREBASE_CMD --version; then
    echo "✅ Firebase CLI working!"
else
    echo "❌ Firebase CLI still not working"
    echo "💡 Manual setup required - see instructions below"
    exit 1
fi

# Check authentication
echo "🔑 Checking Firebase authentication..."
if $FIREBASE_CMD login:list > /dev/null 2>&1; then
    echo "✅ Already logged in to Firebase"
    $FIREBASE_CMD login:list
else
    echo "🔑 Please log in to Firebase:"
    $FIREBASE_CMD login
fi

# List projects
echo "📋 Your Firebase projects:"
$FIREBASE_CMD projects:list

# Test Next.js build for Firebase
echo "🏗️  Testing Next.js build for Firebase..."
if BUILD_TARGET=firebase npm run build > /dev/null 2>&1; then
    echo "✅ Firebase build successful!"
    
    if [ -d "out" ]; then
        echo "📁 Static files ready in 'out' directory"
        echo "📊 Files: $(find out -type f | wc -l)"
        echo "📦 Size: $(du -sh out | cut -f1)"
    fi
else
    echo "⚠️  Firebase build had issues, but continuing..."
    echo "💡 You may need to fix build issues before deploying"
fi

# Show next steps
echo ""
echo "🎉 Firebase Setup Complete!"
echo "=========================="
echo "Firebase Command: $FIREBASE_CMD"
echo ""
echo "📝 Next steps:"
echo "1. Initialize Firebase project:"
echo "   $FIREBASE_CMD init"
echo ""
echo "2. Build for Firebase:"
echo "   BUILD_TARGET=firebase npm run build"
echo ""
echo "3. Deploy to Firebase:"
echo "   $FIREBASE_CMD deploy --only hosting"
echo ""
echo "4. For Firebase Studio, visit:"
echo "   https://console.firebase.google.com/"
echo ""

# Create wrapper script for easy Firebase access
echo "🔧 Creating Firebase wrapper script..."
cat > firebase-local.sh << EOF
#!/bin/bash
# Local Firebase CLI wrapper
$FIREBASE_CMD "\$@"
EOF

chmod +x firebase-local.sh

echo "✅ Created firebase-local.sh wrapper"
echo "💡 Use './firebase-local.sh [command]' for Firebase commands"
