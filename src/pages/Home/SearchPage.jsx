import React, { useState, useEffect } from 'react';
import ContentCard from './ContentCard';
import { fetchTmdb } from '../../utils/tmdb';
import { FaSearch, FaGamepad, FaFilm, FaTv } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import AgreyFlixLoader from '../../components/AgreyFlixLoader';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load suggestions on mount
  useEffect(() => {
    let cancelled = false;
    const fetchSuggestions = async () => {
      try {
        const res = await fetchTmdb('/trending/all/day');
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data.results) {
            const formatted = data.results.slice(0, 10).map(item => ({
              ...item,
              type: item.media_type || 'movie',
              poster_path: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
              release_date: item.release_date || item.first_air_date,
            }));
            setSuggestions(formatted);
          }
        }
      } catch (e) {
        console.error("Error loading search suggestions:", e);
      }
    };
    fetchSuggestions();
    return () => { cancelled = true; };
  }, []);

  // Debounced search when query changes
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await fetchTmdb(`/search/multi?query=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data.results) {
            // Filter out items without poster or media_type in ['movie', 'tv']
            const formatted = data.results
              .filter(item => item.media_type === 'movie' || item.media_type === 'tv')
              .map(item => ({
                ...item,
                type: item.media_type,
                title: item.title || item.name,
                release_date: item.release_date || item.first_air_date,
                poster_path: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
              }));
            setResults(formatted);
          }
        }
      } catch (err) {
        console.error("Search query failed:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 400);

    return () => {
      clearTimeout(delayDebounceFn);
      cancelled = true;
    };
  }, [query]);

  const displayedItems = query ? results : suggestions;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -20 }} 
      transition={{ duration: 0.4 }}
      className="p-6 md:p-10 pb-20"
    >
      <div className="max-w-4xl mx-auto mb-12 mt-8">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
            <FaSearch className="text-gray-400 text-xl group-focus-within:text-red-500 transition-colors" />
          </div>
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for movies, TV series, documentaries..."
            className="w-full bg-[#0d1117] border border-white/10 rounded-full py-5 pl-16 pr-6 text-white text-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all font-semibold shadow-2xl"
            autoFocus
          />
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        <motion.div
           key={query ? 'search' : 'suggestions'}
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           exit={{ opacity: 0, y: -10 }}
           transition={{ duration: 0.3 }}
        >
          {query && (
            <h2 className="text-2xl font-bold text-white mb-8 border-l-4 border-red-600 pl-4 flex items-center gap-3">
              Results for "{query}" 
              {!loading && (
                <span className="text-gray-500 text-sm font-semibold bg-white/10 px-3 py-1 rounded-full">{displayedItems.length} found</span>
              )}
            </h2>
          )}
          
          {!query && (
            <div className="mb-10 animate-fade-in">
              <h2 className="text-2xl font-bold text-white mb-6 border-l-4 border-red-600 pl-4 flex items-center justify-between">
                <span>Popular Categories</span>
                <span className="text-xs text-zinc-500 uppercase font-black tracking-widest hidden sm:inline">QUICK SEARCH</span>
              </h2>
              <div className="flex flex-wrap gap-3 mb-8">
                 <button onClick={() => setQuery('Action')} className="flex items-center gap-2 bg-[#0d1017] hover:bg-red-950/25 border border-white/5 py-3.5 px-6 rounded-xl font-extrabold text-xs tracking-wider transition-all hover:border-red-500/30 text-white shadow-md active:scale-95"><FaFilm className="text-red-500" /> BLOCKBUSTER MOVIES</button>
                 <button onClick={() => setQuery('Comedy')} className="flex items-center gap-2 bg-[#0d1017] hover:bg-purple-950/25 border border-white/5 py-3.5 px-6 rounded-xl font-extrabold text-xs tracking-wider transition-all hover:border-purple-500/30 text-white shadow-md active:scale-95"><FaTv className="text-purple-500" /> BINGE-WORTHY SHOWS</button>
                 <button onClick={() => setQuery('Animation')} className="flex items-center gap-2 bg-[#0d1017] hover:bg-emerald-950/25 border border-white/5 py-3.5 px-6 rounded-xl font-extrabold text-xs tracking-wider transition-all hover:border-emerald-500/30 text-white shadow-md active:scale-95"><FaGamepad className="text-green-500" /> ANIME & DONGHUA</button>
              </div>

              <h2 className="text-2xl font-bold text-white mb-6 border-l-4 border-red-600 pl-4 flex items-center justify-between">
                <span>Suggested Queries</span>
                <span className="text-xs text-zinc-500 uppercase font-black tracking-widest hidden sm:inline">TRENDING TAGS</span>
              </h2>
              <div className="flex flex-wrap gap-2.5 mb-12 bg-black/20 p-4 border border-white/5 rounded-2xl">
                 {['Bongo', 'Hollywood', 'Avengers', 'Nigerian', 'Spider-Man', 'Animated', 'Trending Series', 'Action Heavy', 'Pedro Pascal'].map((tag) => (
                   <button
                     key={tag}
                     onClick={() => setQuery(tag)}
                     className="px-4 py-2 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-full text-xs font-black tracking-wider transition-all active:scale-95 border border-white/5 hover:border-white/15"
                   >
                     #{tag.toUpperCase()}
                   </button>
                 ))}
              </div>

              <h2 className="text-2xl font-bold text-white mb-6 border-l-4 border-red-600 pl-4">Suggested Hot Releases</h2>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center p-20">
              <AgreyFlixLoader />
            </div>
          ) : displayedItems.length > 0 ? (
            <motion.div 
               initial="hidden" 
               animate="show" 
               variants={{
                 hidden: { opacity: 0 },
                 show: { opacity: 1, transition: { staggerChildren: 0.05 } }
               }}
               className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6"
            >
              {displayedItems.map((item) => (
                <motion.div variants={{ hidden: { opacity: 0, scale: 0.9 }, show: { opacity: 1, scale: 1 } }} key={item.id}>
                  <ContentCard 
                    title={item.title || item.name}
                    poster={item.poster_path}
                    rating={item.vote_average}
                    releaseDate={item.release_date}
                    mediaType={item.type}
                    mediaId={item.id}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center justify-center py-24 text-center bg-[#0d1117] rounded-3xl border border-white/5 mx-auto max-w-4xl shadow-xl"
            >
               <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
                 <FaSearch className="text-5xl text-gray-500" />
               </div>
               <h3 className="text-2xl font-bold text-white mb-3">No results found</h3>
               <p className="text-gray-400 max-w-sm mb-6">We couldn't find any matches for "<span className="text-white">{query}</span>". Check your spelling or try different keywords.</p>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
