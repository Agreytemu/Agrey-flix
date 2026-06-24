import { createClient } from '@supabase/supabase-js';

// Retrieve environment variables safely
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Detect if Supabase is properly configured with real credentials
export const isConfigured = 
  supabaseUrl && 
  supabaseUrl !== 'dummy' && 
  !supabaseUrl.includes('placeholder') &&
  supabaseAnonKey && 
  supabaseAnonKey !== 'dummy' &&
  !supabaseAnonKey.includes('placeholder');

// Initialize the real Supabase client only if configured, otherwise use null
export const supabase = isConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    })
  : null;

// Registry for auth state listeners (both real and fallback)
const listeners = new Set();
let currentSessionUser = null;

// Helper to notify all registered listeners of an auth state change
const notifyListeners = (user) => {
  currentSessionUser = user;
  listeners.forEach(cb => {
    try { cb(user); } catch (e) { console.error('Auth listener callback failed:', e); }
  });
};

// ==========================================
// MOCK FALLBACK IMPLEMENTATION
// ==========================================
const getMockUsers = () => {
  try {
    const data = localStorage.getItem('weflix_mock_users');
    return data ? JSON.parse(data) : {};
  } catch (e) {
    return {};
  }
};

const saveMockUsers = (users) => {
  try {
    localStorage.setItem('weflix_mock_users', JSON.stringify(users));
  } catch (e) {}
};

const getMockSession = () => {
  try {
    const data = localStorage.getItem('weflix_mock_session');
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
};

const saveMockSession = (user) => {
  try {
    if (user) {
      localStorage.setItem('weflix_mock_session', JSON.stringify(user));
    } else {
      localStorage.removeItem('weflix_mock_session');
    }
  } catch (e) {}
};

// Initialize fallback state from localStorage
if (!isConfigured) {
  const session = getMockSession();
  if (session) {
    currentSessionUser = session;
  }
}

// Subscribe to real Supabase auth changes if configured
if (isConfigured && supabase) {
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      const user = session.user;
      
      // 1. Immediately notify listeners with the session user metadata (instant UI load!)
      const formattedUser = {
        uid: user.id,
        id: user.id,
        displayName: user.user_metadata?.displayName || user.user_metadata?.full_name || 'Guest User',
        email: user.email,
        photoURL: user.user_metadata?.avatar_url || null,
        emailVerified: !!user.email_confirmed_at,
        watchlist: user.user_metadata?.watchlist || [],
        continueWatching: user.user_metadata?.continueWatching || [],
        preferencesSet: user.user_metadata?.preferencesSet || false,
        preferences: user.user_metadata?.preferences || {},
        isAdmin: user.email?.toLowerCase() === 'webbrowsera@gmail.com' || user.user_metadata?.is_admin === 1 || user.user_metadata?.isAdmin === true,
        created_at: user.created_at || user.user_metadata?.created_at || new Date().toISOString()
      };
      
      currentSessionUser = formattedUser;
      notifyListeners(formattedUser);

      // 2. Load the additional database profiles table records asynchronously in the background
      supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
        .then(({ data, error }) => {
          if (data && !error) {
            const dbProfile = data;
            const updatedUser = {
              uid: user.id,
              id: user.id,
              displayName: dbProfile.display_name || user.user_metadata?.displayName || user.user_metadata?.full_name || 'Guest User',
              email: user.email,
              photoURL: dbProfile.photo_url || user.user_metadata?.avatar_url || null,
              emailVerified: !!user.email_confirmed_at,
              watchlist: dbProfile.watchlist || user.user_metadata?.watchlist || [],
              continueWatching: dbProfile.continue_watching || user.user_metadata?.continueWatching || [],
              preferencesSet: dbProfile.preferences_set || user.user_metadata?.preferencesSet || false,
              preferences: dbProfile.preferences || user.user_metadata?.preferences || {},
              isAdmin: dbProfile.is_admin === 1 || dbProfile.is_admin === true || dbProfile.is_admin === '1' || user.email?.toLowerCase() === 'webbrowsera@gmail.com' || user.user_metadata?.is_admin === 1 || user.user_metadata?.isAdmin === true,
              created_at: dbProfile.created_at || user.created_at || user.user_metadata?.created_at || new Date().toISOString()
            };
            currentSessionUser = updatedUser;
            notifyListeners(updatedUser);
          }
        })
        .catch(e => {
          console.warn('Could not asynchronously load profile from profiles table:', e);
        });
    } else {
      currentSessionUser = null;
      notifyListeners(null);
    }
  });
}

// ==========================================
// EXPOSED SERVICE API
// ==========================================
export const supabaseService = {
  isConfigured,

  /**
   * Register a callback for authentication state changes.
   */
  onAuthStateChanged: (callback) => {
    listeners.add(callback);
    // Fire initially with the current user state
    callback(currentSessionUser);

    return () => {
      listeners.delete(callback);
    };
  },

  /**
   * Get the currently logged-in user.
   */
  getCurrentUser: () => currentSessionUser,

  /**
   * Register a new user with email, password, and full name.
   */
  signUp: async (email, password, name) => {
    if (isConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            displayName: name,
            full_name: name,
            watchlist: [],
            continueWatching: [],
            preferencesSet: false,
            preferences: {}
          },
          emailRedirectTo: window.location.origin + '/verify-email'
        }
      });

      if (error) throw error;
      
      // Explicitly insert into profiles table in case postgres trigger hasn't run (run asynchronously, non-blocking)
      if (data?.user) {
        supabase.from('profiles').insert({
          id: data.user.id,
          email: email,
          display_name: name,
          watchlist: [],
          continue_watching: [],
          preferences_set: false,
          preferences: {}
        }).then(({ error: dbErr }) => {
          if (dbErr) {
            console.warn('Initial profiles table insert info (safe to ignore if trigger handled it):', dbErr);
          }
        }).catch(err => {
          console.warn('Asynchronous profiles table insert failed:', err);
        });
      }

      // If email verification is enabled by default in Supabase, we might not get a session immediately.
      // We will simulate the signout/verification flow.
      if (data?.user && !data.session) {
        return { user: data.user, sessionRequired: true };
      }

      return { user: data.user, sessionRequired: false };
    } else {
      // Mock flow
      const users = getMockUsers();
      if (users[email.toLowerCase()]) {
        throw new Error('An account with this email already exists.');
      }

      const mockUid = 'mock_user_' + Math.random().toString(36).substring(2, 11);
      const newUser = {
        uid: mockUid,
        id: mockUid,
        displayName: name,
        email: email,
        photoURL: null,
        emailVerified: true, // Auto-verify mock users for instant local onboarding
        watchlist: [],
        continueWatching: [],
        preferencesSet: false,
        preferences: {},
        isAdmin: email.toLowerCase() === 'webbrowsera@gmail.com',
        created_at: new Date().toISOString()
      };

      users[email.toLowerCase()] = { ...newUser, password };
      saveMockUsers(users);

      return { user: newUser, sessionRequired: false };
    }
  },

  /**
   * Log in an existing user with email and password.
   */
  signIn: async (email, password) => {
    if (isConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      const user = data.user;

      // 1. Immediately notify listeners with the session user metadata (instant UI load!)
      const formattedUser = {
        uid: user.id,
        id: user.id,
        displayName: user.user_metadata?.displayName || user.user_metadata?.full_name || 'Guest User',
        email: user.email,
        photoURL: user.user_metadata?.avatar_url || null,
        emailVerified: !!user.email_confirmed_at,
        watchlist: user.user_metadata?.watchlist || [],
        continueWatching: user.user_metadata?.continueWatching || [],
        preferencesSet: user.user_metadata?.preferencesSet || false,
        preferences: user.user_metadata?.preferences || {},
        isAdmin: user.email?.toLowerCase() === 'webbrowsera@gmail.com' || user.user_metadata?.is_admin === 1 || user.user_metadata?.isAdmin === true,
        created_at: user.created_at || user.user_metadata?.created_at || new Date().toISOString()
      };

      currentSessionUser = formattedUser;
      notifyListeners(formattedUser);

      // 2. Load the additional database profiles table records asynchronously in the background
      supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
        .then(({ data: dbProfile, error: dbErr }) => {
          if (dbProfile && !dbErr) {
            const updatedUser = {
              uid: user.id,
              id: user.id,
              displayName: dbProfile.display_name || user.user_metadata?.displayName || user.user_metadata?.full_name || 'Guest User',
              email: user.email,
              photoURL: dbProfile.photo_url || user.user_metadata?.avatar_url || null,
              emailVerified: !!user.email_confirmed_at,
              watchlist: dbProfile.watchlist || user.user_metadata?.watchlist || [],
              continueWatching: dbProfile.continue_watching || user.user_metadata?.continue_watching || [],
              preferencesSet: dbProfile.preferences_set || user.user_metadata?.preferencesSet || false,
              preferences: dbProfile.preferences || user.user_metadata?.preferences || {},
              isAdmin: dbProfile.is_admin === 1 || dbProfile.is_admin === true || dbProfile.is_admin === '1' || user.email?.toLowerCase() === 'webbrowsera@gmail.com' || user.user_metadata?.is_admin === 1 || user.user_metadata?.isAdmin === true,
              created_at: dbProfile.created_at || user.created_at || user.user_metadata?.created_at || new Date().toISOString()
            };
            currentSessionUser = updatedUser;
            notifyListeners(updatedUser);
          }
        })
        .catch(e => {
          console.warn('Could not asynchronously load profile on login:', e);
        });

      return formattedUser;
    } else {
      // Mock flow
      const users = getMockUsers();
      const matchedUser = users[email.toLowerCase()];

      if (!matchedUser || matchedUser.password !== password) {
        throw new Error('Email or password is incorrect.');
      }

      const { password: _, ...safeUser } = matchedUser;
      if (safeUser.email?.toLowerCase() === 'webbrowsera@gmail.com') {
        safeUser.isAdmin = true;
      }
      if (!safeUser.created_at) {
        // Fallback older creation date for existing accounts
        safeUser.created_at = '2026-05-12T14:24:00Z';
      }
      currentSessionUser = safeUser;
      saveMockSession(safeUser);
      notifyListeners(safeUser);

      return safeUser;
    }
  },

  /**
   * Implements Google OAuth provider sign-in.
   */
  signInWithGoogle: async () => {
    if (isConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/home'
        }
      });
      if (error) throw error;
      return data;
    } else {
      // Mock sign-in with Google
      const mockUid = 'mock_google_user_' + Math.random().toString(36).substring(2, 11);
      const mockGoogleUser = {
        uid: mockUid,
        id: mockUid,
        displayName: 'Google Partner',
        email: 'google.partner@example.com',
        photoURL: 'https://placehold.co/100x100/ea4335/ffffff?text=G',
        emailVerified: true,
        watchlist: [],
        continueWatching: []
      };

      saveMockSession(mockGoogleUser);
      notifyListeners(mockGoogleUser);
      return mockGoogleUser;
    }
  },

  /**
   * Sign out the currently authenticated user.
   */
  signOut: async () => {
    if (isConfigured && supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } else {
      saveMockSession(null);
    }
    notifyListeners(null);
  },

  /**
   * Update general profile fields (e.g. displayName).
   */
  updateProfile: async (updates) => {
    if (!currentSessionUser) return;

    const mergedUser = { ...currentSessionUser, ...updates };

    if (isConfigured && supabase) {
      // 1. Update auth user metadata
      const { data, error } = await supabase.auth.updateUser({
        data: {
          displayName: mergedUser.displayName,
          photoURL: mergedUser.photoURL,
          preferencesSet: mergedUser.preferencesSet,
          preferences: mergedUser.preferences,
          ...updates
        }
      });
      if (error) throw error;

      // 2. Update profiles table
      try {
        const { error: dbError } = await supabase
          .from('profiles')
          .update({
            display_name: mergedUser.displayName,
            photo_url: mergedUser.photoURL,
            preferences_set: mergedUser.preferencesSet,
            preferences: mergedUser.preferences
          })
          .eq('id', mergedUser.id);
        if (dbError) {
          console.warn('Failed to update profiles table:', dbError);
        }
      } catch (e) {
        console.warn('Failed to sync profile update with database profiles table:', e);
      }
    } else {
      // Save mock state
      saveMockSession(mergedUser);
      const users = getMockUsers();
      const emailKey = mergedUser.email.toLowerCase();
      if (users[emailKey]) {
        users[emailKey] = { ...users[emailKey], ...mergedUser };
        saveMockUsers(users);
      }
    }
    
    notifyListeners(mergedUser);
  },

  /**
   * Sync and save the Watchlist array.
   */
  updateWatchlist: async (watchlist) => {
    if (!currentSessionUser) return;
    const mergedUser = { ...currentSessionUser, watchlist };

    if (isConfigured && supabase) {
      // 1. Update auth user metadata
      const { error } = await supabase.auth.updateUser({
        data: { watchlist }
      });
      if (error) {
        console.error('Failed to sync watchlist with Supabase:', error);
      }

      // 2. Update profiles table
      try {
        const { error: dbError } = await supabase
          .from('profiles')
          .update({ watchlist })
          .eq('id', mergedUser.id);
        if (dbError) {
          console.warn('Failed to update watchlist in profiles table:', dbError);
        }
      } catch (e) {
        console.warn('Failed to sync watchlist with database profiles table:', e);
      }
    } else {
      saveMockSession(mergedUser);
      const users = getMockUsers();
      const emailKey = mergedUser.email.toLowerCase();
      if (users[emailKey]) {
        users[emailKey].watchlist = watchlist;
        saveMockUsers(users);
      }
    }

    notifyListeners(mergedUser);
  },

  /**
   * Sync and save Continue Watching progress.
   */
  updateContinueWatching: async (continueWatching) => {
    if (!currentSessionUser) return;
    const mergedUser = { ...currentSessionUser, continueWatching };

    if (isConfigured && supabase) {
      // 1. Update auth user metadata
      const { error } = await supabase.auth.updateUser({
        data: { continueWatching }
      });
      if (error) {
        console.error('Failed to sync continue watching with Supabase:', error);
      }

      // 2. Update profiles table
      try {
        const { error: dbError } = await supabase
          .from('profiles')
          .update({ continue_watching: continueWatching })
          .eq('id', mergedUser.id);
        if (dbError) {
          console.warn('Failed to update continue_watching in profiles table:', dbError);
        }
      } catch (e) {
        console.warn('Failed to sync continue watching with database profiles table:', e);
      }
    } else {
      saveMockSession(mergedUser);
      const users = getMockUsers();
      const emailKey = mergedUser.email.toLowerCase();
      if (users[emailKey]) {
        users[emailKey].continueWatching = continueWatching;
        saveMockUsers(users);
      }
    }

    notifyListeners(mergedUser);
  },

  /**
   * Sends password reset email.
   */
  sendPasswordResetEmail: async (email) => {
    if (isConfigured && supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password'
      });
      if (error) throw error;
    } else {
      // Mock success response
      console.log(`[Mock Reset] Password reset instructions sent to ${email}`);
    }
  },

  /**
   * Resets password of authenticated user.
   */
  updatePassword: async (newPassword) => {
    if (isConfigured && supabase) {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (error) throw error;
    } else {
      if (currentSessionUser) {
        const users = getMockUsers();
        const emailKey = currentSessionUser.email.toLowerCase();
        if (users[emailKey]) {
          users[emailKey].password = newPassword;
          saveMockUsers(users);
        }
      }
    }
  },

  /**
   * Fetch all system notifications.
   */
  getNotifications: async () => {
    if (isConfigured && supabase) {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Failed to fetch notifications from Supabase:', error);
        return [];
      }
      return data || [];
    } else {
      try {
        const saved = localStorage.getItem('agreyflix_notifications');
        return saved ? JSON.parse(saved) : [
          {
            id: 'notif_welcome',
            title: 'Welcome to AgreyFlix!',
            message: 'Stream your favorite movies, TV shows, and series in crisp HD quality with blazing fast servers.',
            type: 'system',
            created_at: new Date(Date.now() - 3600000).toISOString()
          }
        ];
      } catch (e) {
        console.error('Failed to fetch mock notifications:', e);
        return [];
      }
    }
  },

  /**
   * Send a new notification (Admin only).
   */
  sendNotification: async (title, message, type = 'system') => {
    if (isConfigured && supabase) {
      const { data, error } = await supabase
        .from('notifications')
        .insert([{ title, message, type }])
        .select();
      if (error) throw error;
      return data?.[0];
    } else {
      try {
        const saved = localStorage.getItem('agreyflix_notifications');
        const list = saved ? JSON.parse(saved) : [
          {
            id: 'notif_welcome',
            title: 'Welcome to AgreyFlix!',
            message: 'Stream your favorite movies, TV shows, and series in crisp HD quality with blazing fast servers.',
            type: 'system',
            created_at: new Date(Date.now() - 3600000).toISOString()
          }
        ];
        const newNotif = {
          id: 'notif_' + Math.random().toString(36).substring(2, 11),
          title,
          message,
          type,
          created_at: new Date().toISOString()
        };
        const updated = [newNotif, ...list];
        localStorage.setItem('agreyflix_notifications', JSON.stringify(updated));
        window.dispatchEvent(new Event('newNotification'));
        return newNotif;
      } catch (e) {
        console.error('Failed to save mock notification:', e);
        throw e;
      }
    }
  },

  /**
   * Delete a notification (Admin only).
   */
  deleteNotification: async (id) => {
    if (isConfigured && supabase) {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    } else {
      try {
        const saved = localStorage.getItem('agreyflix_notifications');
        const list = saved ? JSON.parse(saved) : [];
        const updated = list.filter(item => item.id !== id);
        localStorage.setItem('agreyflix_notifications', JSON.stringify(updated));
        window.dispatchEvent(new Event('newNotification'));
        return true;
      } catch (e) {
        console.error('Failed to delete mock notification:', e);
        throw e;
      }
    }
  },

  /**
   * Fetch all user profiles (Admin only).
   */
  getAllProfiles: async () => {
    if (isConfigured && supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Failed to fetch profiles from Supabase:', error);
        return [];
      }
      return data || [];
    } else {
      const users = getMockUsers();
      return Object.values(users).map(({ password, ...user }) => ({
        id: user.id || user.uid,
        email: user.email,
        display_name: user.displayName || user.email?.split('@')[0],
        watchlist: user.watchlist || [],
        continue_watching: user.continueWatching || [],
        is_admin: (user.isAdmin || user.email?.toLowerCase() === 'webbrowsera@gmail.com') ? 1 : 0,
        created_at: user.created_at || new Date().toISOString()
      }));
    }
  },

  /**
   * Update a user's admin status (Admin only).
   */
  updateUserAdminStatus: async (userId, isAdminValue) => {
    const is_admin = isAdminValue ? 1 : 0;
    if (isConfigured && supabase) {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin })
        .eq('id', userId);
      if (error) throw error;
      return true;
    } else {
      const users = getMockUsers();
      const userKey = Object.keys(users).find(
        key => users[key].id === userId || users[key].uid === userId
      );
      if (userKey) {
        users[userKey].isAdmin = !!isAdminValue;
        users[userKey].is_admin = is_admin;
        saveMockUsers(users);
        
        if (currentSessionUser && (currentSessionUser.id === userId || currentSessionUser.uid === userId)) {
          currentSessionUser.isAdmin = !!isAdminValue;
          currentSessionUser.is_admin = is_admin;
          saveMockSession(currentSessionUser);
          notifyListeners(currentSessionUser);
        }
        return true;
      }
      throw new Error('User not found');
    }
  }
};
