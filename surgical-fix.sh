#!/bin/bash

echo "🎯 SURGICAL FIX - ONLY BUILD ISSUES"
echo "==================================="

echo "1. Fixing globals.css import syntax..."
cat > src/app/globals.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: #ffffff;
  --foreground: #171717;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: Arial, Helvetica, sans-serif;
}

/* Hide scrollbar but keep functionality for horizontal scrolling */
.scrollbar-hide {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;     /* Firefox */
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;             /* Chrome, Safari, Opera */
}

/* Toggle switches */
.dot {
  transition: transform 0.2s ease;
}
EOF

echo "✅ Fixed globals.css with v3 syntax"

echo "2. Testing build..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ BUILD FIXED! Your P2P work is safe!"
    git add src/app/globals.css
    git commit -m "Fix globals.css: Use Tailwind v3 syntax instead of v4"
    npm run deploy:vercel:complete
else
    echo "❌ Still broken, need to investigate further"
fi
