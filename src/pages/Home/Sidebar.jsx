import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { FaSearch, FaHome, FaFilm, FaTv, FaChartLine, FaPlus, FaSignOutAlt, FaMagic, FaGlobeAfrica, FaAward, FaCalendarAlt } from 'react-icons/fa';
import { BiMoviePlay } from 'react-icons/bi';
import { motion } from 'framer-motion';

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const navItems = [
    { icon: FaSearch, path: '/search', label: 'Search' },
    { icon: FaHome, path: '/home', label: 'Home' },
    { icon: FaFilm, path: '/movies', label: 'Movies' },
    { icon: FaTv, path: '/series', label: 'TV Shows' },
    { icon: FaCalendarAlt, path: '/upcoming', label: 'Upcoming' },
    { icon: FaGlobeAfrica, path: '/africa-pride', label: 'Africa Pride' },
    { icon: FaMagic, path: '/animations', label: 'Animations' },
    { icon: FaAward, path: '/best-artists', label: 'Rank Artists' },
    { icon: FaChartLine, path: '/trending', label: 'Trending' },
    { icon: FaPlus, path: '/watchlist', label: 'Watchlist' },
  ];

  const sidebarVariants = {
    hidden: { x: -50, opacity: 0 },
    show: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
        staggerChildren: 0.1,
        when: "beforeChildren"
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0, transition: { type: "tween" } }
  };

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm md:hidden" 
          onClick={onClose} 
        />
      )}
      
      <motion.div 
        variants={sidebarVariants}
        initial="hidden"
        animate="show"
        className={`fixed md:relative top-0 left-0 w-[240px] flex-shrink-0 bg-[#0A0A0A] border-r border-white/5 h-[100dvh] flex flex-col justify-between items-start py-6 transition-transform duration-300 z-[70] md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col gap-10 w-full">
          {/* Logo */}
          <motion.div variants={itemVariants} className="px-6 flex items-center gap-4 cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-700 shadow-lg shadow-red-500/30 flex items-center justify-center shrink-0">
              <BiMoviePlay className="text-white text-2xl" />
            </div>
            <span className="text-2xl font-black text-white tracking-tight whitespace-nowrap transition-opacity duration-300">
              Agrey<span className="text-red-500">Flix</span>
            </span>
          </motion.div>

          {/* Navigation */}
          <nav className="flex flex-col gap-1 w-full px-4 overflow-y-auto hide-scrollbar">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <motion.div variants={itemVariants} key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={onClose}
                    className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all font-semibold ${
                      isActive 
                        ? 'bg-gradient-to-r from-red-600 to-red-500 shadow-lg shadow-red-600/20 text-white' 
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <item.icon className="text-[1.35rem] shrink-0" />
                    <span className="whitespace-nowrap transition-opacity duration-300 text-[15px]">
                      {item.label}
                    </span>
                  </NavLink>
                </motion.div>
              );
            })}
          </nav>
        </div>

        {/* User / Settings Profile */}
        <motion.div variants={itemVariants} className="w-full px-4">
          <button className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-gray-400 hover:text-white hover:bg-white/5 transition-all outline-none border border-transparent hover:border-white/10 group">
             <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="avatar" className="w-9 h-9 rounded-full bg-[#151515] shrink-0 border border-white/10 group-hover:border-white/30 transition-colors" />
             <div className="flex flex-col items-start justify-center">
               <span className="font-bold text-[15px] text-white whitespace-nowrap transition-opacity duration-300 leading-none mb-1">
                 My Profile
               </span>
               <span className="text-xs text-gray-500 top-0 leading-none">Free Account</span>
             </div>
          </button>
        </motion.div>
      </motion.div>
    </>
  );
}
