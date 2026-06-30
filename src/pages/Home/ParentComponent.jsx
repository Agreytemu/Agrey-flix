import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate, NavLink } from 'react-router-dom';
import Sidebar from './Sidebar';
import AuthModal from '../../components/AuthModal';
import AgreyFlixLoader from '../../components/AgreyFlixLoader';
import { AnimatePresence } from 'framer-motion';
import { FaSearch, FaHome, FaFilm, FaTv, FaUser, FaCog, FaThLarge, FaShieldAlt, FaFolder, FaAndroid } from 'react-icons/fa';
import { BiMoviePlay } from 'react-icons/bi';
import { useProfile } from '../../context/ProfileContext';

export default function ParentComponent() {
  const navigate = useNavigate();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAppLoading, setIsAppLoading] = useState(true);
  const location = useLocation();
  const { profile } = useProfile();

  useEffect(() => {
    // Simulate initial app boot time for the loader
    const timer = setTimeout(() => {
      setIsAppLoading(false);
    }, 2800);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleOpenAuth = () => setIsAuthOpen(true);
    
    window.addEventListener('openAuthModal', handleOpenAuth);
    
    return () => {
      window.removeEventListener('openAuthModal', handleOpenAuth);
    };
  }, []);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    if (queryParams.get('auth') === 'signin' || queryParams.get('login') === 'true') {
      setIsAuthOpen(true);
    }
  }, [location.search]);

  if (isAppLoading) {
    return (
      <div className="flex bg-[#050505] min-h-screen text-white overflow-hidden font-sans items-center justify-center">
         <AgreyFlixLoader />
      </div>
    );
  }

  return (
    <div className="flex bg-[#050505] min-h-screen text-white overflow-hidden font-sans">
      {/* Sidebar - Hidden on mobile, visible on desktop */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto h-screen relative pb-24 md:pb-0 hide-scrollbar">
        {/* Compact Mobile Header (Real PWA Feel) */}
        <div className="md:hidden sticky top-0 z-40 bg-[#050505]/95 backdrop-blur-md px-4 py-3 border-b border-white/5 flex items-center justify-between">
          {/* Setting on top left */}
          <NavLink 
            to="/settings" 
            className={({ isActive }) => `p-2 rounded-full transition-all duration-300 ${
              isActive ? 'text-red-500' : 'text-zinc-400 hover:text-white'
            }`}
            title="Settings"
            id="mobile-settings-btn"
          >
            <FaCog size={20} />
          </NavLink>

          {/* For You on top middle & branding */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-black tracking-widest uppercase text-red-500 leading-none mb-0.5">AgreyFlix</span>
            <NavLink 
              to="/for-you" 
              className={({ isActive }) => `text-sm font-black uppercase tracking-wider transition-all duration-300 ${
                isActive ? 'text-white border-b-2 border-red-500 pb-0.5' : 'text-zinc-400 hover:text-white'
              }`}
              title="For You"
              id="mobile-foryou-tab"
            >
              For You
            </NavLink>
          </div>

          {/* Search on top right */}
          <NavLink 
            to="/search" 
            className={({ isActive }) => `p-2 rounded-full transition-all duration-300 ${
              isActive ? 'text-red-500' : 'text-zinc-400 hover:text-white'
            }`}
            title="Search"
            id="mobile-search-btn"
          >
            <FaSearch size={18} />
          </NavLink>
        </div>

        <AnimatePresence mode="wait">
          <div key={location.pathname}>
            <Outlet />
          </div>
        </AnimatePresence>
      </main>
      
      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0A0A0A]/95 backdrop-blur-lg border-t border-white/5 py-3 px-6 flex items-center justify-around pb-safe">
        {/* Home */}
        <NavLink
          to="/home"
          className={({ isActive }) => `flex flex-col items-center gap-1 transition-all duration-300 ${
            isActive ? 'text-red-500 scale-110 font-bold' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <FaHome size={20} />
          <span className="text-[10px] tracking-wider font-semibold">Home</span>
        </NavLink>

        {/* Movies */}
        <NavLink
          to="/movies"
          className={({ isActive }) => `flex flex-col items-center gap-1 transition-all duration-300 ${
            isActive ? 'text-red-500 scale-110 font-bold' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <FaFilm size={20} />
          <span className="text-[10px] tracking-wider font-semibold">Movies</span>
        </NavLink>

        {/* Series */}
        <NavLink
          to="/series"
          className={({ isActive }) => `flex flex-col items-center gap-1 transition-all duration-300 ${
            isActive ? 'text-red-500 scale-110 font-bold' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <FaTv size={20} />
          <span className="text-[10px] tracking-wider font-semibold">Series</span>
        </NavLink>

        {/* Hub */}
        <NavLink
          to="/hub"
          className={({ isActive }) => `flex flex-col items-center gap-1 transition-all duration-300 ${
            isActive ? 'text-red-500 scale-110 font-bold' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <FaThLarge size={20} />
          <span className="text-[10px] tracking-wider font-semibold">Hub</span>
        </NavLink>

        {/* Library / Get App conditional */}
        {navigator.userAgent.includes("AgreyFlixAndroidApp") ? (
          <NavLink
            to="/library"
            className={({ isActive }) => `flex flex-col items-center gap-1 transition-all duration-300 ${
              isActive ? 'text-red-500 scale-110 font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <FaFolder size={20} />
            <span className="text-[10px] tracking-wider font-semibold">Library</span>
          </NavLink>
        ) : (
          <NavLink
            to="/download-app"
            className={({ isActive }) => `flex flex-col items-center gap-1 transition-all duration-300 ${
              isActive ? 'text-red-500 scale-110 font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <FaAndroid size={20} />
            <span className="text-[10px] tracking-wider font-semibold">Get App</span>
          </NavLink>
        )}

        {/* Admin (Only if Admin) */}
        {profile?.isAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) => `flex flex-col items-center gap-1 transition-all duration-300 ${
              isActive ? 'text-red-500 scale-110 font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <FaShieldAlt size={20} />
            <span className="text-[10px] tracking-wider font-semibold">Admin</span>
          </NavLink>
        )}

        {/* Profile */}
        <NavLink
          to="/profile"
          className={({ isActive }) => `flex flex-col items-center gap-1 transition-all duration-300 ${
            isActive ? 'text-red-500 scale-110 font-bold' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <FaUser size={20} />
          <span className="text-[10px] tracking-wider font-semibold">Profile</span>
        </NavLink>
      </div>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
}

