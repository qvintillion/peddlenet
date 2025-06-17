'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useBackgroundNotifications } from '../hooks/use-background-notifications';
import { RoomCodeManager } from '../utils/room-codes';

interface FavoriteRoom {
  roomId: string;
  code: string;
  timestamp: number;
  isSubscribed?: boolean;
}

interface FavoritesProps {
  className?: string;
}

export function JoinedRooms({ className = '' }: FavoritesProps) {
  const router = useRouter();
  const [favoritesKey, setFavoritesKey] = useState(0);
  const { subscriptions, subscribeToRoom, unsubscribeFromRoom } = useBackgroundNotifications();
  const subscriptionsRef = useRef(subscriptions);
  
  // Update ref when subscriptions change
  useEffect(() => {
    subscriptionsRef.current = subscriptions;
  }, [subscriptions]);

  // Listen for favorites changes from other components
  useEffect(() => {
    const handleFavoritesChange = () => {
      setFavoritesKey(prev => prev + 1);
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('favoritesChanged', handleFavoritesChange);
      return () => window.removeEventListener('favoritesChanged', handleFavoritesChange);
    }
  }, []);

  // Memoize favorite rooms to prevent unnecessary re-renders
  const favoriteRooms = useMemo(() => {
    const recentRooms = RoomCodeManager.getRecentRoomCodes();
    const favorites = JSON.parse(localStorage.getItem('favoriteRooms') || '[]');
    
    // Show only rooms that are explicitly favorited
    const favoriteRoomsList = recentRooms
      .filter(room => favorites.includes(room.roomId))
      .map(room => {
        const subscription = subscriptions.find(sub => sub.roomId === room.roomId);
        const isSubscribed = subscription ? subscription.subscribed : false;
        
        return {
          ...room,
          isSubscribed
        };
      });
    
    return favoriteRoomsList;
  }, [favoritesKey, subscriptions]); // Use both dependencies

  const handleRejoinRoom = (roomId: string) => {
    router.push(`/chat/${roomId}`);
  };

  const handleRemoveRoom = (roomId: string) => {
    if (confirm('Remove this room from your favorites?')) {
      // Remove from favorites list
      const favorites = JSON.parse(localStorage.getItem('favoriteRooms') || '[]');
      const updatedFavorites = favorites.filter((id: string) => id !== roomId);
      localStorage.setItem('favoriteRooms', JSON.stringify(updatedFavorites));
      
      // Also unsubscribe from notifications if subscribed
      const isSubscribed = subscriptions.some(sub => sub.roomId === roomId && sub.subscribed);
      if (isSubscribed) {
        unsubscribeFromRoom(roomId);
      }
      
      // Trigger re-render by updating the key
      setFavoritesKey(prev => prev + 1);
      
      // Dispatch custom event to notify other components (like FavoriteButton)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('favoritesChanged'));
      }
    }
  };

  const clearAllRooms = () => {
    if (confirm('Clear all favorite rooms? This will also unsubscribe you from notifications.')) {
      // Clear the favorites list
      localStorage.setItem('favoriteRooms', JSON.stringify([]));
      
      // Unsubscribe from all notifications
      favoriteRooms.forEach(room => {
        if (room.isSubscribed) {
          unsubscribeFromRoom(room.roomId);
        }
      });
      
      // Force re-render
      setFavoritesKey(prev => prev + 1);
      
      // Dispatch custom event to notify other components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('favoritesChanged'));
      }
    }
  };

  if (favoriteRooms.length === 0) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-lg font-semibold text-white">Favorites</h4>
        </div>
        <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-600/50 text-center">
          <div className="text-4xl mb-2">💜</div>
          <p className="text-sm text-gray-400 mb-1">No favorite rooms yet</p>
          <p className="text-xs text-gray-500">
            Click the ❤️ button in any chat room to add it to favorites
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`} key={favoritesKey}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-lg font-semibold text-white">Favorites</h4>
      </div>
      
      {/* Horizontal Scrolling Cards */}
      <div className="flex space-x-3 overflow-x-auto pb-3 scrollbar-hide">
        {favoriteRooms.map((room) => (
          <div
            key={room.roomId}
            className="flex-shrink-0 min-w-[160px] bg-gray-800 rounded-lg border border-gray-600 hover:border-purple-500 transition-all relative"
          >
            {/* Remove Button */}
            <button
              onClick={() => handleRemoveRoom(room.roomId)}
              className="absolute top-2 right-2 w-6 h-6 bg-gray-600 hover:bg-red-600 rounded-full flex items-center justify-center text-xs text-white transition-colors z-10"
            >
              ×
            </button>
            
            <div className="p-4 pr-8">
              {/* Room Info */}
              <div className="text-xs text-gray-300 mb-1 truncate" title={room.roomId}>
                {room.roomId}
              </div>
              <div className="font-mono text-sm font-medium text-purple-400 mb-2">
                {room.code}
              </div>
              <div className="text-xs text-gray-400 mb-3">
                {RoomCodeManager.formatTimeAgo(room.timestamp)}
              </div>
              
              {/* Notification Status Indicator */}
              <div className="flex items-center space-x-2 mb-3">
                <div className="flex items-center space-x-1.5">
                  <div 
                    className={`w-2 h-2 rounded-full ${
                      room.isSubscribed ? 'bg-green-400' : 'bg-gray-400'
                    }`}
                    title={room.isSubscribed ? 'Notifications enabled' : 'Notifications disabled'}
                  />
                  <span className={`text-xs ${
                    room.isSubscribed ? 'text-green-400' : 'text-gray-400'
                  }`}>
                    {room.isSubscribed ? '🔔' : '🔕'}
                  </span>
                  <span className={`text-xs ${
                    room.isSubscribed ? 'text-green-400' : 'text-gray-400'
                  }`}>
                    {room.isSubscribed ? 'On' : 'Off'}
                  </span>
                </div>
              </div>
              
              {/* Enter Button */}
              <button
                onClick={() => handleRejoinRoom(room.roomId)}
                className="w-full py-2 px-3 bg-white text-purple-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
              >
                Enter
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
