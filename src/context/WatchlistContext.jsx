import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase'; 

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

  // Sync with Firebase Auth and Firestore
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setWatchlist([]);
        setWatchlistIds(new Set());
        localStorage.removeItem(STORAGE_KEY);
        setReady(true);
        return;
      }

      // Listen to Firestore
      const docRef = doc(db, 'users', currentUser.uid);
      const unsubscribeSnapshot = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const pWatchlist = data.watchlist || [];
          setWatchlist(pWatchlist);
          setWatchlistIds(new Set(pWatchlist.map(item => String(item.mediaId))));
          localStorage.setItem(STORAGE_KEY, JSON.stringify(pWatchlist));
        } else {
          setWatchlist([]);
          setWatchlistIds(new Set());
          localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
        }
        setReady(true);
      }, (error) => {
        console.error("Firestore watchlist sync error:", error);
        setReady(true);
      });

      return () => unsubscribeSnapshot();
    });

    return () => unsubscribeAuth();
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

    // Update Firestore
    try {
      const docRef = doc(db, 'users', user.uid);
      await setDoc(docRef, { watchlist: newWatchlist }, { merge: true });
    } catch (error) {
      console.error("Error updating watchlist in Firestore", error);
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
