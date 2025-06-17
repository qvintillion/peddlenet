#!/bin/bash

echo "🔍 IDENTIFYING TYPESCRIPT SYNTAX IN JAVASCRIPT FILES"
echo "===================================================="

echo ""
echo "Checking all .js and .jsx files for TypeScript syntax..."
echo ""

# Find files with TypeScript syntax
echo "❌ FILES WITH TYPESCRIPT SYNTAX PROBLEMS:"
echo "=========================================="

# Check for interface declarations
echo "🔍 Interface declarations:"
grep -r "^interface " src/ --include="*.js" --include="*.jsx" | head -10

echo ""
echo "🔍 Type annotations (function parameters):"
grep -r ": [A-Za-z]" src/ --include="*.js" --include="*.jsx" | head -10

echo ""
echo "🔍 Generic types:"
grep -r "<[A-Za-z].*>" src/ --include="*.js" --include="*.jsx" | head -10

echo ""
echo "🔍 Optional properties:"
grep -r "?:" src/ --include="*.js" --include="*.jsx" | head -10

echo ""
echo "🔍 Type imports:"
grep -r "import type" src/ --include="*.js" --include="*.jsx" | head -10

echo ""
echo "📊 SUMMARY:"
echo "==========="

# Count files with potential issues
js_files_with_colon=$(grep -r ": [A-Za-z]" src/ --include="*.js" --include="*.jsx" | wc -l)
jsx_files_with_colon=$(grep -r ": [A-Za-z]" src/ --include="*.jsx" | wc -l)
interface_count=$(grep -r "^interface " src/ --include="*.js" --include="*.jsx" | wc -l)
generic_count=$(grep -r "<[A-Za-z].*>" src/ --include="*.js" --include="*.jsx" | wc -l)

echo "Files with type annotations: $js_files_with_colon"
echo "Interface declarations: $interface_count"
echo "Generic type usage: $generic_count"

echo ""
echo "🎯 RECOMMENDATION:"
echo "=================="

if [ $js_files_with_colon -gt 0 ] || [ $interface_count -gt 0 ] || [ $generic_count -gt 0 ]; then
    echo "❌ You have TypeScript syntax in JavaScript files!"
    echo ""
    echo "SOLUTION OPTIONS:"
    echo "1. 🔄 Rename .js/.jsx files with TS syntax back to .ts/.tsx"
    echo "2. 🔧 Remove TypeScript syntax from JavaScript files"
    echo ""
    echo "Since your package.json includes TypeScript, I recommend Option 1"
else
    echo "✅ No TypeScript syntax found in JavaScript files"
fi

echo ""
echo "🔧 SPECIFIC FILES TO FIX:"
echo "========================="

# List specific files that need fixing
grep -l ": [A-Za-z]" src/ -r --include="*.js" --include="*.jsx" | while read file; do
    echo "📄 $file"
    echo "   Issues found:"
    grep -n ": [A-Za-z]" "$file" | head -3 | sed 's/^/   - /'
    echo ""
done
