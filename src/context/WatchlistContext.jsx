import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabaseService } from '../utils/supabaseService'; 

const WatchlistContext = createContext();

const STORAGE_KEY = 'weflix_watchlist_cache';
let debounceTimer = null; // Kutunza timeout registry kwa ajili ya localStorage I/O

export function WatchlistProvider({ children }) {
  const [watchlist, setWatchlist] = useState([]);
  const [watchlistIds, setWatchlistIds] = useState(new Set());
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  // Load from local storage initially
  useEffect(() => {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setWatchlist(parsed);
        setWatchlistIds(new Set(parsed.map(item => String(item.mediaId))));
      } catch (e) {
        console.error("Failed to parse watchlist cache", e);
      }
    }
  }, []);

  // Sync with Supabase Auth
  useEffect(() => {
    const unsubscribe = supabaseService.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setWatchlist([]);
        setWatchlistIds(new Set());
        localStorage.removeItem(STORAGE_KEY);
        setReady(true);
        return;
      }

      const pWatchlist = currentUser.watchlist || [];
      setWatchlist(pWatchlist);
      setWatchlistIds(new Set(pWatchlist.map(item => String(item.mediaId))));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pWatchlist));
      setReady(true);
    });

    return () => unsubscribe();
  }, []);

  const toggleWatchlist = useCallback(async (mediaItem, onNeedAuth) => {
    if (!user) {
      if (onNeedAuth) onNeedAuth();
      return;
    }

    const { mediaId } = mediaItem;
    const isCurrentlySaved = watchlistIds.has(String(mediaId));
    
    let newWatchlist;
    if (isCurrentlySaved) {
      newWatchlist = watchlist.filter(item => String(item.mediaId) !== String(mediaId));
    } else {
      newWatchlist = [...watchlist, mediaItem];
    }

    // Optimistic UI Update
    setWatchlist(newWatchlist);
    setWatchlistIds(new Set(newWatchlist.map(item => String(item.mediaId))));
    
    // Debounce localStorage writes (Performance Optimization)
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newWatchlist));
    }, 500);

    // Update Supabase
    try {
      await supabaseService.updateWatchlist(newWatchlist);
    } catch (error) {
      console.error("Error updating watchlist in Supabase", error);
    }
  }, [user, watchlist, watchlistIds]);

  return (
    <WatchlistContext.Provider value={{ watchlist, watchlistIds, toggleWatchlist, ready, user }}>
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist() {
  return useContext(WatchlistContext);
}
