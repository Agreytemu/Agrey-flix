import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaPlay, FaPlus, FaCheck, FaStar, FaCalendarAlt, 
  FaArrowLeft, FaTv, FaFilm, FaChevronRight, FaTimes,
  FaDownload, FaYoutube, FaShareAlt, FaCopy, FaWhatsapp,
  FaFacebook, FaTelegram, FaTwitter
} from 'react-icons/fa';
import { useWatchlist } from '../context/WatchlistContext';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchTmdb } from '../utils/tmdb';
import { fetchStreamLinks, resolveStreamUrl, getStreamSourceType } from '../utils/extract';
import VideoPlayer from './VideoPlayer';
import AgreyFlixLoader from './AgreyFlixLoader';
import StreamingErrorDiagnostics from './StreamingErrorDiagnostics';

export default function MediaDetailsPage({ type = 'movie' }) {
  const { slug } = useParams(); // Using slug for mediaId
  const navigate = useNavigate();
  
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
    if (!slug) {
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
        const detailsRes = await fetchTmdb(`/${type}/${slug}?append_to_response=videos`);
        if (!detailsRes.ok) throw new Error("TMDB Response not OK");
        const detailsData = await detailsRes.json();
        
        const creditsRes = await fetchTmdb(`/${type}/${slug}/credits`);
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
          setCast(creditsData.cast?.slice(0, 10) || []);
          setTrailerKey(tKey);
          setAllTrailers(trailersList);
          
          // For TV Shows: default to season 1
          if (type === 'tv' && detailsData.seasons && detailsData.seasons.length > 0) {
            // Find first real season (often season_number 1 instead of 0 which is specials)
            const firstSeason = detailsData.seasons.find(s => s.season_number > 0) || detailsData.seasons[0];
            setActiveSeason(firstSeason.season_number);
          }
        }
      } catch (error) {
        console.error("Falling back to local data:", error);
        if (!cancelled) {
          const fakeTitle = type === 'tv' ? `TV Show ${slug}` : `Movie ${slug}`;
          setDetails({
             name: fakeTitle,
             title: fakeTitle,
             overview: 'This is the description placeholder for this video. You can stream it instantly by clicking the Watch Now button.',
             poster_path: null,
             backdrop_path: null,
             vote_average: 8.5,
             release_date: '2026-05-15',
             genres: [
               { id: 1, name: 'African Cinema' }, 
               { id: 2, name: 'Bongo Movie' }, 
               { id: 3, name: 'Action' }
             ],
             runtime: 120,
             seasons: type === 'tv' ? [
               { id: 101, name: 'Season 1', season_number: 1, episode_count: 5 }
             ] : [],
          });
          setCast([
            { id: 101, name: 'Lead Actor', character: 'Star' },
            { id: 102, name: 'Supporting Actor', character: 'Friend' }
          ]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchDetails();
    return () => { cancelled = true; };
  }, [slug, type]);

  // Dynamic Open Graph and Twitter Card tags updater
  useEffect(() => {
    if (!details) return;
    
    const movieTitle = details.title || details.name || "Recommended Media";
    const moviePoster = details.poster_path 
      ? `https://image.tmdb.org/t/p/w500${details.poster_path}` 
      : "https://image.tmdb.org/t/p/w500/placeholder.jpg";
    const movieOverview = details.overview || "Stream high-fidelity videos including bongo series and movies on AgreyFlix.";
    const targetUrl = type === 'tv'
      ? `https://agrey-flix.vercel.app/series/watch/${slug}`
      : `https://agrey-flix.vercel.app/movies/watch/${slug}`;

    // Update browser title
    document.title = `AgreyFlix | Watch ${movieTitle}`;

    const updateMeta = (property, value, isName = false) => {
      const selector = isName ? `meta[name="${property}"]` : `meta[property="${property}"]`;
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement('meta');
        if (isName) {
          element.setAttribute('name', property);
        } else {
          element.setAttribute('property', property);
        }
        document.head.appendChild(element);
      }
      element.setAttribute('content', value);
    };

    updateMeta('og:title', `AgreyFlix - Stream ${movieTitle}`);
    updateMeta('og:description', movieOverview);
    updateMeta('og:image', moviePoster);
    updateMeta('og:url', targetUrl);
    updateMeta('og:type', 'video.movie');
    updateMeta('twitter:card', 'summary_large_image', true);
    updateMeta('twitter:title', `AgreyFlix - Stream ${movieTitle}`, true);
    updateMeta('twitter:description', movieOverview, true);
    updateMeta('twitter:image', moviePoster, true);
  }, [details, slug, type]);

  // 2. Fetch Episodes for selected Season (TV Only)
  useEffect(() => {
    if (type !== 'tv' || !slug || !activeSeason) return;

    let cancelled = false;
    const fetchEpisodes = async () => {
      setEpisodesLoading(true);
      try {
        const res = await fetchTmdb(`/tv/${slug}/season/${activeSeason}`);
        if (!res.ok) throw new Error("Could not load season episodes");
        const data = await res.json();
        if (!cancelled && data.episodes) {
          setEpisodesList(data.episodes);
        }
      } catch (err) {
        console.error("Failed to load season episodes info:", err);
        if (!cancelled) {
          // Generate fallback episodes
          const fallbackEpisodes = Array.from({ length: 8 }, (_, i) => ({
            id: i + 1000,
            episode_number: i + 1,
            name: `Episode ${i + 1}`,
            overview: `Description of episode ${i + 1} of this popular series.`,
            air_date: '2026',
            still_path: null,
          }));
          setEpisodesList(fallbackEpisodes);
        }
      } finally {
        if (!cancelled) setEpisodesLoading(false);
      }
    };

    fetchEpisodes();
    return () => { cancelled = true; };
  }, [slug, type, activeSeason]);

  const inWatchlist = ready && !!slug && watchlistIds.has(String(slug));

  const isUpcoming = (() => {
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
    const rawDate = details?.release_date;
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
    const movieTitle = details?.title || details?.name || "Recommended Media";
    const moviePoster = details?.poster_path 
      ? `https://image.tmdb.org/t/p/w500${details.poster_path}` 
      : "https://image.tmdb.org/t/p/w500/placeholder.jpg";
    const appUrl = type === 'tv'
      ? `https://agrey-flix.vercel.app/series/watch/${slug}`
      : `https://agrey-flix.vercel.app/movies/watch/${slug}`;
    
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
      a.download = `${details?.title || details?.name || 'media'}_poster.jpg`;
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
        const file = new File([blob], `${details?.title || details?.name || 'media'}.jpg`, { type: 'image/jpeg' });
        
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
      mediaId: slug,
      type: type,
      title: details?.title || details?.name,
      poster_path: details?.poster_path,
      vote_average: details?.vote_average,
      release_date: details?.release_date || details?.first_air_date,
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

    if (streamSource === 'embed') {
      const embedBaseUrl = import.meta.env.VITE_SERVER_EMBED_URL || 'https://vidsrc-embed.ru';
      const embedUrl = type === 'tv'
        ? `${embedBaseUrl}/embed/tv/${slug}/${sNum}-${eNum}`
        : `${embedBaseUrl}/embed/movie/${slug}`;
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
      // 1. Call server /extract endpoint
      const responseData = await fetchStreamLinks(slug, type, sNum, eNum);
      
      // 2. Resolve HLS stream URL (highly prioritized Real-Debrid flows)
      const streamUrl = resolveStreamUrl(responseData);
      
      if (!streamUrl) {
        throw new Error("Sorry! No video stream was found on our servers.");
      }

      const sourceType = getStreamSourceType(responseData, streamUrl);
      setActiveStreamSource(sourceType);
      setActiveStreamUrl(streamUrl);
    } catch (err) {
      console.warn("[Watch stream failed (expected for some African movies), searching YouTube fallback...]", err);
      
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
    navigate(`/download/${type}/${slug}?season=${activeSeason}&episode=${activeEpisode}`);
  };

  const backdropSrc = details?.backdrop_path 
    ? `https://image.tmdb.org/t/p/original${details.backdrop_path}`
    : 'https://placehold.co/1920x1080/111/444/?text=No+Backdrop';

  const title = details?.title || details?.name || 'Loading...';
  const overview = details?.overview || 'No synopsis available.';
  const releaseDate = details?.release_date || details?.first_air_date;
  const rating = details?.vote_average;
  const ratingColor = rating >= 7 ? 'text-green-400' : rating >= 5 ? 'text-yellow-400' : 'text-red-400';
  const runtime = details?.runtime || (details?.episode_run_time && details.episode_run_time[0]);

  // Construct subtitle and header metadata
  const currentMediaTitle = details?.title || details?.name || '';
  const subTitleText = type === 'tv' 
    ? `Season ${activeSeason} - Episode ${activeEpisode}` 
    : runtime ? `${Math.floor(runtime / 60)}h ${runtime % 60}m` : '';

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pb-20 relative min-h-screen bg-[#050505]"
    >
      {/* Back button */}
      <button 
        onClick={() => navigate(-1)}
        className="absolute top-6 left-6 z-40 flex items-center justify-center w-12 h-12 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur text-white transition-all border border-white/10"
      >
        <FaArrowLeft />
      </button>

      {/* Header / Backdrop area - Dynamic inline player */}
      <div 
        className={
          playerMaximized && (trailerOpen || activeStreamUrl || embedActiveUrl)
            ? (type === 'tv' 
                ? "relative w-full aspect-video md:aspect-[16/10] bg-black overflow-hidden transition-all duration-500 shadow-2xl border-b border-white/10"
                : "relative w-full aspect-video md:aspect-[21/9] lg:aspect-[25/9] bg-black overflow-hidden transition-all duration-500 shadow-2xl border-b border-white/10")
            : (trailerOpen || activeStreamUrl || embedActiveUrl)
              ? (type === 'tv'
                  ? "relative w-full aspect-video bg-black overflow-hidden transition-all duration-500"
                  : "relative w-full aspect-video md:aspect-[21/9] bg-black overflow-hidden transition-all duration-500")
              : "relative w-full aspect-video md:aspect-[21/9] lg:aspect-[26/9] bg-black overflow-hidden transition-all duration-500"
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
                <div className="absolute top-4 left-4 z-40 flex items-center gap-2">
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
                  mediaId={slug}
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
                  slug={slug}
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
                <div className="absolute top-4 left-4 z-40 flex items-center gap-2">
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
                {/* Elegant gradient blending */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-transparent to-transparent opacity-80" />
                
                <div className="absolute bottom-0 left-0 p-8 md:p-16 w-full max-w-5xl">
                  {/* Inline Genres display */}
                  {details?.genres && details.genres.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {details.genres.map(g => (
                        <span key={g.id} className="text-xs font-bold text-red-500 uppercase tracking-wider bg-red-500/10 px-2.5 py-0.5 rounded-md">
                          {g.name}
                        </span>
                      ))}
                    </div>
                  )}

                  <motion.h1 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-6 tracking-tight drop-shadow-xl"
                  >
                    {title}
                  </motion.h1>
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-wrap items-center gap-4 text-sm md:text-base font-semibold text-gray-300"
                  >
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
                  </motion.div>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Content area */}
      <div className="px-8 md:px-16 pt-8 pb-12 flex flex-col lg:flex-row gap-12 lg:gap-20 max-w-7xl mx-auto -mt-6 relative z-10">
        
        {/* Left Column (Details + Episode Selectors) */}
        <div className="flex-1 space-y-10">
          
          {/* Actions / Play Button */}
          <motion.div 
             initial={{ y: 20, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             transition={{ delay: 0.3 }}
             className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-3">
              {isUpcoming ? (
                // Upcoming Movie UI: Prominent "Watch Trailer" button, no servers, multiple trailers if available
                <div className="space-y-6 bg-black/35 p-6 rounded-3xl border border-red-500/15">
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-black text-red-500 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span> Anticipated Upcoming Release
                    </span>
                    <h4 className="text-xl font-extrabold text-white">
                      {formattedReleaseDate ? `It will be released on ${formattedReleaseDate}` : "This cinematic content is not yet released"}
                    </h4>
                    <p className="text-sm text-zinc-400 font-medium leading-relaxed font-sans">
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
                        className="flex items-center gap-2.5 bg-red-600 hover:bg-red-500 text-white px-8 py-4.5 rounded-full font-bold transition-all active:scale-95 text-lg shadow-lg shadow-red-600/35"
                      >
                        <FaYoutube className="text-xl" />
                        <span>Watch Trailer</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 bg-[#1f2937]/40 border border-white/5 text-gray-400 px-6 py-4 rounded-full font-bold text-base shadow-lg cursor-not-allowed opacity-65">
                        <FaYoutube className="text-lg text-gray-500" />
                        <span>Trailer Unavailable</span>
                      </div>
                    )}

                    <button 
                      onClick={handleNativeShare}
                      className="flex items-center justify-center w-14 h-14 rounded-full border-2 border-gray-400 hover:border-white text-white hover:bg-white/10 transition-all group shadow-lg"
                      title="Share Content"
                    >
                      <FaShareAlt className="text-2xl text-white" />
                    </button>

                    <button 
                      onClick={handleWatchlistToggle}
                      className="flex items-center justify-center w-14 h-14 rounded-full border-2 border-gray-400 hover:border-white text-white hover:bg-white/10 transition-all group shadow-lg"
                      title={inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
                    >
                      {inWatchlist ? <FaCheck className="text-2xl text-white group-hover:text-red-500 transition-colors" /> : <FaPlus className="text-2xl" />}
                    </button>
                  </div>

                  {/* Display multiple trailers inside upcoming area if available */}
                  {allTrailers && allTrailers.length > 1 && (
                    <div className="pt-2 border-t border-white/5">
                      <span className="text-xs font-black text-zinc-500 uppercase tracking-widest block mb-2.5">
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
                      className="flex items-center gap-2 bg-red-600 hover:bg-red-500 disabled:bg-gray-700 text-white px-8 py-4 rounded-full font-bold transition-all active:scale-95 text-xl shadow-[0_0_20px_rgba(220,38,38,0.4)]"
                    >
                      {streamLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <FaPlay className="text-lg ml-1" />
                      )}
                      {streamLoading ? "Loading Stream..." : "Watch Now"}
                    </button>

                    <button 
                      onClick={() => handleDownload()}
                      disabled={streamLoading || downloadLoading}
                      className="flex items-center gap-2 bg-[#1f2937]/80 hover:bg-[#374151]/80 hover:text-white border border-white/10 disabled:bg-gray-700 text-gray-200 px-6 py-4 rounded-full font-bold transition-all active:scale-95 text-lg shadow-lg"
                      title="Pakua Video Hii"
                    >
                      {downloadLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <FaDownload className="text-lg" />
                      )}
                      {downloadLoading ? "Configuring..." : "Download"}
                    </button>

                    {trailerKey ? (
                      <button 
                        onClick={() => setTrailerOpen(true)}
                        className="flex items-center gap-2 bg-[#1f2937]/80 hover:bg-red-600/20 border border-red-500/30 hover:border-red-500 text-gray-200 hover:text-white px-6 py-4 rounded-full font-bold transition-all active:scale-95 text-lg shadow-lg"
                      >
                        <FaYoutube className="text-xl text-red-500" />
                        <span>Watch Trailer</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 bg-[#1f2937]/40 border border-white/5 text-gray-400 px-6 py-4 rounded-full font-bold text-lg shadow-lg cursor-not-allowed opacity-65" title="Trailer has not been found yet">
                        <FaYoutube className="text-xl text-gray-500" />
                        <span>Trailer Unavailable</span>
                      </div>
                    )}

                    <button 
                      onClick={handleNativeShare}
                      className="flex items-center justify-center w-14 h-14 rounded-full border-2 border-gray-400 hover:border-white text-white hover:bg-white/10 transition-all group shadow-lg"
                      title="Share Content"
                    >
                      <FaShareAlt className="text-2xl text-white" />
                    </button>
                    
                    <button 
                      onClick={handleWatchlistToggle}
                      className="flex items-center justify-center w-14 h-14 rounded-full border-2 border-gray-400 hover:border-white text-white hover:bg-white/10 transition-all group shadow-lg"
                      title={inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
                    >
                      {inWatchlist ? <FaCheck className="text-2xl text-white group-hover:text-red-500 transition-colors" /> : <FaPlus className="text-2xl" />}
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
            </div>

            {streamError && (
              <div className="max-w-xl animate-in slide-in-from-top-4 duration-300">
                <StreamingErrorDiagnostics 
                  error={streamError}
                  mediaId={slug}
                  type={type}
                  season={activeSeason}
                  episode={activeEpisode}
                />
              </div>
            )}
          </motion.div>

          {/* TV Seasons and Episodes Selector Block */}
          {!loading && type === 'tv' && details?.seasons && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h3 className="text-2xl font-black text-white flex items-center gap-2">
                  <FaTv className="text-red-500" /> Seasons & Episodes
                </h3>
                
                {/* Season selection dropdown */}
                <select 
                  value={activeSeason}
                  onChange={(e) => {
                    setActiveSeason(Number(e.target.value));
                    setActiveEpisode(1);
                  }}
                  className="bg-[#0d1117] border border-white/10 text-white font-bold px-4 py-2 rounded-xl focus:border-red-500 outline-none transition-colors cursor-pointer text-sm"
                >
                  {details.seasons.map(s => (
                    <option key={s.id} value={s.season_number}>
                      {s.name} ({s.episode_count} Ep)
                    </option>
                  ))}
                </select>
              </div>

              {/* Episodes List Grid */}
              {episodesLoading ? (
                <div className="flex justify-center p-12">
                  <AgreyFlixLoader />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
                  {episodesList.map(ep => (
                    <div 
                      key={ep.id}
                      onClick={() => handleWatchStream(activeSeason, ep.episode_number)}
                      className={`group p-3 rounded-2xl border transition-all cursor-pointer flex gap-4 bg-[#0d1117] hover:bg-white/5 ${
                        activeSeason === ep.season_number && activeEpisode === ep.episode_number
                          ? 'border-red-500/80 ring-1 ring-red-500/20'
                          : 'border-white/5 hover:border-white/10'
                      }`}
                    >
                      {/* Image representation */}
                      <div className="w-24 aspect-video rounded-lg overflow-hidden bg-[#111] shrink-0 border border-white/10 relative">
                        {ep.still_path ? (
                          <img 
                            src={`https://image.tmdb.org/t/p/w185${ep.still_path}`} 
                            alt={ep.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-900 text-gray-500 font-bold text-xs uppercase">
                            No Img
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <FaPlay className="text-white text-xs" />
                        </div>
                      </div>

                      {/* Info representation */}
                      <div className="flex-1 flex flex-col justify-center min-w-0">
                        <span className="text-[11px] font-black tracking-wider text-red-500 mb-0.5 uppercase">
                          Episode {ep.episode_number}
                        </span>
                        <h4 className="text-white font-bold text-sm truncate group-hover:text-red-400 transition-colors">
                          {ep.name}
                        </h4>
                        <p className="text-gray-400 text-xs line-clamp-2 mt-1 leading-snug">
                          {ep.overview || "No description available for this episode."}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Synopsis */}
          <motion.div 
             initial={{ y: 20, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             transition={{ delay: 0.4 }}
          >
            <h3 className="text-2xl font-bold text-white mb-4 border-l-4 border-red-600 pl-4">Synopsis</h3>
            <p className="text-gray-300 text-base md:text-lg leading-relaxed max-w-3xl font-medium">
              {loading ? (
                <span className="animate-pulse space-y-3 block">
                  <span className="h-4 bg-white/10 rounded w-full block"></span>
                  <span className="h-4 bg-white/10 rounded w-[90%] block"></span>
                  <span className="h-4 bg-white/10 rounded w-[95%] block"></span>
                  <span className="h-4 bg-white/10 rounded w-[80%] block"></span>
                </span>
              ) : overview}
            </p>
          </motion.div>

          {/* Genres */}
          <motion.div
             initial={{ y: 20, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             transition={{ delay: 0.5 }}
          >
            {!loading && details?.genres && details.genres.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wide">Genres</h3>
                <div className="flex flex-wrap gap-2">
                   {details.genres.map(g => (
                     <span key={g.id} className="bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-1.5 rounded-full text-sm font-bold text-white transition-colors">
                       {g.name}
                     </span>
                   ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Right Column (Cast) */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="w-full lg:w-1/3 min-w-[300px]"
        >
          <div className="bg-[#0d1117] border border-white/5 rounded-3xl p-8 shadow-xl">
            <h3 className="text-2xl font-bold text-white mb-6 border-l-4 border-red-600 pl-4">Cast</h3>
            {loading ? (
              <div className="space-y-6">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex items-center gap-4 animate-pulse">
                    <div className="w-14 h-14 rounded-full bg-white/10 shrink-0"></div>
                    <div className="space-y-3 flex-1">
                      <div className="h-3 bg-white/10 rounded w-[60%]"></div>
                      <div className="h-2 bg-white/10 rounded w-[40%]"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : cast.length > 0 ? (
                <div className="space-y-6">
                  {cast.map(person => (
                    <div key={person.id} className="flex items-center gap-4 group cursor-pointer hover:bg-white/5 p-2 -m-2 rounded-xl transition-colors">
                      <div className="w-14 h-14 rounded-full overflow-hidden bg-[#111] shrink-0 border border-white/10 shadow-lg">
                        {person.profile_path ? (
                          <img 
                            src={`https://image.tmdb.org/t/p/w185${person.profile_path}`} 
                            alt={person.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-500 font-black text-xl">
                            {person.name?.[0]}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-base font-bold text-white truncate group-hover:text-red-400 transition-colors">{person.name}</p>
                        <p className="text-sm text-gray-400 font-medium truncate">{person.character}</p>
                      </div>
                    </div>
                  ))}
                </div>
            ) : (
              <p className="text-gray-400 text-sm font-medium">No cast information available.</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Custom Share Modal Overlay */}
      <AnimatePresence>
        {shareOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0b0e14] border border-white/10 rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl relative"
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
                <div className="space-y-1.5 text-center sm:text-left flex-1">
                  <h4 className="text-base font-extrabold text-white">{details?.title || details?.name}</h4>
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
              <div className="mt-6 flex flex-col gap-2 p-4 bg-[#11141c] border border-white/5 rounded-2xl">
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
    </motion.div>
  );
}
