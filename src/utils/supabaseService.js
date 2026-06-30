import { createClient } from '@supabase/supabase-js';
import { sanitizeInput, logSecurityEvent, validatePassword } from './security';

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

/**
 * Enforces admin authorization. Throws an error if current session user is not an admin.
 */
export const verifyAdmin = () => {
  if (!currentSessionUser) {
    logSecurityEvent('FAILURE', 'Unauthorized administrative access attempt: No active session.');
    throw new Error('Authentication required. Access denied.');
  }
  const isAdmin = 
    currentSessionUser.email?.toLowerCase() === 'webbrowsera@gmail.com' ||
    currentSessionUser.is_admin === 1 ||
    currentSessionUser.is_admin === true ||
    currentSessionUser.isAdmin === true;
    
  if (!isAdmin) {
    logSecurityEvent('FAILURE', `Unauthorized administrative access attempt by: ${currentSessionUser.email}`);
    throw new Error('Administrator privileges required. Access denied.');
  }
};

// ==========================================
// MOCK FALLBACK IMPLEMENTATION
// ==========================================
const getMockUsers = () => {
  try {
    const data = localStorage.getItem('agreyflix_mock_users');
    return data ? JSON.parse(data) : {};
  } catch (e) {
    return {};
  }
};

const saveMockUsers = (users) => {
  try {
    localStorage.setItem('agreyflix_mock_users', JSON.stringify(users));
  } catch (e) {}
};

const getMockSession = () => {
  try {
    const data = localStorage.getItem('agreyflix_mock_session');
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
};

const saveMockSession = (user) => {
  try {
    if (user) {
      localStorage.setItem('agreyflix_mock_session', JSON.stringify(user));
    } else {
      localStorage.removeItem('agreyflix_mock_session');
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
            
            // Self-healing: if email is confirmed in Auth but not updated in public profile, update it silently
            const isEmailConfirmed = !!user.email_confirmed_at;
            if (isEmailConfirmed && !dbProfile.email_verified) {
              supabase
                .from('profiles')
                .update({ email_verified: true })
                .eq('id', user.id)
                .then(() => {})
                .catch(() => {});
            }

            const updatedUser = {
              uid: user.id,
              id: user.id,
              displayName: dbProfile.display_name || user.user_metadata?.displayName || user.user_metadata?.full_name || 'Guest User',
              email: user.email,
              photoURL: dbProfile.photo_url || user.user_metadata?.avatar_url || null,
              emailVerified: isEmailConfirmed,
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
          emailRedirectTo: 'https://agrey-flix.vercel.app/verify-email'
        }
      });

      if (error) throw error;

      // If email verification is enabled by default in Supabase, we might not get a session immediately.
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

      // Auto login mock user
      currentSessionUser = newUser;
      saveMockSession(newUser);
      notifyListeners(newUser);

      return { user: newUser, sessionRequired: false };
    }
  },

  /**
   * Check if a user with the given email address already exists.
   */
  checkEmailExists: async (email) => {
    if (isConfigured && supabase) {
      try {
        // Try RPC check first
        const { data, error } = await supabase.rpc('check_email_exists', { email_to_check: email.trim() });
        if (!error && typeof data === 'boolean') {
          return data;
        }

        // Fallback: query profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', email.trim().toLowerCase())
          .maybeSingle();
        return !!profile;
      } catch (err) {
        console.error('Error checking email exists:', err);
        return false;
      }
    } else {
      const users = getMockUsers();
      return !!users[email.trim().toLowerCase()];
    }
  },

  /**
   * Resends the verification email for signup.
   */
  resendVerificationEmail: async (email) => {
    if (isConfigured && supabase) {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
        options: {
          emailRedirectTo: 'https://agrey-flix.vercel.app/verify-email'
        }
      });
      if (error) throw error;
      return true;
    } else {
      console.log(`[Mock Resend] Resent verification email to ${email}`);
      return true;
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

    // Sanitize any string values inside updates to protect against XSS
    const sanitizedUpdates = {};
    for (const key in updates) {
      if (typeof updates[key] === 'string') {
        sanitizedUpdates[key] = sanitizeInput(updates[key]);
      } else {
        sanitizedUpdates[key] = updates[key];
      }
    }

    const mergedUser = { ...currentSessionUser, ...sanitizedUpdates };

    if (isConfigured && supabase) {
      // 1. Update auth user metadata
      const { data, error } = await supabase.auth.updateUser({
        data: {
          displayName: mergedUser.displayName,
          photoURL: mergedUser.photoURL,
          preferencesSet: mergedUser.preferencesSet,
          preferences: mergedUser.preferences,
          ...sanitizedUpdates
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
    if (!currentSessionUser) {
      const STORAGE_KEY = 'agreyflix_continue_watching_cache';
      localStorage.setItem(STORAGE_KEY, JSON.stringify(continueWatching));
      window.dispatchEvent(new Event('agreyflix_continue_watching_updated'));
      return;
    }
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
    window.dispatchEvent(new Event('agreyflix_continue_watching_updated'));
  },

  /**
   * Save or update a single Continue Watching item with progress and cache it.
   */
  saveContinueWatchingItem: async (item) => {
    const STORAGE_KEY = 'agreyflix_continue_watching_cache';
    let list = [];
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      try { list = JSON.parse(cached); } catch(e){}
    }

    // Filter out matches of current mediaId
    list = list.filter(x => String(x.mediaId) !== String(item.mediaId));

    // Ensure we keep existing updatedAt if new item doesn't have it, or set default progress if not defined
    const newItem = {
      mediaId: String(item.mediaId),
      type: item.type,
      title: item.title,
      subTitle: item.subTitle || '',
      slug: item.slug || String(item.mediaId),
      backdrop_path: item.backdrop_path || null,
      progress: typeof item.progress === 'number' ? item.progress : 10, // Start with 10% progress if not specified
      lastWatchedEpisode: item.lastWatchedEpisode || (item.type === 'tv' ? { season: Number(item.season || 1), episode: Number(item.episode || 1) } : null),
      updatedAt: item.updatedAt || Date.now(),
    };

    const updatedList = [newItem, ...list].slice(0, 12);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));

    // Now call the existing updateContinueWatching function to sync to DB / listeners!
    if (currentSessionUser) {
      await supabaseService.updateContinueWatching(updatedList);
    } else {
      window.dispatchEvent(new Event('agreyflix_continue_watching_updated'));
    }
  },

  /**
   * Sends password reset email.
   */
  sendPasswordResetEmail: async (email) => {
    const cleanEmail = email.trim().toLowerCase();
    if (isConfigured && supabase) {
      // Fetch the user's profile to see if they are registered and verified
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('email_verified')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (!profile) {
        throw new Error('This email address is not registered on AgreyFlix.');
      }

      if (!profile.email_verified) {
        throw new Error('Your email address is not verified yet. Please verify your email first before attempting to reset your password.');
      }

      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: 'https://agrey-flix.vercel.app/reset-password'
      });
      if (error) throw error;
    } else {
      // Mock flow
      const users = getMockUsers();
      const matchedUser = users[cleanEmail];
      if (!matchedUser) {
        throw new Error('This email address is on registered on AgreyFlix.');
      }
      if (matchedUser.emailVerified === false) {
        throw new Error('Your email address is not verified yet. Please verify your email first before attempting to reset your password.');
      }
      console.log(`[Mock Reset] Password reset instructions sent to ${cleanEmail}`);
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
  sendNotification: async (title, message, type = 'system', targetAudience = 'all') => {
    verifyAdmin(); // Secure administrative endpoint
    const cleanTitle = sanitizeInput(title);
    const cleanMessage = sanitizeInput(message);

    if (isConfigured && supabase) {
      try {
        // First try to insert with dedicated target_audience column if it exists
        const { data, error } = await supabase
          .from('notifications')
          .insert([{ title: cleanTitle, message: cleanMessage, type, target_audience: targetAudience }])
          .select();
        
        if (!error) {
          logSecurityEvent('SUCCESS', `Admin sent notification: ${cleanTitle}`);
          return data?.[0];
        } else {
          // If the error indicates target_audience is invalid column, proceed to fallback
          console.warn('Supabase target_audience insert error, trying fallback:', error.message);
        }
      } catch (err) {
        console.warn('Fallback triggered for notification insert:', err);
      }

      // Fallback: encode the target audience within the type attribute (e.g., "system:subscribers")
      const encodedType = targetAudience === 'subscribers' ? `${type}:subscribers` : type;
      const { data, error } = await supabase
        .from('notifications')
        .insert([{ title: cleanTitle, message: cleanMessage, type: encodedType }])
        .select();
      
      if (error) throw error;
      logSecurityEvent('SUCCESS', `Admin sent notification (fallback): ${cleanTitle}`);
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
            target_audience: 'all',
            created_at: new Date(Date.now() - 3600000).toISOString()
          }
        ];
        const newNotif = {
          id: 'notif_' + Math.random().toString(36).substring(2, 11),
          title: cleanTitle,
          message: cleanMessage,
          type,
          target_audience: targetAudience,
          created_at: new Date().toISOString()
        };
        const updated = [newNotif, ...list];
        localStorage.setItem('agreyflix_notifications', JSON.stringify(updated));
        window.dispatchEvent(new Event('newNotification'));
        logSecurityEvent('SUCCESS', `Admin sent notification locally: ${cleanTitle}`);
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
    verifyAdmin(); // Secure administrative endpoint
    if (isConfigured && supabase) {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);
      if (error) throw error;
      logSecurityEvent('ALERT', `Admin deleted notification: ${id}`);
      return true;
    } else {
      try {
        const saved = localStorage.getItem('agreyflix_notifications');
        const list = saved ? JSON.parse(saved) : [];
        const updated = list.filter(item => item.id !== id);
        localStorage.setItem('agreyflix_notifications', JSON.stringify(updated));
        window.dispatchEvent(new Event('newNotification'));
        logSecurityEvent('ALERT', `Admin deleted notification locally: ${id}`);
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
    verifyAdmin(); // Secure administrative endpoint
    if (isConfigured && supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Failed to fetch profiles from Supabase:', error);
        return [];
      }
      return (data || []).map(p => ({
        ...p,
        email_verified: p.email_verified === true || p.email_verified === 1 || p.preferences_set === true || p.preferences_set === 1
      }));
    } else {
      const users = getMockUsers();
      return Object.values(users).map(({ password, ...user }) => ({
        id: user.id || user.uid,
        email: user.email,
        display_name: user.displayName || user.email?.split('@')[0],
        watchlist: user.watchlist || [],
        continue_watching: user.continueWatching || [],
        is_admin: (user.isAdmin || user.email?.toLowerCase() === 'webbrowsera@gmail.com') ? 1 : 0,
        is_subscribed: (user.isSubscribed || user.is_subscribed) ? 1 : 0,
        is_archived: user.is_archived || 0,
        email_verified: user.emailVerified !== false,
        created_at: user.created_at || new Date().toISOString()
      }));
    }
  },

  /**
   * Update a user's admin status (Admin only).
   */
  updateUserAdminStatus: async (userId, isAdminValue) => {
    verifyAdmin(); // Secure administrative endpoint
    const is_admin = isAdminValue ? 1 : 0;
    if (isConfigured && supabase) {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin })
        .eq('id', userId);
      if (error) throw error;
      logSecurityEvent('AUDIT', `Admin updated user role of ${userId} to is_admin=${is_admin}`);
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
        logSecurityEvent('AUDIT', `Admin updated user role locally of ${userId} to is_admin=${is_admin}`);
        return true;
      }
      throw new Error('User not found');
    }
  },

  /**
   * Update a user's subscription status (Admin only).
   */
  updateUserSubscriptionStatus: async (userId, isSubscribed) => {
    verifyAdmin(); // Secure administrative endpoint
    const is_subscribed = isSubscribed ? 1 : 0;
    if (isConfigured && supabase) {
      const { error } = await supabase
        .from('profiles')
        .update({ is_subscribed, isSubscribed: !!isSubscribed })
        .eq('id', userId);
      if (error) throw error;
      logSecurityEvent('AUDIT', `Admin updated subscription status of ${userId} to is_subscribed=${is_subscribed}`);
      return true;
    } else {
      const users = getMockUsers();
      const userKey = Object.keys(users).find(
        key => users[key].id === userId || users[key].uid === userId
      );
      if (userKey) {
        users[userKey].isSubscribed = !!isSubscribed;
        users[userKey].is_subscribed = is_subscribed;
        saveMockUsers(users);
        logSecurityEvent('AUDIT', `Admin updated subscription status locally of ${userId} to is_subscribed=${is_subscribed}`);
        return true;
      }
      throw new Error('User not found');
    }
  },

  /**
   * Archive a user profile (Soft Delete - Admin only).
   */
  archiveProfile: async (userId) => {
    verifyAdmin(); // Secure administrative endpoint
    if (isConfigured && supabase) {
      const { error } = await supabase
        .from('profiles')
        .update({ is_archived: 1 })
        .eq('id', userId);
      if (error) throw error;
      logSecurityEvent('AUDIT', `Admin soft-deleted (archived) user profile: ${userId}`);
      return true;
    } else {
      const users = getMockUsers();
      const userKey = Object.keys(users).find(
        key => users[key].id === userId || users[key].uid === userId
      );
      if (userKey) {
        users[userKey].is_archived = 1;
        saveMockUsers(users);
        logSecurityEvent('AUDIT', `Admin soft-deleted (archived) user profile locally: ${userId}`);
        return true;
      }
      throw new Error('User not found');
    }
  },

  /**
   * Restore an archived user profile (Admin only).
   */
  restoreProfile: async (userId) => {
    verifyAdmin(); // Secure administrative endpoint
    if (isConfigured && supabase) {
      const { error } = await supabase
        .from('profiles')
        .update({ is_archived: 0 })
        .eq('id', userId);
      if (error) throw error;
      logSecurityEvent('AUDIT', `Admin restored soft-deleted user profile: ${userId}`);
      return true;
    } else {
      const users = getMockUsers();
      const userKey = Object.keys(users).find(
        key => users[key].id === userId || users[key].uid === userId
      );
      if (userKey) {
        users[userKey].is_archived = 0;
        saveMockUsers(users);
        logSecurityEvent('AUDIT', `Admin restored soft-deleted user profile locally: ${userId}`);
        return true;
      }
      throw new Error('User not found');
    }
  },

  /**
   * Delete a user profile (Admin only).
   */
  deleteProfile: async (userId) => {
    verifyAdmin(); // Secure administrative endpoint
    if (isConfigured && supabase) {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
      if (error) throw error;
      logSecurityEvent('ALERT', `Admin permanently deleted user profile: ${userId}`);
      return true;
    } else {
      const users = getMockUsers();
      const userKey = Object.keys(users).find(
        key => users[key].id === userId || users[key].uid === userId
      );
      if (userKey) {
        delete users[userKey];
        saveMockUsers(users);
        logSecurityEvent('ALERT', `Admin permanently deleted user profile locally: ${userId}`);
        return true;
      }
      throw new Error('User not found');
    }
  },

  /**
   * Get user submitted reports (Admin only).
   */
  getReports: async () => {
    verifyAdmin(); // Secure administrative endpoint
    if (isConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('reports')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) {
          console.warn('Reports table not found or query error, falling back to local storage.');
          throw error;
        }
        return data || [];
      } catch (err) {
        // Fallback to local storage if table doesn't exist yet
      }
    }
    
    try {
      const saved = localStorage.getItem('agreyflix_reports');
      if (saved) {
        return JSON.parse(saved);
      }
      
      // Default high fidelity seed data for real feeling reports
      const defaultReports = [
        {
          id: 'rep_1',
          title: 'The Flash',
          media_id: '60735',
          type: 'series',
          issue_type: 'broken_video',
          details: 'VidSrc source returns 404 on Episode 4 of Season 3. Please update server link.',
          reporter_email: 'rashid.kiswahili@gmail.com',
          status: 'pending',
          admin_response: '',
          created_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString()
        },
        {
          id: 'rep_2',
          title: 'Avatar: The Way of Water',
          media_id: '76600',
          type: 'movie',
          issue_type: 'subtitle_problem',
          details: 'Swahili subtitles are out of sync by about 5 seconds during the second half of the movie.',
          reporter_email: 'neema.mlowe@yahoo.com',
          status: 'pending',
          admin_response: '',
          created_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString()
        },
        {
          id: 'rep_3',
          title: 'Extraction 2',
          media_id: '697843',
          type: 'movie',
          issue_type: 'streaming_error',
          details: 'Stream starts loading but keeps buffering after 20 minutes on Server 2.',
          reporter_email: 'juma_ally@outlook.com',
          status: 'resolved',
          admin_response: 'Cleared edge CDN cache and updated VidSrc stream endpoint. Resolved.',
          created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
        },
        {
          id: 'rep_4',
          title: 'Wednesday',
          media_id: '119051',
          type: 'series',
          issue_type: 'wrong_content',
          details: 'Episode 2 title says "Woe is the Loneliest Number" but plays Episode 3 instead.',
          reporter_email: 'kelvin.tz@gmail.com',
          status: 'pending',
          admin_response: '',
          created_at: new Date(Date.now() - 36 * 3600 * 1000).toISOString()
        }
      ];
      localStorage.setItem('agreyflix_reports', JSON.stringify(defaultReports));
      return defaultReports;
    } catch (e) {
      console.error('Failed to retrieve reports:', e);
      return [];
    }
  },

  /**
   * Submit a new issue report.
   */
  createReport: async (reportData) => {
    const newReport = {
      id: 'rep_' + Math.random().toString(36).substring(2, 11),
      title: sanitizeInput(reportData.title || 'Unknown Media'),
      media_id: String(reportData.mediaId || ''),
      type: reportData.type || 'movie',
      issue_type: reportData.issueType || 'broken_video',
      details: sanitizeInput(reportData.details || ''),
      reporter_email: sanitizeInput(reportData.reporterEmail || 'anonymous@agreyflix.com'),
      status: 'pending',
      admin_response: '',
      created_at: new Date().toISOString()
    };

    if (isConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('reports')
          .insert([newReport])
          .select();
        if (!error) return data?.[0];
      } catch (err) {
        console.warn('Could not write report to Supabase table, falling back to local storage.');
      }
    }

    try {
      const saved = localStorage.getItem('agreyflix_reports');
      const list = saved ? JSON.parse(saved) : [];
      const updated = [newReport, ...list];
      localStorage.setItem('agreyflix_reports', JSON.stringify(updated));
      return newReport;
    } catch (e) {
      console.error('Failed to create report:', e);
      throw e;
    }
  },

  /**
   * Update report status / response (Admin only).
   */
  updateReportStatus: async (reportId, status, adminResponse = '') => {
    verifyAdmin(); // Secure this administrative endpoint
    const cleanResponse = sanitizeInput(adminResponse);

    if (isConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('reports')
          .update({ status, admin_response: cleanResponse })
          .eq('id', reportId)
          .select();
        if (!error) return data?.[0];
      } catch (err) {
        console.warn('Could not update report in Supabase, updating in local storage.');
      }
    }

    try {
      const saved = localStorage.getItem('agreyflix_reports');
      const list = saved ? JSON.parse(saved) : [];
      const updated = list.map(item => {
        if (item.id === reportId) {
          return { ...item, status, admin_response: cleanResponse };
        }
        return item;
      });
      localStorage.setItem('agreyflix_reports', JSON.stringify(updated));
      return true;
    } catch (e) {
      console.error('Failed to update report:', e);
      throw e;
    }
  },

  /**
   * Get server monitor statuses.
   */
  getServers: async () => {
    if (isConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('servers')
          .select('*')
          .order('id', { ascending: true });
        if (error) {
          console.warn('Servers table not found or query error, falling back to local storage.');
          throw error;
        }
        return data || [];
      } catch (err) {
        // Fallback to local storage if table doesn't exist yet
      }
    }

    try {
      const saved = localStorage.getItem('agreyflix_servers');
      if (saved) {
        return JSON.parse(saved);
      }
      const defaultServers = [
        { id: 'srv_1', name: 'Server 1 (Primary High-Bitrate)', url: 'https://vidsrc.to/', status: 'Active (100% SLA)', latency: 42, updated_at: new Date().toISOString() },
        { id: 'srv_2', name: 'Server 2 (Backup Ultra-CDN)', url: 'https://vidsrc.me/', status: 'Active (99.8% SLA)', latency: 85, updated_at: new Date().toISOString() },
        { id: 'srv_3', name: 'Server 3 (Vidsrc.ru Premium Stream Host)', url: 'https://vidsrc-embed.ru/', status: 'Active (100% SLA)', latency: 35, updated_at: new Date().toISOString() }
      ];
      localStorage.setItem('agreyflix_servers', JSON.stringify(defaultServers));
      return defaultServers;
    } catch (e) {
      console.error('Failed to retrieve servers:', e);
      return [];
    }
  },

  /**
   * Update server status / latency (Admin only).
   */
  updateServerLatency: async (serverId, latency, status = null) => {
    verifyAdmin(); // Secure administrative endpoint
    const cleanStatus = status ? sanitizeInput(status) : null;
    const updatePayload = { latency, updated_at: new Date().toISOString() };
    if (cleanStatus) {
      updatePayload.status = cleanStatus;
    }

    if (isConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('servers')
          .update(updatePayload)
          .eq('id', serverId)
          .select();
        if (!error) return data?.[0];
      } catch (err) {
        console.warn('Could not update server in Supabase, updating in local storage.');
      }
    }

    try {
      const saved = localStorage.getItem('agreyflix_servers');
      const list = saved ? JSON.parse(saved) : [];
      const updated = list.map(item => {
        if (item.id === serverId) {
          return { ...item, ...updatePayload };
        }
        return item;
      });
      localStorage.setItem('agreyflix_servers', JSON.stringify(updated));
      return true;
    } catch (e) {
      console.error('Failed to update server:', e);
      throw e;
    }
  },

  /**
   * TikTok Videos Methods
   */
  getTikTokVideos: async () => {
    const defaultVideos = [
      {
        id: 'tk_demo1',
        title: 'AgreyFlix Streaming Showcase',
        tiktok_url: 'https://www.tiktok.com/@netflix/video/7339891083984162094',
        thumbnail: '',
        likes_count: 324,
        shares_count: 56,
        active: true,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString()
      },
      {
        id: 'tk_demo2',
        title: 'New Movie Trailer Teaser',
        tiktok_url: 'https://www.tiktok.com/@netflix/video/7342083103444159787',
        thumbnail: '',
        likes_count: 156,
        shares_count: 12,
        active: true,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
      },
      {
        id: 'tk_demo3',
        title: 'Action Series Cinematic Review',
        tiktok_url: 'https://www.tiktok.com/@netflix/video/7325605481747041579',
        thumbnail: '',
        likes_count: 512,
        shares_count: 98,
        active: true,
        created_at: new Date().toISOString()
      }
    ];

    if (isConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('tiktok_videos')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) {
          if (data.length === 0) {
            try {
              await supabase.from('tiktok_videos').insert(defaultVideos);
              return defaultVideos;
            } catch (seedErr) {
              console.warn('Failed to seed default TikTok videos into Supabase:', seedErr);
              return defaultVideos;
            }
          }
          return data.map(v => ({
            ...v,
            likes_count: v.likes_count || 0,
            shares_count: v.shares_count || 0
          }));
        }
        console.warn('tiktok_videos query error, falling back to local storage:', error);
      } catch (err) {
        console.warn('Could not fetch tiktok_videos from Supabase, using local storage.');
      }
    }

    try {
      const saved = localStorage.getItem('agreyflix_tiktok_videos');
      if (saved) {
        return JSON.parse(saved).map(v => ({
          ...v,
          likes_count: v.likes_count || 0,
          shares_count: v.shares_count || 0
        }));
      } else {
        localStorage.setItem('agreyflix_tiktok_videos', JSON.stringify(defaultVideos));
        return defaultVideos;
      }
    } catch (e) {
      console.error('Failed to retrieve tiktok_videos:', e);
      return defaultVideos;
    }
  },

  createTikTokVideo: async (videoData) => {
    verifyAdmin(); // Secure administrative endpoint
    const id = 'tk_' + Math.random().toString(36).substring(2, 11);
    const created_at = new Date().toISOString();
    
    const cleanTitle = sanitizeInput(videoData.title || 'Untitled Video');
    const cleanUrl = sanitizeInput(videoData.tiktok_url || videoData.tiktokUrl || '');
    const cleanThumbnail = sanitizeInput(videoData.thumbnail || '');

    const dbPayloadFull = {
      id,
      title: cleanTitle,
      tiktok_url: cleanUrl,
      thumbnail: cleanThumbnail,
      likes_count: 0,
      shares_count: 0,
      active: videoData.active !== undefined ? videoData.active : true,
      created_at
    };

    const dbPayloadSimple = {
      id,
      title: cleanTitle,
      tiktok_url: cleanUrl,
      thumbnail: cleanThumbnail,
      active: videoData.active !== undefined ? videoData.active : true,
      created_at
    };

    if (isConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('tiktok_videos')
          .insert([dbPayloadFull])
          .select();
        
        if (!error && data) {
          logSecurityEvent('SUCCESS', `Admin created TikTok Video: ${cleanTitle}`);
          return data[0];
        }

        // If the error indicates missing likes_count or shares_count column (Postgres error 42703)
        if (error && (error.code === '42703' || (error.message && error.message.toLowerCase().includes('column')))) {
          console.warn('Supabase tiktok_videos table lacks likes_count or shares_count column. Retrying with simpler payload...');
          const { data: retryData, error: retryError } = await supabase
            .from('tiktok_videos')
            .insert([dbPayloadSimple])
            .select();
          
          if (!retryError && retryData) {
            logSecurityEvent('SUCCESS', `Admin created TikTok Video (simple payload): ${cleanTitle}`);
            return {
              ...retryData[0],
              likes_count: 0,
              shares_count: 0
            };
          }
          if (retryError) throw retryError;
        }
        if (error) throw error;
      } catch (err) {
        console.warn('Could not write tiktok_videos to Supabase, falling back to local storage:', err);
      }
    }

    try {
      const saved = localStorage.getItem('agreyflix_tiktok_videos');
      const list = saved ? JSON.parse(saved) : [];
      const updated = [dbPayloadFull, ...list];
      localStorage.setItem('agreyflix_tiktok_videos', JSON.stringify(updated));
      logSecurityEvent('SUCCESS', `Admin created TikTok Video locally: ${cleanTitle}`);
      return dbPayloadFull;
    } catch (e) {
      console.error('Failed to create tiktok_video:', e);
      throw e;
    }
  },

  updateTikTokVideoActive: async (id, active) => {
    verifyAdmin(); // Secure administrative endpoint
    if (isConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('tiktok_videos')
          .update({ active })
          .eq('id', id)
          .select();
        if (!error) {
          logSecurityEvent('AUDIT', `Admin toggled active state on TikTok video ID: ${id} to ${active}`);
          return data?.[0];
        }
        console.warn('Could not update tiktok_videos in Supabase, using local storage.');
      } catch (err) {
        console.warn('Could not update tiktok_videos in Supabase, using local storage.');
      }
    }

    try {
      const saved = localStorage.getItem('agreyflix_tiktok_videos');
      const list = saved ? JSON.parse(saved) : [];
      const updated = list.map(item => {
        if (item.id === id) {
          return { ...item, active };
        }
        return item;
      });
      localStorage.setItem('agreyflix_tiktok_videos', JSON.stringify(updated));
      logSecurityEvent('AUDIT', `Admin toggled active state locally on TikTok video ID: ${id} to ${active}`);
      return true;
    } catch (e) {
      console.error('Failed to update tiktok_video:', e);
      throw e;
    }
  },

  deleteTikTokVideo: async (id) => {
    verifyAdmin(); // Secure administrative endpoint
    if (isConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('tiktok_videos')
          .delete()
          .eq('id', id);
        if (!error) {
          logSecurityEvent('ALERT', `Admin deleted TikTok video ID: ${id}`);
          return true;
        }
        console.warn('Could not delete tiktok_videos from Supabase, using local storage.');
      } catch (err) {
        console.warn('Could not delete tiktok_videos from Supabase, using local storage.');
      }
    }

    try {
      const saved = localStorage.getItem('agreyflix_tiktok_videos');
      const list = saved ? JSON.parse(saved) : [];
      const updated = list.filter(item => item.id !== id);
      localStorage.setItem('agreyflix_tiktok_videos', JSON.stringify(updated));
      logSecurityEvent('ALERT', `Admin deleted TikTok video locally ID: ${id}`);
      return true;
    } catch (e) {
      console.error('Failed to delete tiktok_video:', e);
      throw e;
    }
  },

  incrementTikTokLikes: async (id, step) => {
    if (isConfigured && supabase) {
      try {
        const { data: current, error: fetchErr } = await supabase
          .from('tiktok_videos')
          .select('likes_count')
          .eq('id', id)
          .single();
        if (!fetchErr && current) {
          const newLikes = Math.max(0, (current.likes_count || 0) + step);
          const { data, error } = await supabase
            .from('tiktok_videos')
            .update({ likes_count: newLikes })
            .eq('id', id)
            .select();
          if (!error) return data?.[0];
        }
      } catch (err) {
        console.warn('Could not increment tiktok_videos likes in Supabase, using local storage.');
      }
    }

    try {
      const saved = localStorage.getItem('agreyflix_tiktok_videos');
      const list = saved ? JSON.parse(saved) : [];
      const updated = list.map(item => {
        if (item.id === id) {
          const newLikes = Math.max(0, (item.likes_count || 0) + step);
          return { ...item, likes_count: newLikes };
        }
        return item;
      });
      localStorage.setItem('agreyflix_tiktok_videos', JSON.stringify(updated));
      return true;
    } catch (e) {
      console.error('Failed to increment tiktok_video likes:', e);
      throw e;
    }
  },

  incrementTikTokShares: async (id) => {
    if (isConfigured && supabase) {
      try {
        const { data: current, error: fetchErr } = await supabase
          .from('tiktok_videos')
          .select('shares_count')
          .eq('id', id)
          .single();
        if (!fetchErr && current) {
          const newShares = (current.shares_count || 0) + 1;
          const { data, error } = await supabase
            .from('tiktok_videos')
            .update({ shares_count: newShares })
            .eq('id', id)
            .select();
          if (!error) return data?.[0];
        }
      } catch (err) {
        console.warn('Could not increment tiktok_videos shares in Supabase, using local storage.');
      }
    }

    try {
      const saved = localStorage.getItem('agreyflix_tiktok_videos');
      const list = saved ? JSON.parse(saved) : [];
      const updated = list.map(item => {
        if (item.id === id) {
          const newShares = (item.shares_count || 0) + 1;
          return { ...item, shares_count: newShares };
        }
        return item;
      });
      localStorage.setItem('agreyflix_tiktok_videos', JSON.stringify(updated));
      return true;
    } catch (e) {
      console.error('Failed to increment tiktok_video shares:', e);
      throw e;
    }
  }
};
