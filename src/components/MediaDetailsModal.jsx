import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaTimes, FaPlay, FaPlus, FaCheck, FaStar, 
  FaCalendarAlt, FaTv, FaFilm, FaDownload, FaYoutube,
  FaShareAlt, FaCopy, FaWhatsapp, FaFacebook, FaTelegram,
  FaTwitter
} from 'react-icons/fa';
import { useWatchlist } from '../context/WatchlistContext';
import { fetchTmdb } from '../utils/tmdb';
import { fetchStreamLinks, resolveStreamUrl, getStreamSourceType } from '../utils/extract';
import { supabaseService } from '../utils/supabaseService';
import VideoPlayer from './VideoPlayer';
import AgreyFlixLoader from './AgreyFlixLoader';
import StreamingErrorDiagnostics from './StreamingErrorDiagnostics';

export default function MediaDetailsModal({ media, onClose }) {
  const [details, setDetails] = useState(null);
  const [cast, setCast] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Streaming Player States
  const [activeStreamUrl, setActiveStreamUrl] = useState(null);
  const [activeStreamSource, setActiveStreamSource] = useState(null);
  const [streamLoading, setStreamLoading] = useState(false);
  const [streamError, setStreamError] = useState(null);

  // Trailer & Download States
  const [trailerKey, setTrailerKey] = useState(null);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [allTrailers, setAllTrailers] = useState([]);
  const [downloadLoading, setDownloadLoading] = useState(false);

  // Choose Server / Player Option
  const [streamSource, setStreamSource] = useState('embed'); // 'embed' is default server
  const [embedActiveUrl, setEmbedActiveUrl] = useState(null);
  const [playerMaximized, setPlayerMaximized] = useState(false);

  // Custom Share States
  const [shareOpen, setShareOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  // TV Series Seasons & Episodes States
  const [activeSeason, setActiveSeason] = useState(1);
  const [activeEpisode, setActiveEpisode] = useState(1);
  const [episodesList, setEpisodesList] = useState([]);
  const [episodesLoading, setEpisodesLoading] = useState(false);

  const { watchlistIds, toggleWatchlist, ready, user } = useWatchlist();

  // Swahili/African content identifier
  const isAfricanMedia = () => {
    if (!details) return false;
    const countries = ['NG', 'KE', 'GH', 'ZA', 'TZ', 'UG', 'RW', 'ET', 'EG', 'MA'];
    const detailsCountries = details.production_countries?.map(c => c.iso_3166_1) || [];
    const hasAfricanCountry = detailsCountries.some(code => countries.includes(code.toUpperCase()));
    const isSwahili = details.original_language === 'sw';
    const isAfricaGenre = details.genres?.some(g => g.name?.toLowerCase().includes('bongo') || g.name?.toLowerCase().includes('africa'));
    return hasAfricanCountry || isSwahili || isAfricaGenre;
  };

  const getYouTubeFallbackSearchQuery = () => {
    if (!details) return "";
    const name = details.title || details.name || "Video";
    const year = details.release_date 
      ? new Date(details.release_date).getFullYear() 
      : (details.first_air_date ? new Date(details.first_air_date).getFullYear() : "");
    const countries = details.production_countries?.map(c => c.iso_3166_1) || [];

    if (isAfricanMedia()) {
      if (countries.includes("TZ") || details.original_language === 'sw') {
        return `${name} bongo movie full Swahili ${year}`;
      }
      if (countries.includes("KE")) {
        return `${name} kenyan movie full ${year}`;
      }
      if (countries.includes("GH")) {
        return `${name} ghanaian movie full ${year}`;
      }
      if (countries.includes("NG")) {
        return `${name} nigerian movie full nollywood ${year}`;
      }
      if (countries.includes("ZA")) {
        return `${name} south african movie full ${year}`;
      }
      return `${name} full movie Africa Kenya Ghana Bongo ${year}`;
    }
    
    return `${name} full movie ${year}`;
  };

  // 1. Fetch Movie/TV General Details
  useEffect(() => {
    if (!media) {
      setDetails(null);
      setCast([]);
      return;
    }

    let cancelled = false;
    const fetchDetails = async () => {
      setLoading(true);
      setActiveStreamUrl(null);
      setStreamError(null);
      try {
        const type = media.mediaType || 'movie';
        
        // Fetch details with videos appended
        const detailsRes = await fetchTmdb(`/${type}/${media.mediaId}?append_to_response=videos`);
        const detailsData = await detailsRes.json();
        
        // Fetch credits (cast)
        const creditsRes = await fetchTmdb(`/${type}/${media.mediaId}/credits`);
        const creditsData = await creditsRes.json();
        
        let tKey = null;
        let trailersList = [];
        if (detailsData.videos && detailsData.videos.results) {
          trailersList = detailsData.videos.results.filter(
            vid => vid.site === "YouTube" && (vid.type === "Trailer" || vid.type === "Teaser" || vid.type === "Clip" || vid.type === "Featurette")
          );
          const trailer = detailsData.videos.results.find(
            vid => vid.type === "Trailer" && vid.site === "YouTube"
          );
          if (trailer) {
            tKey = trailer.key;
          } else {
            // Option to fallback to teaser if no strict trailer is found
            const teaser = detailsData.videos.results.find(
              vid => vid.site === "YouTube" && (vid.type === "Teaser" || vid.type === "Clip")
            );
            if (teaser) {
              tKey = teaser.key;
            }
          }
        }
        
        if (!cancelled) {
          setDetails(detailsData);
          setCast(creditsData.cast?.slice(0, 8) || []);
          setTrailerKey(tKey);
          setAllTrailers(trailersList);

          // For TV Shows: default to season 1
          if (type === 'tv' && detailsData.seasons && detailsData.seasons.length > 0) {
            const firstSeason = detailsData.seasons.find(s => s.season_number > 0) || detailsData.seasons[0];
            setActiveSeason(firstSeason.season_number);
          }
        }
      } catch (error) {
        console.error("Error fetching media details in modal:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchDetails();
    return () => { cancelled = true; };
  }, [media]);

  // 2. Fetch Episodes for selected Season (TV Only)
  useEffect(() => {
    if (!media || !details || media.mediaType !== 'tv' || !activeSeason) return;

    let cancelled = false;
    const fetchEpisodes = async () => {
      setEpisodesLoading(true);
      try {
        const res = await fetchTmdb(`/tv/${media.mediaId}/season/${activeSeason}`);
        if (!res.ok) throw new Error("Could not load season episodes");
        const data = await res.json();
        if (!cancelled && data.episodes) {
          setEpisodesList(data.episodes);
        }
      } catch (err) {
        console.error("Failed to load season episodes info inside modal:", err);
      } finally {
        if (!cancelled) setEpisodesLoading(false);
      }
    };

    fetchEpisodes();
    return () => { cancelled = true; };
  }, [media, details, activeSeason]);

  // Handle escape key closing
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && media && !activeStreamUrl) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [media, onClose, activeStreamUrl]);

  // Stop background scroll
  useEffect(() => {
    if (media) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [media]);

  if (!media) return null;

  const inWatchlist = ready && !!media.mediaId && watchlistIds.has(String(media.mediaId));
  const type = media.mediaType || 'movie';

  const isUpcoming = (() => {
    if (media?.isUpcoming) return true;
    if (!details) return false;
    if (details.release_date) {
      const releaseDate = new Date(details.release_date);
      const today = new Date();
      if (releaseDate > today) return true;
    }
    if (details.status === "Planned" || details.status === "In Production" || details.status === "Post Production") {
      return true;
    }
    return false;
  })();

  const formattedReleaseDate = (() => {
    const rawDate = details?.release_date || media?.release_date;
    if (!rawDate) return null;
    try {
      const date = new Date(rawDate);
      if (isNaN(date.getTime())) return null;
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return null;
    }
  })();

  const getShareInfo = () => {
    const movieTitle = details?.title || details?.name || media?.title || "Recommended Media";
    const moviePoster = details?.poster_path 
      ? `https://image.tmdb.org/t/p/w500${details.poster_path}` 
      : "https://image.tmdb.org/t/p/w500/placeholder.jpg";
    const appUrl = type === 'tv'
      ? `https://agrey-flix.vercel.app/series/watch/${media.mediaId || media.id}`
      : `https://agrey-flix.vercel.app/movies/watch/${media.mediaId || media.id}`;
    
    const welcomeAndDetails = `AgreyFlix Official Streaming Platform

You are cordially invited to stream premium high-fidelity content.

Recommended Title: ${movieTitle}
Official Movie Poster: ${moviePoster}

Platform Highlights:
AgreyFlix provides lightning-fast streaming, dedicated translation tracks, and ultra-high-speed download managers for maximum mobile and desktop compatibility. Connect now to experience high-speed access completely free of advertising elements.

Direct Video Presentation Hyperlink:
${appUrl}`;
    
    return {
      title: `AgreyFlix - Stream ${movieTitle}`,
      text: welcomeAndDetails,
      url: appUrl,
      poster: moviePoster
    };
  };

  const handleDownloadPoster = async () => {
    try {
      const moviePoster = details?.poster_path 
        ? `https://image.tmdb.org/t/p/w500${details.poster_path}` 
        : "https://image.tmdb.org/t/p/w500/placeholder.jpg";
      const response = await fetch(moviePoster, { mode: 'cors' });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${details?.title || details?.name || media?.title || 'media'}_poster.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download poster image directly:", err);
      const posterLink = details?.poster_path 
        ? `https://image.tmdb.org/t/p/w500${details.poster_path}` 
        : "https://image.tmdb.org/t/p/w500/placeholder.jpg";
      window.open(posterLink, '_blank');
    }
  };

  const handleNativeShare = async () => {
    const info = getShareInfo();
    if (navigator.share) {
      try {
        const moviePoster = details?.poster_path 
          ? `https://image.tmdb.org/t/p/w500${details.poster_path}` 
          : "https://image.tmdb.org/t/p/w500/placeholder.jpg";
        
        // Fetch poster blob to share as file
        const response = await fetch(moviePoster, { mode: 'cors' });
        const blob = await response.blob();
        const file = new File([blob], `${details?.title || details?.name || media?.title || 'media'}.jpg`, { type: 'image/jpeg' });
        
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: info.title,
            text: info.text
          });
          return;
        }
      } catch (err) {
        console.warn("Native file sharing not supported or failed, falling back to URL sharing:", err);
      }

      try {
        await navigator.share({
          title: info.title,
          text: info.text,
          url: info.url
        });
      } catch (err) {
        console.warn("Fallback HTML Native Web Share failed or was rejected:", err);
        setShareOpen(true);
      }
    } else {
      setShareOpen(true);
    }
  };

  const handleWatchlistToggle = async () => {
    if (!user) {
      window.dispatchEvent(new Event('openAuthModal'));
      return;
    }
    await toggleWatchlist({
      mediaId: media.mediaId,
      type: type,
      title: details?.title || details?.name || media.title,
      poster_path: details?.poster_path || media.posterPath,
      vote_average: details?.vote_average || media.rating,
      release_date: details?.release_date || details?.first_air_date || media.releaseDate,
    });
  };

  // Trigger content stream extraction from server
  const handleWatchStream = async (targetSeason = null, targetEpisode = null) => {
    if (!user) {
      window.dispatchEvent(new Event('openAuthModal'));
      return;
    }
    const isTv = type === 'tv';
    const sNum = isTv ? (targetSeason !== null ? targetSeason : activeSeason) : 1;
    const eNum = isTv ? (targetEpisode !== null ? targetEpisode : activeEpisode) : 1;

    if (isTv) {
      setActiveSeason(sNum);
      setActiveEpisode(eNum);
    }

    // Save/update Continue Watching record on play
    supabaseService.saveContinueWatchingItem({
      mediaId: String(media.mediaId),
      type: type,
      title: details?.title || details?.name || media?.title || '',
      subTitle: type === 'tv' ? `S${sNum} E${eNum}` : '',
      slug: String(media.mediaId),
      backdrop_path: details?.backdrop_path || media?.backdrop_path || null,
      progress: 10,
      lastWatchedEpisode: type === 'tv' ? { season: sNum, episode: eNum } : null,
      updatedAt: Date.now()
    }).catch(err => console.error("Error saving continue watching item:", err));

    if (streamSource === 'embed') {
      const embedBaseUrl = import.meta.env.VITE_SERVER_EMBED_URL || 'https://vidsrc-embed.ru';
      const embedUrl = type === 'tv'
        ? `${embedBaseUrl}/embed/tv/${media.mediaId}/${sNum}-${eNum}`
        : `${embedBaseUrl}/embed/movie/${media.mediaId}`;
      setEmbedActiveUrl(embedUrl);
      return;
    }

    if (streamSource === 'youtube') {
      const videoSearchTitle = getYouTubeFallbackSearchQuery();
      setEmbedActiveUrl(`https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(videoSearchTitle)}&autoplay=1&modestbranding=1&rel=0`);
      return;
    }

    setStreamLoading(true);
    setStreamError(null);
    setActiveStreamSource(null);
    try {
      const responseData = await fetchStreamLinks(media.mediaId, type, sNum, eNum);
      const streamUrl = resolveStreamUrl(responseData);
      
      if (!streamUrl) {
        throw new Error("Sorry! No video stream was found on our servers.");
      }

      const sourceType = getStreamSourceType(responseData, streamUrl);
      setActiveStreamSource(sourceType);
      setActiveStreamUrl(streamUrl);
    } catch (err) {
      console.warn("[Modal watch stream failed (expected for some African movies), searching YouTube fallback...]", err);
      
      setStreamError("Direct stream unavailable. Searching on YouTube...");
      
      setTimeout(() => {
        setStreamError(null);
        const videoSearchTitle = getYouTubeFallbackSearchQuery();
        setEmbedActiveUrl(`https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(videoSearchTitle)}&autoplay=1&modestbranding=1&rel=0`);
      }, 2000);
    } finally {
      setStreamLoading(false);
    }
  };

  const handleDownload = () => {
    if (!user) {
      window.dispatchEvent(new Event('openAuthModal'));
      return;
    }
    navigate(`/download/${type}/${media.mediaId}?season=${activeSeason}&episode=${activeEpisode}`);
  };

  const backdropSrc = details?.backdrop_path 
    ? `https://image.tmdb.org/t/p/original${details.backdrop_path}`
    : 'https://placehold.co/1920x1080/111/444/?text=No+Backdrop';

  const title = details?.title || details?.name || media.title;
  const overview = details?.overview || 'No synopsis available.';
  const releaseDate = details?.release_date || details?.first_air_date || media.releaseDate;
  const rating = details?.vote_average || media.rating;
  const ratingColor = rating >= 7 ? 'text-green-400' : rating >= 5 ? 'text-yellow-400' : 'text-red-400';
  const runtime = details?.runtime || (details?.episode_run_time && details.episode_run_time[0]);

  const currentMediaTitle = details?.title || details?.name || media.title || '';
  const subTitleText = type === 'tv' 
    ? `Season ${activeSeason} - Episode ${activeEpisode}` 
    : runtime ? `${Math.floor(runtime / 60)}h ${runtime % 60}m` : '';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/85 backdrop-blur-sm cursor-pointer"
        />

        {/* Modal Container */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="relative w-full max-w-4xl max-h-[90vh] bg-[#0d1117] rounded-3xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto border border-white/10 z-[105]"
        >
          {/* Close button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-40 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center hover:bg-black border border-white/10 transition-colors"
          >
            <FaTimes className="text-white text-lg" />
          </button>

          <div className="overflow-y-auto overflow-x-hidden hide-scrollbar">
            {/* Header / Backdrop area - Dynamic inline player inside modal */}
            <div 
              className={
                playerMaximized && (trailerOpen || activeStreamUrl || embedActiveUrl)
                  ? (type === 'tv'
                      ? "relative w-full aspect-video md:aspect-[16/10] bg-black overflow-hidden transition-all duration-500 shadow-2xl border-b border-white/10"
                      : "relative w-full aspect-video md:aspect-[21/9] bg-black overflow-hidden transition-all duration-500 shadow-2xl border-b border-white/10")
                  : (trailerOpen || activeStreamUrl || embedActiveUrl)
                    ? (type === 'tv'
                        ? "relative w-full aspect-video bg-black overflow-hidden transition-all duration-500"
                        : "relative w-full aspect-video md:aspect-[21/9] bg-black overflow-hidden transition-all duration-500")
                    : "relative w-full aspect-video md:aspect-[21/9] bg-black overflow-hidden transition-all duration-500"
              }
            >
              {loading ? (
                 <div className="absolute inset-0 animate-pulse bg-gradient-to-b from-white/5 to-white/10" />
              ) : (
                <>
                  {trailerOpen && trailerKey ? (
                    <div className="w-full h-full relative bg-black">
                      <iframe
                        src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&modestbranding=1&rel=0`}
                        title={`${title} Trailer`}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                      {/* Left-side controls */}
                      <div className="absolute top-4 left-4 z-[210] flex items-center gap-2">
                        <button 
                          onClick={() => {
                            setTrailerOpen(false);
                            setPlayerMaximized(false);
                          }}
                          className="w-10 h-10 rounded-full bg-black/60 hover:bg-black text-white hover:text-red-500 flex items-center justify-center border border-white/20 transition-all active:scale-95 shadow-lg"
                          title="Close Trailer"
                        >
                          <FaTimes className="text-xl" />
                        </button>
                        <button 
                          onClick={() => setPlayerMaximized(!playerMaximized)}
                          className="w-10 h-10 rounded-full bg-black/60 hover:bg-black text-white hover:text-red-500 flex items-center justify-center border border-white/20 transition-all active:scale-95 shadow-lg"
                          title={playerMaximized ? "Minimize Screen" : "Maximize Screen"}
                        >
                          {playerMaximized ? (
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5 10H2V8h3v2zm10 0h3V8h-3v2zM10 5V2H8v3h2zm0 10v3H8v-3h2z"/></svg>
                          ) : (
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M2 2h6v2H4v4H2V2zm16 0h-6v2h4v4h2V2zM2 18h6v-2H4v-4H2v6zm16 0h-6v-2h4v-4h2v6z"/></svg>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : activeStreamUrl ? (
                    <div className="w-full h-full relative bg-black">
                      <VideoPlayer 
                        src={activeStreamUrl}
                        title={currentMediaTitle}
                        subTitle={subTitleText}
                        mediaId={media.mediaId}
                        type={type}
                        season={activeSeason}
                        episode={activeEpisode}
                        onClose={() => {
                          setActiveStreamUrl(null);
                          setPlayerMaximized(false);
                        }}
                        sourceType={activeStreamSource}
                        isMaximized={playerMaximized}
                        onToggleMaximize={() => setPlayerMaximized(!playerMaximized)}
                        backdropPath={details?.backdrop_path || media?.backdrop_path || media?.backdropPath}
                        slug={media?.slug || media?.mediaId || media?.id}
                      />
                    </div>
                  ) : embedActiveUrl ? (
                    <div className="w-full h-full relative bg-black">
                      <iframe
                        src={embedActiveUrl}
                        title={`${title} Player`}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                      {/* Left-side controls */}
                      <div className="absolute top-4 left-4 z-[210] flex items-center gap-2">
                        <button 
                          onClick={() => {
                            setEmbedActiveUrl(null);
                            setPlayerMaximized(false);
                          }}
                          className="w-10 h-10 rounded-full bg-black/60 hover:bg-black text-white hover:text-red-500 flex items-center justify-center border border-white/20 transition-all active:scale-95 shadow-lg"
                          title="Close Player"
                        >
                          <FaTimes className="text-xl" />
                        </button>
                        <button 
                          onClick={() => setPlayerMaximized(!playerMaximized)}
                          className="w-10 h-10 rounded-full bg-black/60 hover:bg-black text-white hover:text-red-500 flex items-center justify-center border border-white/20 transition-all active:scale-95 shadow-lg"
                          title={playerMaximized ? "Minimize Screen" : "Maximize Screen"}
                        >
                          {playerMaximized ? (
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5 10H2V8h3v2zm10 0h3V8h-3v2zM10 5V2H8v3h2zm0 10v3H8v-3h2z"/></svg>
                          ) : (
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M2 2h6v2H4v4H2V2zm16 0h-6v2h4v4h2V2zM2 18h6v-2H4v-4H2v6zm16 0h-6v-2h4v-4h2v6z"/></svg>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <img 
                        src={backdropSrc} 
                        alt={title} 
                        className="w-full h-full object-cover animate-fade-in"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0d1117] via-[#0d1117]/60 to-transparent" />
                      
                      <div className="absolute bottom-0 left-0 p-8 w-full">
                        {/* Inline Genres display */}
                        {details?.genres && details.genres.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {details.genres.map(g => (
                              <span key={g.id} className="text-[10px] font-black text-red-500 uppercase tracking-wider bg-red-500/10 px-2 py-0.5 rounded">
                                {g.name}
                              </span>
                            ))}
                          </div>
                        )}

                        <h2 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight drop-shadow-lg">{title}</h2>
                        <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-gray-300">
                          {rating && (
                            <div className="flex items-center gap-1">
                               <FaStar className={ratingColor} />
                               <span className={ratingColor}>{typeof rating === 'number' ? rating.toFixed(1) : rating} / 10</span>
                            </div>
                          )}
                          {releaseDate && (
                             <div className="flex items-center gap-1">
                               <FaCalendarAlt className="text-gray-400" />
                               <span>{new Date(releaseDate).getFullYear()}</span>
                             </div>
                          )}
                          {runtime && (
                            <div className="border border-white/20 px-2 py-0.5 rounded-sm">
                              {Math.floor(runtime / 60)}h {runtime % 60}m
                            </div>
                          )}
                          <div className="border border-white/20 px-2 py-0.5 rounded-sm uppercase text-xs tracking-wider">
                            {type === 'tv' ? 'Series' : 'Movie'}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Content area */}
            <div className="p-8 pb-12 flex flex-col md:flex-row gap-8">
              {/* Left Column (Details) */}
              <div className="flex-1 space-y-8">
                {/* Actions / Watch Stream */}
                <div className="flex flex-col gap-3">
                  {isUpcoming ? (
                    // Upcoming Movie UI: Prominent "Watch Trailer" button, no servers, multiple trailers if available
                    <div className="space-y-6 bg-black/35 p-6 rounded-3xl border border-red-500/15">
                      <div className="flex flex-col gap-2">
                        <span className="text-xs font-black text-red-500 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span> Anticipated Upcoming Release
                        </span>
                        <h4 className="text-lg font-extrabold text-white">
                          {formattedReleaseDate ? `It will be released on ${formattedReleaseDate}` : "This cinematic content is not yet released"}
                        </h4>
                        <p className="text-xs text-zinc-400 font-medium leading-relaxed font-sans">
                          Streaming servers and download slots are currently offline. You can watch the official promotional trailer below.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-4">
                        {trailerKey ? (
                          <button 
                            onClick={() => {
                              setTrailerOpen(true);
                              setPlayerMaximized(false);
                            }}
                            className="flex items-center gap-2.5 bg-red-600 hover:bg-red-500 text-white px-8 py-4 rounded-full font-bold transition-all active:scale-95 text-lg shadow-lg shadow-red-600/35"
                          >
                            <FaYoutube className="text-xl" />
                            <span>Watch Trailer</span>
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 bg-[#1f2937]/40 border border-white/5 text-gray-400 px-6 py-3.5 rounded-full font-bold text-base shadow-lg cursor-not-allowed opacity-65">
                            <FaYoutube className="text-lg text-gray-500" />
                            <span>Trailer Unavailable</span>
                          </div>
                        )}

                        <button 
                          onClick={handleNativeShare}
                          className="flex items-center justify-center w-12 h-12 rounded-full border-2 border-gray-400 hover:border-white text-white hover:bg-white/10 transition-all group shadow-lg"
                          title="Share Content"
                        >
                          <FaShareAlt className="text-xl text-white" />
                        </button>

                        <button 
                          onClick={handleWatchlistToggle}
                          className="flex items-center justify-center w-12 h-12 rounded-full border-2 border-gray-400 hover:border-white text-white hover:bg-white/10 transition-all group shadow-lg"
                          title={inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
                        >
                          {inWatchlist ? <FaCheck className="text-xl group-hover:text-red-500 transition-colors" /> : <FaPlus className="text-xl" />}
                        </button>
                      </div>

                      {/* Display multiple trailers inside upcoming area if available */}
                      {allTrailers && allTrailers.length > 1 && (
                        <div className="pt-2 border-t border-white/5">
                          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2.5">
                             All Available Video Assets ({allTrailers.length})
                          </span>
                          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                            {allTrailers.map((vid, idx) => {
                              const isCurrent = trailerKey === vid.key;
                              return (
                                <button
                                  key={vid.id || idx}
                                  onClick={() => {
                                    setTrailerKey(vid.key);
                                    setTrailerOpen(true);
                                  }}
                                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 shrink-0 ${
                                    isCurrent && trailerOpen
                                      ? 'bg-red-600 text-white border-red-500 shadow-md'
                                      : 'bg-[#121622] text-zinc-400 hover:text-white border-white/5 hover:border-white/10'
                                  }`}
                                >
                                  <FaYoutube className="text-red-500" />
                                  {vid.name || `Trailer ${idx + 1}`} ({vid.type || 'Promo'})
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    // Regular released movie UI
                    <>
                      <div className="flex flex-wrap items-center gap-4">
                        <button 
                          onClick={() => handleWatchStream()}
                          disabled={streamLoading || downloadLoading}
                          className="flex items-center gap-2 bg-red-600 hover:bg-red-500 disabled:bg-gray-700 text-white px-8 py-3.5 rounded-full font-bold transition-all active:scale-95 text-lg shadow-lg shadow-red-600/25"
                        >
                          {streamLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          ) : (
                            <FaPlay className="text-base" />
                          )}
                          {streamLoading ? "Loading Stream..." : "Watch Now"}
                        </button>

                        <button 
                          onClick={() => handleDownload()}
                          disabled={streamLoading || downloadLoading}
                          className="flex items-center gap-2 bg-[#1f2937]/80 hover:bg-[#374151]/80 hover:text-white border border-white/10 disabled:bg-gray-700 text-gray-200 px-5 py-3.5 rounded-full font-bold transition-all active:scale-95 text-base shadow-lg"
                          title="Pakua Video Hii"
                        >
                          {downloadLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          ) : (
                            <FaDownload className="text-base" />
                          )}
                          {downloadLoading ? "Configuring..." : "Download"}
                        </button>

                        {trailerKey ? (
                          <button 
                            onClick={() => setTrailerOpen(true)}
                            className="flex items-center gap-2 bg-[#1f2937]/80 hover:bg-red-600/20 border border-red-500/30 hover:border-red-500 text-gray-200 hover:text-white px-5 py-3.5 rounded-full font-bold transition-all active:scale-95 text-base shadow-lg"
                          >
                            <FaYoutube className="text-lg text-red-500" />
                            <span>Watch Trailer</span>
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 bg-[#1f2937]/40 border border-white/5 text-gray-400 px-5 py-3.5 rounded-full font-bold text-base shadow-lg cursor-not-allowed opacity-65" title="Trailer has not been found yet">
                            <FaYoutube className="text-lg text-gray-500" />
                            <span>Trailer Unavailable</span>
                          </div>
                        )}

                        <button 
                          onClick={handleNativeShare}
                          className="flex items-center justify-center w-12 h-12 rounded-full border-2 border-gray-400 hover:border-white text-white hover:bg-white/10 transition-all group shadow-lg"
                          title="Share Content"
                        >
                          <FaShareAlt className="text-xl text-white" />
                        </button>
                        
                        <button 
                          onClick={handleWatchlistToggle}
                          className="flex items-center justify-center w-12 h-12 rounded-full border-2 border-gray-400 hover:border-white text-white hover:bg-white/10 transition-all group shadow-lg"
                          title={inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
                        >
                          {inWatchlist ? <FaCheck className="text-xl group-hover:text-red-500 transition-colors" /> : <FaPlus className="text-xl" />}
                        </button>
                      </div>

                       {/* Segmented Server control */}
                      <div className="flex flex-col gap-2 mt-4 max-w-md">
                        <span className="text-xs text-gray-400 font-mono tracking-wider uppercase">Streaming Server:</span>
                        <div className="flex bg-[#11131c]/90 border border-white/5 p-1 rounded-2xl shadow-inner gap-1">
                          <div className="flex-1 py-2 px-3 text-xs md:text-sm font-bold rounded-xl text-center bg-red-600 text-white shadow-lg">
                            Matozzy South - Active
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {streamLoading && (
                    <div className="max-w-md p-4 bg-[#0d1117]/80 border border-white/5 rounded-2xl mt-2 shadow-lg">
                      <AgreyFlixLoader small={true} text="Resolving video stream source..." />
                    </div>
                  )}

                  {streamError && (
                    <div className="max-w-md animate-in slide-in-from-top-4 duration-300">
                      <StreamingErrorDiagnostics 
                        error={streamError}
                        mediaId={media.mediaId}
                        type={type}
                        season={activeSeason}
                        episode={activeEpisode}
                      />
                    </div>
                  )}
                </div>

                {/* TV Series Seasons and Episodes Inside Modal */}
                {!loading && type === 'tv' && details?.seasons && (
                  <div className="space-y-4 pt-2 border-t border-white/5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-black text-white flex items-center gap-2">
                        <FaTv className="text-red-500" /> Seasons & Episodes
                      </h3>
                      
                      <select 
                        value={activeSeason}
                        onChange={(e) => {
                          setActiveSeason(Number(e.target.value));
                          setActiveEpisode(1);
                        }}
                        className="bg-[#151a23] border border-white/10 text-white font-bold px-3 py-1.5 rounded-xl text-xs cursor-pointer outline-none focus:border-red-500"
                      >
                        {details.seasons.map(s => (
                          <option key={s.id} value={s.season_number}>
                            {s.name} ({s.episode_count} Ep)
                          </option>
                        ))}
                      </select>
                    </div>

                    {episodesLoading ? (
                      <div className="flex justify-center p-6">
                        <AgreyFlixLoader />
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-2 max-h-[250px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
                        {episodesList.map(ep => (
                          <div 
                            key={ep.id}
                            onClick={() => handleWatchStream(activeSeason, ep.episode_number)}
                            className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between bg-[#151a23] hover:bg-white/5 ${
                              activeSeason === ep.season_number && activeEpisode === ep.episode_number
                                ? 'border-red-500 bg-red-500/5'
                                : 'border-white/5 hover:border-white/10'
                            }`}
                          >
                            <div className="flex flex-col min-w-0 pr-4">
                              <span className="text-[10px] font-black text-red-500 uppercase">Ep {ep.episode_number}</span>
                              <h4 className="text-white font-semibold text-xs truncate">{ep.name}</h4>
                            </div>
                            <button className="h-7 w-7 rounded-full bg-red-600 flex items-center justify-center text-white shrink-0 shadow">
                              <FaPlay className="text-[9px] ml-0.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Synopsis */}
                <div>
                  <h3 className="text-xl font-bold text-white mb-3">Synopsis</h3>
                  <p className="text-gray-300 text-sm md:text-base leading-relaxed font-semibold">
                    {loading ? (
                      <span className="animate-pulse space-y-2 block">
                        <span className="h-4 bg-white/10 rounded w-full block"></span>
                        <span className="h-4 bg-white/10 rounded w-[90%] block"></span>
                        <span className="h-4 bg-white/10 rounded w-[80%] block"></span>
                      </span>
                    ) : overview}
                  </p>
                </div>

                {/* Genres */}
                {!loading && details?.genres && details.genres.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-gray-400 mb-2 uppercase tracking-wide">Genres</h3>
                    <div className="flex flex-wrap gap-2">
                       {details.genres.map(g => (
                         <span key={g.id} className="bg-white/5 border border-white/10 px-3 py-1 rounded-full text-xs font-semibold text-gray-300">
                           {g.name}
                         </span>
                       ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column (Cast) */}
              <div className="w-full md:w-1/3 space-y-6">
                <div>
                   <h3 className="text-xl font-bold text-white mb-4">Cast</h3>
                   {loading ? (
                     <div className="space-y-4">
                       {[1, 2, 3].map(i => (
                         <div key={i} className="flex items-center gap-3 animate-pulse">
                           <div className="w-12 h-12 rounded-full bg-white/10 shrink-0"></div>
                           <div className="space-y-2 flex-1">
                             <div className="h-3 bg-white/10 rounded w-[60%]"></div>
                             <div className="h-2 bg-white/15 rounded w-[40%]"></div>
                           </div>
                         </div>
                       ))}
                     </div>
                   ) : cast.length > 0 ? (
                      <div className="space-y-4">
                        {cast.slice(0, 5).map(person => (
                          <div key={person.id} className="flex items-center gap-3 group">
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-[#111] shrink-0 border border-white/10 group-hover:border-white/30 transition-colors">
                              {person.profile_path ? (
                                <img 
                                  src={`https://image.tmdb.org/t/p/w185${person.profile_path}`} 
                                  alt={person.name} 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-500 font-bold text-lg">
                                  {person.name?.[0]}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <p className="text-sm font-bold text-white truncate">{person.name}</p>
                              <p className="text-xs text-gray-400 truncate">{person.character}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                   ) : (
                     <p className="text-gray-400 text-sm">No cast information available.</p>
                   )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Custom Share Modal Overlay */}
      <AnimatePresence>
        {shareOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0b0e14] border border-white/10 rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl relative text-left"
            >
              <button 
                onClick={() => setShareOpen(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-colors"
                title="Close"
              >
                <FaTimes className="text-xl" />
              </button>

              <div id="share-modal-header" className="text-center space-y-2 mb-6">
                <span className="text-[10px] uppercase font-black tracking-widest text-red-500 bg-red-950/30 px-3.5 py-1.5 rounded-full border border-red-500/10">
                  Official Communication Share
                </span>
                <h3 className="text-2xl font-black text-white tracking-tight uppercase">
                  Digital Distribution Hub
                </h3>
              </div>

              {/* Share Content Details block */}
              <div id="share-preview-box" className="bg-[#11141c] border border-white/5 p-4 rounded-2xl flex flex-col sm:flex-row gap-4 items-center mb-6">
                <div className="w-24 aspect-[2/3] rounded-xl overflow-hidden bg-zinc-900 border border-white/10 shrink-0 shadow-md">
                  {details?.poster_path ? (
                    <img 
                      src={`https://image.tmdb.org/t/p/w185${details.poster_path}`} 
                      alt="" 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full bg-zinc-950" />
                  )}
                </div>
                <div className="space-y-1.5 text-center sm:text-left flex-1 col-span-2">
                  <h4 className="text-base font-extrabold text-white">{details?.title || details?.name || media?.title}</h4>
                  <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                    {details?.overview ? details.overview : "This premium content is highly trending on our networks."}
                  </p>
                  <div className="text-[10px] font-mono font-bold text-gray-400">
                    Format: Verified Digital Distribution Link
                  </div>
                </div>
              </div>

              {/* TextArea for previewing the message */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-black text-gray-500 tracking-wider">Preview Share invitation Message</span>
                <textarea 
                  readOnly
                  value={getShareInfo().text}
                  className="w-full h-40 bg-[#07090e] border border-white/5 rounded-xl p-3 text-xs font-mono text-zinc-300 resize-none focus:outline-none"
                />
              </div>

              {/* Direct Actions & Social Networks */}
              <div id="share-social-grid" className="grid grid-cols-2 gap-3 mt-6">
                <button
                  onClick={handleDownloadPoster}
                  className="flex items-center justify-center gap-2.5 py-3.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all col-span-2"
                >
                  <FaDownload className="text-base" />
                  <span>Download Poster Image to Device</span>
                </button>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(getShareInfo().url);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="flex items-center justify-center gap-2.5 py-3.5 bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/5 text-zinc-300 rounded-xl text-xs font-bold transition-all"
                >
                  <FaCopy className="text-base" />
                  <span>{copiedLink ? "Link Copied!" : "Copy Link"}</span>
                </button>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(getShareInfo().text);
                    setCopiedText(true);
                    setTimeout(() => setCopiedText(false), 2000);
                  }}
                  className="flex items-center justify-center gap-2.5 py-3.5 bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/5 text-zinc-300 rounded-xl text-xs font-bold transition-all"
                >
                  <FaCopy className="text-base" />
                  <span>{copiedText ? "Caption Copied!" : "Copy Caption Text"}</span>
                </button>

                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(getShareInfo().text)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2.5 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all"
                >
                  <FaWhatsapp className="text-base" />
                  <span>WhatsApp Chat</span>
                </a>

                <a
                  href={`https://t.me/share/url?url=${encodeURIComponent(getShareInfo().url)}&text=${encodeURIComponent(getShareInfo().text)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2.5 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all"
                >
                  <FaTelegram className="text-base" />
                  <span>Telegram Channel</span>
                </a>

                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getShareInfo().url)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2.5 py-3.5 bg-blue-800 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all col-span-2"
                >
                  <FaFacebook className="text-base" />
                  <span>Share on Facebook Feed</span>
                </a>
              </div>

              {/* Informational guide for tiktok / general sharing */}
              <div className="mt-6 flex flex-col gap-2 p-4 bg-[#11141c] border border-white/5 rounded-2xl text-left">
                <span className="text-xs font-extrabold text-zinc-300 block">Professional WhatsApp & Social Broadcast Guidelines:</span>
                <div className="text-[11px] text-zinc-400 space-y-1 md:space-y-1.5 leading-relaxed">
                  <p>1. <span className="text-white font-semibold">Native Share Option:</span> If your device or browser supports file-sharing, clicking the main circular share button automatically bundles the actual poster image file and English description together directly into the WhatsApp program.</p>
                  <p>2. <span className="text-white font-semibold">WhatsApp Status & Stories:</span> Click <span className="text-white font-semibold">Download Poster Image to Device</span>, followed by <span className="text-white font-semibold">Copy Caption Text</span>. Create a status post by uploading the poster and pasting the clipboard response as the image description.</p>
                  <p>3. <span className="text-white font-semibold">TikTok & Instagram:</span> Attach the obtained media artwork directly to your creator profile and attach the generated invitation details.</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* No action required - players are displayed inline now */}
    </AnimatePresence>
  );
}
