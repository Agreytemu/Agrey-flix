import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaAward, FaSearch, FaStar, FaFire, FaFilter, FaUserPlus, FaFilm, FaChevronRight, FaChevronLeft, FaTimes, FaTv, FaHeart, FaShareAlt } from 'react-icons/fa';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { fetchTmdb } from '../../utils/tmdb';
import ContentCard from './ContentCard';
import AgreyFlixLoader from '../../components/AgreyFlixLoader';

// Static offline fallbacks in case TMDB lookup is slow or exceeds rate limits
const BACKUP_ARTISTS = [
  {
    id: 115440,
    name: "Pedro Pascal",
    popularity: 145.8,
    known_for_department: "Acting",
    gender: 2,
    profile_path: "https://image.tmdb.org/t/p/w500/9696vszEvEv9698dZ5B2b9DVEZ6.jpg",
    backup_profile: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80",
    known_for: [
      { id: 100088, title: "The Last of Us", name: "The Last of Us", media_type: "tv", poster_path: "https://image.tmdb.org/t/p/w500/uKVQjEUuHSi1368n60bUI73WbYn.jpg", vote_average: 8.6, release_date: "2023-01-15", first_air_date: "2023-01-15" },
      { id: 85271, title: "The Mandalorian", name: "The Mandalorian", media_type: "tv", poster_path: "https://image.tmdb.org/t/p/w500/e9N6O61mYgOi6Zg8n78A6Z81x08.jpg", vote_average: 8.4, release_date: "2019-11-12", first_air_date: "2019-11-12" }
    ]
  },
  {
    id: 500,
    name: "Tom Cruise",
    popularity: 132.4,
    known_for_department: "Acting",
    gender: 2,
    profile_path: "https://image.tmdb.org/t/p/w500/775f0a1AD6Zg8n78A6Z81x089aD.jpg",
    backup_profile: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80",
    known_for: [
      { id: 438631, title: "Dune", media_type: "movie", poster_path: "https://image.tmdb.org/t/p/w500/d587gKIvL6eKgA6Z81x08eLz136.jpg", vote_average: 8.2, release_date: "2021-09-15" },
      { id: 572802, title: "Top Gun: Maverick", media_type: "movie", poster_path: "https://image.tmdb.org/t/p/w500/62HCn9v8Hi6Zg8n78A6Z81x08ab.jpg", vote_average: 8.3, release_date: "2022-05-24" }
    ]
  },
  {
    id: 1245,
    name: "Scarlett Johansson",
    popularity: 124.9,
    known_for_department: "Acting",
    gender: 1,
    profile_path: "https://image.tmdb.org/t/p/w500/62HCn9v8Hi6Zg8n78A6Z81x08ab.jpg",
    backup_profile: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop&q=80",
    known_for: [
      { id: 299536, title: "Avengers: Infinity War", media_type: "movie", poster_path: "https://image.tmdb.org/t/p/w500/7WsyChp0vCQsc7NOfm6OfNOf7W.jpg", vote_average: 8.3, release_date: "2018-04-25" },
      { id: 299534, title: "Avengers: Endgame", media_type: "movie", poster_path: "https://image.tmdb.org/t/p/w500/or06Sgtu89aD7NOfm6Of7W9abB.jpg", vote_average: 8.3, release_date: "2019-04-24" }
    ]
  },
  {
    id: 1397778,
    name: "Zendaya",
    popularity: 110.5,
    known_for_department: "Acting",
    gender: 1,
    profile_path: "https://image.tmdb.org/t/p/w500/xr8xszEv9698dZ5B2b9DVEZ6X8A.jpg",
    backup_profile: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80",
    known_for: [
      { id: 438631, title: "Dune", media_type: "movie", poster_path: "https://image.tmdb.org/t/p/w500/d587gKIvL6eKgA6Z81x08eLz136.jpg", vote_average: 8.2, release_date: "2021-09-15" },
      { id: 634649, title: "Spider-Man: No Way Home", media_type: "movie", poster_path: "https://image.tmdb.org/t/p/w500/1g0m2m3b4B9gOi6Zg8n78A6Z81xO.jpg", vote_average: 8.0, release_date: "2021-12-15" }
    ]
  }
];

export default function BestArtistsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const artistIdQuery = searchParams.get('id');

  const [artists, setArtists] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGender, setActiveGender] = useState('All'); // 'All', 'Female', 'Male'
  const [loading, setLoading] = useState(true);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [errorStatus, setErrorStatus] = useState(null);

  // Pagination states to make groups of 10 slide beautifully
  const [currentPage, setCurrentPage] = useState(0);
  const [slideDirection, setSlideDirection] = useState('left');

  // Stats Counters
  const [stats, setStats] = useState({ totalFetched: 0, averagePopularity: 0 });

  // Slide directional animations for groups of 10
  const slideVariants = {
    enter: (direction) => ({
      x: direction === 'left' ? 350 : -350,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.25 }
      }
    },
    exit: (direction) => ({
      x: direction === 'left' ? -350 : 350,
      opacity: 0,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 }
      }
    })
  };

  useEffect(() => {
    let cancelled = false;
    const fetchArtists = async () => {
      setLoading(true);
      setErrorStatus(null);
      try {
        let results = [];
        let queriedPerson = null;

        // If there's an artist ID query, fetch the detail and their credits first
        if (artistIdQuery) {
          try {
            const res = await fetchTmdb(`/person/${artistIdQuery}?append_to_response=combined_credits`);
            if (res && res.ok) {
              const data = await res.json();
              const cast = data.combined_credits?.cast || [];
              const known_for = cast
                .filter(c => c.poster_path)
                .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
                .slice(0, 4);

              queriedPerson = {
                ...data,
                known_for: known_for
              };
            }
          } catch (e) {
            console.error("Failed to fetch queried artist detail:", e);
          }
        }

        if (searchQuery.trim().length > 1) {
          const queryEscaped = encodeURIComponent(searchQuery.trim());
          const [res1, res2] = await Promise.all([
            fetchTmdb(`/search/person?query=${queryEscaped}&page=1`),
            fetchTmdb(`/search/person?query=${queryEscaped}&page=2`).catch(() => null)
          ]);
          
          if (res1.ok) {
            const data = await res1.json();
            if (data.results) results.push(...data.results);
          }
          if (res2 && res2.ok) {
            const data = await res2.json();
            if (data.results) results.push(...data.results);
          }
        } else {
          const pageNumbers = [1, 2, 3, 4, 5];
          const promises = pageNumbers.map(page => 
            fetchTmdb(`/person/popular?page=${page}`).then(r => r.ok ? r.json() : null).catch(() => null)
          );
          
          const datasets = await Promise.all(promises);
          datasets.forEach(data => {
            if (data && data.results) {
              results.push(...data.results);
            }
          });
        }

        if (cancelled) return;

        // Deduplicate personalities by id
        const uniquePeopleMap = {};
        if (queriedPerson) {
          uniquePeopleMap[queriedPerson.id] = queriedPerson;
        }

        results.forEach(person => {
          if (person && person.id) {
            if (!uniquePeopleMap[person.id]) {
              uniquePeopleMap[person.id] = person;
            }
          }
        });

        const sortedPeople = Object.values(uniquePeopleMap).sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

        if (sortedPeople.length > 0) {
          const processed = sortedPeople.map((artist, idx) => {
            const formattedKnownFor = (artist.known_for || []).map(kf => ({
              ...kf,
              mediaType: kf.media_type || (kf.first_air_date ? 'tv' : 'movie'),
              title: kf.title || kf.name,
              poster_path: kf.poster_path ? `https://image.tmdb.org/t/p/w500${kf.poster_path}` : null,
              vote_average: kf.vote_average || 0
            }));

            const hasProfile = artist.profile_path;
            const profileUrl = hasProfile 
              ? (artist.profile_path.startsWith('http') ? artist.profile_path : `https://image.tmdb.org/t/p/w500${artist.profile_path}`)
              : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(artist.name)}&backgroundColor=dc2626`;

            return {
              ...artist,
              profile_path: profileUrl,
              known_for: formattedKnownFor,
              rank: idx + 1
            };
          });

          setArtists(processed);
          
          const totalPop = processed.reduce((sum, item) => sum + (item.popularity || 0), 0);
          setStats({
            totalFetched: processed.length,
            averagePopularity: processed.length > 0 ? (totalPop / processed.length).toFixed(1) : 0
          });

          if (processed.length > 0) {
            if (queriedPerson) {
              const matchedQs = processed.find(p => String(p.id) === String(queriedPerson.id));
              if (matchedQs) {
                setSelectedArtist(matchedQs);
                return;
              }
            }

            setSelectedArtist(prev => {
              if (prev && processed.some(p => p.id === prev.id)) {
                return processed.find(p => p.id === prev.id);
              }
              return processed[0];
            });
          }
        } else {
          setArtists([]);
        }
      } catch (err) {
        console.warn("[BestArtistsPage Info] Using beautiful offline backup dataset", err.message);
        const offlineData = BACKUP_ARTISTS.map((item, idx) => ({
          ...item,
          rank: idx + 1
        }));
        setArtists(offlineData);
        setStats({ totalFetched: offlineData.length, averagePopularity: 128.4 });
        
        let initialSelection = offlineData[0];
        if (artistIdQuery) {
          const matched = offlineData.find(a => String(a.id) === String(artistIdQuery));
          if (matched) initialSelection = matched;
        }
        setSelectedArtist(initialSelection);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchArtists();
    }, searchQuery.trim().length > 0 ? 400 : 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery, artistIdQuery]);

  // Gender Filtering Logic
  const filteredArtists = artists.filter(artist => {
    if (activeGender === 'All') return true;
    if (activeGender === 'Female') return artist.gender === 1;
    if (activeGender === 'Male') return artist.gender === 2;
    return true;
  });

  // Automatically page-align to make sure the selected artist is visible
  useEffect(() => {
    if (selectedArtist && filteredArtists.length > 0) {
      const idx = filteredArtists.findIndex(a => a.id === selectedArtist.id);
      if (idx !== -1) {
        const destPage = Math.floor(idx / 10);
        if (destPage !== currentPage) {
          setSlideDirection(destPage > currentPage ? 'left' : 'right');
          setCurrentPage(destPage);
        }
      }
    }
  }, [selectedArtist, filteredArtists]);

  const getDepartmentColor = (dept) => {
    switch (dept?.toLowerCase()) {
      case 'acting': return 'bg-red-500/25 border-red-500/40 text-red-400';
      case 'directing': return 'bg-cyan-500/25 border-cyan-500/40 text-cyan-400';
      case 'writing': return 'bg-purple-500/25 border-purple-500/40 text-purple-400';
      default: return 'bg-amber-500/25 border-amber-500/40 text-amber-400';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -15 }} 
      transition={{ duration: 0.35 }}
      className="p-4 md:p-8 pb-32 max-w-[1700px] mx-auto text-white"
    >
      {/* Premium Header Accent */}
      <div className="relative mb-10 mt-2">
        <div className="absolute -left-4 top-0 bottom-0 w-1.5 bg-gradient-to-b from-red-600 via-red-500 to-transparent rounded-full shadow-lg shadow-red-500/20" />
        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white flex items-center gap-3 pl-4">
          <FaAward className="text-red-500 leading-none" /> Rank Artists <span className="text-sm font-semibold text-zinc-500 uppercase tracking-widest bg-zinc-900 border border-white/5 py-1 px-3 rounded-full ml-2">GLOBAL CHART</span>
        </h1>
        <p className="text-zinc-400 text-sm md:text-base mt-2 max-w-2xl pl-4 leading-relaxed">
          Explore the industry's most popular actors and performers globally. Use the real-time search or filter by gender to instantly inspect their complete portfolio profile and stream filmographies.
        </p>
      </div>

      {/* Stats Counter & Controls Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        
        {/* Dynamic Search Box */}
        <div className="lg:col-span-4 relative flex items-center">
          <div className="absolute left-4 text-zinc-400">
            <FaSearch className="text-base" />
          </div>
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search matching artists..."
            className="w-full bg-[#0d1017] border border-white/10 hover:border-white/20 focus:border-red-500 rounded-2xl pl-12 pr-4 py-3.5 text-sm md:text-base placeholder-zinc-500 outline-none transition-all focus:ring-2 focus:ring-red-500/10 shadow-inner font-semibold"
          />
        </div>

        {/* Filters */}
        <div className="lg:col-span-4 flex items-center overflow-x-auto hide-scrollbar gap-2.5">
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest shrink-0 flex items-center gap-1.5">
            <FaFilter className="text-zinc-600" /> Filter:
          </span>
          <div className="flex bg-[#0d1017] p-1 border border-white/5 rounded-full shadow-md">
            {['All', 'Male', 'Female'].map((gen) => (
              <button
                key={gen}
                onClick={() => {
                  setActiveGender(gen);
                  // Auto-select first matching artist on filter change
                  const matched = artists.find(a => gen === 'All' ? true : (gen === 'Female' ? a.gender === 1 : a.gender === 2));
                  if (matched) setSelectedArtist(matched);
                }}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${
                  activeGender === gen 
                    ? 'bg-red-600 text-white shadow-md' 
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {gen}
              </button>
            ))}
          </div>
        </div>

        {/* Insight Stats Boxes */}
        <div className="lg:col-span-4 flex justify-between gap-4">
          <div className="flex-1 bg-gradient-to-br from-[#0c0f16] to-[#080a10] border border-white/5 px-4 py-3 rounded-2xl flex flex-col justify-center shadow-lg">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none">Total Artists</span>
            <span className="text-xl md:text-2xl font-black text-white mt-1">{filteredArtists.length}</span>
          </div>
          <div className="flex-1 bg-gradient-to-br from-[#0c0f16] to-[#080a10] border border-white/5 px-4 py-3 rounded-2xl flex flex-col justify-center shadow-lg">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none">Avg Popularity</span>
            <span className="text-xl md:text-2xl font-black text-red-500 mt-1 flex items-center gap-1">
              <FaFire className="text-base text-amber-500" /> {stats.averagePopularity}
            </span>
          </div>
        </div>
      </div>

      {/* Main Workspace Layout Grid */}
      {loading ? (
        <div className="flex flex-col justify-center items-center w-full min-h-[450px] gap-4">
          <AgreyFlixLoader text="Summoning stars..." />
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest animate-pulse mt-2">Connecting to TMDB Network</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: Masterlist Artists Column (7 Columns wide on desktop) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            
            {filteredArtists.length === 0 ? (
              <div className="text-center py-20 bg-[#0d1017]/50 rounded-3xl border border-white/5">
                <FaAward className="text-5xl text-zinc-700 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white">No active artists match your selection</h3>
                <p className="text-zinc-500 text-xs mt-1">Try resetting your search parameter or filters.</p>
                <button
                  onClick={() => { setSearchQuery(''); setActiveGender('All'); }}
                  className="mt-4 px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full font-bold text-xs transition-all active:scale-95"
                >
                  Reset Parameters
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {/* Modern Sliding Pagination Controls */}
                <div className="flex items-center justify-between bg-[#0a0d14]/60 border border-white/5 p-3 rounded-2xl">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none">Chart Positions</span>
                    <span className="text-sm font-black text-white mt-1">
                      Showing #{currentPage * 10 + 1} - #{Math.min((currentPage + 1) * 10, filteredArtists.length)} <span className="text-zinc-600 font-medium">/ {filteredArtists.length}</span>
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-400 bg-zinc-900 border border-white/5 py-1 px-3 rounded-full">
                      Page {currentPage + 1} of {Math.max(1, Math.ceil(filteredArtists.length / 10))}
                    </span>
                    
                    <button
                      onClick={() => {
                        if (currentPage > 0) {
                          const newPage = currentPage - 1;
                          setSlideDirection('right');
                          setCurrentPage(newPage);
                          const firstArtistOnPage = filteredArtists[newPage * 10];
                          if (firstArtistOnPage) {
                            setSelectedArtist(firstArtistOnPage);
                          }
                        }
                      }}
                      disabled={currentPage === 0}
                      className={`p-2.5 rounded-xl border border-white/5 bg-[#0d1017] text-white active:scale-95 transition-all ${
                        currentPage === 0 ? 'opacity-30 cursor-not-allowed text-zinc-600' : 'hover:bg-zinc-800 hover:text-red-500'
                      }`}
                      title="Previous 10"
                    >
                      <FaChevronLeft className="text-sm" />
                    </button>
                    
                    <button
                      onClick={() => {
                        if (currentPage < Math.ceil(filteredArtists.length / 10) - 1) {
                          const newPage = currentPage + 1;
                          setSlideDirection('left');
                          setCurrentPage(newPage);
                          const firstArtistOnPage = filteredArtists[newPage * 10];
                          if (firstArtistOnPage) {
                            setSelectedArtist(firstArtistOnPage);
                          }
                        }
                      }}
                      disabled={currentPage >= Math.ceil(filteredArtists.length / 10) - 1}
                      className={`p-2.5 rounded-xl border border-white/5 bg-[#0d1017] text-white active:scale-95 transition-all ${
                        currentPage >= Math.ceil(filteredArtists.length / 10) - 1 ? 'opacity-30 cursor-not-allowed text-zinc-600' : 'hover:bg-zinc-800 hover:text-red-500'
                      }`}
                      title="Next 10"
                    >
                      <FaChevronRight className="text-sm" />
                    </button>
                  </div>
                </div>

                {/* Sliding Actor Grid Container */}
                <div className="relative overflow-hidden min-h-[500px] w-full rounded-2xl bg-[#090b10]/40 p-1 border border-white/5">
                  <AnimatePresence mode="wait" custom={slideDirection} initial={false}>
                    <motion.div
                      key={currentPage}
                      custom={slideDirection}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full"
                    >
                      {filteredArtists.slice(currentPage * 10, (currentPage + 1) * 10).map((artist) => {
                        const isSelected = selectedArtist?.id === artist.id;
                        return (
                          <motion.div
                            key={artist.id}
                            onClick={() => {
                              const slug = artist.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                              navigate(`/person/${artist.id}/${slug}`);
                            }}
                            onMouseEnter={() => setSelectedArtist(artist)}
                            className={`relative flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-300 group border overflow-hidden ${
                              isSelected 
                                ? 'bg-gradient-to-r from-red-950/20 via-[#10141d] to-[#0a0d14] border-red-500/40 shadow-xl shadow-red-950/5' 
                                : 'bg-[#0d1017]/80 hover:bg-[#111622]/90 border-white/5 hover:border-white/10'
                            }`}
                            whileHover={{ y: -2, scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                          >
                            {/* Popularity Ranking Indicator */}
                            <div className="absolute top-3 right-3 text-2xl font-black font-mono text-white/5 select-none pointer-events-none group-hover:text-white/10 transition-colors">
                              #{artist.rank}
                            </div>

                            {/* Headshot Portrait */}
                            <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-zinc-900 shadow-md shrink-0 ring-2 ring-white/10 group-hover:ring-red-500/40 transition-all">
                              <img 
                                src={artist.profile_path} 
                                alt={artist.name} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                referrerPolicy="no-referrer"
                              />
                            </div>

                            {/* Info Panel block */}
                            <div className="flex-1 min-w-0 pr-4">
                              <h3 className="font-extrabold text-base text-white group-hover:text-red-400 transition-colors truncate">
                                {artist.name}
                              </h3>
                              <p className="text-[11px] text-zinc-500 font-bold truncate uppercase tracking-widest mt-0.5">
                                {artist.known_for_department || 'Artist'} • {artist.gender === 1 ? 'Female' : 'Male'}
                              </p>
                              
                              {/* Custom Popularity Progress bar */}
                              <div className="flex items-center gap-1.5 mt-2">
                                <span className="text-[10px] font-black text-red-500">POP:</span>
                                <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-gradient-to-r from-red-600 to-amber-500 rounded-full"
                                    style={{ width: `${Math.min(artist.popularity / 2.2, 100)}%` }}
                                  />
                                </div>
                                <span className="text-[10px] font-black text-zinc-400">{Math.round(artist.popularity)}</span>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Dots Indicator */}
                {Math.ceil(filteredArtists.length / 10) > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-2">
                    {Array.from({ length: Math.ceil(filteredArtists.length / 10) }).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          const newPage = idx;
                          setSlideDirection(newPage > currentPage ? 'left' : 'right');
                          setCurrentPage(newPage);
                          const firstArtistOnPage = filteredArtists[newPage * 10];
                          if (firstArtistOnPage) {
                            setSelectedArtist(firstArtistOnPage);
                          }
                        }}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          currentPage === idx ? 'w-8 bg-red-600 shadow-md shadow-red-600/35' : 'w-2 bg-zinc-700 hover:bg-zinc-500'
                        }`}
                        title={`Page ${idx + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT: Detailed Spotlight Panel (5 Columns wide on desktop) */}
          <div className="lg:col-span-5 lg:sticky lg:top-4">
            <AnimatePresence mode="wait">
              {selectedArtist && (
                <motion.div
                  key={selectedArtist.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -25 }}
                  transition={{ duration: 0.3 }}
                  className="bg-gradient-to-b from-[#0d1017] via-[#090b10] to-[#05060a] border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden"
                >
                  {/* Decorative background grid pattern */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(239,68,68,0.06),transparent_60%)]" />

                  {/* Spotlight Profile Cover Block */}
                  <div className="relative flex flex-col sm:flex-row gap-6 items-center sm:items-start z-10">
                    <div className="w-32 h-32 md:w-36 md:h-36 rounded-2xl overflow-hidden bg-zinc-900 border-2 border-white/10 shadow-lg shadow-black/80 shrink-0 relative group">
                      <img 
                        src={selectedArtist.profile_path} 
                        alt={selectedArtist.name} 
                        className="w-full h-full object-cover shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2">
                        <span className="text-[10px] font-black tracking-widest text-[#dc2626]">SPOTLIGHT</span>
                      </div>
                    </div>
                    
                    {/* Character Bio Header */}
                    <div className="flex-1 text-center sm:text-left">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-600/15 border border-red-500/30 text-red-500 rounded-full text-[10px] font-black uppercase tracking-wider mb-2.5">
                        <FaFire className="text-amber-500" /> Rank #{selectedArtist.rank}
                      </div>

                      <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-tight">
                        {selectedArtist.name}
                      </h2>
                      
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-4">
                        <span className={`px-3 py-1 border rounded-lg text-xs font-bold ${getDepartmentColor(selectedArtist.known_for_department)}`}>
                          {selectedArtist.known_for_department || "Acting"}
                        </span>
                        <span className="px-3 py-1 bg-zinc-900 border border-white/5 rounded-lg text-xs font-bold text-zinc-400">
                          Popularity Score: {selectedArtist.popularity?.toFixed(1)}
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          const slug = selectedArtist.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                          navigate(`/person/${selectedArtist.id}/${slug}`);
                        }}
                        className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-red-600 hover:bg-red-750 border border-red-500/30 text-white font-extrabold text-xs rounded-xl transition-all shadow-md active:scale-[0.98]"
                      >
                        <FaAward className="text-amber-400 text-sm" /> Tazama Profaili na Kazi Zote
                      </button>
                    </div>
                  </div>

                  {/* Filmography Section (Starred In / Greatest Hits) */}
                  <div className="mt-8 relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                        <FaFilm className="text-red-500" /> Notable Filmography
                      </h3>
                      <span className="text-[10px] font-bold text-zinc-500 uppercase">Stream Instantly</span>
                    </div>

                    {!selectedArtist.known_for || selectedArtist.known_for.length === 0 ? (
                      <p className="text-zinc-500 text-xs py-6 text-center italic bg-zinc-900/30 border border-dashed border-white/5 rounded-xl">
                        No notable movies listed for this artist.
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        {selectedArtist.known_for.map((media) => (
                          <div 
                            key={media.id} 
                            className="flex flex-col rounded-xl overflow-hidden bg-[#07090d] border border-white/5 shadow-md justify-between"
                          >
                            <div className="relative aspect-[2/3] bg-zinc-950 overflow-hidden group">
                              <ContentCard 
                                title={media.title}
                                poster={media.poster_path}
                                rating={media.vote_average}
                                releaseDate={media.release_date || media.first_air_date}
                                mediaType={media.mediaType || 'movie'}
                                mediaId={media.id}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Disclaimer / Notice */}
                  <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-600">
                    <span>Source: TMDB International Media</span>
                    <span>HD 1080p Support</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      )}
    </motion.div>
  );
}
