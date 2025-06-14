#!/bin/bash

# 🔧 Make Scripts Executable - Comprehensive Permission Fix
# ======================================================
# Ensures all scripts have proper execute permissions
# Run after cloning or if permissions get reset

echo "🔧 Making all scripts executable..."
echo "=================================="

# Count scripts for reporting
script_count=0
tool_count=0

# Make scripts executable
if [ -d "scripts" ]; then
    for script in scripts/*.sh; do
        if [ -f "$script" ]; then
            chmod +x "$script"
            script_count=$((script_count + 1))
        fi
    done
    echo "✅ Made $script_count scripts executable in scripts/"
else
    echo "⚠️  No scripts directory found"
fi

# Make tools executable
if [ -d "tools" ]; then
    for tool in tools/*.sh; do
        if [ -f "$tool" ]; then
            chmod +x "$tool"
            tool_count=$((tool_count + 1))
        fi
    done
    echo "✅ Made $tool_count tools executable in tools/"
else
    echo "⚠️  No tools directory found"
fi

# Make root-level scripts executable
root_count=0
for script in *.sh; do
    if [ -f "$script" ]; then
        chmod +x "$script"
        root_count=$((root_count + 1))
    fi
done

if [ $root_count -gt 0 ]; then
    echo "✅ Made $root_count scripts executable in project root"
fi

# Summary
total_count=$((script_count + tool_count + root_count))
echo ""
echo "🎉 Permission Fix Complete!"
echo "============================"
echo "📊 Total scripts made executable: $total_count"
echo "   • Scripts directory: $script_count"
echo "   • Tools directory: $tool_count" 
echo "   • Project root: $root_count"
echo ""
echo "🚀 Ready to run scripts!"
