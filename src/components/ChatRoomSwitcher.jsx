'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { RoomCodeManager } from '../utils/room-codes';
import { useUnreadMessages } from '../hooks/use-unread-messages';

interface ChatRoomSwitcherProps {
  currentRoomId: string;
  className?: string;
}

interface SwitcherRoom {
  roomId: string;
  code: string;
  timestamp: number;
  isFavorite: boolean;
  isRecent: boolean;
}

export function ChatRoomSwitcher({ currentRoomId, className = '' }: ChatRoomSwitcherProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<SwitcherRoom[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { getUnreadCount } = useUnreadMessages();

  // Load available rooms (favorites + 1 most recent)
  useEffect(() => {
    const loadAvailableRooms = () => {
      try {
        // Get favorites
        const favorites = JSON.parse(localStorage.getItem('favoriteRooms') || '[]') as string[];
        
        // Get recent rooms
        const recentRooms = RoomCodeManager.getRecentRoomCodes();
        
        // Create a map of all unique rooms
        const roomMap = new Map<string, SwitcherRoom>();
        
        // Add favorites
        favorites.forEach(roomId => {
          const roomData = recentRooms.find(r => r.roomId === roomId);
          if (roomData && roomId !== currentRoomId) {
            roomMap.set(roomId, {
              roomId,
              code: roomData.code,
              timestamp: roomData.timestamp,
              isFavorite: true,
              isRecent: false
            });
          }
        });
        
        // Add 1 most recent room (that's not current and not already favorited)
        const mostRecentRoom = recentRooms.find(room => 
          room.roomId !== currentRoomId && !favorites.includes(room.roomId)
        );
        
        if (mostRecentRoom) {
          roomMap.set(mostRecentRoom.roomId, {
            roomId: mostRecentRoom.roomId,
            code: mostRecentRoom.code,
            timestamp: mostRecentRoom.timestamp,
            isFavorite: false,
            isRecent: true
          });
        }
        
        // Convert to array and sort (favorites first, then by timestamp)
        const roomsArray = Array.from(roomMap.values()).sort((a, b) => {
          if (a.isFavorite && !b.isFavorite) return -1;
          if (!a.isFavorite && b.isFavorite) return 1;
          return b.timestamp - a.timestamp;
        });
        
        setAvailableRooms(roomsArray);
      } catch (error) {
        console.warn('Error loading available rooms:', error);
        setAvailableRooms([]);
      }
    };

    loadAvailableRooms();

    // Listen for favorites changes
    const handleFavoritesChange = () => {
      loadAvailableRooms();
    };

    window.addEventListener('favoritesChanged', handleFavoritesChange);
    return () => window.removeEventListener('favoritesChanged', handleFavoritesChange);
  }, [currentRoomId, getUnreadCount]); // Add getUnreadCount to trigger re-render when unread counts change

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        // Check if the click is not on the portal content either
        const portalContent = document.querySelector('[data-dropdown-portal="true"]');
        if (!portalContent || !portalContent.contains(event.target as Node)) {
          setIsOpen(false);
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Debug logging for dropdown positioning
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      console.log('📍 Dropdown button position:', {
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right,
        calculatedDropdownTop: rect.bottom + 12
      });
    }
  }, [isOpen]);

  const handleRoomSwitch = (roomId: string) => {
    setIsOpen(false);
    router.push(`/chat/${roomId}`);
  };

  const truncateRoomId = (roomId: string, maxLength: number = 20) => {
    if (roomId.length <= maxLength) return roomId;
    return roomId.substring(0, maxLength - 3) + '...';
  };

  // Check if any of the available rooms have unread messages for button styling
  const hasUnreadMessages = availableRooms.some(room => getUnreadCount(room.roomId) > 0);
  // Always show dropdown now - even with no other rooms, we want "View all rooms" option
  const shouldShowDropdown = true;

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Room Display - Always show dropdown now for "View all rooms" access */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-3 py-2 bg-gray-800/50 rounded-lg border transition-all relative ${
          hasUnreadMessages 
            ? 'hover:bg-gray-700/50 border-orange-500/50 hover:border-orange-400/50 cursor-pointer' 
            : 'hover:bg-gray-700/50 border-gray-600/50 hover:border-purple-500/50 cursor-pointer'
        }`}
        title="Switch room or view all rooms"
      >
        <span className="text-sm text-white truncate max-w-[150px]">
          🎪 {truncateRoomId(currentRoomId)}
        </span>
        
        {/* Always show dropdown arrow now */}
        <svg 
          width="12" 
          height="12" 
          viewBox="0 0 12 12" 
          fill="currentColor" 
          className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        
        {/* Unread indicator dot */}
        {hasUnreadMessages && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-gray-900" />
        )}
      </button>

      {/* Dropdown Menu - Always show when open, even with no other rooms */}
      {isOpen && typeof window !== 'undefined' && createPortal(
        <>
          {/* Backdrop to block content behind - no click handler */}
          <div className="fixed inset-0 z-[999998] bg-black/20" />
          
          <div 
            className="fixed left-3 w-64 border border-gray-600 rounded-lg shadow-2xl z-[999999] overflow-hidden" 
            data-dropdown-portal="true"
            style={{ 
              backgroundColor: '#111827',
              top: dropdownRef.current ? dropdownRef.current.getBoundingClientRect().bottom + 12 : '70px',
              minHeight: '80px' // Ensure minimum height so it's always visible
            }}>
            <div className="p-2 border-b border-gray-700" style={{ backgroundColor: '#111827' }}>
              <h4 className="text-xs font-medium text-gray-400">
                {availableRooms.length > 0 ? 'Switch Room' : 'Room Options'}
              </h4>
            </div>
            
            {/* Show available rooms if any */}
            {availableRooms.length > 0 && (
              <div className="max-h-64 overflow-y-auto" style={{ backgroundColor: '#111827' }}>
                {availableRooms.map((room, index) => (
                  <button
                    key={room.roomId}
                    onClick={() => handleRoomSwitch(room.roomId)}
                    className="w-full p-3 text-left hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0 relative"
                    style={{ 
                      backgroundColor: '#111827', 
                      opacity: 1,
                      position: 'relative',
                      zIndex: 1000000 + index,
                      boxShadow: 'inset 0 0 0 1000px #111827'
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium text-white truncate">
                            {truncateRoomId(room.roomId, 18)}
                          </span>
                          {room.isFavorite && (
                            <span className="text-red-400 text-xs" title="Favorite">❤️</span>
                          )}
                          {room.isRecent && (
                            <span className="text-blue-400 text-xs" title="Recent">🕐</span>
                          )}
                          
                          {/* Unread message pill */}
                          {(() => {
                            const unreadCount = getUnreadCount(room.roomId);
                            if (unreadCount > 0) {
                              return (
                                <span 
                                  className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-orange-500 text-white text-xs font-bold rounded-full"
                                  title={`${unreadCount} unread message${unreadCount === 1 ? '' : 's'}`}
                                >
                                  {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                              );
                            }
                            return null;
                          })()} 
                        </div>
                        <div className="font-mono text-xs text-purple-400 mb-1">
                          {room.code}
                        </div>
                        <div className="text-xs text-gray-500">
                          {RoomCodeManager.formatTimeAgo(room.timestamp)}
                        </div>
                      </div>
                      
                      <div className="flex-shrink-0 ml-2">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" className="text-gray-400">
                          <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            
            {/* Always show "View All Rooms" option */}
            <div className={`p-2 ${availableRooms.length > 0 ? 'border-t border-gray-700' : ''}`} style={{ backgroundColor: '#111827' }}>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🔍 View all rooms button clicked');
                  
                  // Close dropdown immediately
                  setIsOpen(false);
                  
                  // Navigate immediately without delay
                  console.log('🔍 Navigating to: /?mode=join');
                  try {
                    router.push('/?mode=join');
                    console.log('🔍 Navigation initiated successfully');
                  } catch (error) {
                    console.error('🔍 Navigation error:', error);
                    // Fallback to window.location
                    window.location.href = '/?mode=join';
                  }
                }}
                className="w-full text-sm text-purple-400 hover:text-purple-300 py-2 px-2 transition-colors text-center font-medium rounded-md hover:bg-gray-700/50"
                type="button"
              >
                🔍 View all rooms
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
