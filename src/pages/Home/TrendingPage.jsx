import React, { useState, useEffect, useCallback } from 'react';
import ContentCard from './ContentCard';
import { fetchTmdb } from '../../utils/tmdb';
import { FaFire, FaSearch, FaFilter, FaSortAmountDown, FaGlobe, FaChevronRight, FaSync, FaStar } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import AgreyFlixLoader from '../../components/AgreyFlixLoader';

export default function TrendingPage() {
  const [trendingAll, setTrendingAll] = useState([]);
  const [displayedItems, setDisplayedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadedPagesCount, setLoadedPagesCount] = useState(6);
  const [errorLocal, setErrorLocal] = useState(null);

  // States for search and filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [liveTmdbResults, setLiveTmdbResults] = useState([]);
  const [isSearchingTmdb, setIsSearchingTmdb] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all'); // 'all', 'movie', 'tv'
  const [ratingFilter, setRatingFilter] = useState('all'); // 'all', 'high' (>= 75%)
  const [sortBy, setSortBy] = useState('popularity'); // 'popularity', 'vote_average', 'release_date'

  // Fetch multiple pages of trending content
  const loadTrendingData = useCallback(async (pagesToLoad = 6) => {
    setLoading(true);
    setErrorLocal(null);
    try {
      // We fetch both Weekly and Daily trending across multiple pages to get a very broad range of content
      const weeklyPromises = Array.from({ length: pagesToLoad }, (_, i) => 
        fetchTmdb(`/trending/all/week?page=${i + 1}`)
      );
      const dailyPromises = Array.from({ length: Math.min(pagesToLoad, 3) }, (_, i) => 
        fetchTmdb(`/trending/all/day?page=${i + 1}`)
      );

      const allResponses = await Promise.all([...weeklyPromises, ...dailyPromises]);
      
      const allResults = [];
      for (const res of allResponses) {
        if (res.ok) {
          const data = await res.json();
          if (data && data.results) {
            allResults.push(...data.results);
          }
        }
      }

      // Deduplicate items by ID
      const uniqueMap = {};
      allResults.forEach(item => {
        if (item && item.id) {
          uniqueMap[item.id] = item;
        }
      });

      const uniqueList = Object.values(uniqueMap).map(item => ({
        ...item,
        type: item.media_type || 'movie',
        poster_path: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
      }));

      // Set state
      setTrendingAll(uniqueList);
    } catch (err) {
      console.error("Error loading multiple trending pages:", err);
      setErrorLocal(err.message || "Failed to retrieve the trending directory. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadTrendingData(loadedPagesCount);
  }, [loadTrendingData, loadedPagesCount]);

  // Live direct search in TMDB when query changes and does not match localized item
  useEffect(() => {
    if (!searchQuery.trim()) {
      setLiveTmdbResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingTmdb(true);
      try {
        const res = await fetchTmdb(`/search/multi?query=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.results) {
            const parsed = data.results
              .filter(item => item.media_type === 'movie' || item.media_type === 'tv')
              .map(item => ({
                ...item,
                type: item.media_type,
                poster_path: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
              }));
            setLiveTmdbResults(parsed);
          }
        }
      } catch (err) {
        console.warn("Direct TMDB Search failed:", err);
      } finally {
        setIsSearchingTmdb(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Apply filters & sorting to items
  useEffect(() => {
    let itemsToProcess = [...trendingAll];

    // Category Filter (All, Movie, TV)
    if (categoryFilter !== 'all') {
      itemsToProcess = itemsToProcess.filter(item => item.type === categoryFilter);
    }

    // Rating Filter (All, High rating >= 7.5 or >= 75%)
    if (ratingFilter === 'high') {
      itemsToProcess = itemsToProcess.filter(item => item.vote_average >= 7.0);
    }

    // Sort processing
    itemsToProcess.sort((a, b) => {
      if (sortBy === 'vote_average') {
        return (b.vote_average || 0) - (a.vote_average || 0);
      } else if (sortBy === 'release_date') {
        const dateA = new Date(a.release_date || a.first_air_date || 0);
        const dateB = new Date(b.release_date || b.first_air_date || 0);
        return dateB - dateA;
      } else {
        // Default: popularity
        return (b.popularity || 0) - (a.popularity || 0);
      }
    });

    setDisplayedItems(itemsToProcess);
  }, [trendingAll, categoryFilter, ratingFilter, sortBy]);

  // Load more pages command
  const handleLoadMorePages = () => {
    setLoadedPagesCount(prev => prev + 4);
  };

  // Filter local display results if there is a search query
  const filteredLocalDisplay = searchQuery.trim() 
    ? displayedItems.filter(item => {
        const titleText = (item.title || item.name || '').toLowerCase();
        const origText = (item.original_title || item.original_name || '').toLowerCase();
        const q = searchQuery.toLowerCase();
        return titleText.includes(q) || origText.includes(q);
      })
    : displayedItems;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -15 }} 
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="p-6 md:p-10 pb-24 text-white font-sans max-w-[1600px] mx-auto"
      id="trending-container-page"
    >
      {/* HEADER SECTION WITH MODERN COUNTER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-white/5 pb-6" id="trending-header-bar">
        <div>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight flex items-center gap-3" id="trending-main-title">
            Trending Hub <FaFire className="text-orange-500 animate-pulse drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
          </h1>
          <p className="text-zinc-400 mt-2 font-medium" id="trending-description">
            Comprehensive database scanning active. Browse live movie listings, high-rating TV series, and seasonal trending titles.
          </p>
        </div>
        
        {/* COUNTER BADGE */}
        <div className="flex items-center gap-3 bg-[#111420]/80 border border-white/10 px-4 py-2.5 rounded-2xl self-start md:self-center shadow-lg" id="trending-stats-badge">
          <FaGlobe className="text-cyan-400 text-lg animate-spin [animation-duration:8s]" />
          <div>
            <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Cached Database</div>
            <div className="text-sm font-extrabold text-white">
              {trendingAll.length > 0 ? `${trendingAll.length} Trending Titles` : 'Analyzing...'}
            </div>
          </div>
          <button 
            onClick={() => loadTrendingData(loadedPagesCount)} 
            className="ml-2 w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
            title="Refresh list"
            id="trending-refresh-btn"
          >
            <FaSync className="text-xs text-zinc-300" />
          </button>
        </div>
      </div>

      {/* FILTERS & SEARCH MODULE */}
      <div className="bg-[#121520]/60 border border-white/5 p-5 md:p-6 rounded-3xl mb-10 shadow-xl backdrop-blur-md space-y-5" id="trending-controls-panel">
        
        {/* ROW 1: SEARCH BAR */}
        <div className="relative" id="trending-search-wrap">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-lg" />
          <input
            type="text"
            id="trending-search-field"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search live trending categories or query public catalogs directly (e.g., 'The Polygamist')..."
            className="w-full bg-[#161a29]/90 text-white pl-12 pr-4 py-4 rounded-2xl border border-white/10 focus:border-red-500 transition-all text-sm md:text-base outline-none shadow-inner placeholder-zinc-500 font-medium"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-xs px-2.5 py-1 rounded-lg text-zinc-300 font-bold transition-all"
              id="trending-clear-search"
            >
              Clear
            </button>
          )}
        </div>

        {/* ROW 2: FILTERS & SORTS */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2" id="trending-filters-row">
          
          {/* CATEGORIES BUTTONS */}
          <div className="flex items-center gap-2 flex-wrap" id="trending-category-tabs">
            <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider mr-2 hidden sm:inline">Type:</span>
            {[
              { id: 'all', label: 'All Handy' },
              { id: 'movie', label: 'Movies' },
              { id: 'tv', label: 'TV Shows & Series' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setCategoryFilter(tab.id)}
                className={`px-4 py-2 text-xs md:text-sm font-bold rounded-xl transition-all ${
                  categoryFilter === tab.id
                    ? 'bg-red-600 text-white shadow-md shadow-red-700/30 ring-1 ring-red-500'
                    : 'bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white'
                }`}
                id={`trending-tab-${tab.id}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* SORTS & QUALITY DROPDOWN OPTIONS */}
          <div className="flex items-center gap-3 flex-wrap" id="trending-sort-controls">
            
            {/* RATING SLIDER / FAST BUTTON */}
            <button
              onClick={() => setRatingFilter(prev => prev === 'all' ? 'high' : 'all')}
              className={`px-3.5 py-2 text-xs md:text-sm font-bold rounded-xl transition-all flex items-center gap-2 ${
                ratingFilter === 'high'
                  ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/50 shadow-md shadow-yellow-500/10'
                  : 'bg-white/5 text-zinc-300 border border-transparent hover:bg-white/10'
              }`}
              id="trending-toggle-high-rating"
            >
              <FaStar className="text-yellow-400" /> Top Rated (70%+)
            </button>

            {/* SORTING METHOD */}
            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5" id="trending-sort-dropdown-wrap">
              <FaSortAmountDown className="text-zinc-400 text-xs" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-xs sm:text-sm text-zinc-200 outline-none cursor-pointer font-bold border-none"
                id="trending-sort-select"
              >
                <option value="popularity" className="bg-[#111420] text-white">Hottest (Popularity)</option>
                <option value="vote_average" className="bg-[#111420] text-white">Top Rated (Vote Average %)</option>
                <option value="release_date" className="bg-[#111420] text-white">Recently Released</option>
              </select>
            </div>

          </div>

        </div>

      </div>

      {/* LOADER */}
      {loading && trendingAll.length === 0 && (
        <div className="py-24 flex flex-col justify-center items-center gap-4" id="trending-loading-spinner">
          <AgreyFlixLoader />
          <p className="text-zinc-400 font-bold text-sm">Aggregating global trending entries across streaming nodes, please wait...</p>
        </div>
      )}

      {/* SEARCH OR RESULTS LISTING */}
      <div id="trending-results-section" className="space-y-12">
        
        {/* SECTION A: DIRECT TMDB LIVE RESULTS (IF USER SEARCHED A SPECIFIC TITLE) */}
        {searchQuery.trim() !== '' && (
          <div className="border border-white/5 rounded-3xl p-6 bg-[#0f121d]/40" id="trending-direct-tmdb-block">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-white/5 pb-4">
              <h2 className="text-lg md:text-xl font-extrabold text-cyan-400 flex items-center gap-2">
                <FaGlobe className="animate-spin [animation-duration:12s]" />
                Direct Global Catalog Matches (Live Results)
              </h2>
              <span className="text-xs bg-white/5 text-zinc-400 px-3 py-1 rounded-lg font-bold">
                Found: {liveTmdbResults.length} entries
              </span>
            </div>

            {isSearchingTmdb ? (
              <div className="py-12 flex justify-center" id="trending-tmdb-search-loading">
                <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : liveTmdbResults.length === 0 ? (
              <p className="text-zinc-500 text-sm py-4 italic">No additional entries matching your query were found in our global repositories.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6" id="trending-live-search-grid">
                {liveTmdbResults.map((item) => (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    key={`live-${item.id}`}
                  >
                    <ContentCard 
                      title={item.title || item.name}
                      poster={item.poster_path}
                      rating={item.vote_average}
                      releaseDate={item.release_date || item.first_air_date}
                      mediaType={item.type}
                      mediaId={item.id}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SECTION B: LOCAL EXTENSIVE TRENDING RESULTS */}
        <div id="trending-local-block">
          <div className="flex items-center justify-between mb-6" id="trending-local-header">
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span className="w-2 h-6 bg-red-600 rounded-sm"></span>
              {searchQuery.trim() ? 'Matches in Our Current Charts' : 'Trending Master List'}
            </h2>
            <span className="text-xs bg-red-600/10 text-red-400 border border-red-500/20 px-3 py-1 rounded-lg font-bold">
              {filteredLocalDisplay.length} displayed
            </span>
          </div>

          {filteredLocalDisplay.length === 0 ? (
            <div className="py-16 text-center bg-white/5 rounded-3xl border border-white/5" id="trending-no-local-results">
              <p className="text-zinc-400 font-bold mb-2">No entries matched your filter selections.</p>
              <p className="text-zinc-600 text-sm">Try clearing active filters or modifying your search query.</p>
            </div>
          ) : (
            <motion.div 
              initial="hidden" 
              animate="show" 
              variants={{
                hidden: { opacity: 0 },
                show: { opacity: 1, transition: { staggerChildren: 0.03 } }
              }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6"
              id="trending-grid"
            >
              {filteredLocalDisplay.map((item) => (
                <motion.div 
                  variants={{ hidden: { opacity: 0, scale: 0.93 }, show: { opacity: 1, scale: 1 } }} 
                  key={`trend-${item.id}`}
                >
                  <ContentCard 
                    title={item.title || item.name}
                    poster={item.poster_path}
                    rating={item.vote_average}
                    releaseDate={item.release_date || item.first_air_date}
                    mediaType={item.type}
                    mediaId={item.id}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>

      </div>

      {/* FOOTER ACTION FOR MORE DATA */}
      {!loading && !searchQuery.trim() && (
        <div className="mt-16 flex flex-col justify-center items-center gap-4 border-t border-white/5 pt-10" id="trending-load-more-section">
          <p className="text-zinc-400 text-sm font-semibold">Fetched {loadedPagesCount} catalog index layers. Expand searchable index count with deeper catalog coverage?</p>
          <button 
            onClick={handleLoadMorePages}
            className="px-6 py-3.5 rounded-2xl bg-white text-black font-extrabold text-sm hover:bg-zinc-200 active:scale-95 transition-all shadow-xl flex items-center gap-2"
            id="trending-load-more-btn"
          >
            Expand Deeper Catalog Scope <FaChevronRight className="text-xs" />
          </button>
        </div>
      )}

    </motion.div>
  );
}

