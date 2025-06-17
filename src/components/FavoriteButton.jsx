'use client';

import React, { useState, useEffect } from 'react';
import { useBackgroundNotifications } from '../hooks/use-background-notifications';

interface FavoriteButtonProps {
  roomId: string;
  displayName: string;
  className?: string;
}

export function FavoriteButton({ roomId, displayName, className = '' }: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const { subscriptions, subscribeToRoom, unsubscribeFromRoom } = useBackgroundNotifications();
  
  const isSubscribed = subscriptions.some(sub => sub.roomId === roomId && sub.subscribed);

  // Check if room is favorited
  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem('favoriteRooms') || '[]');
    setIsFavorite(favorites.includes(roomId));
  }, [roomId]);

  const handleToggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('favoriteRooms') || '[]');
    
    if (isFavorite) {
      // Remove from favorites AND unsubscribe from notifications
      const updatedFavorites = favorites.filter((id: string) => id !== roomId);
      localStorage.setItem('favoriteRooms', JSON.stringify(updatedFavorites));
      
      if (isSubscribed) {
        unsubscribeFromRoom(roomId);
      }
      
      setIsFavorite(false);
      
      // Dispatch custom event to notify Favorites component
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('favoritesChanged'));
      }
    } else {
      // Add to favorites AND subscribe to notifications
      if (!favorites.includes(roomId)) {
        const updatedFavorites = [...favorites, roomId];
        localStorage.setItem('favoriteRooms', JSON.stringify(updatedFavorites));
      }
      
      // Subscribe to notifications
      subscribeToRoom(roomId, displayName);
      
      setIsFavorite(true);
      
      // Dispatch custom event to notify Favorites component
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('favoritesChanged'));
      }
    }
  };

  return (
    <button
      onClick={handleToggleFavorite}
      className={`p-2 rounded-lg transition ${
        isFavorite 
          ? 'bg-red-600 text-white hover:bg-red-700' 
          : 'bg-gray-600 text-white hover:bg-gray-700'
      } ${className}`}
      title={isFavorite ? 'Remove from favorites' : 'Add to favorites & enable notifications'}
    >
      {isFavorite ? '❤️' : '🤍'}
    </button>
  );
}
