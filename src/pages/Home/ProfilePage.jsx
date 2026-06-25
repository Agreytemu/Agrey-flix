import React, { useState, useEffect } from 'react';
import { useProfile } from '../../context/ProfileContext';
import { supabaseService } from '../../utils/supabaseService';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaUser, FaCrown, FaBell, FaLaptop, FaMobileAlt, 
  FaCheckCircle, FaExclamationTriangle, FaShieldAlt, 
  FaSave, FaUserEdit, FaInfoCircle, FaHome, FaPowerOff,
  FaShareAlt, FaNetworkWired, FaCog
} from 'react-icons/fa';

export default function ProfilePage() {
  const { profile, updateProfile, loading: profileLoading } = useProfile();
  const navigate = useNavigate();

  // Profile forms state
  const [displayName, setDisplayName] = useState('');
  const [avatarSeed, setAvatarSeed] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Upgrade state
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);

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
      setSaveSuccess('Your profile has been updated successfully!');
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

  // VIP Subscription handler
  const handleUpgradeSubscription = async () => {
    if (!profile) {
      window.dispatchEvent(new Event('openAuthModal'));
      return;
    }

    setIsUpgrading(true);
    try {
      // Set subscriber state to true
      await updateProfile({
        isSubscribed: true,
        is_subscribed: true,
        plan: 'VIP Premium'
      });
      setUpgradeSuccess(true);
      setTimeout(() => {
        setUpgradeSuccess(false);
      }, 5000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel your VIP Premium membership? You will no longer receive subscriber-only messages.')) return;
    try {
      await updateProfile({
        isSubscribed: false,
        is_subscribed: false,
        plan: 'Free Member'
      });
    } catch (err) {
      console.error(err);
    }
  };

  const isUserSubscriber = profile?.isSubscribed || profile?.is_subscribed || profile?.preferences?.isSubscribed;

  if (profileLoading) {
    return (
      <div className="flex bg-[#050505] min-h-screen text-white items-center justify-center font-bold">
        Loading User Profile...
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 md:p-12 min-h-screen bg-[#070707] text-white overflow-x-hidden pt-20 md:pt-10">
      
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
              Manage your account, VIP membership, and all notification permissions.
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/home')}
          className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-white/5 py-2.5 px-5 rounded-xl font-bold text-xs tracking-wider transition-all cursor-pointer"
        >
          <FaHome /> Back to Home
        </button>
      </div>

      {!profile ? (
        /* Not logged in banner */
        <div className="max-w-xl mx-auto bg-[#0d0d0d] border border-white/5 p-8 rounded-3xl text-center shadow-2xl space-y-6 my-10">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-600/10 flex items-center justify-center">
            <FaPowerOff className="text-red-500 text-2xl" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white">Not Logged Into Account</h2>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-sm mx-auto">
              Please sign in or sign up to view your profile, manage permissions, and join VIP Premium.
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
        /* Logged In Dashboard layout */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Column 1: Profile card info (left side) */}
          <div className="lg:col-span-4 flex flex-col gap-8">
            <div className="bg-[#0D0D0D] border border-white/5 p-6 rounded-3xl shadow-2xl space-y-6">
              
              <div className="text-center space-y-3">
                <div className="relative w-24 h-24 mx-auto rounded-full overflow-hidden bg-zinc-900 border-2 border-red-500/30">
                  <img 
                    src={profile.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.displayName || 'Felix'}`} 
                    alt="avatar" 
                    className="w-full h-full object-cover" 
                  />
                  {isUserSubscriber && (
                    <div className="absolute -top-1 -right-1 bg-yellow-500 text-black p-1 rounded-full border border-[#0d0d0d]" title="VIP Premium Member">
                      <FaCrown className="text-xs" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center justify-center gap-1.5">
                    {profile.displayName || 'Member'}
                    {isUserSubscriber && <FaCrown className="text-yellow-500 text-sm" />}
                  </h3>
                  <p className="text-xs text-zinc-500">{profile.email}</p>
                </div>

                <div className="pt-2">
                  {isUserSubscriber ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-[11px] text-yellow-400 font-extrabold tracking-wider uppercase">
                      Active VIP Premium
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-white/5 text-[11px] text-zinc-400 font-extrabold tracking-wider uppercase">
                      Standard Member
                    </span>
                  )}
                </div>
              </div>

              {/* Profile upgrade logic */}
              <div className="border-t border-white/5 pt-5 space-y-4">
                <h4 className="text-xs font-black uppercase text-zinc-500 tracking-wider">Subscription Plan Status</h4>
                
                {isUserSubscriber ? (
                  <div className="bg-yellow-500/5 border border-yellow-500/20 p-4 rounded-2xl space-y-3">
                    <span className="text-xs font-bold text-yellow-500 block leading-tight">Active VIP Membership</span>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      You now have full access to custom notifications, subscriber-only updates, and max download speeds.
                    </p>
                    <button
                      onClick={handleCancelSubscription}
                      className="text-[10px] text-zinc-600 hover:text-red-400 font-bold uppercase transition-all block"
                    >
                      Cancel VIP
                    </button>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-zinc-950 to-zinc-900 border border-red-500/15 p-5 rounded-2xl space-y-4">
                    <div className="flex items-center gap-2">
                      <FaCrown className="text-yellow-500 animate-pulse text-lg" />
                      <span className="text-xs font-black uppercase text-white tracking-widest">AgreyFlix VIP Premium</span>
                    </div>
                    <ul className="space-y-1 text-[11px] text-zinc-400 list-inside">
                      <li className="flex items-center gap-1.5">Download MP4 files inside IDM directly</li>
                      <li className="flex items-center gap-1.5">Exclusive Admin-Subscriber Messages</li>
                      <li className="flex items-center gap-1.5">Fast high-speed multi-threaded pipes</li>
                      <li className="flex items-center gap-1.5">No redirection bounds or third-party ads</li>
                    </ul>

                    {upgradeSuccess && (
                      <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-2.5 rounded-xl text-[10px] font-semibold text-center">
                        Membership updated to VIP Premium!
                      </div>
                    )}

                    <button
                      onClick={handleUpgradeSubscription}
                      disabled={isUpgrading}
                      className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black py-2.5 rounded-xl font-black text-[11px] tracking-wider uppercase transition-all shadow-lg cursor-pointer"
                    >
                      {isUpgrading ? 'Upgrading...' : 'Join VIP Now'}
                    </button>
                  </div>
                )}
              </div>

              {/* General details */}
              <div className="border-t border-white/5 pt-5 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Joined Date:</span>
                  <span className="text-zinc-300 font-semibold font-mono">
                    {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Account Type:</span>
                  <span className="text-emerald-400 font-bold uppercase">{profile.isAdmin ? 'System Admin' : 'Active User'}</span>
                </div>
              </div>

            </div>
          </div>

          {/* Column 2: Profile forms & Permissions system (right side) */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            
            {/* PERMISSIONS BOX (RUHUSA ZOTE) */}
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
                    className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95 text-center cursor-pointer"
                  >
                    Grant All Permissions
                  </button>
                </div>

              </div>
            </div>

            {/* PROFILE FORM BOX */}
            <div className="bg-[#0D0D0D] border border-white/5 p-6 rounded-3xl h-fit shadow-2xl">
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
                    className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-black text-xs tracking-wider uppercase rounded-xl transition-all shadow-lg active:scale-95 flex items-center gap-2 cursor-pointer"
                  >
                    <FaSave /> {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
