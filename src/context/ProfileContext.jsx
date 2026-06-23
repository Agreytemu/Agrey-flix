import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const ProfileContext = createContext();

export function ProfileProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync with Firebase Auth and Firestore for User Profile
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        // Sikiliza mabadiliko ya papo kwa papo (real-time) kwenye Profile
        const docRef = doc(db, 'users', user.uid);
        const unsubscribeSnap = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data());
          }
          setLoading(false);
        }, (error) => {
          console.error("Profile sync error:", error);
          setLoading(false);
        });
        
        return () => unsubscribeSnap();
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const updateProfile = useCallback(async (updates) => {
    if (!auth.currentUser) return;
    try {
      const ref = doc(db, 'users', auth.currentUser.uid);
      // Tunatumia 'merge: true' ili tusifute data zingine (kama watchlist)
      await setDoc(ref, updates, { merge: true });
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
