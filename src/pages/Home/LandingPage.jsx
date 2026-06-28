import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { fetchTmdb } from '../../utils/tmdb';
import { FaChevronRight, FaPlay, FaFilm, FaTv, FaBolt, FaInfinity } from 'react-icons/fa';
import { BiMoviePlay } from 'react-icons/bi';

// Stylish high-quality fallback movie posters in case of TMDB API connection limits
const BACKUP_POSTERS = [
  "https://image.tmdb.org/t/p/w500/or06Sgtu89aD7NOfm6OfW9abB.jpg",
  "https://image.tmdb.org/t/p/w500/uKVQjEUuHSi1368n60bUI73WbYn.jpg",
  "https://image.tmdb.org/t/p/w500/e9N6O61mYgOi6Zg8n78A6Z81x08.jpg",
  "https://image.tmdb.org/t/p/w500/9696vszEvEv9698dZ5B2b9DVEZ6.jpg",
  "https://image.tmdb.org/t/p/w500/d587gKIvL6eKgA6Z81x08eLz136.jpg",
  "https://image.tmdb.org/t/p/w500/pB8BM76v6S6vY7W6vX8A6Z81x08.jpg",
  "https://image.tmdb.org/t/p/w500/62HCn9v8Hi6Zg8n78A6Z81x08ab.jpg",
  "https://image.tmdb.org/t/p/w500/or06Sgtu89aD7NOfm6OfW9abB.jpg"
];

const WELCOME_PHRASES = [
  "welcome to AGREY-FLIX",
  "Stream your absolute favorite Bongo, Nollywood, and International hits instantly.",
  "Premium cinema entertainment fully adapted for your mobile, tablet, or desktop screen.",
  "Blazing fast speeds with intelligent streaming sources updated every single second.",
  "Beautiful visual organization, rich details, and smart personal watchlist controls.",
  "No hidden fees, no subscriptions. Dive right into your premier entertainment universe."
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [posters, setPosters] = useState([]);
  const [activePhraseIndex, setActivePhraseIndex] = useState(0);

  // Auto-redirect if auth parameter is present
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    if (queryParams.get('auth') === 'signin' || queryParams.get('login') === 'true') {
      navigate('/home?auth=signin', { replace: true });
    }
  }, [navigate]);

  // Load raw posters from API
  useEffect(() => {
    let active = true;
    const loadBackgrounds = async () => {
      try {
        const res = await fetchTmdb('/trending/movie/week?page=1');
        if (res.ok) {
          const data = await res.json();
          if (active && data.results && data.results.length > 0) {
            const urls = data.results
              .filter(m => m.poster_path)
              .map(m => `https://image.tmdb.org/t/p/w500${m.poster_path}`);
            if (urls.length > 5) {
              setPosters(urls.slice(0, 24)); // Pick top poster images
              return;
            }
          }
        }
      } catch (err) {
        console.warn("[LandingPage Grid] Using prefilled posters", err);
      }
      if (active) {
        setPosters(BACKUP_POSTERS);
      }
    };

    loadBackgrounds();
    return () => { active = false; };
  }, []);

  // Set Interval to swap welcoming phrases smoothly
  useEffect(() => {
    const timer = setInterval(() => {
      setActivePhraseIndex((prev) => (prev + 1) % WELCOME_PHRASES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const handleGetStarted = () => {
    navigate('/home');
  };

  return (
    <div className="relative min-h-screen bg-[#050505] text-white flex flex-col justify-between overflow-hidden font-sans select-none">
      <Helmet>
        <title>AgreyFlix | Unlimited Premium Streaming Hub</title>
        <meta name="description" content="Stream high-speed cloud content, premium Swahili voice-overs, and optimized multi-threaded downloads on AgreyFlix without ad interruptions." />
        <meta name="keywords" content="AgreyFlix, streaming platform, watch movies, watch series online, Swahili translations, download movies offline" />
        <link rel="canonical" href="https://agrey-flix.vercel.app/" />
      </Helmet>
      
      {/* 1. MOVIE POSTERS BACKDROP GRID */}
      <div className="absolute inset-0 z-0 overflow-hidden opacity-100">
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 p-4 scale-105 pointer-events-none select-none">
          {posters.length > 0 ? (
            // Duplicate entries to enrich background grid patterns
            [...posters, ...posters, ...posters].map((url, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 0.95, scale: 1 }}
                transition={{ duration: 1, delay: (i % 16) * 0.04 }}
                className="aspect-[2/3] rounded-xl overflow-hidden bg-zinc-900 border border-white/10 shadow-xl group"
              >
                <img 
                  src={url} 
                  alt="" 
                  className="w-full h-full object-cover select-none"
                  referrerPolicy="no-referrer"
                  loading="lazy" 
                />
              </motion.div>
            ))
          ) : (
            // Fallback boxes in case resources are loading
            Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] bg-zinc-950/20 rounded-xl animate-pulse border border-white/5" />
            ))
          )}
        </div>
        
        {/* Dynamic Inner Vignette Shadow - lightened to show movies clearly but keep text legible */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505]/70 via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 inset-y-0 bg-[radial-gradient(circle_at_center,transparent_60%,rgba(5,5,5,0.25)_95%)] pointer-events-none" />
      </div>

      {/* 2. PREMIUM LOGO HEADER SECTION */}
      <header className="relative z-10 px-6 py-6 md:px-12 flex items-center justify-between border-b border-white/5 bg-transparent">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-800 shadow-xl shadow-red-600/35 flex items-center justify-center shrink-0">
            <BiMoviePlay className="text-white text-2xl" />
          </div>
          <span className="text-2xl md:text-3xl font-black text-white tracking-tighter">
            Agrey<span className="text-red-500">Flix</span>
          </span>
        </div>
      </header>

      {/* 3. HERO CALL-TO-ACTION & WELCOME MESSAGE CARDS */}
      <main className="relative z-10 flex-1 flex flex-col justify-center items-center text-center px-4 md:px-8 py-12">
        <div className="max-w-4xl w-full flex flex-col items-center gap-8 md:gap-11">
          
          {/* Main Title Badge removed per request */}

          {/* Epic Main Heading */}
          <motion.h1 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-4xl sm:text-6xl md:text-8xl font-black tracking-tight text-white leading-none capitalize drop-shadow-[0_4px_12px_rgba(0,0,0,0.95)]"
            style={{ textShadow: '0px 4px 16px rgba(0,0,0,0.95)' }}
          >
            unlimited movies,<br />
            <span className="bg-gradient-to-r from-red-500 to-amber-500 bg-clip-text text-transparent">bongo & series.</span>
          </motion.h1>

          {/* Subtitle statement */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="text-white text-base sm:text-xl md:text-2xl font-bold max-w-2xl leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] bg-black/45 px-6 py-3.5 rounded-2xl border border-white/5 backdrop-blur-[2px]"
          >
            Welcome to the future of regional and international streaming. Fully responsive. High fidelity playback. Free forever.
          </motion.p>

          {/* 4. DYNAMIC ROTATING WELCOME PHRASES */}
          <div className="min-h-[85px] sm:min-h-[60px] max-w-2xl w-full flex items-center justify-center py-2 px-4 bg-[#0d1017]/40 border border-white/5 rounded-2xl backdrop-blur-md">
            <AnimatePresence mode="wait">
              <motion.p
                key={activePhraseIndex}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className="text-zinc-400 text-xs sm:text-sm font-semibold tracking-wide"
              >
                {WELCOME_PHRASES[activePhraseIndex]}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* 5. IMMERSIVE GETTING STARTED TRIGGER */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="w-full flex flex-col items-center gap-4 mt-2"
          >
            <button
              onClick={handleGetStarted}
              className="group bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-extrabold text-base sm:text-lg tracking-wide py-4.5 px-9 rounded-2xl shadow-xl shadow-red-600/30 flex items-center justify-center gap-3 transition-all duration-300 scale-95 hover:scale-100 active:scale-95 border border-white/10"
            >
              <FaPlay className="text-sm text-white group-hover:scale-110 transition-transform" />
              GETTING STARTED
              <FaChevronRight className="text-xs text-white group-hover:translate-x-1 transition-transform" />
            </button>
            
            <div className="flex items-center gap-6 mt-3 text-zinc-500 font-bold text-[11px] uppercase tracking-widest">
              <span className="flex items-center gap-1.5"><FaInfinity className="text-zinc-600 text-[13px]" /> Unlimited Lists</span>
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-800"></span>
              <span className="flex items-center gap-1.5"><FaFilm className="text-zinc-600 text-[13px]" /> 1080p Stream</span>
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-800"></span>
              <span className="flex items-center gap-1.5"><FaTv className="text-zinc-600 text-[13px]" /> Swahili & Global</span>
            </div>
          </motion.div>

        </div>
      </main>

      {/* 6. CINEMATIC CURVED INNER BOTTOM BORDER SCREEN */}
      <footer className="relative z-10 w-full bg-gradient-to-t from-[#050505] to-transparent">
        {/* Bending Curve Pointing Inwards (An elegant screen curve effect) */}
        <div className="w-full h-12 bg-transparent overflow-hidden select-none pointer-events-none">
          <svg viewBox="0 0 1440 100" className="w-full h-full text-[#050505] fill-current" preserveAspectRatio="none">
            <path d="M0,100 C480,30 960,30 1440,100 Z"></path>
          </svg>
        </div>
        
        {/* Signature details */}
        <div className="bg-[#050505] pb-8 pt-2 px-6 text-center space-y-4">
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-[10px] font-black uppercase tracking-wider text-zinc-500">
            <Link to="/about" className="hover:text-red-500 transition-colors">About Us</Link>
            <span className="text-zinc-800 select-none">•</span>
            <Link to="/contact" className="hover:text-red-500 transition-colors">Contact Us</Link>
            <span className="text-zinc-800 select-none">•</span>
            <Link to="/privacy" className="hover:text-red-500 transition-colors">Privacy Policy</Link>
            <span className="text-zinc-800 select-none">•</span>
            <Link to="/terms" className="hover:text-red-500 transition-colors">Terms & Conditions</Link>
          </div>
          <div className="text-zinc-700 font-bold text-[9px] tracking-widest uppercase">
            AGREYFLIX MEDIA SERVICE © 2026 • BUILT FOR EXCEPTIONAL DISCOVERIES
          </div>
        </div>
      </footer>

    </div>
  );
}
