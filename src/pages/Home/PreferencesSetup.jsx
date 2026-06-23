import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../../context/ProfileContext';
import { useNotification } from '../../context/NotificationContext';
import { FaGlobe, FaDesktop, FaCheck } from 'react-icons/fa';

export default function PreferencesSetup() {
  const { profile, updateProfile } = useProfile();
  const { addNotification } = useNotification();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [language, setLanguage] = useState('en');
  const [subtitle, setSubtitle] = useState(true);

  const handleFinishSetup = async () => {
    setLoading(true);
    try {
      await updateProfile({
        preferences: { language, subtitle },
        preferencesSet: true // Signifies completed onboarding
      });
      addNotification("Preferences saved successfully!", "success");
      navigate('/home');
    } catch (err) {
      addNotification("Failed to save preferences", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return null;

  // If already set up, redirect home
  if (profile.preferencesSet) {
    navigate('/home');
    return null;
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
      <div className="bg-[#0d1117] border border-white/10 rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold text-white mb-2">Welcome, {profile.displayName || 'User'}!</h2>
        <p className="text-gray-400 text-sm mb-8">Configure your preferences to optimize your streaming experience on AgreyFlix.</p>

        <div className="space-y-6">
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-white mb-2">
              <FaGlobe className="text-red-500" /> Prefered Language
            </label>
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-1 focus:ring-red-500 transition-all font-medium text-sm"
            >
              <option value="en">English</option>
              <option value="sw">Swahili</option>
              <option value="fr">French</option>
            </select>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-white mb-2">
              <FaDesktop className="text-red-500" /> Default Subtitles
            </label>
            <div className="flex gap-4">
              <button 
                onClick={() => setSubtitle(true)}
                className={`flex-1 py-2.5 rounded-lg border text-sm font-bold transition-all ${subtitle ? 'bg-red-600 border-red-500 text-white' : 'bg-transparent border-white/20 text-gray-400 hover:border-white/40'}`}
              >
                On
              </button>
              <button 
                onClick={() => setSubtitle(false)}
                className={`flex-1 py-2.5 rounded-lg border text-sm font-bold transition-all ${!subtitle ? 'bg-red-600 border-red-500 text-white' : 'bg-transparent border-white/20 text-gray-400 hover:border-white/40'}`}
              >
                Off
              </button>
            </div>
          </div>

          <button 
            onClick={handleFinishSetup}
            disabled={loading}
            className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold shadow-[0_0_20px_rgba(220,38,38,0.2)] transition-all flex items-center justify-center gap-2 mt-4"
          >
            {loading ? <span className="animate-spin border-2 border-white/20 border-t-white rounded-full w-5 h-5" /> : <><FaCheck /> Get Started</>}
          </button>
        </div>
      </div>
    </div>
  );
}
