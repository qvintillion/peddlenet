#!/bin/bash

echo "🔄 REVERTING TO LAST WORKING STATE"
echo "=================================="

# Check what commit was 4 hours ago when build was working
echo "Finding commits from 4-5 hours ago when build was working..."
git log --since="5 hours ago" --until="3 hours ago" --oneline

# Let's see what the working state looked like
echo ""
echo "🕰️ What was the state 4 hours ago?"
git show --name-only HEAD~10
git show --name-only HEAD~15
git show --name-only HEAD~20

# Find the exact commit before I started fucking things up
echo ""
echo "📋 Recent commits to identify the breaking point:"
git log --oneline -25
