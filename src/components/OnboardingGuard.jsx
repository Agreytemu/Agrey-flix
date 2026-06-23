import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useProfile } from '../context/ProfileContext';

export default function OnboardingGuard() {
  const { profile, loading } = useProfile();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#0d1117]">
        <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // 1. Kama mtumiaji hayupo, muache aendelee kwa sababu protected routes zitashughulikia Login
  if (!profile) return <Outlet />;

  // 2. Kama ni fully verified lakini hajaweka mapendeleo, mwelekeze kwenye "/setup"
  // Tunazuia infinite loop kwa kuhakikisha hayupo kwenye "/setup"
  if (profile.emailVerified && !profile.preferencesSet && location.pathname !== '/setup') {
    return <Navigate to="/setup" replace />;
  }

  return <Outlet />;
}
