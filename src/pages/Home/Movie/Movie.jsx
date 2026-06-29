import React, { useState, useEffect } from 'react';
import ContentCard from '../ContentCard';
import { MovieGridSkeleton } from '../../../components/Skeletons';
import TMDBErrorDiagnostics from '../../../components/TMDBErrorDiagnostics';
import { fetchTmdb } from '../../../utils/tmdb';
import { FaFilter } from 'react-icons/fa';
import { motion } from 'framer-motion';

const GENRE_MAP_INV = {
  'Action': 28,
  'Animation': 16,
  'Comedy': 35,
  'Drama': 18,
  'Romance': 10749,
  'Sci-Fi': 878,
  'Horror': 27,
  'Thriller': 53
};

export default function Movie() {
  const [activeGenre, setActiveGenre] = useState('All');
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryKey, setRetryKey] = useState(0);
  const genres = ['All', 'Action', 'Comedy', 'Drama', 'Sci-Fi', 'Horror', 'Romance', 'Thriller', 'Animation'];

  useEffect(() => {
    let cancelled = false;
    const fetchMovies = async () => {
      setLoading(true);
      setError(null);
      try {
        let endpoint = '/movie/popular';
        if (activeGenre !== 'All') {
          const gId = GENRE_MAP_INV[activeGenre];
          if (gId) {
            endpoint = `/discover/movie?with_genres=${gId}`;
          }
        }
          
        const res = await fetchTmdb(endpoint);
        if (!res.ok) throw new Error(`TMDB response error fetching movie genre: ${activeGenre}`);
        
        const data = await res.json();
        if (!data.results) {
          throw new Error("The returned TMDB movie response was empty or invalid.");
        }

        if (!cancelled) {
          const formattedItems = data.results.map(item => ({
             ...item,
             type: 'movie',
             poster_path: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
          }));
          setMovies(formattedItems);
        }
      } catch (err) {
        console.error("Error fetching movies through proxy:", err);
        if (!cancelled) {
          setError(err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    
    fetchMovies();
    return () => { cancelled = true; };
  }, [activeGenre, retryKey]);

  if (error) {
    return <TMDBErrorDiagnostics error={error} onRetry={() => setRetryKey(prev => prev + 1)} />;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -20 }} 
      transition={{ duration: 0.4 }}
      className="px-4 md:px-10 py-6 md:py-10 pb-28 md:pb-20 max-w-[1600px] mx-auto w-full"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight border-l-4 border-red-600 pl-4 shadow-sm">
          Movies
        </h1>
        
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-2">
          <FaFilter className="text-gray-500 mr-2 shrink-0" />
          {genres.map(g => (
             <button 
               key={g}
               onClick={() => setActiveGenre(g)}
               className={`px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap active:scale-95 ${activeGenre === g ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' : 'bg-[#151a23] border border-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}
             >
               {g}
             </button>
          ))}
        </div>
      </div>
      
      {loading ? (
        <MovieGridSkeleton count={12} />
      ) : (
        <motion.div 
          initial="hidden" 
          animate="show" 
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { staggerChildren: 0.05 } }
          }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6"
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
    </motion.div>
  );
}
