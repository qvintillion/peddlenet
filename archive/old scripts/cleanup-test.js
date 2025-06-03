// Quick cleanup and test script - paste in browser console

console.log('🧹 Starting cleanup and connection test...');

// 1. Clean all old presence data
const cleaned = Object.keys(localStorage).filter(k => k.startsWith('presence_v2_test_'));
cleaned.forEach(k => localStorage.removeItem(k));
console.log(`🗑️  Removed ${cleaned.length} stale presence entries`);

// 2. Force refresh peer discovery
if (typeof forceReconnect === 'function') {
  forceReconnect();
} else {
  console.log('⚠️ forceReconnect not available - refresh page manually');
}

// 3. Check signaling server connection
if (window.location.hostname === 'localhost') {
  fetch('http://localhost:3001/health')
    .then(r => r.json())
    .then(data => {
      console.log('🎵 Signaling server status:', data);
    })
    .catch(e => {
      console.log('❌ Signaling server not running - start with: npm run dev:signaling');
    });
}

// 4. Wait and check results
setTimeout(() => {
  const newPresence = Object.keys(localStorage).filter(k => k.startsWith('presence_v2_test_'));
  console.log(`📊 After cleanup: ${newPresence.length} presence entries`);
  console.log('🔍 Current peer discovery should be clean now');
}, 3000);
