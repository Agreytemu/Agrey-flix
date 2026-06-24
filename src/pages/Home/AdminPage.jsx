import React, { useState, useEffect } from 'react';
import { useProfile } from '../../context/ProfileContext';
import { supabaseService } from '../../utils/supabaseService';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaShieldAlt, FaBell, FaUsers, FaTrash, FaPlus, FaCheck, FaTimes, FaExclamationTriangle, FaInfoCircle, FaHome } from 'react-icons/fa';

export default function AdminPage() {
  const { profile, loading: profileLoading } = useProfile();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('notifications'); // 'notifications' | 'users' | 'stats'
  
  // State for Notifications Tab
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newType, setNewType] = useState('system'); // system, alert, update
  const [notifSuccess, setNotifSuccess] = useState('');
  const [notifError, setNotifError] = useState('');

  // State for Users Tab
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSuccess, setUserSuccess] = useState('');
  const [userError, setUserError] = useState('');

  // Authentication check: redirect non-admins
  useEffect(() => {
    if (!profileLoading) {
      if (!profile || !profile.isAdmin) {
        navigate('/home');
      }
    }
  }, [profile, profileLoading, navigate]);

  // Load notifications
  const loadNotifications = async () => {
    setNotifLoading(true);
    try {
      const data = await supabaseService.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error(err);
      setNotifError('Failed to load notifications');
    } finally {
      setNotifLoading(false);
    }
  };

  // Load users
  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const data = await supabaseService.getAllProfiles();
      setUsers(data);
    } catch (err) {
      console.error(err);
      setUserError('Failed to load user profiles');
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    if (profile && profile.isAdmin) {
      loadNotifications();
      loadUsers();
    }
  }, [profile]);

  // Handle Send Notification
  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newMessage.trim()) {
      setNotifError('Please enter both a title and message.');
      return;
    }

    setNotifError('');
    setNotifSuccess('');

    try {
      await supabaseService.sendNotification(newTitle.trim(), newMessage.trim(), newType);
      setNotifSuccess('Notification broadcasted successfully!');
      setNewTitle('');
      setNewMessage('');
      setNewType('system');
      loadNotifications();
    } catch (err) {
      console.error(err);
      setNotifError('Failed to send notification. Verify database tables are created.');
    }
  };

  // Handle Delete Notification
  const handleDeleteNotification = async (id) => {
    if (!window.confirm('Are you sure you want to delete this notification?')) return;
    try {
      await supabaseService.deleteNotification(id);
      loadNotifications();
    } catch (err) {
      console.error(err);
      alert('Failed to delete notification.');
    }
  };

  // Handle Toggle Admin Status
  const handleToggleAdmin = async (userId, currentIsAdmin, email) => {
    // Prevent self-demotion
    if (userId === profile?.id || userId === profile?.uid) {
      alert('You cannot revoke your own admin rights.');
      return;
    }

    const newStatus = currentIsAdmin === 1 ? 0 : 1;
    const confirmMsg = newStatus === 1 
      ? `Promote ${email} to Administrator?` 
      : `Revoke Administrator privileges from ${email}?`;

    if (!window.confirm(confirmMsg)) return;

    setUserSuccess('');
    setUserError('');

    try {
      await supabaseService.updateUserAdminStatus(userId, newStatus === 1);
      setUserSuccess(`Successfully updated role for ${email}`);
      loadUsers();
    } catch (err) {
      console.error(err);
      setUserError('Failed to update user administrative status.');
    }
  };

  if (profileLoading) {
    return (
      <div className="flex bg-[#050505] min-h-screen text-white items-center justify-center font-bold">
        Loading administrative session...
      </div>
    );
  }

  if (!profile || !profile.isAdmin) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="p-4 sm:p-8 md:p-12 min-h-screen bg-[#070707] text-white overflow-x-hidden pt-20 md:pt-10">
      
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10 pb-6 border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 shadow-xl shadow-red-500/20 flex items-center justify-center shrink-0">
            <FaShieldAlt className="text-white text-2xl" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-2">
              Admin Portal <span className="text-xs bg-red-600 px-2 py-1 rounded-md tracking-widest font-black uppercase">LIVE</span>
            </h1>
            <p className="text-gray-500 text-sm font-semibold">
              Manage system notices, notifications, and authenticate users as admins.
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/home')}
          className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-white/5 py-2.5 px-5 rounded-xl font-bold text-xs tracking-wider transition-all"
        >
          <FaHome /> Back to Home
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 mb-8 gap-2">
        <button
          onClick={() => setActiveTab('notifications')}
          className={`py-3 px-6 font-extrabold text-sm tracking-wider uppercase border-b-2 transition-all flex items-center gap-2.5 ${
            activeTab === 'notifications'
              ? 'border-red-600 text-white bg-white/5 rounded-t-xl'
              : 'border-transparent text-gray-500 hover:text-white'
          }`}
        >
          <FaBell /> Notifications Setup
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`py-3 px-6 font-extrabold text-sm tracking-wider uppercase border-b-2 transition-all flex items-center gap-2.5 ${
            activeTab === 'users'
              ? 'border-red-600 text-white bg-white/5 rounded-t-xl'
              : 'border-transparent text-gray-500 hover:text-white'
          }`}
        >
          <FaUsers /> User Profiles
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`py-3 px-6 font-extrabold text-sm tracking-wider uppercase border-b-2 transition-all flex items-center gap-2.5 ${
            activeTab === 'stats'
              ? 'border-red-600 text-white bg-white/5 rounded-t-xl'
              : 'border-transparent text-gray-500 hover:text-white'
          }`}
        >
          <FaInfoCircle /> App Diagnostics
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        <AnimatePresence mode="wait">
          
          {/* TAB 1: NOTIFICATIONS SETUP */}
          {activeTab === 'notifications' && (
            <motion.div
              key="notifications"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Form panel */}
              <div className="lg:col-span-1 bg-[#0D0D0D] border border-white/5 p-6 rounded-3xl h-fit shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <FaPlus className="text-red-500 text-sm" /> Create Notification
                </h3>

                {notifSuccess && (
                  <div className="mb-4 bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <FaCheck className="shrink-0" /> {notifSuccess}
                  </div>
                )}
                {notifError && (
                  <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <FaExclamationTriangle className="shrink-0" /> {notifError}
                  </div>
                )}

                <form onSubmit={handleSendNotification} className="flex flex-col gap-5">
                  <div>
                    <label className="block text-xs font-black uppercase text-zinc-500 tracking-widest mb-2">Notice Title</label>
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="e.g. Server Maintenance Notice"
                      className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-red-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase text-zinc-500 tracking-widest mb-2">Notice Message</label>
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Enter the update message detailed description..."
                      rows={4}
                      className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-red-600 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase text-zinc-500 tracking-widest mb-2">Notice Type / Visual Badge</label>
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value)}
                      className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-white text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-red-600"
                    >
                      <option value="system">System (Blue Info Banner)</option>
                      <option value="update">Platform Update (Green Update Banner)</option>
                      <option value="alert">Critical Alert (Red Warning Banner)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 py-3.5 px-6 rounded-xl font-black text-xs tracking-widest uppercase transition-all shadow-lg active:scale-95 text-white"
                  >
                    Broadcast System-wide
                  </button>
                </form>
              </div>

              {/* Broadcasts History */}
              <div className="lg:col-span-2 bg-[#0D0D0D] border border-white/5 p-6 rounded-3xl shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center justify-between">
                  <span>Active Announcements ({notifications.length})</span>
                  <button onClick={loadNotifications} className="text-xs text-red-500 font-extrabold uppercase hover:underline">
                    Refresh List
                  </button>
                </h3>

                {notifLoading ? (
                  <div className="text-center py-20 text-gray-500 text-sm font-semibold animate-pulse">
                    Retrieving previous system broadcasts...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-20 bg-black/10 border border-dashed border-white/5 rounded-2xl">
                    <FaBell className="text-gray-700 text-4xl mx-auto mb-4" />
                    <p className="text-gray-500 text-sm font-semibold">No active announcements sent yet.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 max-h-[550px] overflow-y-auto hide-scrollbar pr-1">
                    {notifications.map((notif) => {
                      const badgeColors = 
                        notif.type === 'alert' ? 'bg-red-950/40 text-red-400 border border-red-800/30' :
                        notif.type === 'update' ? 'bg-green-950/40 text-green-400 border border-green-800/30' :
                        'bg-blue-950/40 text-blue-400 border border-blue-800/30';
                      
                      return (
                        <div 
                          key={notif.id}
                          className="flex items-start justify-between p-4.5 bg-black/40 border border-white/5 rounded-2xl hover:border-white/10 transition-all group"
                        >
                          <div className="flex gap-4">
                            <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full h-fit mt-1 shrink-0 ${badgeColors}`}>
                              {notif.type || 'system'}
                            </span>
                            <div>
                              <h4 className="text-sm font-bold text-white mb-1">{notif.title}</h4>
                              <p className="text-gray-400 text-xs leading-relaxed mb-2 pr-4">{notif.message}</p>
                              <span className="text-[10px] font-mono text-zinc-600">
                                {new Date(notif.created_at).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteNotification(notif.id)}
                            className="text-zinc-600 hover:text-red-500 p-2 rounded-lg hover:bg-red-500/10 transition-all opacity-100 sm:opacity-0 group-hover:opacity-100"
                            title="Remove notification"
                          >
                            <FaTrash size={13} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 2: USER PROFILES */}
          {activeTab === 'users' && (
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="bg-[#0D0D0D] border border-white/5 p-6 rounded-3xl shadow-2xl"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">User Directory</h3>
                  <p className="text-gray-500 text-xs font-semibold">
                    Review authenticated users. Manage access control and database roles (`is_admin=1`).
                  </p>
                </div>
                <button onClick={loadUsers} className="text-xs bg-zinc-900 hover:bg-zinc-800 text-white font-extrabold uppercase py-2 px-4 border border-white/5 rounded-xl transition-colors">
                  Refresh Profiles
                </button>
              </div>

              {userSuccess && (
                <div className="mb-4 bg-green-500/10 border border-green-500/20 text-green-400 p-3 rounded-xl text-xs font-semibold">
                  {userSuccess}
                </div>
              )}
              {userError && (
                <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs font-semibold">
                  {userError}
                </div>
              )}

              {usersLoading ? (
                <div className="text-center py-20 text-gray-500 text-sm font-semibold animate-pulse">
                  Querying authenticated profiles database...
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-400">
                    <thead>
                      <tr className="border-b border-white/5 text-[10px] uppercase font-black tracking-widest text-zinc-500">
                        <th className="py-4 px-3">Profile ID</th>
                        <th className="py-4 px-3">Display Name</th>
                        <th className="py-4 px-3">Email Address</th>
                        <th className="py-4 px-3 text-center">Watchlist Count</th>
                        <th className="py-4 px-3">System Role</th>
                        <th className="py-4 px-3 text-right">Administrative Toggle</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {users.map((u) => {
                        const isSelf = u.id === profile?.id || u.id === profile?.uid;
                        return (
                          <tr key={u.id} className="hover:bg-white/[0.01] transition-colors">
                            <td className="py-4 px-3 font-mono text-[10px] text-zinc-600">{u.id}</td>
                            <td className="py-4 px-3 text-white font-bold">{u.display_name}</td>
                            <td className="py-4 px-3 font-semibold">{u.email}</td>
                            <td className="py-4 px-3 text-center font-bold font-mono text-xs">
                              {u.watchlist ? (Array.isArray(u.watchlist) ? u.watchlist.length : Object.keys(u.watchlist).length) : 0}
                            </td>
                            <td className="py-4 px-3">
                              {u.is_admin === 1 ? (
                                <span className="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">
                                  Administrator
                                </span>
                              ) : (
                                <span className="bg-zinc-900 border border-white/5 text-zinc-500 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">
                                  Standard User
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-3 text-right">
                              {isSelf ? (
                                <span className="text-xs text-zinc-600 italic font-semibold">Currently Active</span>
                              ) : (
                                <button
                                  onClick={() => handleToggleAdmin(u.id, u.is_admin, u.email)}
                                  className={`text-xs font-black tracking-wider uppercase py-1.5 px-4.5 rounded-xl border transition-all active:scale-95 ${
                                    u.is_admin === 1
                                      ? 'bg-red-950/20 border-red-900/50 hover:bg-red-950/40 text-red-400'
                                      : 'bg-zinc-900 border-white/5 hover:bg-zinc-800 text-zinc-300'
                                  }`}
                                >
                                  {u.is_admin === 1 ? 'DEMOTE' : 'MAKE ADMIN'}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 3: APP DIAGNOSTICS */}
          {activeTab === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              <div className="bg-[#0D0D0D] border border-white/5 p-6 rounded-3xl shadow-lg">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-zinc-500 text-xs font-black uppercase tracking-widest">Profiles Synced</span>
                  <FaUsers className="text-red-500 text-lg" />
                </div>
                <div className="text-3xl font-black text-white">{users.length}</div>
                <p className="text-zinc-600 text-xs mt-1.5 font-semibold">Total authenticated profile records in db.</p>
              </div>

              <div className="bg-[#0D0D0D] border border-white/5 p-6 rounded-3xl shadow-lg">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-zinc-500 text-xs font-black uppercase tracking-widest">Active Notifications</span>
                  <FaBell className="text-blue-500 text-lg" />
                </div>
                <div className="text-3xl font-black text-white">{notifications.length}</div>
                <p className="text-zinc-600 text-xs mt-1.5 font-semibold">Broadcasts active system-wide.</p>
              </div>

              <div className="bg-[#0D0D0D] border border-white/5 p-6 rounded-3xl shadow-lg">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-zinc-500 text-xs font-black uppercase tracking-widest">Admins Count</span>
                  <FaShieldAlt className="text-green-500 text-lg" />
                </div>
                <div className="text-3xl font-black text-white">
                  {users.filter(u => u.is_admin === 1).length}
                </div>
                <p className="text-zinc-600 text-xs mt-1.5 font-semibold">Users with administrative privileges.</p>
              </div>

              <div className="md:col-span-3 bg-[#0D0D0D] border border-white/5 p-6 rounded-3xl shadow-lg mt-2">
                <h3 className="text-base font-bold text-white mb-4">Database SQL Configuration Instructions</h3>
                <div className="bg-black/50 border border-white/5 p-4 rounded-xl font-mono text-xs text-zinc-400 overflow-x-auto leading-relaxed">
                  <p className="text-zinc-500 mb-2">// Run this in your Supabase SQL editor to enable Admin Roles & Announcements:</p>
                  <pre className="text-red-400 font-semibold select-all">
{`-- 1. Add admin state field to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin INTEGER DEFAULT 0;

-- 2. Create the system-wide announcements table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'system',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);`}
                  </pre>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

    </div>
  );
}
