import React from 'react';
import { useProfile } from '../../context/ProfileContext';
import { supabaseService } from '../../utils/supabaseService';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FaUser, FaHome, FaPowerOff, FaCog, FaThLarge, FaSignOutAlt, FaCrown
} from 'react-icons/fa';

export default function ProfilePage() {
  const { profile, loading: profileLoading } = useProfile();
  const navigate = useNavigate();

  if (profileLoading) {
    return (
      <div className="flex bg-[#050505] min-h-screen text-white items-center justify-center font-bold">
        Loading User Profile...
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="p-4 sm:p-8 md:p-12 pb-28 md:pb-12 min-h-screen bg-[#070707] text-white overflow-x-hidden pt-20 md:pt-10 max-w-4xl mx-auto w-full"
    >
      {/* Header section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10 pb-6 border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 shadow-xl flex items-center justify-center shrink-0">
            <FaUser className="text-white text-xl" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-2">
              My Profile <span className="text-[10px] bg-red-600 px-2 py-1 rounded-md tracking-widest font-black uppercase">MY ACCOUNT</span>
            </h1>
            <p className="text-gray-500 text-sm font-semibold">
              Manage your personal account status, security tier, and general preferences.
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/home')}
          className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-white/5 py-2.5 px-5 rounded-xl font-bold text-xs tracking-wider transition-all cursor-pointer border-0 outline-none"
        >
          <FaHome /> Back to Home
        </button>
      </div>

      {!profile ? (
        <div className="max-w-xl mx-auto bg-[#0d0d0d] border border-white/5 p-8 rounded-3xl text-center shadow-2xl space-y-6 my-10">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-600/10 flex items-center justify-center">
            <FaPowerOff className="text-red-500 text-2xl" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white">Not Logged Into Account</h2>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-sm mx-auto">
              Please sign in or sign up to view your profile and manage notification settings.
            </p>
          </div>
          <button
            onClick={() => window.dispatchEvent(new Event('openAuthModal'))}
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-black text-xs tracking-widest uppercase rounded-xl transition-all shadow-lg active:scale-95 cursor-pointer border-0 outline-none"
          >
            Sign In Here
          </button>
        </div>
      ) : (
        /* Logged In Dashboard layout */
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Left Column: Avatar & Account Basic Status */}
          <div className="md:col-span-5 bg-[#0D0D0D] border border-white/5 p-8 rounded-3xl shadow-2xl flex flex-col justify-between gap-6">
            <div className="text-center space-y-4">
              <div className="relative w-28 h-28 mx-auto rounded-full overflow-hidden bg-zinc-900 border-4 border-red-500/20">
                <img 
                  src={profile.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.displayName || 'Felix'}`} 
                  alt="avatar" 
                  className="w-full h-full object-cover" 
                />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white tracking-tight">
                  {profile.displayName || 'Member'}
                </h3>
                <p className="text-xs text-zinc-500 font-mono mt-1">{profile.email}</p>
              </div>

              <div className="pt-2">
                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-red-600/10 border border-red-500/20 text-xs text-red-400 font-extrabold tracking-wider uppercase">
                  Active Member
                </span>
              </div>
            </div>

            {/* General details table */}
            <div className="border-t border-white/5 pt-6 space-y-3 text-xs">
              <div className="flex justify-between items-center py-1">
                <span className="text-zinc-500 font-semibold">Joined Date:</span>
                <span className="text-zinc-300 font-black font-mono bg-zinc-950 px-2.5 py-1 rounded-md border border-white/5">
                  {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-zinc-500 font-semibold">Security Level:</span>
                <span className="text-emerald-400 font-black uppercase bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/15">
                  {profile.isAdmin ? 'Administrator' : 'Verified User'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Portal Navigation Options */}
          <div className="md:col-span-7 flex flex-col gap-6">
            
            {/* Settings Portal Card */}
            <div 
              onClick={() => navigate('/settings')}
              className="p-6 bg-[#0D0D0D] border border-white/5 hover:border-red-600/30 rounded-3xl transition-all duration-300 cursor-pointer group hover:bg-zinc-900/45 shadow-lg flex items-start gap-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-600/10 border border-red-500/20 text-red-500 flex items-center justify-center shrink-0 group-hover:scale-115 transition-transform">
                <FaCog size={20} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-white group-hover:text-red-500 transition-colors uppercase tracking-wider">System Settings</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                  Update your display name, choose a custom avatar seed generator, and toggle app permissions for system notifications.
                </p>
              </div>
            </div>

            {/* Hub Portal Card */}
            <div 
              onClick={() => navigate('/hub')}
              className="p-6 bg-[#0D0D0D] border border-white/5 hover:border-red-600/30 rounded-3xl transition-all duration-300 cursor-pointer group hover:bg-zinc-900/45 shadow-lg flex items-start gap-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-600/10 border border-red-500/20 text-red-500 flex items-center justify-center shrink-0 group-hover:scale-115 transition-transform">
                <FaThLarge size={20} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-white group-hover:text-red-500 transition-colors uppercase tracking-wider">Features Hub</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                  Access community areas including upcoming movie catalogs, rankings, animations, trending lists, and watchlist items.
                </p>
              </div>
            </div>

            {/* Log Out Actions */}
            <div className="mt-auto pt-6 border-t border-white/5 flex justify-end">
              <button
                onClick={async () => {
                  try {
                    await supabaseService.signOut();
                    window.location.reload();
                  } catch (err) {
                    console.error("Logout failed:", err);
                  }
                }}
                className="px-6 py-3 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/10 hover:border-red-500 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer outline-none"
              >
                <FaSignOutAlt size={12} /> Log Out
              </button>
            </div>

          </div>

        </div>
      )}

    </motion.div>
  );
}
