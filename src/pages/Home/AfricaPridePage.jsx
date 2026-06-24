import React, { useState, useEffect } from 'react';
import ContentCard from './ContentCard';
import { MovieGridSkeleton } from '../../components/Skeletons';
import TMDBErrorDiagnostics from '../../components/TMDBErrorDiagnostics';
import { fetchTmdb } from '../../utils/tmdb';
import { FaFilter, FaGlobeAfrica } from 'react-icons/fa';
import { motion } from 'framer-motion';

export default function AfricaPridePage() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryKey, setRetryKey] = useState(0);

  const filters = [
    { value: 'All', label: 'All Movies' },
    { value: 'bongo-movie', label: 'Bongo Movies' },
    { value: 'afro-movie', label: 'Afro Movies' },
    { value: 'east-africa', label: 'East Africa' },
    { value: 'west-africa', label: 'West Africa' }
  ];

  useEffect(() => {
    let cancelled = false;
    const fetchAfricanMovies = async () => {
      setLoading(true);
      setError(null);
      try {
        let endpoint = '/discover/movie?with_origin_country=TZ|NG|KE|ZA|GH|UG';
        if (activeFilter === 'bongo-movie') {
          endpoint = '/discover/movie?with_original_language=sw&with_origin_country=TZ';
        } else if (activeFilter === 'afro-movie') {
          endpoint = '/discover/movie?with_origin_country=NG';
        } else if (activeFilter === 'east-africa') {
          endpoint = '/discover/movie?with_origin_country=TZ|KE|UG|ET';
        } else if (activeFilter === 'west-africa') {
          endpoint = '/discover/movie?with_origin_country=NG|GH|SN';
        }

        const res = await fetchTmdb(endpoint);
        if (!res.ok) throw new Error("TMDB Response Error on Discover Africa");
        const data = await res.json();
        
        if (!data.results) {
          throw new Error("Empty data returned. No African movies found.");
        }

        if (!cancelled) {
          const formatted = data.results.map(item => ({
            ...item,
            type: 'movie',
            poster_path: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
            backdrop_path: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : null,
          }));
          
          if ((activeFilter === 'All' || activeFilter === 'bongo-movie') && formatted.length < 5) {
             const resSw = await fetchTmdb('/discover/movie?with_original_language=sw');
             const dataSw = await resSw.json();
             if (dataSw.results) {
                const formattedSw = dataSw.results.map(item => ({
                  ...item,
                  type: 'movie',
                  poster_path: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
                }));
                const seen = new Set(formatted.map(m => m.id));
                formattedSw.forEach(item => {
                  if (!seen.has(item.id)) formatted.push(item);
                });
             }
          }
          
          setMovies(formatted);
        }
      } catch (err) {
        console.error("Error fetching African movies:", err);
        if (!cancelled) {
          setError(err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAfricanMovies();
    return () => { cancelled = true; };
  }, [activeFilter, retryKey]);

  if (error) {
    return <TMDBErrorDiagnostics error={error} onRetry={() => setRetryKey(prev => prev + 1)} />;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -20 }} 
      transition={{ duration: 0.4 }}
      className="p-6 md:p-10 pb-20 text-white max-w-[1600px] mx-auto w-full"
    >
      {/* Editorial Header Banner */}
      <div className="relative rounded-3xl overflow-hidden mb-12 bg-gradient-to-r from-amber-600/30 via-red-600/10 to-transparent border border-amber-500/15 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/20 to-red-600/20 border border-amber-500/30 text-amber-500 text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
            <FaGlobeAfrica className="text-sm animate-[spin_10s_linear_infinite]" />
            Africa Pride
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tighter">
            Our Land, <span className="text-amber-500">Our Stories</span>.
          </h1>
          <p className="text-gray-300 text-sm md:text-base leading-relaxed">
            Experience the finest African cinema. From thrilling Bongo films and Nollywood dramas, to legendary storytelling from across East, West, and South Africa.
          </p>
        </div>

        <div className="hidden lg:block w-72 h-44 shrink-0 overflow-hidden rounded-2xl border border-white/10 group bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=500&q=80')" }}>
          <div className="w-full h-full bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4 text-center">
            <span className="font-bold tracking-widest text-[#ef4444] text-lg uppercase select-none">AFRICA PRIDE</span>
          </div>
        </div>
      </div>

      {/* Filters and Search segment */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <h2 className="text-2xl font-bold flex items-center gap-3 border-l-4 border-amber-500 pl-4">
          Discover Premium African Cinema
        </h2>
        
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-2">
          <FaFilter className="text-amber-500 mr-2 shrink-0" />
          {filters.map(f => (
             <button 
               key={f.value}
               onClick={() => setActiveFilter(f.value)}
               className={`px-4 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap active:scale-95 ${activeFilter === f.value ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30' : 'bg-[#0f121a] border border-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}
             >
               {f.label}
             </button>
          ))}
        </div>
      </div>
      
      {loading ? (
        <MovieGridSkeleton count={12} />
      ) : (
        <>
          {movies.length === 0 ? (
            <div className="text-center py-20 bg-[#0f121a] border border-white/5 rounded-2xl">
              <FaGlobeAfrica className="text-gray-600 text-5xl mx-auto mb-4 animate-pulse" />
              <p className="text-gray-400 font-bold">No movies found in this collection at the moment.</p>
              <p className="text-xs text-gray-600 mt-2">Check back again shortly or verify your system database connection!</p>
            </div>
          ) : (
            <motion.div 
              initial="hidden" 
              animate="show" 
              variants={{
                hidden: { opacity: 0 },
                show: { opacity: 1, transition: { staggerChildren: 0.05 } }
              }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6"
            >
              {movies.map((movie) => (
                <motion.div variants={{ hidden: { opacity: 0, scale: 0.9 }, show: { opacity: 1, scale: 1 } }} key={movie.id}>
                  <ContentCard 
                    title={movie.title}
                    poster={movie.poster_path}
                    rating={movie.vote_average}
                    releaseDate={movie.release_date}
                    mediaType={movie.type}
                    mediaId={movie.id}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  );
}
