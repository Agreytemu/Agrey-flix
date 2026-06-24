import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabaseService } from '../utils/supabaseService';

const ProfileContext = createContext();

export function ProfileProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync with Supabase Auth and User Profile
  useEffect(() => {
    const unsubscribe = supabaseService.onAuthStateChanged((user) => {
      setProfile(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateProfile = useCallback(async (updates) => {
    try {
      await supabaseService.updateProfile(updates);
    } catch (error) {
      console.error("Failed to update profile", error);
      throw error;
    }
  }, []);

  return (
    <ProfileContext.Provider value={{ profile, updateProfile, loading }}>
      {children}
    </ProfileContext.Provider>
  );
}

export const useProfile = () => useContext(ProfileContext);
