import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaLock, FaCheckCircle, FaExclamationCircle, FaSpinner, FaTimesCircle, FaShieldAlt } from 'react-icons/fa';
import { BiMoviePlay } from 'react-icons/bi';
import { supabaseService, supabase } from '../../utils/supabaseService';
import { validatePassword, getPasswordStrength, checkRateLimit, logSecurityEvent } from '../../utils/security';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    // Check for any URL-based authentication errors (e.g. link expired or already used)
    const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'));
    const queryParams = new URLSearchParams(window.location.search);
    const errorParam = hashParams.get('error_description') || queryParams.get('error_description') || hashParams.get('error') || queryParams.get('error');
    
    if (errorParam) {
      setError(decodeURIComponent(errorParam).replace(/\+/g, ' '));
      setHasSession(false);
      setCheckingSession(false);
      return;
    }

    if (supabaseService.isConfigured && supabase) {
      // If URL already contains access tokens, assume the session is valid
      const hasHash = window.location.hash && (
        window.location.hash.includes('access_token') ||
        window.location.hash.includes('type=recovery')
      );
      const hasQuery = window.location.search && (
        window.location.search.includes('code=')
      );

      if (hasHash || hasQuery) {
        setHasSession(true);
        setCheckingSession(false);
      }

      // 1. Give Supabase a short window to parse the token from window.location (hash fragment or query parameters)
      const timer = setTimeout(async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            setHasSession(true);
          } else if (!(hasHash || hasQuery)) {
            setHasSession(false);
          }
        } catch (err) {
          console.error("Session check error:", err);
        } finally {
          setCheckingSession(false);
        }
      }, 1000);

      // 2. Also listen dynamically to auth state changes (e.g. PASSWORD_RECOVERY or SIGNED_IN event)
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (session || event === 'PASSWORD_RECOVERY') {
          setHasSession(true);
          setCheckingSession(false);
        }
      });

      return () => {
        clearTimeout(timer);
        subscription?.unsubscribe();
      };
    } else {
      // Mock / fallback simulation is always active
      setHasSession(true);
      setCheckingSession(false);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Rate limiting check
    if (!checkRateLimit('password_reset_submit', 3, 60000)) {
      setError('Too many attempts. Please try again after 1 minute.');
      logSecurityEvent('ALERT', 'Password reset form submit rate limited');
      return;
    }

    // Password validation
    const validation = validatePassword(password);
    if (!validation.isValid) {
      setError(validation.message);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      if (supabaseService.isConfigured) {
        // Double-check or wait for session if necessary
        const { data: { session } } = await supabase.auth.getSession();
        if (!session && window.location.hash.includes('access_token')) {
          await new Promise(r => setTimeout(r, 600));
        }
        await supabaseService.updatePassword(password);
        logSecurityEvent('SUCCESS', 'User successfully reset password via recovery link');
      } else {
        // Simulate reset in mock session
        const currentUser = supabaseService.getCurrentUser();
        if (currentUser) {
          const mockUsers = JSON.parse(localStorage.getItem('agreyflix_mock_users') || '{}');
          const emailKey = Object.keys(mockUsers).find(k => k.toLowerCase() === currentUser.email.toLowerCase());
          if (emailKey) {
            mockUsers[emailKey].password = password;
            localStorage.setItem('agreyflix_mock_users', JSON.stringify(mockUsers));
          }
        }
        logSecurityEvent('SUCCESS', 'User successfully reset password via local fallback simulation');
      }
      setSuccess(true);
    } catch (err) {
      setError(err?.message || 'Failed to update your password. Please ensure the link is still valid.');
      logSecurityEvent('FAILURE', `Password reset failed: ${err?.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const str = getPasswordStrength(password);

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className="w-full max-w-md bg-[#0b0f19]/95 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-2xl shadow-black text-center"
      >
        <div className="flex justify-center items-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-red-600/20 flex items-center justify-center">
            <BiMoviePlay className="text-red-500 text-2xl" />
          </div>
          <span className="text-2xl font-black text-white tracking-tight">
            Agrey<span className="text-red-500">Flix</span>
          </span>
        </div>

        {checkingSession ? (
          <div className="py-12 space-y-4">
            <FaSpinner className="text-red-500 text-4xl animate-spin mx-auto" />
            <p className="text-zinc-400 text-sm font-semibold uppercase tracking-wider animate-pulse">Verifying secure recovery session...</p>
          </div>
        ) : !hasSession ? (
          <div className="space-y-6 py-6">
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto">
              <FaTimesCircle className="text-red-500 text-3xl" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">{error ? "Link Expired or Invalid" : "Invalid Recovery Session"}</h2>
              <p className="text-zinc-400 text-xs leading-relaxed max-w-sm mx-auto">
                {error || "No active recovery handshake or authenticated credentials detected. Please request a new password reset link from the homepage sign-in portal."}
              </p>
            </div>
            <button
              onClick={() => navigate('/', { replace: true })}
              className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs tracking-wider uppercase rounded-xl border border-white/5 transition-all"
            >
              Back to Home
            </button>
          </div>
        ) : success ? (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="space-y-6"
          >
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
              <FaCheckCircle className="text-emerald-500 text-3xl" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Password Reset Complete</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Your password has been securely updated. You can now log in using your new credentials.
            </p>
            <button
              onClick={() => navigate('/', { replace: true })}
              className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-[0_0_25px_rgba(220,38,38,0.25)] transition-all active:scale-[0.98]"
            >
              Continue to Home
            </button>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 text-left">
            <div className="text-center space-y-2 mb-6">
              <h2 className="text-xl font-bold text-white">Reset Password</h2>
              <p className="text-gray-400 text-xs">
                Enter your new strong password below to secure your account.
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3"
              >
                <FaExclamationCircle className="text-red-400 text-base shrink-0 mt-0.5" />
                <p className="text-red-300 text-xs font-medium leading-snug">{error}</p>
              </motion.div>
            )}

            <div className="space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <FaLock className="text-gray-500 text-sm" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New Password"
                  className="w-full bg-black/25 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-all font-medium text-sm"
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <FaLock className="text-gray-500 text-sm" />
                </div>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm New Password"
                  className="w-full bg-black/25 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-all font-medium text-sm"
                />
              </div>
            </div>

            {password && (
              <div className="mt-2 text-left bg-black/30 border border-white/5 p-3 rounded-xl">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] uppercase font-black tracking-wider text-gray-500">Strength:</span>
                  <span className={`text-[10px] font-black uppercase ${
                    str.score >= 3 ? 'text-emerald-400' : str.score === 2 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {str.label}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden flex gap-1">
                  <div className={`h-full flex-1 transition-all duration-300 ${str.score >= 0 ? str.color : 'bg-transparent'}`} />
                  <div className={`h-full flex-1 transition-all duration-300 ${str.score >= 1 ? str.color : 'bg-white/5'}`} />
                  <div className={`h-full flex-1 transition-all duration-300 ${str.score >= 2 ? str.color : 'bg-white/5'}`} />
                  <div className={`h-full flex-1 transition-all duration-300 ${str.score >= 3 ? str.color : 'bg-white/5'}`} />
                </div>
                <ul className="mt-2 space-y-0.5 text-[9px] text-gray-400 font-medium">
                  <li className={password.length >= 8 ? 'text-emerald-400 flex items-center gap-1' : 'text-gray-500 flex items-center gap-1'}>
                    <span>{password.length >= 8 ? '●' : '○'}</span> At least 8-20 characters
                  </li>
                  <li className={/[A-Z]/.test(password) ? 'text-emerald-400 flex items-center gap-1' : 'text-gray-500 flex items-center gap-1'}>
                    <span>{/[A-Z]/.test(password) ? '●' : '○'}</span> At least one uppercase letter
                  </li>
                  <li className={/[a-z]/.test(password) ? 'text-emerald-400 flex items-center gap-1' : 'text-gray-500 flex items-center gap-1'}>
                    <span>{/[a-z]/.test(password) ? '●' : '○'}</span> At least one lowercase letter
                  </li>
                  <li className={/\d/.test(password) ? 'text-emerald-400 flex items-center gap-1' : 'text-gray-500 flex items-center gap-1'}>
                    <span>{/\d/.test(password) ? '●' : '○'}</span> At least one number
                  </li>
                  <li className={/[^A-Za-z0-9]/.test(password) ? 'text-emerald-400 flex items-center gap-1' : 'text-gray-500 flex items-center gap-1'}>
                    <span>{/[^A-Za-z0-9]/.test(password) ? '●' : '○'}</span> At least one special character
                  </li>
                </ul>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-2 flex justify-center items-center gap-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all active:scale-[0.98]"
            >
              {loading && <FaSpinner className="animate-spin" />}
              Save New Password
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
