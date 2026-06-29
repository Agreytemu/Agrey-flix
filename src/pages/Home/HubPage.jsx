import React from 'react';
import { useProfile } from '../../context/ProfileContext';
import { supabaseService } from '../../utils/supabaseService';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FaCalendarAlt, FaGlobeAfrica, FaMagic, FaAward, 
  FaChartLine, FaPlus, FaBell, FaShieldAlt, FaSignOutAlt, 
  FaGlobe, FaThLarge, FaPowerOff
} from 'react-icons/fa';

export default function HubPage() {
  const { profile, loading: profileLoading } = useProfile();
  const navigate = useNavigate();

  const items = [
    { label: 'Upcoming Titles', path: '/upcoming', icon: FaCalendarAlt, desc: 'Preview upcoming cinema launches and set reminders.' },
    { label: 'Africa Pride', path: '/africa-pride', icon: FaGlobeAfrica, desc: 'Discover the rich selection of local African cinema.' },
    { label: 'Animations', path: '/animations', icon: FaMagic, desc: 'Explore top animation titles, series, and features.' },
    { label: 'Rank Artists', path: '/best-artists', icon: FaAward, desc: 'Vote and rank the top performance artists.' },
    { label: 'Trending Row', path: '/trending', icon: FaChartLine, desc: 'See what is hot and trending on AgreyFlix right now.' },
    { label: 'My Watchlist', path: '/watchlist', icon: FaPlus, desc: 'View your handpicked saved movies and TV shows.' },
    { label: 'System Alerts', path: '/notifications', icon: FaBell, desc: 'Read instant system broadcast and server updates.' },
  ];

  if (profile?.isAdmin) {
    items.push({ label: 'Admin Terminal', path: '/admin', icon: FaShieldAlt, desc: 'Full administration panel for editing movie feeds.' });
  }

  if (profileLoading) {
    return (
      <div className="flex bg-[#050505] min-h-screen text-white items-center justify-center font-bold">
        Loading Features Hub...
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.3 }}
      className="p-4 sm:p-8 md:p-12 pb-28 md:pb-12 min-h-screen bg-[#070707] text-white overflow-x-hidden pt-20 md:pt-10 max-w-5xl mx-auto w-full"
    >
      {/* Header section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10 pb-6 border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 shadow-xl flex items-center justify-center shrink-0">
            <FaThLarge className="text-white text-xl" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-2">
              Features Hub <span className="text-[10px] bg-red-600 px-2 py-1 rounded-md tracking-widest font-black uppercase">COMMUNITY</span>
            </h1>
            <p className="text-gray-500 text-sm font-semibold">
              Explore specialized AgreyFlix content areas and platform resources.
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Central Hub items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        {items.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              onClick={() => navigate(item.path)}
              className="p-5 bg-[#0D0D0D] hover:bg-[#121212] border border-white/5 rounded-3xl flex items-start gap-4 hover:border-red-600/30 transition-all duration-300 group text-left active:scale-95 outline-none cursor-pointer w-full shadow-lg"
            >
              <div className="w-10 h-10 rounded-2xl bg-red-600/10 border border-red-500/20 text-red-500 flex items-center justify-center shadow-md shrink-0 group-hover:scale-110 transition-all">
                <Icon size={18} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-white group-hover:text-red-500 transition-colors uppercase tracking-wider">{item.label}</h3>
                <p className="text-xs text-zinc-400 font-medium leading-relaxed">{item.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer and Policy Links */}
      <div className="bg-[#0D0D0D]/60 border border-white/5 p-6 rounded-3xl space-y-4">
        <div>
          <h4 className="text-xs font-black uppercase text-zinc-500 tracking-wider mb-1">Company Information & Policies</h4>
          <p className="text-[11px] text-zinc-400">Read our legal guidelines, terms of service, and direct channels of contact.</p>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-bold text-zinc-400 pt-2">
          <button onClick={() => navigate('/about')} className="bg-[#050505] p-3 border border-white/5 rounded-xl hover:text-white hover:border-white/20 transition-all text-center cursor-pointer">About Us</button>
          <button onClick={() => navigate('/contact')} className="bg-[#050505] p-3 border border-white/5 rounded-xl hover:text-white hover:border-white/20 transition-all text-center cursor-pointer">Contact Us</button>
          <button onClick={() => navigate('/privacy')} className="bg-[#050505] p-3 border border-white/5 rounded-xl hover:text-white hover:border-white/20 transition-all text-center cursor-pointer">Privacy Policy</button>
          <button onClick={() => navigate('/terms')} className="bg-[#050505] p-3 border border-white/5 rounded-xl hover:text-white hover:border-white/20 transition-all text-center cursor-pointer">Terms & Conditions</button>
        </div>
        
        {profile ? (
          <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-zinc-500 font-semibold">
              Signed in as <span className="text-zinc-300 font-bold">{profile.email}</span>
            </div>
            <button
              onClick={async () => {
                try {
                  await supabaseService.signOut();
                  window.location.reload();
                } catch (err) {
                  console.error("Logout failed:", err);
                }
              }}
              className="w-full sm:w-auto px-6 py-2.5 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/10 hover:border-red-500 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
            >
              <FaSignOutAlt size={12} /> Log Out
            </button>
          </div>
        ) : (
          <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-zinc-500 font-semibold">
              Join the AgreyFlix community to unlock interactive custom features.
            </div>
            <button
              onClick={() => window.dispatchEvent(new Event('openAuthModal'))}
              className="w-full sm:w-auto px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
            >
              <FaPowerOff size={12} /> Sign In Here
            </button>
          </div>
        )}
      </div>

    </motion.div>
  );
}
