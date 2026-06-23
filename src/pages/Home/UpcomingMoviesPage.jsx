import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaCalendarAlt, FaChevronRight, FaYoutube, FaClock, FaFilm } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { fetchTmdb } from '../../utils/tmdb';
import AgreyFlixLoader from '../../components/AgreyFlixLoader';

export default function UpcomingMoviesPage() {
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let canceled = false;
    const fetchUpcoming = async () => {
      try {
        setLoading(true);
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const todayStr = `${yyyy}-${mm}-${dd}`;

        // Sourcing from both official Upcoming TMDB endpoints and future Popular Discovered titles (blockbusters)
        const urls = [
          `/movie/upcoming?page=1`,
          `/movie/upcoming?page=2`,
          `/movie/upcoming?page=3`,
          `/discover/movie?sort_by=popularity.desc&primary_release_date.gte=${todayStr}&page=1`,
          `/discover/movie?sort_by=popularity.desc&primary_release_date.gte=${todayStr}&page=2`,
          `/discover/movie?sort_by=popularity.desc&primary_release_date.gte=${todayStr}&page=3`
        ];

        const responses = await Promise.all(urls.map(url => fetchTmdb(url)));
        let allResults = [];
        
        for (const res of responses) {
          if (res.ok) {
            const data = await res.json();
            if (data.results) {
              allResults.push(...data.results);
            }
          }
        }

        if (!canceled && allResults.length > 0) {
          // Remove duplicates by ID
          const uniqueMap = {};
          allResults.forEach(movie => {
            if (movie && movie.id) {
              uniqueMap[movie.id] = movie;
            }
          });
          const uniqueResults = Object.values(uniqueMap);

          // Filter strictly unreleased movies whose release date is in the future
          const unreleased = uniqueResults.filter(movie => {
            if (!movie.release_date) return true; // assuming unreleased if no date
            return new Date(movie.release_date) > today;
          });

          // Sort by release date ascending to show nearest first
          const sorted = [...unreleased].sort((a, b) => {
            if (!a.release_date && !b.release_date) return 0;
            if (!a.release_date) return 1;
            if (!b.release_date) return -1;
            return new Date(a.release_date) - new Date(b.release_date);
          });

          setUpcoming(sorted);
        }
      } catch (err) {
        console.error("Error loading upcoming movies:", err);
      } finally {
        if (!canceled) setLoading(false);
      }
    };

    fetchUpcoming();
    return () => { canceled = true; };
  }, []);

  // Format release date into standard human readable string
  const formatReadableDate = (dateStr) => {
    if (!dateStr) return "To be announced";
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Calculate standard countdown days to launch of movies
  const getDaysLeft = (dateStr) => {
    if (!dateStr) return null;
    const today = new Date();
    today.setHours(0,0,0,0);
    const release = new Date(dateStr);
    release.setHours(0,0,0,0);
    const diffMs = release.getTime() - today.getTime();
    if (diffMs < 0) return null;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return `${diffDays} Day${diffDays > 1 ? 's' : ''} Left`;
  };

  const handleCardClick = (movieId) => {
    navigate(`/movies/watch/${movieId}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.35 }}
      className="p-4 md:p-8 pb-32 max-w-[1700px] mx-auto text-white font-sans"
    >
      {/* Title Header Header */}
      <div className="relative mb-8 mt-2">
        <div className="absolute -left-4 top-0 bottom-0 w-1 bg-red-600 rounded-full shadow-lg" />
        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white flex items-center gap-3 pl-4 uppercase">
          <FaCalendarAlt className="text-red-500" /> Upcoming Movies
          <span className="text-[10px] font-black text-red-500 tracking-wider bg-red-950/40 border border-red-500/20 py-1 px-3 rounded-full hidden sm:inline-block">
            SNEAK PREVIEWS
          </span>
        </h1>
        <p className="text-zinc-400 text-sm md:text-base mt-2 max-w-2xl pl-4 leading-relaxed">
          Be the first to track highly anticipated upcoming theatrical blockbusters, watch official promotional trailers, and count down their release days.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col justify-center items-center w-full min-h-[450px]">
          <AgreyFlixLoader text="Sourcing global blockbusters..." />
        </div>
      ) : upcoming.length === 0 ? (
        <div className="flex flex-col justify-center items-center py-20 bg-[#0d1017] rounded-3xl border border-white/5 text-center px-4">
          <FaFilm className="text-red-500/40 text-5xl mb-4" />
          <h3 className="text-lg font-bold">No unreleased movies found</h3>
          <p className="text-zinc-500 text-sm mt-1">Check back later for updated promotional listings.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {upcoming.map((movie) => {
            const daysLeft = getDaysLeft(movie.release_date);
            const hasPoster = !!movie.poster_path;
            const formattedDate = formatReadableDate(movie.release_date);

            return (
              <motion.div
                key={movie.id}
                onClick={() => handleCardClick(movie.id)}
                className="group flex flex-col cursor-pointer bg-[#0c0f16] hover:bg-[#121622] rounded-2xl overflow-hidden border border-white/5 hover:border-white/10 shadow-lg transition-all duration-300 relative"
                whileHover={{ y: -6 }}
              >
                {/* Poster Container */}
                <div className="aspect-[2/3] w-full bg-zinc-900 border-b border-white/5 relative overflow-hidden">
                  {hasPoster ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                      alt={movie.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full p-4 flex flex-col justify-center items-center text-center text-xs font-bold text-zinc-500 bg-zinc-950">
                      <FaFilm className="text-lg text-zinc-600 mb-2 animate-pulse" />
                      <span>{movie.title}</span>
                    </div>
                  )}

                  {/* Top Overlay Badge Countdown */}
                  <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 items-start">
                    {daysLeft ? (
                      <span className="bg-red-600 text-white font-black text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md shadow-red-600/35">
                        {daysLeft}
                      </span>
                    ) : (
                      <span className="bg-zinc-800 text-zinc-300 border border-white/10 font-bold text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-full">
                        TBA
                      </span>
                    )}
                  </div>

                  {/* Interactive Watch Trailer Center Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center items-center p-3 text-center">
                    <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white text-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <FaYoutube />
                    </div>
                    <span className="text-[10px] uppercase font-black tracking-widest text-white mt-3">Watch Trailer</span>
                  </div>
                </div>

                {/* Info Box below card */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-white group-hover:text-red-400 leading-snug tracking-tight transition-colors line-clamp-2">
                      {movie.title}
                    </h3>
                    
                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mt-2 font-medium">
                      <FaClock className="text-[10px] text-zinc-500" />
                      <span className="truncate">{formattedDate}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-black tracking-wider text-red-500 uppercase">
                    <span>Watch Preview</span>
                    <FaChevronRight className="text-[8px] group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
