import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { FaSearch, FaHome, FaFilm, FaTv, FaChartLine, FaPlus, FaSignOutAlt, FaMagic, FaGlobeAfrica, FaAward, FaCalendarAlt, FaShieldAlt, FaBell, FaTimes, FaCircle, FaCheckCircle, FaUser, FaHeart } from 'react-icons/fa';
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
      const fullList = await supabaseService.getNotifications();
      
      const isUserSubscriber = profile?.isSubscribed || profile?.is_subscribed || profile?.preferences?.isSubscribed;
      
      // Filter notifications:
      // - Show subscriber-only messages only if the user is an active premium subscriber.
      // - Show regular announcements only if created after user's created_at (joined time).
      // - Always show welcome notifications (type === 'welcome') to welcome new users automatically!
      const filteredList = fullList.filter(item => {
        const isSubscribersOnly = item.target_audience === 'subscribers' || (item.type || '').includes(':subscribers');
        
        // Non-logged-in or non-subscribers can NEVER see subscriber-only notifications
        if (isSubscribersOnly && !isUserSubscriber) {
          return false;
        }

        if (item.type === 'welcome') {
          return true;
        }
        if (profile?.created_at) {
          // Compare dates
          return new Date(item.created_at).getTime() >= new Date(profile.created_at).getTime() - 5000; // 5 seconds margin to prevent clock skew issues
        }
        return true;
      });

      setNotifications(filteredList);
      
      // Calculate unread count
      const lastViewed = localStorage.getItem('agreyflix_last_notif_view');
      if (lastViewed) {
        const unread = filteredList.filter(item => new Date(item.created_at) > new Date(lastViewed)).length;
        setUnreadCount(unread);
      } else {
        setUnreadCount(filteredList.length);
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
  }, [profile]);

  const handleOpenNotifications = () => {
    setIsNotifOpen(true);
    setUnreadCount(0);
    localStorage.setItem('agreyflix_last_notif_view', new Date().toISOString());
  };

  const navItems = [
    { icon: FaSearch, path: '/search', label: 'Search' },
    { icon: FaHeart, path: '/for-you', label: 'For You' },
    { icon: FaHome, path: '/home', label: 'Home' },
    { icon: FaFilm, path: '/movies', label: 'Movies' },
    { icon: FaTv, path: '/series', label: 'TV Shows' },
    { icon: FaCalendarAlt, path: '/upcoming', label: 'Upcoming' },
    { icon: FaGlobeAfrica, path: '/africa-pride', label: 'Africa Pride' },
    { icon: FaMagic, path: '/animations', label: 'Animations' },
    { icon: FaAward, path: '/best-artists', label: 'Rank Artists' },
    { icon: FaChartLine, path: '/trending', label: 'Trending' },
    { icon: FaPlus, path: '/watchlist', label: 'Watchlist' },
    { icon: FaUser, path: '/profile', label: 'Profile' },
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
        className={`fixed md:relative top-0 left-0 w-[240px] flex-shrink-0 bg-[#0A0A0A] border-r border-white/5 h-[100dvh] flex flex-col justify-between items-start py-6 transition-transform duration-300 z-[70] md:translate-x-0 overflow-y-auto custom-scrollbar ${
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
          <nav className="flex flex-col gap-1 w-full px-4 overflow-y-auto custom-scrollbar">
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
            {profile && (
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
            )}

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

        {/* SEO Trust Pages Sub-Footer */}
        <motion.div 
          variants={itemVariants}
          className="w-full px-6 py-3 border-t border-white/5 mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[9px] font-black uppercase tracking-wider text-zinc-600 shrink-0"
        >
          <NavLink to="/about" onClick={onClose} className="hover:text-red-500 transition-colors">About</NavLink>
          <span className="text-zinc-800 select-none">•</span>
          <NavLink to="/contact" onClick={onClose} className="hover:text-red-500 transition-colors">Contact</NavLink>
          <span className="text-zinc-800 select-none">•</span>
          <NavLink to="/privacy" onClick={onClose} className="hover:text-red-500 transition-colors">Privacy</NavLink>
          <span className="text-zinc-800 select-none">•</span>
          <NavLink to="/terms" onClick={onClose} className="hover:text-red-500 transition-colors">Terms</NavLink>
        </motion.div>

        {/* User / Settings Profile & Logout */}
        <motion.div variants={itemVariants} className="w-full px-4 flex items-center gap-2">
          {profile ? (
            <>
              <button 
                onClick={() => window.dispatchEvent(new Event('openAuthModal'))}
                className="flex-1 flex items-center gap-3 px-3 py-2.5 rounded-2xl text-gray-400 hover:text-white hover:bg-white/5 transition-all outline-none border border-transparent hover:border-white/10 group overflow-hidden"
              >
                 <img src={profile.photoURL || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} alt="avatar" className="w-8 h-8 rounded-full bg-[#151515] shrink-0 border border-white/10 group-hover:border-white/30 transition-colors" />
                 <div className="flex flex-col items-start justify-center min-w-0">
                   <span className="font-bold text-sm text-white truncate max-w-[100px] transition-opacity duration-300 leading-none mb-1 flex items-center gap-1">
                     {profile.displayName || 'Subscriber'}
                     <FaCheckCircle className="text-emerald-500 text-[10px] shrink-0" title="Verified Account" />
                   </span>
                   <span className="text-[10px] text-emerald-500 font-bold leading-none truncate max-w-[100px]">
                     {profile.isAdmin ? 'Admin' : 'Member'}
                   </span>
                 </div>
              </button>
              
              {/* Logout Button */}
              <button
                onClick={async () => {
                  try {
                    await supabaseService.signOut();
                    window.location.reload();
                  } catch (err) {
                    console.error("Logout failed:", err);
                  }
                }}
                className="w-10 h-10 rounded-2xl bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/10 hover:border-red-500 flex items-center justify-center shrink-0 transition-all duration-300 active:scale-90 cursor-pointer"
                title="Log Out"
              >
                <FaSignOutAlt className="text-sm" />
              </button>
            </>
          ) : (
            <button 
              onClick={() => window.dispatchEvent(new Event('openAuthModal'))}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-black text-xs tracking-wider uppercase transition-all shadow-lg shadow-red-600/20 active:scale-95 cursor-pointer"
            >
              <FaSignOutAlt className="text-xs rotate-180" /> Sign In / Join
            </button>
          )}
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
