import React, { useState, useEffect } from 'react';
import ContentCard from './ContentCard';
import AgreyFlixLoader from '../../components/AgreyFlixLoader';
import { fetchTmdb } from '../../utils/tmdb';
import { FaFilter, FaMagic } from 'react-icons/fa';
import { motion } from 'framer-motion';

const ANIM_SUB_GENRE_MAP = {
  'Action': 28,
  'Comedy': 35,
  'Fantasy': 14,
  'Family': 10751,
  'Adventure': 12,
  'Sci-Fi': 878
};

export default function AnimationPage() {
  const [activeGenre, setActiveGenre] = useState('All');
  const [animations, setAnimations] = useState([]);
  const [loading, setLoading] = useState(true);
  const genres = ['All', 'Action', 'Comedy', 'Fantasy', 'Family', 'Adventure', 'Sci-Fi'];

  useEffect(() => {
    let cancelled = false;
    const fetchAnimations = async () => {
      setLoading(true);
      try {
        let endpoint = '/discover/movie?with_genres=16';
        if (activeGenre !== 'All') {
          const subGenreId = ANIM_SUB_GENRE_MAP[activeGenre];
          if (subGenreId) {
            endpoint = `/discover/movie?with_genres=16,${subGenreId}`;
          }
        }
          
        const res = await fetchTmdb(endpoint);
        if (!res.ok) throw new Error("TMDB Response not OK");
        
        const data = await res.json();
        if (!cancelled && data.results) {
          const formattedItems = data.results.map(item => ({
             ...item,
             type: 'movie',
             poster_path: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
          }));
          setAnimations(formattedItems);
        }
      } catch (error) {
        console.error("Error fetching animations through proxy:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    
    fetchAnimations();
    return () => { cancelled = true; };
  }, [activeGenre]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -20 }} 
      transition={{ duration: 0.4 }}
      className="p-6 md:p-10 pb-20"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight border-l-4 border-purple-600 pl-4 shadow-sm flex items-center gap-3">
          <FaMagic className="text-purple-500" /> Animations
        </h1>
        
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-2">
          <FaFilter className="text-gray-500 mr-2 shrink-0" />
          {genres.map(g => (
             <button 
               key={g}
               onClick={() => setActiveGenre(g)}
               className={`px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap active:scale-95 ${activeGenre === g ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' : 'bg-[#151a23] border border-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}
             >
               {g}
             </button>
          ))}
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center w-full min-h-[400px]">
          <AgreyFlixLoader />
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
          {animations.map((movie) => (
            <motion.div variants={{ hidden: { opacity: 0, scale: 0.9 }, show: { opacity: 1, scale: 1 } }} key={movie.id}>
              <ContentCard 
                title={movie.title}
                poster={movie.poster_path}
                rating={movie.vote_average}
                releaseDate={movie.release_date}
                mediaType={movie.type}
                mediaId={movie.id}
                isAnimation={true}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
