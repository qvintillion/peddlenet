// Quick fix: Create a stable peer ID that persists for QR generation
const generateStablePeerId = (roomId: string): string => {
  const storageKey = `stable_peer_id_${roomId}`;
  let peerId = localStorage.getItem(storageKey);
  
  if (!peerId) {
    // Use a more compatible UUID generation method
    const uuid = generateCompatibleUUID();
    peerId = 'stable-' + uuid.substring(0, 8);
    localStorage.setItem(storageKey, peerId);
  }
  
  return peerId;
};

// Generate UUID compatible with all environments
function generateCompatibleUUID(): string {
  // Try modern crypto.randomUUID first
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch (e) {
      // Fall through to fallback
    }
  }
  
  // Fallback: Generate UUID manually
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Generate a short random ID (good for peer IDs, message IDs)
function generateShortId(prefix = ''): string {
  const randomPart = Math.random().toString(36).substring(2, 10);
  return prefix ? `${prefix}-${randomPart}` : randomPart;
}

export { generateStablePeerId, generateCompatibleUUID, generateShortId };