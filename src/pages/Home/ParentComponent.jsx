import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import AuthModal from '../../components/AuthModal';
import AgreyFlixLoader from '../../components/AgreyFlixLoader';
import { AnimatePresence } from 'framer-motion';
import { FaBars, FaSearch } from 'react-icons/fa';
import { BiMoviePlay } from 'react-icons/bi';

export default function ParentComponent() {
  const navigate = useNavigate();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAppLoading, setIsAppLoading] = useState(true);
  const location = useLocation();

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
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto h-screen relative hide-scrollbar">
        {/* Mobile Header (Hamburger) */}
        <div className="md:hidden sticky top-0 z-40 bg-gradient-to-b from-[#0A0A0A] to-transparent p-4 flex items-center justify-between pointer-events-none">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-700 shadow-md flex items-center justify-center shrink-0">
                <BiMoviePlay className="text-white text-lg" />
              </div>
              <span className="text-xl font-black tracking-tight drop-shadow-md">
                Agrey<span className="text-red-500">Flix</span>
              </span>
           </div>
           <div className="flex items-center gap-2 pointer-events-auto">
             <button 
               onClick={() => navigate('/search')}
               className="w-10 h-10 rounded-full bg-black/50 border border-white/10 backdrop-blur-md flex items-center justify-center text-white active:scale-95 transition-all outline-none"
               title="Search"
               id="mobile-search-btn"
             >
               <FaSearch className="text-xs" />
             </button>
             <button 
               onClick={() => setIsSidebarOpen(true)}
               className="w-10 h-10 rounded-full bg-black/50 border border-white/10 backdrop-blur-md flex items-center justify-center text-white active:scale-95 transition-all outline-none"
               title="Menu"
               id="mobile-menu-btn"
             >
               <FaBars className="text-xs" />
             </button>
           </div>
        </div>

        <AnimatePresence mode="wait">
          <div key={location.pathname}>
            <Outlet />
          </div>
        </AnimatePresence>
      </main>
      
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
}

