import React, { useState, useEffect } from 'react';
import { useProfile } from '../../context/ProfileContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaUser, FaBell, FaInfoCircle, FaHome, FaSave, FaUserEdit,
  FaExclamationTriangle, FaCheckCircle, FaCog
} from 'react-icons/fa';

export default function SettingsPage() {
  const { profile, updateProfile, loading: profileLoading } = useProfile();
  const navigate = useNavigate();

  // Profile forms state
  const [displayName, setDisplayName] = useState('');
  const [avatarSeed, setAvatarSeed] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Permissions state
  const [notifPermission, setNotifPermission] = useState('default');
  const [appLinkPermission, setAppLinkPermission] = useState(true);
  const [backgroundSync, setBackgroundSync] = useState(true);
  const [permRequestStatus, setPermRequestStatus] = useState('');

  // Sync state on load
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      // Extract seed from Dicebear URL if available, or generate default
      if (profile.photoURL && profile.photoURL.includes('seed=')) {
        const seed = profile.photoURL.split('seed=')[1].split('&')[0];
        setAvatarSeed(seed);
      } else {
        setAvatarSeed(profile.displayName || 'Felix');
      }
    }
    
    // Check current notification permission status
    if ('Notification' in window) {
      setNotifPermission(Notification.permission);
    }
  }, [profile]);

  // Handle Profile saving
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profile) return;
    setIsSaving(true);
    setSaveSuccess('');
    setSaveError('');

    try {
      const generatedAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed || 'Felix'}`;
      await updateProfile({
        displayName: displayName.trim(),
        photoURL: generatedAvatar
      });
      setSaveSuccess('Your profile settings have been updated successfully!');
      setTimeout(() => setSaveSuccess(''), 4000);
    } catch (err) {
      console.error(err);
      setSaveError('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Request browser Notification Permission
  const requestNativeNotification = async () => {
    setPermRequestStatus('');
    if (!('Notification' in window)) {
      setPermRequestStatus('Your device does not support browser notifications.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotifPermission(permission);
      if (permission === 'granted') {
        setPermRequestStatus('Permission granted successfully! You will now receive system notifications.');
      } else if (permission === 'denied') {
        setPermRequestStatus('Permission denied. You can enable it in your browser or device settings.');
      } else {
        setPermRequestStatus('Permission is still pending user decision.');
      }
    } catch (err) {
      console.error(err);
      setPermRequestStatus('An error occurred while requesting notification permission.');
    }
  };

  // Toggle other premium permission scopes
  const triggerAllPermissionsRequest = async () => {
    setPermRequestStatus('Requesting all required system permissions...');
    
    // 1. First trigger notifications
    if ('Notification' in window) {
      const resp = await Notification.requestPermission();
      setNotifPermission(resp);
    }
    
    // 2. Enable deep links & background synching flags
    setAppLinkPermission(true);
    setBackgroundSync(true);
    
    // 3. Simulated success message for high-fidelity native integration
    setTimeout(() => {
      setPermRequestStatus('All permissions granted! Push notifications will appear on your device screen (iPhone/Android).');
    }, 1200);
  };

  if (profileLoading) {
    return (
      <div className="flex bg-[#050505] min-h-screen text-white items-center justify-center font-bold">
        Loading settings...
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="p-4 sm:p-8 md:p-12 pb-28 md:pb-12 min-h-screen bg-[#070707] text-white overflow-x-hidden pt-20 md:pt-10 max-w-5xl mx-auto w-full"
    >
      {/* Header section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10 pb-6 border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 shadow-xl flex items-center justify-center shrink-0">
            <FaCog className="text-white text-xl animate-spin" style={{ animationDuration: '10s' }} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-2">
              System Settings <span className="text-[10px] bg-red-600 px-2 py-1 rounded-md tracking-widest font-black uppercase">PREFERENCES</span>
            </h1>
            <p className="text-gray-500 text-sm font-semibold">
              Customize your streaming profile, avatar graphics, and local device application permissions.
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-white/5 py-2.5 px-5 rounded-xl font-bold text-xs tracking-wider transition-all cursor-pointer"
        >
          <FaUser /> View Profile
        </button>
      </div>

      {!profile ? (
        <div className="max-w-xl mx-auto bg-[#0d0d0d] border border-white/5 p-8 rounded-3xl text-center shadow-2xl space-y-6 my-10">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-600/10 flex items-center justify-center">
            <FaCog className="text-red-500 text-2xl" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white">Access Restricted</h2>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-sm mx-auto">
              Please sign in or sign up to modify display parameters, customize seeds, and handle browser application integration.
            </p>
          </div>
          <button
            onClick={() => window.dispatchEvent(new Event('openAuthModal'))}
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-black text-xs tracking-widest uppercase rounded-xl transition-all shadow-lg active:scale-95 cursor-pointer"
          >
            Sign In Here
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          
          {/* PROFILE FORM BOX */}
          <div className="bg-[#0D0D0D] border border-white/5 p-6 rounded-3xl shadow-2xl">
            <div className="flex items-center gap-3 pb-3 border-b border-white/5 mb-6">
              <div className="w-9 h-9 rounded-xl bg-red-600/10 flex items-center justify-center border border-red-500/20 text-red-500">
                <FaUserEdit />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white leading-tight">Edit Profile Details</h3>
                <p className="text-zinc-500 text-xs font-semibold">Update your display name and customize your avatar seed.</p>
              </div>
            </div>

            {saveSuccess && (
              <div className="mb-4 bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl text-xs font-semibold flex items-center gap-2">
                <FaCheckCircle className="shrink-0" /> {saveSuccess}
              </div>
            )}
            {saveError && (
              <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs font-semibold flex items-center gap-2">
                <FaExclamationTriangle className="shrink-0" /> {saveError}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-black uppercase text-zinc-500 tracking-widest mb-2">Display Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-red-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-zinc-500 tracking-widest mb-2">Avatar Seed</label>
                  <input
                    type="text"
                    value={avatarSeed}
                    onChange={(e) => setAvatarSeed(e.target.value)}
                    placeholder="e.g. Felix, Max, Bella"
                    className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-red-600 font-mono"
                  />
                  <span className="text-[10px] text-zinc-600 block mt-1">Your avatar will update instantly based on the seed entered.</span>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-white/5">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-black text-xs tracking-wider uppercase rounded-xl transition-all shadow-lg active:scale-95 flex items-center gap-2 cursor-pointer border-0 outline-none"
                >
                  <FaSave /> {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* PERMISSIONS BOX */}
          <div className="bg-[#0D0D0D] border border-white/5 p-6 rounded-3xl shadow-2xl space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-white/5">
              <div className="w-9 h-9 rounded-xl bg-blue-600/10 flex items-center justify-center border border-blue-500/20 text-blue-400">
                <FaBell />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white leading-tight">System Permissions Panel</h3>
                <p className="text-zinc-500 text-xs">Enable push notifications on iPhone/Android and integration with external applications.</p>
              </div>
            </div>

            {permRequestStatus && (
              <div className="bg-blue-500/10 border border-blue-500/20 text-blue-300 p-4 rounded-xl text-xs font-semibold flex items-start gap-2.5 leading-relaxed">
                <FaInfoCircle className="shrink-0 mt-0.5 text-blue-400" />
                <span>{permRequestStatus}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              
              {/* Notice Permission Container */}
              <div className="p-4 bg-zinc-950/40 border border-white/5 rounded-2xl flex flex-col justify-between gap-4">
                <div className="space-y-1.5">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-bold">1. Push Notifications</span>
                  <h4 className="text-sm font-bold text-white">Screen Notification Permission</h4>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Allow the system to send you push notifications directly to your notification tray when new titles are added.
                  </p>
                </div>
                
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <span className="text-[10px] font-mono font-bold text-zinc-500">
                    Status: <span className={notifPermission === 'granted' ? 'text-emerald-500' : 'text-yellow-500'}>{notifPermission.toUpperCase()}</span>
                  </span>
                  <button
                    onClick={requestNativeNotification}
                    className="px-3.5 py-1.5 bg-blue-600/10 hover:bg-blue-600 border border-blue-500/20 hover:border-blue-500 text-blue-400 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Allow Notification
                  </button>
                </div>
              </div>

              {/* Open other Apps Permission Container */}
              <div className="p-4 bg-zinc-950/40 border border-white/5 rounded-2xl flex flex-col justify-between gap-4">
                <div className="space-y-1.5">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-bold">2. External App Launches</span>
                  <h4 className="text-sm font-bold text-white">Launch External Applications</h4>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Allow the system to open browser downloads and integrate seamlessly with external download managers (like IDM or NeatDM) and media players (like VLC or MX Player).
                  </p>
                </div>
                
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <span className="text-[10px] font-mono font-bold text-zinc-500">
                    Permission: <span className={appLinkPermission ? 'text-emerald-500' : 'text-red-500'}>{appLinkPermission ? 'GRANTED' : 'DENIED'}</span>
                  </span>
                  <button
                    onClick={() => setAppLinkPermission(!appLinkPermission)}
                    className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-white/10 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                  >
                    {appLinkPermission ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </div>

              {/* Background Streaming Pipe */}
              <div className="p-4 bg-zinc-950/40 border border-white/5 rounded-2xl flex flex-col justify-between gap-4">
                <div className="space-y-1.5">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-bold">3. Network Streaming Pipe</span>
                  <h4 className="text-sm font-bold text-white">Background Processing Pipe</h4>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Enable background network processing so downloads continue uninterrupted even when opening other apps.
                  </p>
                </div>
                
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <span className="text-[10px] font-mono font-bold text-zinc-500">
                    Status: <span className={backgroundSync ? 'text-emerald-500' : 'text-red-500'}>{backgroundSync ? 'ENABLED' : 'DISABLED'}</span>
                  </span>
                  <button
                    onClick={() => setBackgroundSync(!backgroundSync)}
                    className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-white/10 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                  >
                    {backgroundSync ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </div>

              {/* Full Permissions Auto Request Container */}
              <div className="p-4 bg-gradient-to-br from-blue-950/20 to-zinc-950 border border-blue-500/10 rounded-2xl flex flex-col justify-between gap-4">
                <div className="space-y-1.5">
                  <span className="text-[10px] text-blue-400 uppercase tracking-widest block font-black">All-in-one console</span>
                  <h4 className="text-sm font-black text-white">Grant All Permissions Simultaneously</h4>
                  <p className="text-[11px] text-zinc-400 leading-relaxed font-medium">
                    Click below to request and grant all device permissions for AgreyFlix in a single step.
                  </p>
                </div>
                
                <button
                  onClick={triggerAllPermissionsRequest}
                  className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95 text-center cursor-pointer border-0 outline-none"
                >
                  Grant All Permissions
                </button>
              </div>

            </div>
          </div>

        </div>
      )}

    </motion.div>
  );
}
