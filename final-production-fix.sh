#!/bin/bash

echo "🚨 FIXING PRODUCTION BUILD - FINAL SOLUTION"
echo "============================================"

# 1. First ensure we have clean dependencies
echo "1. Cleaning node_modules..."
rm -rf node_modules
rm -f package-lock.json

# 2. Install exact dependencies  
echo "2. Installing dependencies..."
npm install

# 3. Verify Tailwind is available
echo "3. Verifying Tailwind..."
if npm list tailwindcss > /dev/null 2>&1; then
    echo "✅ Tailwind is installed correctly"
    npx tailwindcss --version
else
    echo "❌ Tailwind missing, installing specifically..."
    npm install tailwindcss@3.4.0 autoprefixer@10.4.16 postcss@8.4.32 --save-dev
fi

# 4. Test local build
echo "4. Testing build locally..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ LOCAL BUILD SUCCESSFUL!"
    echo ""
    echo "🚀 Now deploy to production:"
    echo "npm run deploy:vercel:complete"
else
    echo "❌ Local build failed. Check errors above."
    echo ""
    echo "🔧 Troubleshooting:"
    echo "1. Check that globals.css has correct Tailwind imports"
    echo "2. Verify all admin components exist"
    echo "3. Check for any missing dependencies"
fi
