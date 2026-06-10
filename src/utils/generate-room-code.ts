/**
 * Generate memorable room codes for easy sharing
 * Format: adjective-noun-number (e.g., "cosmic-dragon-42")
 */

const ADJECTIVES = [
  'happy', 'bright', 'cosmic', 'electric', 'glowing', 'radiant', 'vibrant', 'stellar',
  'lunar', 'solar', 'neon', 'crystal', 'golden', 'silver', 'rainbow', 'cosmic',
  'mystic', 'magic', 'wild', 'fierce', 'bold', 'brave', 'swift', 'clever',
  'dancing', 'flying', 'jumping', 'running', 'spinning', 'twirling', 'soaring',
  'blazing', 'shining', 'sparkling', 'glittering', 'dazzling', 'luminous',
  'purple', 'azure', 'crimson', 'emerald', 'sapphire', 'amber', 'coral', 'jade',
  'velvet', 'silk', 'satin', 'pearl', 'diamond', 'ruby', 'topaz', 'opal'
];

const NOUNS = [
  'dragon', 'phoenix', 'tiger', 'eagle', 'wolf', 'bear', 'lion', 'hawk',
  'falcon', 'raven', 'swan', 'dolphin', 'whale', 'shark', 'octopus', 'jellyfish',
  'star', 'moon', 'sun', 'comet', 'meteor', 'galaxy', 'nebula', 'aurora',
  'thunder', 'lightning', 'storm', 'wind', 'rain', 'cloud', 'rainbow', 'sunrise',
  'sunset', 'twilight', 'dawn', 'dusk', 'midnight', 'daylight', 'moonlight',
  'forest', 'ocean', 'mountain', 'river', 'valley', 'desert', 'meadow', 'garden',
  'flame', 'ember', 'spark', 'blaze', 'inferno', 'firefly', 'lantern', 'beacon'
];

/**
 * Generate a random memorable room code
 * @returns Room code in format "adjective-noun-number"
 */
export function generateRoomCode(): string {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const number = Math.floor(Math.random() * 90) + 10; // 10-99

  return `${adjective}-${noun}-${number}`;
}

/**
 * Validate if a string is a valid room code format
 * @param code - The code to validate
 * @returns True if valid format
 */
export function isValidRoomCode(code: string): boolean {
  const pattern = /^[a-z]+-[a-z]+-\d{1,2}$/i;
  return pattern.test(code.trim());
}

/**
 * Prettify a room code for display
 * @param code - Room code like "cosmic-dragon-42"
 * @returns Prettified version like "Cosmic Dragon 42"
 */
export function prettifyRoomCode(code: string): string {
  return code
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Resolve a room's display name: the locally-cached name (set when this client
 * created/cached the room) if present, otherwise the prettified room code.
 *
 * NOTE: this reads localStorage, so it must only be called in the browser
 * (event handlers, effects, or memoized render-phase reads in client
 * components). For SSR-rendered initial state, use prettifyRoomCode(roomId)
 * directly to avoid a hydration mismatch (React error #418).
 *
 * @param roomId - The room ID
 * @returns Cached display name, or prettified room code as fallback
 */
export function getRoomDisplayName(roomId: string): string {
  if (typeof window !== 'undefined') {
    const storedName = localStorage.getItem(`room:${roomId}:name`);
    if (storedName) return storedName;
  }
  return prettifyRoomCode(roomId);
}
