// utils/room-utils.js
'use client';

/**
 * Slugify a room name to create a short, readable room ID
 * @param roomName - The user-provided room name
 * @returns A slugified room ID (max 32 chars)
 */
export function slugifyRoomName(roomName: string): string {
  return roomName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32); // Limit to 32 characters
}

/**
 * Generate a festival-themed room name
 * @returns A random festival-themed room name
 */
export function generateFestivalRoomName(): string {
  const adjectives = ['electric', 'bass', 'neon', 'cosmic', 'vibrant', 'psychedelic', 'groovy'];
  const nouns = ['stage', 'tent', 'grove', 'meadow', 'dome', 'lounge', 'oasis'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 99) + 1;
  return `${adj}-${noun}-${num}`;
}

/**
 * Validate if a room ID is valid
 * @param roomId - The room ID to validate
 * @returns True if valid
 */
export function isValidRoomId(roomId: string): boolean {
  return /^[a-z0-9-]{1,32}$/.test(roomId);
}
