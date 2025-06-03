#!/bin/bash

echo "🔍 Validating Enhanced P2P Implementation..."
echo ""

# Check if backup was created
if [ -f "src/hooks/use-p2p-optimized-backup.ts" ]; then
    echo "✅ Original P2P hook backed up"
else
    echo "❌ Original P2P hook backup not found"
fi

# Check if new P2P hook exists
if [ -f "src/hooks/use-p2p-optimized.ts" ]; then
    echo "✅ Enhanced P2P hook installed"
    
    # Check for key improvements
    if grep -q "connectionQuality" src/hooks/use-p2p-optimized.ts; then
        echo "  ✅ Connection quality monitoring"
    else
        echo "  ❌ Missing connection quality monitoring"
    fi
    
    if grep -q "messageQueueRef" src/hooks/use-p2p-optimized.ts; then
        echo "  ✅ Message queueing system"
    else
        echo "  ❌ Missing message queueing system"
    fi
    
    if grep -q "exponential" src/hooks/use-p2p-optimized.ts; then
        echo "  ✅ Exponential backoff retry logic"
    else
        echo "  ❌ Missing exponential backoff"
    fi
else
    echo "❌ Enhanced P2P hook not found"
fi

# Check debug utilities
if [ -f "src/utils/p2p-debug.ts" ]; then
    echo "✅ P2P debug utilities added"
else
    echo "❌ P2P debug utilities missing"
fi

# Check enhanced debug panel
if [ -f "src/components/DebugPanel.tsx" ]; then
    echo "✅ Debug panel exists"
    
    if grep -q "p2pHook" src/components/DebugPanel.tsx; then
        echo "  ✅ Enhanced debug panel with P2P hook integration"
    else
        echo "  ❌ Debug panel not enhanced"
    fi
else
    echo "❌ Debug panel missing"
fi

# Check chat page integration
if [ -f "src/app/chat/[roomId]/page.tsx" ]; then
    echo "✅ Chat page exists"
    
    if grep -q "P2PDebugUtils" src/app/chat/[roomId]/page.tsx; then
        echo "  ✅ Chat page integrated with debug utilities"
    else
        echo "  ❌ Chat page missing debug integration"
    fi
else
    echo "❌ Chat page missing"
fi

echo ""
echo "📋 Implementation Summary:"
echo ""

# Count lines of code added
if [ -f "src/hooks/use-p2p-optimized.ts" ]; then
    lines=$(wc -l < src/hooks/use-p2p-optimized.ts)
    echo "Enhanced P2P Hook: $lines lines"
fi

if [ -f "src/utils/p2p-debug.ts" ]; then
    lines=$(wc -l < src/utils/p2p-debug.ts)
    echo "Debug Utilities: $lines lines"
fi

if [ -f "src/components/DebugPanel.tsx" ]; then
    lines=$(wc -l < src/components/DebugPanel.tsx)
    echo "Enhanced Debug Panel: $lines lines"
fi

echo ""
echo "🎯 Key Features Added:"
echo "• Connection quality monitoring and scoring"
echo "• Exponential backoff for reconnections (2s, 4s, 8s, 16s, 30s max)"
echo "• Message queueing for offline delivery"
echo "• Versioned presence data (prevents stale connections)"
echo "• Smart peer selection based on quality metrics"
echo "• Advanced debugging tools and data export"
echo "• Real-time connection health monitoring"
echo "• Environment validation and diagnostics"
echo ""

# Check if TypeScript will compile
echo "🔍 Checking TypeScript compilation..."
if command -v npx &> /dev/null; then
    if npx tsc --noEmit --skipLibCheck 2>/dev/null; then
        echo "✅ TypeScript compilation successful"
    else
        echo "⚠️  TypeScript compilation issues detected"
        echo "   Run 'npx tsc --noEmit' for details"
    fi
else
    echo "⚠️  TypeScript not available for validation"
fi

echo ""
echo "🚀 Ready to test! Run: npm run dev"
echo "📖 See ENHANCED-P2P-GUIDE.md for detailed testing instructions"