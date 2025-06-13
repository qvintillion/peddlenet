#!/bin/bash

# 🧹 CLEAR ALL ROOM DATA SCRIPT
# This will clear all cached room data from browser storage

echo "🧹 CLEARING ALL ROOM CACHE DATA..."

# 1. Force clear all build caches
echo "🗑️ Clearing build caches..."
rm -rf .next/
rm -rf .firebase/
npm cache clean --force

# 2. Clear any room-related localStorage (when you open the app)
echo "📝 Generating localStorage clear script..."

cat > public/clear-room-cache.js << 'EOF'
// 🧹 Clear all room-related data from localStorage
console.log('🧹 Clearing all room cache data...');

// Clear recent rooms
localStorage.removeItem('peddlenet_recent_rooms');
console.log('✅ Cleared recent rooms');

// Clear room code mappings
localStorage.removeItem('peddlenet_room_codes');
console.log('✅ Cleared room code mappings');

// Clear favorite rooms
localStorage.removeItem('favoriteRooms');
console.log('✅ Cleared favorite rooms');

// Clear any other PeddleNet data
Object.keys(localStorage).forEach(key => {
    if (key.toLowerCase().includes('peddlenet') || 
        key.toLowerCase().includes('room') ||
        key.toLowerCase().includes('chat')) {
        localStorage.removeItem(key);
        console.log('✅ Cleared:', key);
    }
});

console.log('🎉 All room cache data cleared!');
alert('Room cache cleared! Please refresh the page.');
EOF

echo "✅ Created public/clear-room-cache.js"

echo ""
echo "🔥 NOW DO THIS:"
echo "1. Run: npm run preview:deploy room-fix-v3"
echo "2. Open the preview URL"
echo "3. Open browser console (F12)"
echo "4. Run: fetch('/clear-room-cache.js').then(r=>r.text()).then(eval)"
echo "5. Refresh the page"
echo "6. Check if PeddleNet room is gone"
