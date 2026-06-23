import React, { useState, useEffect } from 'react';
import { FaPlay, FaInfoCircle } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import AgreyFlixLoader from '../../components/AgreyFlixLoader';
import { fetchTmdb } from '../../utils/tmdb';

const GENRE_MAP = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime", 99: "Documentary", 18: "Drama", 10751: "Family", 14: "Fantasy", 36: "History", 27: "Horror", 10402: "Music", 9648: "Mystery", 10749: "Romance", 878: "Science Fiction", 10770: "TV Movie", 53: "Thriller", 10752: "War", 37: "Western", 10759: "Action & Adventure", 10762: "Kids", 10763: "News", 10764: "Reality", 10765: "Sci-Fi & Fantasy", 10766: "Soap", 10767: "Talk", 10768: "War & Politics"
};

export default function HeroBanner() {
  const [items, setItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    const fetchTrending = async () => {
      setLoading(true);
      try {
        const res = await fetchTmdb('/trending/all/week');
        if (!res.ok) throw new Error("TMDB Response not OK");
        
        const data = await res.json();
        if (!cancelled && data.results) {
          const formatted = data.results.slice(0, 8).map(item => ({
            ...item,
            type: item.media_type || 'movie',
            backdrop_path: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : null,
            poster_path: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
          }));
          setItems(formatted);
        }
      } catch (error) {
        console.error("Error fetching trending for hero:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchTrending();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (items.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 6000); // 6 seconds slide
    return () => clearInterval(interval);
  }, [items.length]);

  if (loading) {
    return (
      <div className="w-full h-[85vh] sm:h-[90vh] bg-[#111] flex items-center justify-center">
        <AgreyFlixLoader />
      </div>
    );
  }

  if (items.length === 0) return null;

  const currentItem = items[currentIndex];
  const title = currentItem.title || currentItem.name;
  const date = currentItem.release_date || currentItem.first_air_date;
  const year = date ? date.split('-')[0] : '';
  const mediaType = currentItem.media_type || currentItem.type || 'movie';
  const typeStr = mediaType === 'tv' ? 'TV Series' : 'Movie';
  const genres = currentItem.genre_ids ? currentItem.genre_ids.map(id => GENRE_MAP[id]).filter(Boolean).slice(0, 2) : [];
  
  const handlePlay = () => {
    navigate(`/${mediaType === 'tv' ? 'series' : 'movies'}/watch/${currentItem.id}`);
  };

  return (
    <div className="relative w-full h-[85vh] sm:h-[90vh] bg-[#111] overflow-hidden group">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0"
        >
          <motion.img
            initial={{ scale: 1.05 }}
            animate={{ scale: 1 }}
            transition={{ duration: 6, ease: "linear" }}
            src={currentItem.backdrop_path?.startsWith('http') ? currentItem.backdrop_path : `https://image.tmdb.org/t/p/original${currentItem.backdrop_path}`}
            alt={title}
            className="w-full h-full object-cover opacity-60"
          />
        </motion.div>
      </AnimatePresence>
      
      {/* Gradients to blend with content below and sidebar */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 md:from-black/80 via-black/40 to-transparent z-10" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/20 md:via-transparent to-transparent z-10" />

      {/* Content */}
      <div className="absolute inset-y-0 left-0 flex flex-col justify-center px-8 md:px-16 w-full md:w-2/3 max-w-3xl z-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col"
          >
            <div className="flex gap-2 items-center mb-4">
              <span className="bg-red-600 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-sm shadow-lg shadow-red-500/20">
                Trending #{currentIndex + 1}
              </span>
              <span className="text-gray-300 text-xs font-semibold uppercase tracking-widest">{typeStr}</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4 tracking-tighter drop-shadow-xl line-clamp-2">
              {title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-gray-200 mb-6 drop-shadow-md">
              <span className="text-yellow-500 flex items-center gap-1">★ {currentItem.vote_average?.toFixed(1)}</span>
              {year && <span>{year}</span>}
              {genres.map(genre => (
                <span key={genre} className="border border-white/30 bg-white/5 px-2 py-0.5 rounded-sm backdrop-blur-sm">
                  {genre}
                </span>
              ))}
            </div>
            
            <p className="text-gray-300 text-sm md:text-base lg:text-lg mb-8 max-w-2xl line-clamp-3 md:line-clamp-4 leading-relaxed drop-shadow-md">
              {currentItem.overview}
            </p>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={handlePlay}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-6 md:px-8 py-3 md:py-4 rounded-full font-bold shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all active:scale-95 text-sm md:text-base"
              >
                <FaPlay className="text-sm" /> Play Now
              </button>
              <button 
                onClick={handlePlay}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-6 md:px-8 py-3 md:py-4 rounded-full font-bold transition-all active:scale-95 backdrop-blur-sm text-sm md:text-base"
              >
                <FaInfoCircle className="text-lg text-gray-300" /> More Info
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Slider Indicators */}
      <div className="absolute bottom-10 right-10 z-30 flex items-center gap-2">
        {items.map((_, idx) => (
           <button
             key={idx}
             onClick={() => setCurrentIndex(idx)}
             className={`h-1.5 rounded-full transition-all duration-300 ${
               idx === currentIndex ? 'w-8 bg-red-600' : 'w-4 bg-white/30 hover:bg-white/50'
             }`}
           />
        ))}
      </div>
    </div>
  );
}
