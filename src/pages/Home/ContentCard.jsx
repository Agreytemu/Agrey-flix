import React, { useState, memo, useCallback, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { FaPlay, FaStar, FaPlus, FaCheck, FaTrash, FaVolumeMute, FaVolumeUp } from 'react-icons/fa';
import { useWatchlist } from '../../context/WatchlistContext';
import { useNavigate } from 'react-router-dom';
import { fetchTmdb } from '../../utils/tmdb';

const ContentCard = memo(({
  title,
  poster,
  rating,
  onClick = () => { },
  className = '',
  placeholderImage = 'https://placehold.co/400x600/1e293b/a5b4fc?text=No+Poster',
  releaseDate,
  // Watchlist props — optional
  mediaId,
  mediaType, // 'movie' | 'tv'
  posterPath,
  voteAverage,
  onNeedAuth,
  isWatchlistPage = false,
  rank,
  isAnimation = false,
  isUpcoming = false,
  isTeaser = false,
  genreIds = [],
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [wlLoading, setWlLoading] = useState(false);
  
  const navigate = useNavigate();

  const { watchlistIds, toggleWatchlist, ready, user } = useWatchlist();

  // Instantly read from shared in-memory Set — no async, no flash
  const inWatchlist = ready && !!mediaId && watchlistIds.has(String(mediaId));

  const handleWatchlist = useCallback(async (e) => {
    e.stopPropagation();
    if (!user) {
      if (onNeedAuth) {
        onNeedAuth();
      } else {
        window.dispatchEvent(new Event('openAuthModal'));
      }
      return;
    }
    if (!mediaId) return;
    setWlLoading(true);
    try {
      await toggleWatchlist({
        mediaId,
        type: mediaType || 'movie',
        title,
        poster_path: posterPath || null,
        vote_average: voteAverage || rating || 0,
        release_date: releaseDate || null,
      }, onNeedAuth);
    } finally {
      setWlLoading(false);
    }
  }, [user, mediaId, mediaType, title, posterPath, voteAverage, rating, releaseDate, onNeedAuth, toggleWatchlist]);

  const handleCardClick = (e) => {
    // If onClick was provided and it's not the default empty function
    if (mediaId && (!onClick || onClick.name === 'onClick' || onClick.toString().includes('() => { }') || onClick.toString().includes('()=>{}'))) {
      if (mediaType === 'tv') {
        navigate(`/series/watch/${mediaId}`);
      } else {
        navigate(`/movies/watch/${mediaId}`);
      }
    } else if (onClick) {
      onClick(e);
    }
  };

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick();
    }
  }, [handleCardClick]);

  const src = imageError ? placeholderImage : poster;
  const year = releaseDate ? new Date(releaseDate).getFullYear() : null;
  const ratingNum = rating ? Math.round(rating * 10) : null;
  const ratingColor = rating >= 7 ? 'text-green-400' : rating >= 5 ? 'text-yellow-400' : 'text-red-400';
  const showWatchlistBtn = !!mediaId;

  // Derive granular video categories for beautiful label tagging
  const titleLower = (title || "").toLowerCase();
  const calculatedIsTeaser = isTeaser || isUpcoming || titleLower.includes('teaser') || titleLower.includes('trailer') || titleLower.includes('preview') || titleLower.includes('sneak peek') || titleLower.includes('sneak-peek') || titleLower.includes('clip') || mediaType === 'teaser';
  const calculatedIsAnimation = isAnimation || (genreIds && Array.isArray(genreIds) && genreIds.includes(16)) || mediaType === 'animation';

  // ── Hover Trailer Logic ──
  const [showTrailer, setShowTrailer] = useState(false);
  const [trailerKey, setTrailerKey] = useState(null);
  const [trailerError, setTrailerError] = useState(false);
  const [popoutOrigin, setPopoutOrigin] = useState('center');
  const [isMuted, setIsMuted] = useState(true);
  const [iframeReady, setIframeReady] = useState(false);
  
  const hoverTimerRef = useRef(null);
  const iframeRef = useRef(null);

  const toggleMute = useCallback((e) => {
    e.stopPropagation();
    if (!iframeRef.current) return;
    const newState = !isMuted;
    setIsMuted(newState);
    iframeRef.current.contentWindow.postMessage(
      JSON.stringify({
        event: 'command',
        func: newState ? 'mute' : 'unMute',
        args: []
      }),
      '*'
    );
  }, [isMuted]);

  const handleMouseEnter = useCallback((e) => {
    if (!mediaId || !mediaType) return;
    // Skip trailer on touch-only devices (mobile/tablet)
    if (window.matchMedia('(hover: none)').matches) return;
    
    if (e?.currentTarget) {
      const rect = e.currentTarget.getBoundingClientRect();
      const vw = window.innerWidth;
      // Cards too close to the left/right edges must transform away from the edge
      if (rect.left < vw * 0.15) setPopoutOrigin('left');
      else if (rect.right > vw * 0.85) setPopoutOrigin('right');
      else setPopoutOrigin('center');
    }

    hoverTimerRef.current = setTimeout(() => {
      setShowTrailer(true);
    }, 800); // 800ms hover creates an intentional feel
  }, [mediaId, mediaType]);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setShowTrailer(false);
    setIsMuted(true);
    setIframeReady(false);
  }, []);

  useEffect(() => {
    if (showTrailer && !trailerKey && !trailerError) {
      let cancelled = false;
      fetchTmdb(`/${mediaType}/${mediaId}/videos`)
        .then(res => res.json())
        .then(data => {
          if (cancelled) return;
          const v = data.results?.find(vid => vid.type === 'Trailer' && vid.site === 'YouTube');
          if (v) setTrailerKey(v.key);
          else setTrailerError(true);
        })
        .catch(() => setTrailerError(true));
      return () => { cancelled = true; };
    }
  }, [showTrailer, mediaId, mediaType, trailerKey, trailerError]);

  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -4 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`group relative w-full cursor-pointer transition-shadow duration-200 ${showTrailer ? 'z-50' : 'z-10'} ${className}`}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyPress={handleKeyPress}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-label={`${title}${year ? ` (${year})` : ''}`}
    >
      {/* ── ACTUAL CARD WITH CLIPPING ── */}
      <div className="w-full h-full rounded-xl overflow-hidden ring-1 ring-white/5 group-hover:ring-white/20 group-hover:shadow-2xl group-hover:shadow-black/60 relative flex flex-col z-20 bg-[#0d1117]">
        {/* Poster */}
        <div className="relative w-full aspect-[2/3] bg-[#111827]">
          {/* Skeleton */}
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 animate-pulse bg-gradient-to-b from-white/5 to-white/[0.02]" />
          )}

          <img
            src={src}
            alt={title}
            loading="lazy"
            className={`w-full h-full object-cover transition-all duration-700 ease-out ${
              imageLoaded ? 'opacity-100 blur-0 scale-100' : 'opacity-0 blur-md scale-105'
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={() => { setImageError(true); setImageLoaded(true); }}
          />

          {/* Always-visible bottom gradient */}
          <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

          {/* Rating badge — top right */}
          {ratingNum && (
            <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm
              text-[11px] font-bold px-1.5 py-0.5 rounded-md">
              <FaStar className={`text-[9px] ${ratingColor}`} />
              <span className={ratingColor}>{ratingNum}%</span>
            </div>
          )}

          {/* Media-type badge — top left */}
          {(mediaType || calculatedIsTeaser || calculatedIsAnimation) && (
            calculatedIsTeaser ? (
              <div className="absolute top-2 left-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border border-white/10 shadow-md pointer-events-none select-none">
                TEASER
              </div>
            ) : calculatedIsAnimation ? (
              <div className="absolute top-2 left-2 bg-gradient-to-r from-purple-600 to-indigo-550 text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border border-white/10 shadow-md pointer-events-none select-none">
                ANIMATION
              </div>
            ) : (mediaType === 'tv' || mediaType === 'series') ? (
              <div className="absolute top-2 left-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border border-white/10 shadow-md pointer-events-none select-none">
                SERIES
              </div>
            ) : (
              <div className="absolute top-2 left-2 bg-gradient-to-r from-red-600 to-rose-500 text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border border-white/10 shadow-md pointer-events-none select-none">
                MOVIE
              </div>
            )
          )}

          {/* Integrated Rank & Heat-level Badge — bottom right corner of poster */}
          {rank && (
            <div className={`absolute bottom-3 right-3 flex flex-col items-center justify-center text-center px-2 py-1 rounded-xl border shadow-lg border-white/10 z-30 select-none uppercase ${
              rank <= 3 
                ? 'bg-gradient-to-br from-red-600 to-orange-500 text-white shadow-red-950/50 animate-pulse' 
                : rank <= 8
                  ? 'bg-gradient-to-br from-amber-500 to-yellow-500 text-white shadow-yellow-950/50'
                  : 'bg-gradient-to-br from-indigo-650 to-cyan-500 text-white shadow-blue-950/50'
            }`}>
              <span className="text-[9px] font-bold opacity-90 leading-none">RANK #{rank}</span>
              <span className="text-[10px] font-black tracking-wider leading-none mt-0.5">
                {rank <= 3 ? 'HOT 🔥' : rank <= 8 ? 'MODERATE ⚡' : 'COOL ❄️'}
              </span>
            </div>
          )}

          {/* Hover overlay — Play + Watchlist */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3">
            {/* Play */}
            <div className="w-12 h-12 rounded-full bg-red-600 shadow-lg shadow-red-700/50 flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform duration-200">
              <FaPlay className="text-white text-sm ml-0.5" />
            </div>

            {/* Watchlist toggle */}
            {showWatchlistBtn && (
              <button
                onClick={handleWatchlist}
                title={inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
                className={`w-12 h-12 rounded-full flex items-center justify-center
                  transform scale-75 group-hover:scale-100 transition-all duration-200
                  shadow-lg
                  ${inWatchlist
                    ? (isWatchlistPage ? 'bg-black/60 hover:bg-red-600/90 border border-white/20 hover:border-red-500' : 'bg-red-600 shadow-red-700/50')
                    : 'bg-white/25 backdrop-blur-sm border border-white/30 hover:bg-white/35'
                  }`}
              >
                {inWatchlist
                  ? (isWatchlistPage ? <FaTrash className="text-white text-sm" /> : <FaCheck className="text-white text-sm" />)
                  : <FaPlus className="text-white text-sm" />
                }
              </button>
            )}
          </div>
        </div>

        {/* Info below poster */}
        <div className="px-2.5 pt-2 pb-2.5 shrink-0 bg-[#0d1117] relative z-20">
          <p className="text-white text-[13px] font-semibold leading-tight line-clamp-1">{title}</p>
          {(year || mediaType) && (
            <p className="text-gray-500 text-[11px] mt-0.5">
              {year}{year && ' • '}{calculatedIsTeaser ? 'Teaser' : calculatedIsAnimation ? 'Animation' : (mediaType === 'tv' || mediaType === 'series') ? 'Series' : 'Movie'}
            </p>
          )}
        </div>
      </div>

      {/* ── POPOUT TRAILER OVERLAY (NETFLIX WEB STYLE) ── */}
      {showTrailer && trailerKey && (
        <div 
          className="absolute z-50 pointer-events-none"
          style={{ 
            top: '50%',
            width: '220%',
            ...(popoutOrigin === 'left' 
              ? { left: '0%', transform: 'translate(0%, -50%)' } 
              : popoutOrigin === 'right' 
                ? { right: '0%', transform: 'translate(0%, -50%)' } 
                : { left: '50%', transform: 'translate(-50%, -50%)' }
            )
          }}
        >
          <div 
            className={`w-full bg-[#181818] rounded-xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.95)] ring-1 ring-white/10 animate-in fade-in fill-mode-both zoom-in-75 duration-300 pointer-events-auto flex flex-col ${
              popoutOrigin === 'left' ? 'origin-left' : popoutOrigin === 'right' ? 'origin-right' : 'origin-center'
            }`}
            onMouseLeave={handleMouseLeave}
          >
            {/* 16:9 Video Top */}
            <div className="relative w-full aspect-video bg-black cursor-pointer overflow-hidden" onClick={(e) => { e.stopPropagation(); handleCardClick(e); }}>
              <iframe
                ref={iframeRef}
                title="Trailer"
                src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&modestbranding=1&loop=1&playlist=${trailerKey}&playsinline=1&enablejsapi=1`}
                className="w-full h-full scale-[1.35] pointer-events-none"
                allow="autoplay; encrypted-media"
                onLoad={() => setTimeout(() => setIframeReady(true), 800)}
              />
              {/* Poster cover — hides YouTube loader/logo while buffering */}
              <div
                className="absolute inset-0 transition-opacity duration-500 pointer-events-none"
                style={{ opacity: iframeReady ? 0 : 1 }}
              >
                {poster && (
                  <div
                    className="w-full h-full"
                    style={{
                      backgroundImage: `url(${poster})`,
                      backgroundSize: '100% 100%',
                      backgroundPosition: 'center center',
                      filter: 'blur(12px)',
                      transform: 'scale(1.15)',
                    }}
                  />
                )}
                {/* Dark scrim so it doesn't look too bright */}
                <div className="absolute inset-0 bg-black/50" />
              </div>
              <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-[#181818] to-transparent pointer-events-none" />
              {/* Mute / Unmute button */}
              <button
                onClick={toggleMute}
                className="absolute bottom-2 right-2 z-20 w-8 h-8 rounded-full bg-black/60 border border-white/30 flex items-center justify-center text-white hover:bg-black/80 hover:border-white transition-all backdrop-blur-sm"
              >
                {isMuted ? <FaVolumeMute className="text-[11px]" /> : <FaVolumeUp className="text-[11px]" />}
              </button>
            </div>

            {/* Info Panel Bottom */}
            <div className="px-4 py-4 shrink-0 flex flex-col gap-2.5 relative z-10 -mt-[1px] bg-[#181818]">
              <div className="flex items-center gap-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); handleCardClick(e); }}
                  className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-gray-200 transition-colors shadow-lg shadow-white/10"
                >
                  <FaPlay className="text-black text-[10px] ml-0.5" />
                </button>
                {showWatchlistBtn && (
                  <button 
                    onClick={handleWatchlist}
                    className="w-8 h-8 rounded-full bg-[#2a2a2a] border border-white/30 flex items-center justify-center hover:border-white transition-colors"
                  >
                    {inWatchlist 
                      ? (isWatchlistPage ? <FaTrash className="text-white text-[10px]" /> : <FaCheck className="text-white text-[10px]" />) 
                      : <FaPlus className="text-white text-[10px]" />
                    }
                  </button>
                )}
              </div>
              
              <h4 className="text-white text-sm font-bold leading-tight">{title}</h4>
              <div className="flex items-center gap-2 text-[10px] sm:text-[11px] font-semibold">
                {ratingNum && <span className={ratingColor}>{ratingNum}% Match</span>}
                {year && <span className="text-gray-400">{year}</span>}
                <span className="text-gray-400 border border-zinc-700 px-1.5 py-0.5 rounded uppercase text-[9px] font-extrabold bg-white/5">
                  {calculatedIsTeaser ? 'Teaser' : calculatedIsAnimation ? 'Animation' : (mediaType === 'tv' || mediaType === 'series') ? 'Series' : 'Movie'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
});

ContentCard.propTypes = {
  title: PropTypes.string.isRequired,
  poster: PropTypes.string,
  rating: PropTypes.number,
  onClick: PropTypes.func,
  className: PropTypes.string,
  placeholderImage: PropTypes.string,
  releaseDate: PropTypes.string,
  mediaId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  mediaType: PropTypes.oneOf(['movie', 'tv']),
  posterPath: PropTypes.string,
  voteAverage: PropTypes.number,
  onNeedAuth: PropTypes.func,
  isWatchlistPage: PropTypes.bool,
  rank: PropTypes.number,
};

ContentCard.displayName = 'ContentCard';
export default ContentCard;
