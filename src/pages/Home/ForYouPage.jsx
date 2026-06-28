import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabaseService } from '../../utils/supabaseService';
import TikTokEmbedPlayer from '../../components/TikTokEmbedPlayer';
import { FaHeart, FaComment, FaShareAlt, FaPlus, FaCheckCircle, FaMusic, FaArrowUp, FaArrowDown, FaFilm, FaChevronLeft } from 'react-icons/fa';
import { BiMoviePlay } from 'react-icons/bi';
import AgreyFlixLoader from '../../components/AgreyFlixLoader';

export default function ForYouPage() {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Real persistence of likes and shares with no randomized data
  const [stats, setStats] = useState({});

  // Swipe, Wheel & Double-Tap Like features
  const [touchStart, setTouchStart] = useState(null);
  const [lastTap, setLastTap] = useState(0);
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const [heartPos, setHeartPos] = useState({ x: 0, y: 0 });
  const lastScrollTime = useRef(0);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await supabaseService.getTikTokVideos();
      // Filter active videos and sort by latest created_at
      const activeVideos = (data || [])
        .filter(v => v.active)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      setVideos(activeVideos);

      // Fetch user's local liked list to render correct red hearts on startup
      let likedList = [];
      try {
        const stored = localStorage.getItem('agreyflix_liked_reels');
        if (stored) likedList = JSON.parse(stored);
      } catch (err) {
        console.error('Error reading liked list from storage:', err);
      }

      // Initialize stats with actual database/local storage values (No random numbers!)
      const initialStats = {};
      activeVideos.forEach(v => {
        initialStats[v.id] = {
          likes: v.likes_count || 0,
          shares: v.shares_count || 0,
          liked: likedList.includes(v.id)
        };
      });
      setStats(initialStats);
    } catch (err) {
      console.error('Error loading TikTok videos:', err);
      setError('Failed to load the "For You" feed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleLike = async (id) => {
    const currentVideoStats = stats[id];
    if (!currentVideoStats) return;

    const willLike = !currentVideoStats.liked;
    const step = willLike ? 1 : -1;

    // 1. Optimistic UI update
    setStats(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        liked: willLike,
        likes: Math.max(0, (prev[id]?.likes || 0) + step)
      }
    }));

    // 2. Persist liked status in local user storage
    try {
      const stored = localStorage.getItem('agreyflix_liked_reels');
      let likedList = stored ? JSON.parse(stored) : [];
      if (willLike) {
        if (!likedList.includes(id)) likedList.push(id);
      } else {
        likedList = likedList.filter(item => item !== id);
      }
      localStorage.setItem('agreyflix_liked_reels', JSON.stringify(likedList));
    } catch (err) {
      console.error('Failed to update local liked list:', err);
    }

    // 3. Increment/Decrement in Database
    try {
      await supabaseService.incrementTikTokLikes(id, step);
    } catch (err) {
      console.error('Failed to persist like in database:', err);
    }
  };

  const handleShare = async (video) => {
    // 1. Increment shares locally first (Optimistic update)
    setStats(prev => {
      const current = prev[video.id];
      if (!current) return prev;
      return {
        ...prev,
        [video.id]: {
          ...current,
          shares: (current.shares || 0) + 1
        }
      };
    });

    // 2. Share with system or fallback
    if (navigator.share) {
      navigator.share({
        title: video.title,
        url: video.tiktok_url
      }).catch(err => console.log('Share canceled', err));
    } else {
      navigator.clipboard.writeText(video.tiktok_url);
      alert('Copied TikTok link to clipboard!');
    }

    // 3. Persist share count in Database
    try {
      await supabaseService.incrementTikTokShares(video.id);
    } catch (err) {
      console.error('Failed to persist share count in database:', err);
    }
  };

  const handleNext = () => {
    if (activeIndex < videos.length - 1) {
      setActiveIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (activeIndex > 0) {
      setActiveIndex(prev => prev - 1);
    }
  };

  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientY);
  };

  const handleTouchEnd = (e) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientY;
    const diff = touchStart - touchEnd;
    const threshold = 40; // Reduced pixels threshold for quick light swipe on mobile

    if (diff > threshold) {
      // Swipe Up -> Next Video
      setActiveIndex(prev => {
        if (prev < videos.length - 1) return prev + 1;
        return prev;
      });
    } else if (diff < -threshold) {
      // Swipe Down -> Previous Video
      setActiveIndex(prev => {
        if (prev > 0) return prev - 1;
        return prev;
      });
    }
    setTouchStart(null);
  };

  const handleWheel = (e) => {
    const now = Date.now();
    if (now - lastScrollTime.current < 900) return; // Cooldown to make wheel scroll transitions super clean

    if (Math.abs(e.deltaY) > 20) {
      if (e.deltaY > 0) {
        setActiveIndex(prev => {
          if (prev < videos.length - 1) {
            lastScrollTime.current = now;
            return prev + 1;
          }
          return prev;
        });
      } else {
        setActiveIndex(prev => {
          if (prev > 0) {
            lastScrollTime.current = now;
            return prev - 1;
          }
          return prev;
        });
      }
    }
  };

  const handleOverlayTap = (e) => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    if (now - lastTap < DOUBLE_PRESS_DELAY) {
      // Double click or tap triggers like!
      if (currentVideo) {
        handleLike(currentVideo.id);
      }
      
      // Compute tap coordinates relative to the interactive middle container
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setHeartPos({ x, y });
      setShowHeartAnim(true);
      setTimeout(() => setShowHeartAnim(false), 800);
    }
    setLastTap(now);
  };

  if (loading) {
    return (
      <div className="flex bg-[#050505] min-h-screen text-white items-center justify-center">
        <div className="text-center space-y-4">
          <AgreyFlixLoader />
          <p className="text-zinc-500 text-xs font-black uppercase tracking-widest animate-pulse">
            LOADING FOR YOU REELS...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex bg-[#050505] min-h-screen text-white items-center justify-center p-6">
        <div className="text-center space-y-4 bg-zinc-950/80 border border-white/5 p-8 rounded-3xl max-w-sm">
          <p className="text-red-500 font-bold text-sm">{error}</p>
          <button 
            onClick={fetchVideos}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all"
          >
            Retry Feed
          </button>
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="flex bg-[#050505] min-h-screen text-white items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center mx-auto text-zinc-500 text-2xl animate-pulse">
            <BiMoviePlay />
          </div>
          <h2 className="text-lg font-black text-white">No Videos Available</h2>
          <p className="text-zinc-500 text-xs leading-relaxed">
            The administrator hasn't added or enabled any TikTok reels in the "For You" feed yet. Check back soon!
          </p>
        </div>
      </div>
    );
  }

  const currentVideo = videos[activeIndex];
  const currentStats = stats[currentVideo?.id] || { likes: 0, comments: 0, shares: 0, liked: false };

  return (
    <div 
      className="fixed inset-0 md:relative bg-black md:bg-[#050505] w-full h-full md:min-h-screen text-white flex flex-col items-center justify-center pt-0 md:pt-4 pb-0 md:pb-20 px-0 md:px-4 overflow-hidden select-none z-50"
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background Ambience Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[350px] h-[350px] bg-red-600/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Immersive Floating Navigation Dock - Top Left Corner (Avoids blocking any video content or center details) */}
      <div className="fixed top-4 left-4 z-[60] flex items-center gap-2 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full shadow-lg pointer-events-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/home')}
          className="text-zinc-400 hover:text-white transition-colors p-1 flex items-center justify-center active:scale-95"
          title="Back to Home"
          id="foryou-back-btn"
        >
          <FaChevronLeft className="text-xs" />
        </button>
        
        <span className="h-3 w-[1px] bg-white/15 mx-0.5" />

        {/* Home Navigation Link */}
        <button
          onClick={() => navigate('/home')}
          className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-colors px-1.5"
          id="foryou-dock-home"
        >
          Home
        </button>

        <span className="h-3 w-[1px] bg-white/15 mx-0.5" />

        {/* For You Active Badge */}
        <span className="text-[10px] font-black uppercase tracking-widest text-white bg-red-600 px-2.5 py-1 rounded-full shadow-sm">
          For You
        </span>
      </div>

      {/* Main Reels Container */}
      <div className="relative w-full h-full md:h-[78vh] md:max-h-[750px] md:max-w-[430px] md:aspect-[9/16] flex gap-4 items-center justify-center">
        {/* Navigation Buttons for Desktop */}
        <div className="hidden lg:flex flex-col gap-4 absolute -left-16 z-20">
          <button
            onClick={handlePrev}
            disabled={activeIndex === 0}
            className="w-10 h-10 rounded-full bg-zinc-900/80 hover:bg-zinc-800 border border-white/5 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-white active:scale-90 transition-all shadow-md"
            title="Previous video"
          >
            <FaArrowUp />
          </button>
          <button
            onClick={handleNext}
            disabled={activeIndex === videos.length - 1}
            className="w-10 h-10 rounded-full bg-zinc-900/80 hover:bg-zinc-800 border border-white/5 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-white active:scale-90 transition-all shadow-md"
            title="Next video"
          >
            <FaArrowDown />
          </button>
        </div>

        {/* Dynamic Card Container - Immersive Fullscreen Embed */}
        <div className="relative w-full h-full bg-black border-0 md:border md:border-white/10 rounded-none md:rounded-[32px] overflow-hidden shadow-2xl flex flex-col justify-between">
          
          {/* TikTok Player Component - Fullscreen absolute stretch. Direct pointer events enabled to let user click on play, pause, volume, like, comment, follow directly inside TikTok widget! */}
          <div className="absolute inset-0 w-full h-full z-0 pointer-events-auto">
            <TikTokEmbedPlayer 
              url={currentVideo.tiktok_url} 
              title={currentVideo.title} 
              className="w-full h-full"
            />
          </div>

          {/* Transparent Swipe Gesture Zone (Left 18% of the screen) - lets users swipe up/down to change reels on the left margin while keeping 82% of the screen fully clickable for direct TikTok widget interactions */}
          <div 
            className="absolute left-0 top-[6%] bottom-[12%] w-[18%] z-20 pointer-events-auto cursor-ns-resize"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          />

          {/* Elegant Top Right Video Counter - keeps video top space completely clear and unblocked */}
          <div className="absolute top-4 right-4 z-20 pointer-events-auto">
            <div className="bg-black/60 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-full text-[9px] font-black uppercase text-zinc-300 tracking-wider">
              {activeIndex + 1} / {videos.length}
            </div>
          </div>

          {/* Transparent Gradient Protection Cover Overlay - moved entirely out of interactive bounds */}
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none z-10" />

          {/* Video Overlay Metadata & Floating Right Controls (Bottom-aligned) */}
          <div className="absolute inset-x-0 bottom-0 p-5 flex items-end justify-between gap-4 z-20 pointer-events-none">
            <div className="space-y-2 min-w-0 flex-1 pointer-events-none">
              <div className="flex items-center gap-1.5 pointer-events-auto">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-600 to-red-500 flex items-center justify-center text-[10px] font-black text-white uppercase shrink-0 shadow-lg">
                  A
                </div>
                <span className="font-black text-xs text-white truncate flex items-center gap-1 drop-shadow">
                  AgreyFlix <FaCheckCircle className="text-red-500 text-xs shrink-0 animate-pulse" />
                </span>
              </div>
              
              <h3 className="font-bold text-sm text-zinc-100 leading-normal line-clamp-2 drop-shadow pointer-events-auto">
                {currentVideo.title}
              </h3>

              <div className="flex items-center gap-2 text-[10px] font-black uppercase text-zinc-400 tracking-wider pointer-events-auto">
                <FaMusic className="text-red-500 animate-spin" style={{ animationDuration: '4s' }} />
                <span className="truncate drop-shadow">Original Sound - AgreyFlix Streaming</span>
              </div>
            </div>

            {/* Float-Style Sidebar Controls on Right (Bottom-aligned right side) */}
            <div className="flex flex-col items-center gap-4 shrink-0 pointer-events-auto pb-1 z-30">
              {/* Previous Video (Mobile only floating in stack) */}
              <button
                onClick={handlePrev}
                disabled={activeIndex === 0}
                className="md:hidden w-11 h-11 rounded-full bg-black/60 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-800/80 text-zinc-200 border border-white/10 backdrop-blur-md flex items-center justify-center transition-all active:scale-90 shadow-lg"
                title="Previous Video"
              >
                <FaArrowUp className="text-sm" />
              </button>

              {/* Like Option */}
              <button
                onClick={() => handleLike(currentVideo.id)}
                className="flex flex-col items-center gap-1 group outline-none"
              >
                <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-all border border-white/10 backdrop-blur-md shadow-lg ${
                  currentStats.liked 
                    ? 'bg-red-600/40 text-red-500 border-red-500/30 scale-105' 
                    : 'bg-black/60 text-zinc-200 group-hover:text-white group-hover:bg-zinc-800/80'
                } active:scale-90`}>
                  <FaHeart className="text-lg" />
                </div>
                <span className="text-[10px] font-black text-zinc-300 drop-shadow">
                  {currentStats.likes}
                </span>
              </button>

              {/* Share Option */}
              <button
                onClick={() => handleShare(currentVideo)}
                className="flex flex-col items-center gap-1 group outline-none"
              >
                <div className="w-11 h-11 rounded-full bg-black/60 hover:bg-zinc-800/80 text-zinc-200 hover:text-white border border-white/10 backdrop-blur-md flex items-center justify-center transition-all active:scale-90 shadow-lg">
                  <FaShareAlt className="text-lg" />
                </div>
                <span className="text-[10px] font-black text-zinc-300 drop-shadow">
                  {currentStats.shares}
                </span>
              </button>

              {/* Next Video (Mobile only floating in stack) */}
              <button
                onClick={handleNext}
                disabled={activeIndex === videos.length - 1}
                className="md:hidden w-11 h-11 rounded-full bg-black/60 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-800/80 text-zinc-200 border border-white/10 backdrop-blur-md flex items-center justify-center transition-all active:scale-90 shadow-lg"
                title="Next Video"
              >
                <FaArrowDown className="text-sm" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
