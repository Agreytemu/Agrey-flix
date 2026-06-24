import React, { useState, useEffect } from 'react';
import HeroBanner from './HeroBanner';
import { useProfile } from '../../context/ProfileContext';
import { FaCheckCircle, FaCalendarAlt } from 'react-icons/fa';
import TrendingRow from './TrendingRow';
import ContinueWatchingRow_2 from './ContinueWatchingRow_2';
import TrendingNowCarousel from '../../components/TrendingNowCarousel';
import TMDBErrorDiagnostics from '../../components/TMDBErrorDiagnostics';
import { fetchTmdb } from '../../utils/tmdb';
import { motion } from 'framer-motion';
import { HomePageSkeleton } from '../../components/Skeletons';

export default function HomePage() {
  const { profile } = useProfile();
  
  const greeting = (() => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good morning';
    if (hr < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  const userName = profile?.displayName || profile?.email?.split('@')[0] || 'Subscriber';

  const joinedDate = (() => {
    const dateStr = profile?.created_at;
    if (!dateStr) return 'June 2026';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } catch (e) {
      return 'June 2026';
    }
  })();

  const [trending, setTrending] = useState([]);
  const [popularMovies, setPopularMovies] = useState([]);
  const [nowPlaying, setNowPlaying] = useState([]);
  const [upcomingMovies, setUpcomingMovies] = useState([]);
  const [mustWatchSeries, setMustWatchSeries] = useState([]);
  const [topSeries, setTopSeries] = useState([]);
  const [africaPride, setAfricaPride] = useState([]);
  const [animations, setAnimations] = useState([]);
  const [latestMovies, setLatestMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const fetchAllData = async () => {
      setLoading(true);
      setError(null);
      try {
        const formatResults = (results, type = 'movie') => {
          if (!results) return [];
          return results.map(item => ({
            ...item,
            type: item.media_type || type,
            poster_path: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
            backdrop_path: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : null,
          }));
        };

        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const todayStr = `${yyyy}-${mm}-${dd}`;

        const [
          resTrending,
          resPopularMovies,
          resNowPlaying,
          resMustWatchSeries,
          resTopSeries,
          resAfricanMovies,
          resAnimations,
          resUpcoming1,
          resUpcoming2,
          resPopularFuture1,
          resPopularFuture2
        ] = await Promise.all([
          fetchTmdb('/trending/all/week'),
          fetchTmdb('/movie/popular'),
          fetchTmdb('/movie/now_playing'),
          fetchTmdb('/tv/popular'),
          fetchTmdb('/tv/top_rated'),
          fetchTmdb('/discover/movie?with_original_language=sw'),
          fetchTmdb('/discover/movie?with_genres=16'),
          fetchTmdb('/movie/upcoming?page=1'),
          fetchTmdb('/movie/upcoming?page=2'),
          fetchTmdb(`/discover/movie?sort_by=popularity.desc&primary_release_date.gte=${todayStr}&page=1`),
          fetchTmdb(`/discover/movie?sort_by=popularity.desc&primary_release_date.gte=${todayStr}&page=2`)
        ]);

        const [
          dataTrending,
          dataPopularMovies,
          dataNowPlaying,
          dataMustWatchSeries,
          dataTopSeries,
          dataAfricanMovies,
          dataAnimations,
          dataUpcoming1,
          dataUpcoming2,
          dataPopularFuture1,
          dataPopularFuture2
        ] = await Promise.all([
          resTrending.json(),
          resPopularMovies.json(),
          resNowPlaying.json(),
          resMustWatchSeries.json(),
          resTopSeries.json(),
          resAfricanMovies.json(),
          resAnimations.json(),
          resUpcoming1.json(),
          resUpcoming2.json(),
          resPopularFuture1.json(),
          resPopularFuture2.json()
        ]);

        // Fail-safe check: if they have results as undefined or missing (401 results, etc), throw
        if (!dataTrending.results && !dataPopularMovies.results) {
          throw new Error("Empty response from TMDB. There might be an issue with your TMDB API Key (VITE_TMDB_API) or connectivity.");
        }

        if (!cancelled) {
          setTrending(formatResults(dataTrending.results, 'movie'));
          setPopularMovies(formatResults(dataPopularMovies.results, 'movie'));
          setNowPlaying(formatResults(dataNowPlaying.results, 'movie'));

          // Merge and deduplicate upcoming and popular future results
          const combinedUpcoming = [
            ...(dataUpcoming1.results || []),
            ...(dataUpcoming2.results || []),
            ...(dataPopularFuture1.results || []),
            ...(dataPopularFuture2.results || [])
          ];
          const uniqueMap = {};
          combinedUpcoming.forEach(item => {
            if (item && item.id) uniqueMap[item.id] = item;
          });
          const uniqueUpcoming = Object.values(uniqueMap);

          // Filter strictly unreleased/upcoming movies whose release date is in the future
          const unreleasedOnly = uniqueUpcoming.filter(movie => {
            if (!movie.release_date) return true; // Keep if no release_date but categorized as upcoming
            return new Date(movie.release_date) > today;
          });
          const upcomingWithFlag = formatResults(unreleasedOnly, 'movie').map(item => ({
            ...item,
            isUpcoming: true
          }));
          setUpcomingMovies(upcomingWithFlag);

          setMustWatchSeries(formatResults(dataMustWatchSeries.results, 'tv'));
          setTopSeries(formatResults(dataTopSeries.results, 'tv'));
          
          let AF_MOVIES = formatResults(dataAfricanMovies.results, 'movie');
          if (AF_MOVIES.length < 8) {
            try {
              const resNollywood = await fetchTmdb('/discover/movie?with_origin_country=NG');
              const dataNollywood = await resNollywood.json();
              const nollywood = formatResults(dataNollywood.results, 'movie');
              const seen = new Set(AF_MOVIES.map(m => m.id));
              nollywood.forEach(item => {
                if (!seen.has(item.id)) {
                  AF_MOVIES.push(item);
                  seen.add(item.id);
                }
              });
            } catch (err) {
              console.error("Nollywood append failed", err);
            }
          }
          setAfricaPride(AF_MOVIES);
          
          const animResults = formatResults(dataAnimations.results, 'movie').map(item => ({
            ...item,
            isAnimation: true
          }));
          setAnimations(animResults);

          // Nyuzi za hivi karibuni toka Seva 2 (Vidsrc-embed)
          let vidsrcLatestMovies = [];
          try {
            const backendBase = import.meta.env.VITE_API_BASE_URL || 'https://vidsrcscraper-production.up.railway.app';
            const proxyUrl = backendBase.endsWith('/') ? backendBase.slice(0, -1) : backendBase;
            
            let resLatestM;
            try {
              resLatestM = await fetch(`${proxyUrl}/api/latest-movies`);
              if (resLatestM.ok) {
                const rawData = await resLatestM.json();
                if (Array.isArray(rawData)) {
                  vidsrcLatestMovies = rawData;
                } else if (rawData && Array.isArray(rawData.result)) {
                  vidsrcLatestMovies = rawData.result;
                } else if (rawData && Array.isArray(rawData.results)) {
                  vidsrcLatestMovies = rawData.results;
                }
              } else {
                throw new Error("Proxy error response");
              }
            } catch (mErr) {
              console.log("Proxy latest-movies query went offline. Skipping remote lookup to prevent browser CORS exceptions.");
            }
          } catch (err) {
            console.log("Vidsrc-embed lookup skipped:", err.message);
          }

          // Safe fallback to prevent empty sections or browser console failures
          if (!vidsrcLatestMovies || vidsrcLatestMovies.length === 0) {
            vidsrcLatestMovies = dataNowPlaying.results || [];
          }

          // Map vidsrcLatestMovies
          const mappedLatest = vidsrcLatestMovies.slice(0, 15).map(item => {
            const tmdbId = item.tmdb_id || item.tmdb || item.id;
            const title = item.title || item.name || `Movie #${tmdbId}`;
            
            // Extract the poster image using the most robust fallback mechanism
            const poster_path = (() => {
              const img = item.poster_path || item.poster || item.image || item.thumb;
              if (!img) return null;
              if (img.startsWith('http')) return img;
              const cleanImg = img.startsWith('/') ? img : `/${img}`;
              return `https://image.tmdb.org/t/p/w500${cleanImg}`;
            })();

            return {
              id: tmdbId,
              mediaId: tmdbId,
              title: title,
              name: title,
              type: 'movie',
              poster_path: poster_path
            };
          }).filter(item => item.id);

          setLatestMovies(mappedLatest);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error reading TMDB response in HomePage:", err);
        if (!cancelled) {
          setError(err);
          setLoading(false);
        }
      }
    };

    fetchAllData();
    return () => { cancelled = true; };
  }, [retryKey]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.3
      }
    }
  };

  const rowVariants = {
    hidden: { opacity: 0, y: 40 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  if (loading) {
    return <HomePageSkeleton />;
  }

  if (error) {
    return <TMDBErrorDiagnostics error={error} onRetry={() => setRetryKey(prev => prev + 1)} />;
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="pb-20"
    >
      {/* Premium Welcome Banner Card */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="pt-20 md:pt-8 pb-4 px-4 md:px-16"
      >
        <div className="relative overflow-hidden bg-gradient-to-r from-zinc-950/95 to-[#0D0D0D]/95 border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Accent ambient glow effects matching the theme */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/10 rounded-full blur-[90px] pointer-events-none -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-zinc-700/5 rounded-full blur-[90px] pointer-events-none -ml-16 -mb-16" />
          
          <div className="relative z-10 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-red-500">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
              AgreyFlix Streaming Experience
            </div>
            <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight flex items-center gap-2">
              {greeting}, {userName}! <FaCheckCircle className="text-emerald-500 text-lg md:text-2xl shrink-0" title="Verified Account" />
            </h1>
            <p className="text-zinc-400 text-sm md:text-base font-semibold max-w-2xl leading-relaxed">
              We hope you enjoy streaming all the latest blockbuster movies, trending TV series, and Swahili content in crystal-clear HD. Sit back and have an exceptional viewing session!
            </p>
          </div>
          
          {/* Sign up "together since" badge */}
          <div className="relative z-10 shrink-0 self-start md:self-center bg-zinc-900/60 border border-white/5 rounded-2xl p-4 flex flex-col items-start gap-1 backdrop-blur-sm">
            <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider flex items-center gap-1.5">
              <FaCalendarAlt className="text-red-500" /> Member Milestone
            </span>
            <span className="text-xs md:text-sm font-black text-white">
              Together since <span className="text-red-500">{joinedDate}</span>
            </span>
          </div>
        </div>
      </motion.div>

      <HeroBanner />
      
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="relative z-20 -mt-24 sm:-mt-32 space-y-12"
      >
        <motion.div variants={rowVariants}>
          <ContinueWatchingRow_2 />
        </motion.div>
        <motion.div variants={rowVariants}>
          <TrendingNowCarousel />
        </motion.div>
        {latestMovies.length > 0 && (
          <motion.div variants={rowVariants}>
            <TrendingRow title="Recently Added (Server 2)" items={latestMovies} />
          </motion.div>
        )}
        {popularMovies.length > 0 && (
          <motion.div variants={rowVariants}>
            <TrendingRow title="Top 10 Movies This Week" items={popularMovies.slice(0, 10)} useNumbers={true} />
          </motion.div>
        )}
        {upcomingMovies.length > 0 && (
          <motion.div variants={rowVariants}>
            <TrendingRow title="Upcoming Movies & New Trailers" items={upcomingMovies.slice(0, 15)} />
          </motion.div>
        )}
        {nowPlaying.length > 0 && (
          <motion.div variants={rowVariants}>
            <TrendingRow title="Now Playing in Theaters" items={nowPlaying.slice(0, 15)} />
          </motion.div>
        )}
        {mustWatchSeries.length > 0 && (
          <motion.div variants={rowVariants}>
            <TrendingRow title="Must-Watch Series" items={mustWatchSeries.slice(0, 15)} />
          </motion.div>
        )}
        {topSeries.length > 0 && (
          <motion.div variants={rowVariants}>
            <TrendingRow title="Top 10 Series This Week" items={topSeries.slice(0, 10)} useNumbers={true} />
          </motion.div>
        )}
        {africaPride.length > 0 && (
          <motion.div variants={rowVariants}>
            <TrendingRow title="Africa Pride (Bongo & Afro)" items={africaPride} />
          </motion.div>
        )}
        {animations.length > 0 && (
          <motion.div variants={rowVariants}>
            <TrendingRow title="Top Animations" items={animations.slice(0, 15)} />
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
