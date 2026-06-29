import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBell, FaTrash, FaCheckCircle, FaInfoCircle, FaExclamationCircle, FaArrowLeft, FaMagic, FaTrashAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../../context/ProfileContext';
import { supabaseService } from '../../utils/supabaseService';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Serra AI custom notification generation states for Admin only
  const [aiNotifStyle, setAiNotifStyle] = useState('cinematic');
  const [aiNotifTopic, setAiNotifTopic] = useState('');
  const [isGeneratingAiNotif, setIsGeneratingAiNotif] = useState(false);
  const [aiNotifStatus, setAiNotifStatus] = useState('');

  // Fetch and filter notifications
  const loadNotifications = async () => {
    try {
      setLoading(true);
      const fullList = await supabaseService.getNotifications();
      const isUserSubscriber = profile?.isSubscribed || profile?.is_subscribed || profile?.preferences?.isSubscribed;
      
      // Filter based on joined date, subscriber status, and welcome status
      let filteredList = fullList.filter(item => {
        const isSubscribersOnly = item.target_audience === 'subscribers' || (item.type || '').includes(':subscribers');
        
        if (isSubscribersOnly && !isUserSubscriber) {
          return false;
        }

        if (item.type === 'welcome') {
          return true;
        }
        
        if (profile?.created_at) {
          return new Date(item.created_at).getTime() >= new Date(profile.created_at).getTime() - 5000;
        }
        return true;
      });

      // Merge with locally generated notifications
      const localNotifs = JSON.parse(localStorage.getItem('agreyflix_local_notifications') || '[]');
      let mergedList = [...localNotifs, ...filteredList];

      // Exclude cleared notification IDs
      const clearedIds = JSON.parse(localStorage.getItem('agreyflix_cleared_notification_ids') || '[]');
      const visibleList = mergedList.filter(item => !clearedIds.includes(item.id.toString()));

      // Sort by newest first
      visibleList.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setNotifications(visibleList);

      // Save last viewed timestamp to clear Sidebar badges automatically
      localStorage.setItem('agreyflix_last_notif_view', new Date().toISOString());
      window.dispatchEvent(new Event('newNotification'));
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [profile]);

  // Clear a single notification
  const handleClearSingle = (id) => {
    const clearedIds = JSON.parse(localStorage.getItem('agreyflix_cleared_notification_ids') || '[]');
    clearedIds.push(id.toString());
    localStorage.setItem('agreyflix_cleared_notification_ids', JSON.stringify(clearedIds));

    // Also remove from local notifications if it is one
    const localNotifs = JSON.parse(localStorage.getItem('agreyflix_local_notifications') || '[]');
    const filteredLocal = localNotifs.filter(n => n.id.toString() !== id.toString());
    localStorage.setItem('agreyflix_local_notifications', JSON.stringify(filteredLocal));

    // Update state and notify components
    setNotifications(prev => prev.filter(n => n.id.toString() !== id.toString()));
    window.dispatchEvent(new Event('newNotification'));
  };

  // Clear all notifications
  const handleClearAll = () => {
    const clearedIds = JSON.parse(localStorage.getItem('agreyflix_cleared_notification_ids') || '[]');
    notifications.forEach(n => {
      if (!clearedIds.includes(n.id.toString())) {
        clearedIds.push(n.id.toString());
      }
    });
    localStorage.setItem('agreyflix_cleared_notification_ids', JSON.stringify(clearedIds));
    localStorage.setItem('agreyflix_local_notifications', JSON.stringify([]));

    setNotifications([]);
    window.dispatchEvent(new Event('newNotification'));
  };

  // Admin: trigger Serra AI notification generation
  const handleAiGenerateNotification = async () => {
    if (!aiNotifTopic.trim() || isGeneratingAiNotif) return;
    setIsGeneratingAiNotif(true);
    setAiNotifStatus('Connecting to Serra brain...');

    let stylePrompt = "";
    if (aiNotifStyle === 'cinematic') {
      stylePrompt = `Create an extremely hyped cinematic release notice for "${aiNotifTopic}". Use dramatic Hollywood trailer tone with emojis.`;
    } else if (aiNotifStyle === 'swahili') {
      stylePrompt = `Create a Swahili translated dub release notice for "${aiNotifTopic}". Explain the Swahili dub quality and include a brief translation teaser in Swahili with emojis.`;
    } else if (aiNotifStyle === 'cyberpunk') {
      stylePrompt = `Create a futuristic cyberpunk system transmission alert about "${aiNotifTopic}". Use sci-fi terminal operator terminology and emojis.`;
    } else {
      stylePrompt = `Create a curated premium weekly recommendation for "${aiNotifTopic}", highlighting why this is a must-watch choice with emojis.`;
    }

    const prompt = `${stylePrompt}
Output your result strictly as a valid JSON object matching this schema so that I can parse it programmatically:
{
  "title": "Short Title with Emojis",
  "body": "Beautiful notification text."
}`;

    try {
      const response = await fetch('/api/admin/serra/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          context: { targetMovie: aiNotifTopic }
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      let parsed = { title: `New Recommendation! 🎬`, body: `Watch "${aiNotifTopic}" now streaming on AgreyFlix!` };
      try {
        const text = data.text;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          parsed.body = text;
        }
      } catch (e) {
        parsed.body = data.text;
      }

      // If user is admin, broadcast globally!
      if (profile?.isAdmin) {
        await supabaseService.sendNotification(parsed.title, parsed.body, 'update', 'all');
        setAiNotifStatus('Broadcasted across the system successfully! ✓');
      } else {
        const localNotifs = JSON.parse(localStorage.getItem('agreyflix_local_notifications') || '[]');
        const newNotif = {
          id: 'local_' + Date.now(),
          title: parsed.title,
          message: parsed.body,
          type: 'update',
          created_at: new Date().toISOString()
        };
        localStorage.setItem('agreyflix_local_notifications', JSON.stringify([newNotif, ...localNotifs]));
        setAiNotifStatus('Added locally into your notices! ✓');
      }
      
      setAiNotifTopic('');
      loadNotifications();
    } catch (err) {
      setAiNotifStatus('Failed: ' + err.message);
    } finally {
      setIsGeneratingAiNotif(false);
      setTimeout(() => setAiNotifStatus(''), 5000);
    }
  };

  const getNotifIcon = (type) => {
    if (type === 'alert') return <FaExclamationCircle className="text-red-500 text-lg shrink-0" />;
    if (type === 'update') return <FaCheckCircle className="text-emerald-500 text-lg shrink-0" />;
    return <FaInfoCircle className="text-blue-500 text-lg shrink-0" />;
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 px-6 py-12 md:px-12 lg:px-24">
      <Helmet>
        <title>My Notifications | AgreyFlix</title>
        <meta name="description" content="View system announcements, movie updates, and Swahili translated releases on AgreyFlix." />
      </Helmet>

      {/* Back Button & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 pb-6 border-b border-white/5">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/home')}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            title="Go Back"
          >
            <FaArrowLeft />
          </button>
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
              <FaBell className="text-red-500 animate-pulse" /> Notifications
            </h1>
            <p className="text-xs text-zinc-500 font-semibold mt-1">Stay updated with release schedules and platform alerts</p>
          </div>
        </div>

        {notifications.length > 0 && (
          <button
            onClick={handleClearAll}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-red-600/10 hover:bg-red-600 hover:text-white text-red-500 border border-red-500/10 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer self-start sm:self-auto"
          >
            <FaTrashAlt size={12} /> Clear All Notices
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Notifications List (Spans 2 columns on desktop) */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-24 bg-zinc-950/40 border border-white/5 rounded-3xl p-8">
              <FaBell className="text-zinc-800 text-6xl mx-auto mb-4 animate-pulse" />
              <h3 className="text-lg font-bold text-white mb-1">No Notifications</h3>
              <p className="text-zinc-500 text-sm max-w-sm mx-auto">You are completely up to date! As soon as new films, series or Swahili dubs release, they will show here.</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {notifications.map((notif) => (
                <motion.div
                  key={notif.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  className="p-5 bg-zinc-950/80 border border-white/5 hover:border-white/10 rounded-2xl hover:bg-zinc-900/30 transition-all flex justify-between gap-4 items-start group"
                >
                  <div className="flex gap-4 min-w-0">
                    <div className="mt-1">{getNotifIcon(notif.type)}</div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-white mb-1.5 flex items-center gap-2">
                        {notif.title}
                      </h4>
                      <p className="text-zinc-400 text-xs leading-relaxed mb-3 whitespace-pre-wrap">{notif.message}</p>
                      <span className="text-[10px] font-mono text-zinc-600 block">
                        {new Date(notif.created_at).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleClearSingle(notif.id)}
                    className="p-2 bg-white/5 hover:bg-red-600/10 text-zinc-500 hover:text-red-400 rounded-xl transition-all cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="Delete notice"
                  >
                    <FaTrash size={12} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Serra AI Notifier Control Panel (Visible ONLY to Admins) */}
        {profile?.isAdmin && (
          <div className="lg:col-span-1 bg-zinc-950 border border-white/5 p-6 rounded-3xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-white/5">
              <FaMagic className="text-red-500 animate-pulse" />
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-200">Serra AI Notifier</h3>
                <p className="text-[10px] text-zinc-500 font-bold mt-0.5">Admin Broadcast Console</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-black uppercase text-zinc-500 block mb-1.5">Alert Style</label>
                <select
                  value={aiNotifStyle}
                  onChange={(e) => setAiNotifStyle(e.target.value)}
                  className="w-full bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-zinc-300 font-bold focus:outline-none focus:border-red-500 transition-all outline-none cursor-pointer"
                >
                  <option value="cinematic">Cinematic Hype 🎬</option>
                  <option value="swahili">Swahili Dub Tip 🗣️</option>
                  <option value="cyberpunk">Cyberpunk Alert ⚡</option>
                  <option value="recommendation">Curated Highlights 🍿</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] font-black uppercase text-zinc-500 block mb-1.5">Subject / Movie</label>
                <input
                  type="text"
                  placeholder="E.g. Squid Game, Gladiator II"
                  value={aiNotifTopic}
                  onChange={(e) => setAiNotifTopic(e.target.value)}
                  className="w-full bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-red-500 transition-all placeholder:text-zinc-600 outline-none"
                />
              </div>

              <button
                onClick={handleAiGenerateNotification}
                disabled={isGeneratingAiNotif || !aiNotifTopic.trim()}
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-black text-xs tracking-wider uppercase rounded-xl transition-all shadow-lg shadow-red-600/10 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
              >
                {isGeneratingAiNotif ? 'Generating...' : 'Generate via Serra AI'}
              </button>
              
              {aiNotifStatus && (
                <p className={`text-[10px] font-bold ${aiNotifStatus.includes('Failed') || aiNotifStatus.includes('error') ? 'text-red-500' : 'text-emerald-500'}`}>
                  {aiNotifStatus}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
