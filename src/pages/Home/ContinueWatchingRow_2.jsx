import React, { useRef, useState, useEffect, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlay, FaTimes } from 'react-icons/fa';
import { supabaseService } from '../../utils/supabaseService';

const STORAGE_KEY = 'agreyflix_continue_watching_cache';

// Mockup Data for UI Preview
const MOCK_CONTINUE_WATCHING = [];

const ContinueWatchingCard = memo(({ item, handleCardClick, handleRemove }) => (
  <div 
    className="shrink-0 w-[240px] md:w-[280px] group relative rounded-xl overflow-hidden ring-1 ring-white/10 hover:ring-white/30 transition-all select-none bg-[#0d1117]"
    onClick={() => handleCardClick(item)}
  >
    <div className="w-full aspect-[16/9] relative bg-[#111827]">
      <img 
        src={item.backdrop_path === '/placeholder.svg' ? 'https://placehold.co/600x338/1e293b/a5b4fc?text='+encodeURIComponent(item.title) : `https://image.tmdb.org/t/p/w500${item.backdrop_path}`} 
        alt={item.title} 
        className="w-full h-full object-cover" 
        draggable={false}
      />
      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-12 h-12 rounded-full bg-red-600 shadow-lg flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform">
          <FaPlay className="text-white ml-1 text-sm" />
        </div>
      </div>
      {item.progress > 0 && (
        <div className="absolute bottom-0 left-0 h-1 bg-red-600" style={{ width: `${item.progress}%` }} />
      )}
      <button 
        onClick={(e) => handleRemove(e, item.mediaId)}
        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-black hover:text-red-500 transition-all"
      >
        <FaTimes className="text-xs text-white" />
      </button>
    </div>
    <div className="p-3">
      <h4 className="text-white text-sm font-semibold truncate">{item.title}</h4>
      <p className="text-gray-400 text-xs mt-1">
        {item.type === 'tv' && item.lastWatchedEpisode 
          ? `S${item.lastWatchedEpisode.season} E${item.lastWatchedEpisode.episode}` 
          : 'Movie'}
      </p>
    </div>
  </div>
));
ContinueWatchingCard.displayName = "ContinueWatchingCard";

export default function ContinueWatchingRow_2() {
  const navigate = useNavigate();
  const listRef = useRef(null);
  const rafRef = useRef(null);
  const dragStateRef = useRef({ active: false, startX: 0, startScrollLeft: 0, moved: false });
  const suppressClickRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  
  // Use mock data by default for preview
  const [continueWatching, setContinueWatching] = useState(MOCK_CONTINUE_WATCHING);
  const [user, setUser] = useState(null);

  // Load from local storage initially
  useEffect(() => {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      try {
        setContinueWatching(JSON.parse(cached));
      } catch (e) {
        console.error("Failed to parse continue watching cache", e);
      }
    }
  }, []);

  // Listen for live update events (e.g. guest or user playing a video)
  useEffect(() => {
    const handleLiveUpdate = () => {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        try {
          setContinueWatching(JSON.parse(cached));
        } catch (e) {
          console.error("Failed to parse live updated cache", e);
        }
      }
    };
    window.addEventListener('agreyflix_continue_watching_updated', handleLiveUpdate);
    return () => window.removeEventListener('agreyflix_continue_watching_updated', handleLiveUpdate);
  }, []);

  useEffect(() => {
    const unsubscribe = supabaseService.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        // Load local storage progress for guest users instead of wiping it out
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          try {
            setContinueWatching(JSON.parse(cached));
          } catch (e) {
            setContinueWatching([]);
          }
        } else {
          setContinueWatching([]);
        }
        return;
      }

      const cwData = currentUser.continueWatching || [];
      setContinueWatching(cwData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cwData));
    });

    return () => unsubscribe();
  }, []);

  const onMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    const el = listRef.current;
    if (!el) return;
    dragStateRef.current = {
      active: true,
      startX: e.pageX,
      startScrollLeft: el.scrollLeft,
      moved: false,
    };
    setIsDragging(true);
  }, []);

  const onMouseMove = useCallback((e) => {
    const el = listRef.current;
    const drag = dragStateRef.current;
    if (!el || !drag.active) return;
    const delta = e.pageX - drag.startX;
    if (Math.abs(delta) > 4) drag.moved = true;
    
    // Smooth Scrolling using RequestAnimationFrame (Inazuia CSS Layout Thrashing)
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      el.scrollLeft = drag.startScrollLeft - delta;
    });
  }, []);

  const endDrag = useCallback(() => {
    const drag = dragStateRef.current;
    if (!drag.active) return;
    drag.active = false;
    suppressClickRef.current = drag.moved;
    setIsDragging(false);
    setTimeout(() => { suppressClickRef.current = false; }, 0);
  }, []);

  useEffect(() => {
    window.addEventListener('mouseup', endDrag);
    return () => {
      window.removeEventListener('mouseup', endDrag);
      if (rafRef.current) cancelAnimationFrame(rafRef.current); // Cleanup layout frames
    };
  }, [endDrag]);

  const handleRemove = async (e, mediaId) => {
    e.stopPropagation();
    
    const newCwData = continueWatching.filter(item => String(item.mediaId) !== String(mediaId));
    setContinueWatching(newCwData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newCwData));
    
    if (user) {
      try {
        await supabaseService.updateContinueWatching(newCwData);
      } catch (err) {
        console.error('Failed to remove from continue watching', err);
      }
    }
  };

  const handleCardClick = (item) => {
    if (suppressClickRef.current) return;
    navigate(`/${item.type === 'tv' ? 'series' : 'movies'}/watch/${item.slug || item.mediaId}`);
  };

  return (
    <section className="px-4 sm:px-6 md:px-12 py-8 relative z-20">
      <div className="max-w-7xl mx-auto">
        <h3 className="text-xl md:text-2xl font-bold text-white mb-6 tracking-tight flex items-center gap-3">
          <span className="w-1.5 h-6 bg-red-500 rounded-full inline-block"></span>
          Continue Watching
        </h3>
        
        {continueWatching.length === 0 ? (
          <div className="bg-gradient-to-r from-zinc-950 to-[#0D0D0D] border border-white/5 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <p className="text-sm font-bold text-zinc-200">You haven't started watching anything recently</p>
              <p className="text-xs text-zinc-500 font-semibold">Once you start watching any movie or show, they will automatically appear here so you can continue where you left off!</p>
            </div>
            <button 
              onClick={() => {
                window.scrollTo({ top: window.innerHeight * 0.75, behavior: 'smooth' });
              }}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-white/5 rounded-xl text-xs font-black uppercase text-white tracking-wider cursor-pointer transition-all shrink-0"
            >
              Explore Content
            </button>
          </div>
        ) : (
          <div
            ref={listRef}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseLeave={endDrag}
            className={`flex gap-4 overflow-x-auto hide-scrollbar pb-6 -mx-4 px-4 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          >
            {continueWatching.map((item) => (
              <ContinueWatchingCard 
                key={item.mediaId} 
                item={item} 
                handleCardClick={handleCardClick} 
                handleRemove={handleRemove} 
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
