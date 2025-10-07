#!/bin/bash
# Investigate Vercel GitHub Connection

echo "🔍 Investigating Vercel GitHub Connection"
echo "========================================="
echo ""

# Check git remote
echo "📡 Git Remote Configuration:"
git remote -v
echo ""

# Check current branch
echo "🌿 Current Branch:"
git branch --show-current
echo ""

# Check git status
echo "📊 Git Status:"
git status --short
echo ""

# Check if .vercel directory exists
echo "📁 Vercel Project Configuration:"
if [ -d ".vercel" ]; then
    echo "✅ .vercel directory exists"
    if [ -f ".vercel/project.json" ]; then
        echo "📄 Project config:"
        cat .vercel/project.json
    fi
else
    echo "❌ No .vercel directory found"
fi
echo ""

# Check if there are uncommitted changes
echo "🔄 Uncommitted Changes:"
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  You have uncommitted changes:"
    git status --short
else
    echo "✅ No uncommitted changes"
fi
echo ""

# Check last commit
echo "📝 Last Commit:"
git log -1 --oneline
echo ""

# Instructions
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 What This Means:"
echo ""
echo "If Vercel deployments are 'linked to GitHub':"
echo "✅ This is NORMAL and GOOD"
echo "✅ Vercel watches your GitHub repo"
echo "✅ Auto-deploys on push to main"
echo "✅ Auto-creates previews for branches"
echo ""
echo "How Vercel Works:"
echo "1. You push to GitHub"
echo "2. Vercel detects the push"
echo "3. Vercel builds and deploys"
echo "4. You get a deployment URL"
echo ""
echo "This is the CORRECT setup!"
echo ""
echo "To Deploy:"
echo "  Production → git push origin main"
echo "  Preview → git push origin [branch-name]"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
