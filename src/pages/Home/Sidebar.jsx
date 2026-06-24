import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { FaSearch, FaHome, FaFilm, FaTv, FaChartLine, FaPlus, FaSignOutAlt, FaMagic, FaGlobeAfrica, FaAward, FaCalendarAlt, FaShieldAlt, FaBell, FaTimes, FaCircle, FaCheckCircle } from 'react-icons/fa';
import { BiMoviePlay } from 'react-icons/bi';
import { motion, AnimatePresence } from 'framer-motion';
import { useProfile } from '../../context/ProfileContext';
import { supabaseService } from '../../utils/supabaseService';

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const { profile } = useProfile();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications to calculate unread badge
  const fetchNotifList = async () => {
    try {
      const list = await supabaseService.getNotifications();
      setNotifications(list);
      
      // Calculate unread count
      const lastViewed = localStorage.getItem('agreyflix_last_notif_view');
      if (lastViewed) {
        const unread = list.filter(item => new Date(item.created_at) > new Date(lastViewed)).length;
        setUnreadCount(unread);
      } else {
        setUnreadCount(list.length);
      }
    } catch (e) {
      console.warn('Failed to load notifications for badge:', e);
    }
  };

  useEffect(() => {
    fetchNotifList();
    // Listen to new notifications triggered locally in mock mode
    const handleNewNotif = () => fetchNotifList();
    window.addEventListener('newNotification', handleNewNotif);
    return () => window.removeEventListener('newNotification', handleNewNotif);
  }, []);

  const handleOpenNotifications = () => {
    setIsNotifOpen(true);
    setUnreadCount(0);
    localStorage.setItem('agreyflix_last_notif_view', new Date().toISOString());
  };

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

            {/* Notifications Panel Link */}
            <motion.div variants={itemVariants}>
              <button
                onClick={() => {
                  handleOpenNotifications();
                  onClose();
                }}
                className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all font-semibold text-gray-400 hover:text-white hover:bg-white/5 text-left outline-none border border-transparent"
              >
                <div className="flex items-center gap-4">
                  <FaBell className="text-[1.35rem] shrink-0 text-gray-400" />
                  <span className="whitespace-nowrap text-[15px]">Notifications</span>
                </div>
                {unreadCount > 0 && (
                  <span className="bg-red-600 text-white text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center animate-bounce shrink-0">
                    {unreadCount}
                  </span>
                )}
              </button>
            </motion.div>

            {/* Admin Panel Link */}
            {profile?.isAdmin && (
              <motion.div variants={itemVariants}>
                <NavLink
                  to="/admin"
                  onClick={onClose}
                  className={({ isActive }) => `flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all font-semibold ${
                    isActive 
                      ? 'bg-gradient-to-r from-red-600 to-red-500 shadow-lg shadow-red-600/20 text-white' 
                      : 'text-red-500/80 hover:text-red-400 hover:bg-red-500/5 border border-red-500/10'
                  }`}
                >
                  <FaShieldAlt className="text-[1.35rem] shrink-0" />
                  <span className="whitespace-nowrap text-[15px] flex items-center gap-1.5 font-bold">
                    Admin Panel <span className="text-[8px] bg-red-600 text-white font-black rounded px-1.5 py-0.5 uppercase tracking-wider">OP</span>
                  </span>
                </NavLink>
              </motion.div>
            )}
          </nav>
        </div>

        {/* User / Settings Profile */}
        <motion.div variants={itemVariants} className="w-full px-4">
          <button className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-gray-400 hover:text-white hover:bg-white/5 transition-all outline-none border border-transparent hover:border-white/10 group">
             <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="avatar" className="w-9 h-9 rounded-full bg-[#151515] shrink-0 border border-white/10 group-hover:border-white/30 transition-colors" />
             <div className="flex flex-col items-start justify-center">
               <span className="font-bold text-[15px] text-white whitespace-nowrap transition-opacity duration-300 leading-none mb-1 flex items-center gap-1">
                 {profile?.displayName || 'My Profile'}
                 <FaCheckCircle className="text-emerald-500 text-[11px] shrink-0" title="Verified Account" />
               </span>
               <span className="text-xs text-emerald-500 font-bold top-0 leading-none">
                 {profile?.isAdmin ? 'Verified Administrator' : 'Verified Account'}
               </span>
             </div>
          </button>
        </motion.div>
      </motion.div>

      {/* Dynamic Notifications Sheet */}
      <AnimatePresence>
        {isNotifOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-[100]"
              onClick={() => setIsNotifOpen(false)}
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 w-full sm:w-[420px] h-full bg-[#0a0a0a] border-l border-white/5 shadow-2xl z-[110] p-6 flex flex-col"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                  <FaBell className="text-red-500" /> System Notices
                </h3>
                <button
                  onClick={() => setIsNotifOpen(false)}
                  className="p-2 hover:bg-white/5 rounded-xl text-zinc-500 hover:text-white transition-all"
                >
                  <FaTimes size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto hide-scrollbar flex flex-col gap-4">
                {notifications.length === 0 ? (
                  <div className="text-center py-20">
                    <FaBell className="text-zinc-800 text-5xl mx-auto mb-4 animate-pulse" />
                    <p className="text-zinc-500 text-sm font-semibold">All caught up! No notifications yet.</p>
                  </div>
                ) : (
                  notifications.map(notif => {
                    const typeColor = 
                      notif.type === 'alert' ? 'bg-red-500' :
                      notif.type === 'update' ? 'bg-green-500' :
                      'bg-blue-500';
                    return (
                      <div key={notif.id} className="p-4 bg-zinc-950/60 border border-white/5 rounded-2xl hover:bg-zinc-900/40 transition-all relative overflow-hidden group">
                        <div className="flex gap-3">
                          <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${typeColor}`} />
                          <div>
                            <h4 className="text-sm font-bold text-white mb-1">{notif.title}</h4>
                            <p className="text-zinc-400 text-xs leading-relaxed mb-2">{notif.message}</p>
                            <span className="text-[10px] font-mono text-zinc-600 block">
                              {new Date(notif.created_at).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
