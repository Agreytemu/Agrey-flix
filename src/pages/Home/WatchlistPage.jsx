import React from 'react';
import ContentCard from './ContentCard';
import { useWatchlist } from '../../context/WatchlistContext';
import { FaBookmark, FaLock } from 'react-icons/fa';
import { MOCK_MOVIES } from '../../utils/mockData';
import { motion } from 'framer-motion';

export default function WatchlistPage() {
  const { watchlist, user, ready } = useWatchlist();

  if (!ready) {
     return <div className="p-8 flex items-center justify-center min-h-[60vh]"><div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  // Visual Mockup for when user is not logged in vs when they have items
  // Since we are mocking up UI, let's treat the page gracefully if !user
  if (!user) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        exit={{ opacity: 0, y: -20 }} 
        transition={{ duration: 0.4 }}
        className="p-6 md:p-10 pb-20 flex flex-col items-center justify-center min-h-[75vh] text-center"
      >
        <div className="w-24 h-24 bg-[#0d1117] border border-white/10 shadow-2xl rounded-full flex items-center justify-center mb-6">
           <FaLock className="text-3xl text-gray-500" />
        </div>
        <h1 className="text-3xl font-black text-white mb-3 tracking-tight">Sign in to view your Watchlist</h1>
        <p className="text-gray-400 mb-8 max-w-md font-medium">Keep track of movies and TV shows you want to watch. Your watchlist syncs across all your devices.</p>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => window.dispatchEvent(new Event('openAuthModal'))}
          className="bg-red-600 hover:bg-red-500 text-white font-bold py-4 px-10 rounded-full shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all"
        >
          Sign In Now
        </motion.button>
        
        <div className="mt-20 w-full max-w-4xl text-left border-t border-white/10 pt-10">
           <h3 className="text-xl font-bold text-gray-400 mb-6">What you could be saving:</h3>
           <div className="grid grid-cols-3 md:grid-cols-4 gap-4 opacity-50 select-none pointer-events-none grayscale">
             {MOCK_MOVIES.slice(0,4).map(item => (
                 <div key={item.id} className="aspect-[2/3] bg-gray-800 rounded-xl overflow-hidden">
                    <img src={item.poster_path} alt="blur" className="w-full h-full object-cover" />
                 </div>
             ))}
           </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -20 }} 
      transition={{ duration: 0.4 }}
      className="p-6 md:p-10 pb-20"
    >
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight border-l-4 border-red-600 pl-4 flex items-center gap-3 shadow-sm">
          My Watchlist <FaBookmark className="text-red-500 drop-shadow-md" />
        </h1>
        <p className="text-gray-400 mt-3 ml-5 font-medium">You have {watchlist.length} items saved.</p>
      </div>

      {watchlist.length > 0 ? (
        <motion.div 
          initial="hidden" 
          animate="show" 
          variants={{
             hidden: { opacity: 0 },
             show: { opacity: 1, transition: { staggerChildren: 0.05 } }
          }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6"
        >
          {watchlist.map((item) => (
            <motion.div variants={{ hidden: { opacity: 0, scale: 0.9 }, show: { opacity: 1, scale: 1 } }} key={item.mediaId}>
              <ContentCard 
                title={item.title}
                poster={item.poster_path ? (item.poster_path.includes('http') ? item.poster_path : `https://image.tmdb.org/t/p/w500${item.poster_path}`) : null}
                posterPath={item.poster_path || null}
                rating={item.vote_average}
                releaseDate={item.release_date}
                mediaType={item.type || 'movie'}
                mediaId={item.mediaId}
                isWatchlistPage={true}
              />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center justify-center py-24 text-center bg-[#0d1117] rounded-3xl border border-white/5 mx-auto max-w-4xl shadow-xl mt-10"
        >
           <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
             <FaBookmark className="text-5xl text-gray-600" />
           </div>
           <h3 className="text-3xl font-black text-white mb-4 tracking-tight">Your watchlist is empty</h3>
           <p className="text-gray-400 mb-8 max-w-md font-medium">Add movies and shows to your Watchlist to keep track of what you want to watch. It's the best way to queue up your next binge.</p>
           <motion.button 
             whileHover={{ scale: 1.05 }}
             whileTap={{ scale: 0.95 }}
             onClick={() => window.location.href = '/trending'}
             className="border border-white/20 hover:border-white text-white font-bold py-3 px-8 rounded-full transition-all bg-white/5"
           >
             Explore Trending Content
           </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
}
