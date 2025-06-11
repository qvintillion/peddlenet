#!/bin/bash

# 🧪 Comprehensive Package Warnings Test
# Tests both local development and Docker server package fixes

echo "🧪 Testing all package deprecation warnings fixes..."
echo "=================================================="

# Test 1: Local development package health
echo ""
echo "📦 Test 1: Local Development Package Health"
echo "-------------------------------------------"
npm run package:check-health

# Test 2: Server package health
echo ""
echo "🐳 Test 2: Docker Server Package Health"
echo "---------------------------------------"
npm run package:test-server

# Test 3: Quick deployment verification
echo ""
echo "🚀 Test 3: Deployment Scripts Verification"
echo "------------------------------------------"
echo "✅ Available deployment scripts:"
echo "  npm run deploy:firebase:super-quick  (fastest, 1-2 min)"
echo "  npm run deploy:firebase:quick        (standard, 2-3 min)"
echo "  npm run deploy:firebase:complete     (full stack, 5-8 min)"

echo ""
echo "🔍 Checking script configuration..."
SCRIPT_1=$(grep -o "firebase deploy --only [^\"]*" tools/deploy-firebase-super-quick.sh 2>/dev/null || echo "Script not found")
SCRIPT_2=$(grep -o "firebase deploy --only [^\"]*" tools/deploy-firebase-quick.sh 2>/dev/null || echo "Script not found")

if [[ $SCRIPT_1 == *"hosting,functions"* ]]; then
    echo "✅ deploy:firebase:super-quick deploys hosting + functions"
else
    echo "❌ deploy:firebase:super-quick may not deploy hosting: $SCRIPT_1"
fi

if [[ $SCRIPT_2 == *"hosting,functions"* ]]; then
    echo "✅ deploy:firebase:quick deploys hosting + functions"
else
    echo "❌ deploy:firebase:quick may not deploy hosting: $SCRIPT_2"
fi

# Test 4: Docker build simulation
echo ""
echo "🐳 Test 4: Docker Build Simulation"
echo "----------------------------------"
if [ -f "package-server.json" ]; then
    echo "✅ package-server.json exists"
    
    # Check if server package has overrides
    if grep -q "overrides" package-server.json; then
        echo "✅ package-server.json has overrides"
        echo "📋 Server overrides:"
        grep -A 10 "overrides" package-server.json | grep -E '(npmlog|are-we-there-yet|gauge)' | sed 's/^/    /'
    else
        echo "❌ package-server.json missing overrides"
    fi
    
    # Check if Dockerfile uses server package
    if grep -q "package-server.json.*package.json" Dockerfile; then
        echo "✅ Dockerfile uses package-server.json"
    else
        echo "❌ Dockerfile may not use package-server.json"
    fi
else
    echo "❌ package-server.json not found"
fi

# Test 5: Summary and recommendations
echo ""
echo "📊 Summary and Recommendations"
echo "==============================="

echo "🎯 Expected Results After Fixes:"
echo "  ✅ Local npm install: Significantly fewer warnings"
echo "  ✅ Docker builds: No 'npmlog', 'gauge', 'are-we-there-yet' warnings"
echo "  ✅ Firebase deployments: Clean output without deprecated package noise"
echo "  ✅ Faster builds: Smaller dependency trees"

echo ""
echo "🚀 Next Steps:"
echo "  1. Run 'npm run deploy:firebase:complete' to test Docker fix"
echo "  2. Monitor Cloud Run build logs for clean output"
echo "  3. Verify no deprecation warnings in deployment"

echo ""
echo "📚 Documentation:"
echo "  📄 Local fix details: docs/PACKAGE-WARNINGS-FIX-JUNE-2025.md"
echo "  🐳 Docker fix details: docs/DOCKER-PACKAGE-WARNINGS-FIX-JUNE-2025.md"

echo ""
echo "✅ Comprehensive package warnings test complete!"
